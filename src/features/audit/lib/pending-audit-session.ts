import "server-only";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { connection } from "next/server";

import { sealPayload, unsealPayload } from "@/features/audit/lib/audit-crypto";
import type {
  AuditRunRequestBody,
  PendingAuditCookiePayload,
} from "@/features/audit/types/audit-run.types";
import { cookieSecureAttribute } from "@/lib/cookie-secure";

export const PENDING_AUDIT_COOKIE = "dps_audit_pending";
export const PENDING_AUDIT_TTL_SECONDS = 15 * 60;

export async function stashPendingAudit(
  body: AuditRunRequestBody,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const payload: PendingAuditCookiePayload = {
      ...body,
      createdAt: Date.now(),
      nonce: randomBytes(8).toString("hex"),
    };
    const jar = await cookies();
    jar.set(PENDING_AUDIT_COOKIE, sealPayload(JSON.stringify(payload)), {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecureAttribute(),
      path: "/",
      maxAge: PENDING_AUDIT_TTL_SECONDS,
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "Unable to start audit session." };
  }
}

export async function loadPendingAudit(): Promise<PendingAuditCookiePayload | null> {
  try {
    await connection();
    const jar = await cookies();
    const raw = jar.get(PENDING_AUDIT_COOKIE)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(unsealPayload(raw)) as PendingAuditCookiePayload;
    if (
      !parsed ||
      typeof parsed.createdAt !== "number" ||
      Date.now() - parsed.createdAt > PENDING_AUDIT_TTL_SECONDS * 1000
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPendingAudit(): Promise<void> {
  try {
    const jar = await cookies();
    jar.delete(PENDING_AUDIT_COOKIE);
  } catch {
    // ignore
  }
}
