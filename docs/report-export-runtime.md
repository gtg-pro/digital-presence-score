# Report PDF/PNG export — runtime notes

Server-side exports use Playwright Chromium (`page.setContent` only; no arbitrary URL navigation).

## Requirements

- Node.js runtime with the Playwright Chromium browser installed (`npx playwright install chromium`).
- Sufficient memory for headless Chromium (typically ≥512MB free for a single export).
- Request timeout budget ≥30s for PDF/PNG generation on cold start.

## Hosting constraints

- Prefer a persistent Node server (`next start`) or a container with Chromium dependencies installed.
- Many serverless platforms restrict Playwright/Chromium, limit `/tmp`, or enforce short timeouts — validate in the target environment before calling exports production-ready.
- Ephemeral live reports rely on compressed encrypted httpOnly cookies (`REPORT_SESSION_SECRET`, 30-minute TTL, ~18KB sealed budget). Expired sessions return export errors and never fall back to demo fixtures. Large Cookie headers may require `NODE_OPTIONS=--max-http-header-size=65536`.

## Security

- Export routes accept only validated report IDs (`demo`, `demo-complete`, `demo-partial`, `demo-limited`, or `live-*`).
- Rendering input is a server-built HTML snapshot from `DigitalPresenceReport` (HTML-escaped text). Client HTML and client-submitted scores are rejected.
- Live exports load only from the caller’s encrypted httpOnly session cookies — a guessed `live-*` ID cannot read another session.
- Responses use `Cache-Control: private, no-store`.
- Chromium is launched with `page.setContent` only (no arbitrary URL navigation / screenshot SSRF).

## Consistency

- HTML report card, PDF, and PNG share the same validated `DigitalPresenceReport` snapshot (scores, status, policy disclosures).
- PARTIAL and LIMITED_VISIBILITY exports must not invent an overall numerical score.
