# Report PDF/PNG export — runtime notes

Server-side exports use Playwright Chromium (`page.setContent` only; no arbitrary URL navigation).

## Requirements

- **Local / persistent Node:** Playwright Chromium (`npx playwright install chromium`).
- **Netlify / AWS Lambda Linux:** `@sparticuz/chromium` (bundled via NFT includes + `netlify.toml`). Launch uses `launchAuditBrowser()` — not Playwright’s default downloaded browser.
- Sufficient memory for headless Chromium (Netlify functions set to 2048 MB in `netlify.toml`; ≥512 MB free typical).
- Request timeout budget ≥30s for PDF/PNG generation on cold start.

## Hosting constraints

- Prefer a persistent Node server (`next start`) or a container with Chromium dependencies installed when possible.
- Serverless Linux hosts must ship a compatible Chromium binary (`@sparticuz/chromium`); Playwright’s browser cache is not present in Netlify function bundles.
- **File tracing:** Playwright 1.60+ loads `playwright-core/browsers.json` via a dynamic `require(path.join(...))`, so Next.js NFT omits it unless `outputFileTracingIncludes` lists that file (and `@sparticuz/chromium/**`) for `/api/audit/run` and report PDF/PNG routes.
- Function duration, `/tmp` size, and cold-start decompression of Chromium remain platform limits — validate after each deploy.
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
