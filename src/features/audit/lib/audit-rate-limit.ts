/**
 * Process-local sliding-window rate limit for audit submissions.
 *
 * PRODUCTION LIMITATION:
 * This is NOT globally reliable on serverless or horizontally scaled hosts.
 * Each isolate maintains its own counters. For deploy-wide enforcement, use an
 * external rate-limit store (Redis, edge WAF, platform rate limits) — out of
 * scope for Prompt 21 (no Redis / durable job store).
 */

type Bucket = {
  timestamps: number[];
  inFlight: number;
};

const buckets = new Map<string, Bucket>();

export const AUDIT_RATE_LIMIT_WINDOW_MS = 60_000;
export const AUDIT_RATE_LIMIT_MAX_PER_WINDOW = 5;
export const AUDIT_MAX_CONCURRENT = 2;

function prune(bucket: Bucket, now: number): void {
  bucket.timestamps = bucket.timestamps.filter(
    (t) => now - t < AUDIT_RATE_LIMIT_WINDOW_MS,
  );
}

export type RateLimitDecision =
  | { ok: true }
  | { ok: false; reason: "rate_limited" | "busy"; message: string };

export function checkAuditRateLimit(key: string): RateLimitDecision {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [], inFlight: 0 };
    buckets.set(key, bucket);
  }
  prune(bucket, now);

  if (bucket.inFlight >= AUDIT_MAX_CONCURRENT) {
    return {
      ok: false,
      reason: "busy",
      message:
        "Too many audits are already running from this network. Please wait and retry.",
    };
  }

  if (bucket.timestamps.length >= AUDIT_RATE_LIMIT_MAX_PER_WINDOW) {
    return {
      ok: false,
      reason: "rate_limited",
      message:
        "Audit submission rate limit reached. Please wait about a minute before retrying.",
    };
  }

  return { ok: true };
}

export function beginAuditRequest(key: string): void {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [], inFlight: 0 };
    buckets.set(key, bucket);
  }
  prune(bucket, now);
  bucket.timestamps.push(now);
  bucket.inFlight += 1;
}

export function endAuditRequest(key: string): void {
  const bucket = buckets.get(key);
  if (!bucket) return;
  bucket.inFlight = Math.max(0, bucket.inFlight - 1);
}

/** Test-only reset. */
export function resetAuditRateLimitForTests(): void {
  buckets.clear();
}
