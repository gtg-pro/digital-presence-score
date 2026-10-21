/**
 * Whether Set-Cookie should include the Secure attribute.
 *
 * Defaults to true in production. Override with COOKIE_SECURE=0 for local
 * `next start` / Playwright over plain HTTP (Secure cookies are not sent on
 * non-HTTPS origins other than browser localhost exceptions).
 */
export function cookieSecureAttribute(): boolean {
  const override = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (override === "0" || override === "false") return false;
  if (override === "1" || override === "true") return true;
  return process.env.NODE_ENV === "production";
}
