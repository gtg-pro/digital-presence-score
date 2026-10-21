import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";

import { cookies } from "next/headers";
import { connection } from "next/server";

import type { DigitalPresenceReport } from "@/features/report/types/report.types";
import { cookieSecureAttribute } from "@/lib/cookie-secure";

/**
 * Short-lived encrypted cookie transport for mapped live reports.
 *
 * Limitations:
 * - Per-cookie chunk size (~3KB) and max chunks (see MAX_CHUNKS).
 * - JSON is deflate-compressed before encryption to stay under typical
 *   Node.js Cookie header limits (default `--max-http-header-size` is 16KB).
 * - Survives only for the browser session TTL (default 30 minutes).
 * - Not durable across deployments/restarts/devices — not a database.
 * - Does not store raw AssessmentResult, API keys, or provider payloads.
 *
 * Deploy note: if large reports still hit HTTP 431, raise
 * `NODE_OPTIONS=--max-http-header-size=65536` (or equivalent) on the server.
 */

export const EPHEMERAL_REPORT_COOKIE_PREFIX = "dps_live_report";
export const EPHEMERAL_REPORT_META_COOKIE = "dps_live_report_meta";
export const EPHEMERAL_REPORT_TTL_SECONDS = 30 * 60;
/** Usable characters per cookie value (browser ~4KB limit with name/attrs). */
export const MAX_CHUNK_BYTES = 3000;
/**
 * Max sealed chunks. Total Cookie header must still fit the Node header budget.
 * Prefer compression over raising this further.
 */
export const MAX_CHUNKS = 6;
/** Soft budget for sealed payload characters (excludes meta cookie). */
export const MAX_SEALED_CHARS = MAX_CHUNK_BYTES * MAX_CHUNKS;

const PAYLOAD_VERSION_DEFLATE = 1;

type SealedMeta = {
  id: string;
  chunks: number;
  exp: number;
};

function resolveSecret(): Buffer {
  const configured = process.env.REPORT_SESSION_SECRET?.trim();
  if (configured) {
    return createHash("sha256").update(configured).digest();
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "REPORT_SESSION_SECRET is required in production for encrypted report sessions.",
    );
  }
  // Development-only fallback — never reuse provider API keys as session secrets.
  return createHash("sha256")
    .update("dev-only-report-session-secret-change-me")
    .digest();
}

function encryptBytes(plaintext: Buffer): string {
  const key = resolveSecret();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function decryptBytes(payload: string): Buffer {
  const key = resolveSecret();
  const buf = Buffer.from(payload, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

function encryptText(plaintext: string): string {
  return encryptBytes(Buffer.from(plaintext, "utf8"));
}

function decryptText(payload: string): string {
  return decryptBytes(payload).toString("utf8");
}

/** Compress + encrypt a report for cookie transport. Exported for size tests. */
export function sealReportPayload(report: DigitalPresenceReport): string {
  const json = Buffer.from(JSON.stringify(report), "utf8");
  const compressed = deflateSync(json, { level: 9 });
  return encryptBytes(
    Buffer.concat([Buffer.from([PAYLOAD_VERSION_DEFLATE]), compressed]),
  );
}

export function unsealReportPayload(sealed: string): DigitalPresenceReport {
  const buf = decryptBytes(sealed);
  if (buf.length > 0 && buf[0] === PAYLOAD_VERSION_DEFLATE) {
    return JSON.parse(inflateSync(buf.subarray(1)).toString("utf8")) as DigitalPresenceReport;
  }
  // Legacy uncompressed UTF-8 JSON (pre-compression sessions).
  return JSON.parse(buf.toString("utf8")) as DigitalPresenceReport;
}

export type StashLiveReportResult =
  | { ok: true; reportId: string; transport: "encrypted_cookie" }
  | {
      ok: false;
      reason: "payload_too_large" | "cookie_write_failed";
      message: string;
    };

/**
 * Seal a mapped DigitalPresenceReport into httpOnly cookie chunk(s).
 * Call from Server Actions / Route Handlers only.
 */
export async function stashLiveReport(
  report: DigitalPresenceReport,
): Promise<StashLiveReportResult> {
  if (report.isDemo) {
    return {
      ok: false,
      reason: "cookie_write_failed",
      message: "Refusing to stash demo fixtures as live reports.",
    };
  }

  const sealed = sealReportPayload(report);
  const chunks: string[] = [];
  for (let i = 0; i < sealed.length; i += MAX_CHUNK_BYTES) {
    chunks.push(sealed.slice(i, i + MAX_CHUNK_BYTES));
  }

  if (chunks.length > MAX_CHUNKS || sealed.length > MAX_SEALED_CHARS) {
    return {
      ok: false,
      reason: "payload_too_large",
      message:
        "Mapped report exceeds ephemeral cookie capacity (compressed). Persistent report storage is required for this payload size, or raise the server max HTTP header size.",
    };
  }

  try {
    const jar = await cookies();
    const exp = Date.now() + EPHEMERAL_REPORT_TTL_SECONDS * 1000;
    const meta: SealedMeta = {
      id: report.id.startsWith("live-") ? report.id : `live-${report.id}`,
      chunks: chunks.length,
      exp,
    };

    const secure = cookieSecureAttribute();
    jar.set(EPHEMERAL_REPORT_META_COOKIE, encryptText(JSON.stringify(meta)), {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: EPHEMERAL_REPORT_TTL_SECONDS,
    });

    // Clear any leftover higher-index chunks from a prior larger session.
    for (let i = chunks.length; i < 8; i += 1) {
      jar.delete(`${EPHEMERAL_REPORT_COOKIE_PREFIX}_${i}`);
    }

    chunks.forEach((chunk, index) => {
      jar.set(`${EPHEMERAL_REPORT_COOKIE_PREFIX}_${index}`, chunk, {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: EPHEMERAL_REPORT_TTL_SECONDS,
      });
    });

    return { ok: true, reportId: meta.id, transport: "encrypted_cookie" };
  } catch {
    return {
      ok: false,
      reason: "cookie_write_failed",
      message: "Unable to write ephemeral report cookies.",
    };
  }
}

/**
 * Load a previously stashed live report for the current browser session.
 * Returns null when missing, expired, mismatched, or tampered.
 */
export async function loadLiveReport(
  reportId: string,
): Promise<DigitalPresenceReport | null> {
  try {
    // Opt into request-time rendering before Date.now() (Cache Components).
    await connection();
    const jar = await cookies();
    const metaRaw = jar.get(EPHEMERAL_REPORT_META_COOKIE)?.value;
    if (!metaRaw) return null;

    const meta = JSON.parse(decryptText(metaRaw)) as SealedMeta;
    if (meta.id !== reportId) return null;
    if (Date.now() > meta.exp) return null;
    if (meta.chunks < 1 || meta.chunks > MAX_CHUNKS) return null;

    let sealed = "";
    for (let i = 0; i < meta.chunks; i += 1) {
      const part = jar.get(`${EPHEMERAL_REPORT_COOKIE_PREFIX}_${i}`)?.value;
      if (!part) return null;
      sealed += part;
    }

    const report = unsealReportPayload(sealed);
    if (report.isDemo) return null;
    const matchesId =
      report.id === reportId ||
      report.reportId === reportId ||
      `live-${report.id.replace(/^live-/, "")}` === reportId;
    if (!matchesId) return null;
    return { ...report, isDemo: false };
  } catch {
    return null;
  }
}

export function isLiveReportId(id: string): boolean {
  return id.startsWith("live-");
}
