import { createHash } from "node:crypto";

import { AUDIT_HANDOFF_TTL_MS } from "@/features/audit/lib/assessment-handoff";

/**
 * Process-local one-time consumption of sealed handoff tokens.
 *
 * LIMITATION: Not shared across serverless isolates or multiple Node processes.
 * A replayed token could still succeed on another instance until expiry.
 * Durable single-use handoff requires shared storage (out of scope).
 */

type Entry = { exp: number };

const consumed = new Map<string, Entry>();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function prune(now: number): void {
  for (const [key, entry] of consumed) {
    if (entry.exp <= now) consumed.delete(key);
  }
}

/**
 * Returns true if this is the first successful consume in this process.
 * Returns false if the token was already consumed here.
 */
export function consumeHandoffToken(token: string): boolean {
  const now = Date.now();
  prune(now);
  const key = hashToken(token);
  if (consumed.has(key)) return false;
  consumed.set(key, { exp: now + AUDIT_HANDOFF_TTL_MS });
  return true;
}

/** Test-only reset. */
export function resetHandoffConsumptionForTests(): void {
  consumed.clear();
}
