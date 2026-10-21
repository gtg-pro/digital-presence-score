/**
 * Same-origin guard for state-changing audit API requests.
 * Browsers send Origin on cross-origin POSTs; reject explicit cross-site calls.
 */
export function isAllowedAuditRequestOrigin(request: Request): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    // Non-browser clients / same-origin requests may omit Origin.
    return true;
  }

  const host = request.headers.get("host");
  if (!host) return false;

  try {
    const parsed = new URL(origin);
    return parsed.host === host;
  } catch {
    return false;
  }
}

export const MAX_AUDIT_REQUEST_BODY_BYTES = 32_768;
