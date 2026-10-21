# Audit journey — production-relevant limitations

Verified against the Prompt 21–24 implementation.

## Product scope (intentionally not included)

- **No persistent database** — live reports are ephemeral browser-session cookies only.
- **No email delivery** of reports.
- **No Admin / Super Admin dashboard.**
- **No background job queues** (Redis, workers, etc.).
- **No website-less / business-details-only audit path** — assessments start from the homepage URL field only (`/audit` redirects home).
- **Live OpenAI / Google PageSpeed connectivity** is configured via env vars but was **not verified** in the automated Prompt 23–24 QA pass (CI uses mocked/fixture boundaries).

## Local vs production parity

- Match Production env vars to local: `GOOGLE_PAGESPEED_API_KEY`, `OPENAI_API_KEY`, `REPORT_SESSION_SECRET`. Do not set `AUDIT_SKIP_PAGESPEED` / `AUDIT_SKIP_OPENAI` in Production.
- Same URL can still differ slightly when local Playwright Chromium vs serverless `@sparticuz/chromium` extract different DOM, or when PageSpeed/OpenAI is available in one environment only.

## Streaming

- Live audits use a single `POST /api/audit/run` Server-Sent Events response.
- Progress events reflect genuine `runAssessment()` stage callbacks (not fake timers).
- Default assessment wall-clock budget: **120 seconds** (`DEFAULT_ASSESSMENT_TIMEOUT_MS`).
- Report cookies cannot be set mid-stream for a subsequent client navigation; completion returns a short-lived encrypted handoff token. The client calls `finalizeAuditHandoff` (Server Action) to write httpOnly report cookies, then navigates to `/report/live-*`.
- Cross-site browser posts are rejected (`sec-fetch-site: cross-site` / mismatched `Origin`).
- Request JSON bodies are bounded (~32 KB).

## Report session

- Encrypted cookie transport: deflate-compressed AES-GCM payload, chunked cookies (**~18 KB sealed budget / 6×3 KB chunks**, **30-minute TTL**).
- Oversized mapped reports fail with a clear error (no silent truncation).
- **Node default `max-http-header-size` is 16KB.** Large Cookie headers return **HTTP 431**. Production should run with `NODE_OPTIONS=--max-http-header-size=65536` (or equivalent reverse-proxy limits). Compression reduces but does not eliminate this risk.
- **`REPORT_SESSION_SECRET` is required in production.** Development uses a local fallback only.
- Cookies default to `Secure` in production. For local `next start` / Playwright over plain HTTP, set `COOKIE_SECURE=0`.
- After handoff finalize, the client uses a **hard navigation** so httpOnly report cookies are present on the report request (soft `router.push` can race `Set-Cookie`).
- Guessing a `live-*` report ID does not reveal another browser’s cookie-bound session.

## Handoff token

- Sealed handoff tokens expire after ~5 minutes.
- Process-local one-time consumption is enforced after successful finalize.
- **Limitation:** consumption state is not shared across serverless isolates or multiple Node processes. Replay could succeed on another instance until expiry. Durable single-use handoff needs shared storage (out of scope; no Redis/DB).

## Rate limiting

- Process-local sliding window (**5 / minute**) and concurrency (**2**) per client IP key.
- **Not globally reliable** on serverless or multi-instance hosts. Each isolate has its own counters.
- Production-wide rate limiting needs an external store or platform/WAF controls (out of scope; no Redis).

## Timeouts and disconnect

- Client disconnect aborts the in-flight stream where supported.
- Retry starts a fresh assessment (pending cookie retained on technical failure).

## Browser / crawl runtime (Netlify / Vercel)

- Live crawls require a launchable Chromium. On serverless Linux (Netlify, Vercel, Lambda) this is `@sparticuz/chromium` (not Playwright’s cached browser download).
- Runtime detection must include `VERCEL` / `VERCEL_ENV` — Vercel Fluid Compute may omit `AWS_LAMBDA_*`, so a Netlify-only check incorrectly falls back to Playwright’s missing browser and shows `browser_executable_missing` with the `npx playwright install` hint.
- If browser launch fails, the assessment returns **LIMITED_VISIBILITY** with crawl error `browser_executable_missing` / `browser_launch_failed`, evidence coverage 0%, and PageSpeed/OpenAI marked **skipped** with explicit reasons (not silent `not_requested`).
- Crawl diagnostics record launch attempt/success, sanitized failure reason, navigation counts, robots decision, and final crawler status — without secrets or raw HTML.
- SSRF and robots restrictions are unchanged. Genuine inaccessible sites still correctly produce LIMITED_VISIBILITY.
- API keys (`OPENAI_API_KEY`, `GOOGLE_PAGESPEED_API_KEY`, `REPORT_SESSION_SECRET`) do not install Chromium; missing keys only affect later stages after a successful crawl.

## E2E fixtures (test-only)

- `ALLOW_AUDIT_E2E_FIXTURES=1` enables crawl/PageSpeed/OpenAI injectables for Playwright.
- Optional header `x-audit-e2e-fixture: complete|partial|limited` selects the fixture.
- **Never set `ALLOW_AUDIT_E2E_FIXTURES` on real production traffic.**

## Demo vs live

- `/audit/progress?demo=1` keeps demo snapshots for UI preview.
- Production submissions never redirect to demo report IDs.
- Live reports never fall back to demo fixtures.
