import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Short-lived sealed payloads for pending audit requests and assessment handoff.
 * Uses the same secret material as report sessions.
 */
function resolveSecret(): Buffer {
  const configured = process.env.REPORT_SESSION_SECRET?.trim();
  if (configured) {
    return createHash("sha256").update(configured).digest();
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "REPORT_SESSION_SECRET is required in production for audit handoff encryption.",
    );
  }
  return createHash("sha256")
    .update("dev-only-report-session-secret-change-me")
    .digest();
}

export function sealPayload(plaintext: string): string {
  const key = resolveSecret();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function unsealPayload(payload: string): string {
  const key = resolveSecret();
  const buf = Buffer.from(payload, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}
