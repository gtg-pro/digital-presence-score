# Audit functionality — tech stack

Technologies used specifically for the digital-presence auditing pipeline.

## External APIs (server-side)

| Service | Env var | Role |
|---------|---------|------|
| **OpenAI** | `OPENAI_API_KEY`, optional `OPENAI_MODEL` | Structured content analysis grounded in crawl evidence. Does not invent the numerical score. |
| **Google PageSpeed Insights** | `GOOGLE_PAGESPEED_API_KEY` | Mobile and desktop performance metrics (lab/field where available). |
| **Report session crypto** | `REPORT_SESSION_SECRET` | Encrypts short-lived live report cookies and audit handoff tokens. |

## Crawl, extract, and analyze

| Technology | Role |
|------------|------|
| **Playwright Chromium** | Bounded, SSRF-aware website crawling and evidence capture. |
| **Cheerio** | HTML parsing and structured field extraction from crawled pages. |
| **OpenAI SDK** | Client for structured outputs used in content analysis. |
| **Zod** | Schema validation for OpenAI structured responses and related contracts. |

## Scoring

| Technology | Role |
|------------|------|
| **strict-v1.0 scoring engine** | Deterministic category/criterion scoring (100 points across five categories). Absolute points earned; unassessed checks are not automatic fails. |

## Live audit delivery

| Technology | Role |
|------------|------|
| **SSE** (`POST /api/audit/run`) | Streams real assessment progress to the progress UI. |
| **Server Actions** | Starts the pending audit session and finalizes encrypted report handoff. |
| **httpOnly encrypted cookies** | Holds the ephemeral live report (~30 minutes). |
| **AES-GCM** (with compression) | Seals pending-session, handoff, and report cookie payloads. |
| **Playwright Chromium** | Also used to render PDF/PNG exports from the validated report snapshot. |

## What the audit evaluates (summary)

- **Website Experience** (25) — usability, measured performance, readability, structure, business info  
- **Local SEO Presence** (25) — intent/geo metadata, service coverage, crawlability/schema, discovery, contact consistency  
- **Reputation & Trust** (20) — evidenced reviews/credentials/testimonials/activity  
- **Content Authority** (15) — depth, education, freshness, topical breadth  
- **Conversion Readiness** (15) — CTAs, inquiry path, next steps, trust near CTAs, mobile completion  

Outcomes: **COMPLETE**, **PARTIAL**, or **LIMITED_VISIBILITY**.
