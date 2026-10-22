# Audit functionality — tech stack

Technologies used specifically for the digital-presence auditing pipeline.

## External APIs (server-side)

| Service | Env var | Role |
|---------|---------|------|
| **OpenAI** | `OPENAI_API_KEY`, optional `OPENAI_MODEL` | Primary audit provider. Two-step Responses API flow: (1) `web_search` research brief, (2) structured JSON scoring. OpenAI does not allow web_search and JSON mode in one request. |
| **Report session crypto** | `REPORT_SESSION_SECRET` | Encrypts short-lived live report cookies and audit handoff tokens. |

## Analyze and score

| Technology | Role |
|------------|------|
| **OpenAI SDK** | Server-only client for Responses API + web_search + structured JSON outputs. |
| **Zod** | Runtime validation of OpenAI structured audit payloads. |
| **openai-web-v1.0 scoring** | Deterministic mapping of PASS/PARTIAL/FAIL/NOT_ASSESSED criterion anchors to the five-category, 100-point Report Card. OpenAI does not invent numeric totals. |

## Live audit delivery

| Technology | Role |
|------------|------|
| **SSE** (`POST /api/audit/run`) | Streams real assessment progress to the progress UI. |
| **Server Actions** | Starts the pending audit session and finalizes encrypted report handoff. |
| **httpOnly encrypted cookies** | Holds the ephemeral live report (~30 minutes). |
| **AES-GCM** (with compression) | Seals pending-session, handoff, and report cookie payloads. |
| **Playwright Chromium** | Used only for PDF/PNG export rendering and end-to-end browser tests — not for production website crawling. |

## What the audit evaluates (summary)

- **Website Experience** (25) — clarity, navigation, readability, service information, UX signals supported by retrieved public information  
- **Local SEO Presence** (25) — search-relevant content, service/location relevance, titles/headings, local discovery signals when available  
- **Reputation & Trust** (20) — visible testimonials, credibility signals, published credentials/case content (not fabricated third-party proof)  
- **Content Authority** (15) — service-page quality, depth, resources/FAQs, topical coverage  
- **Conversion Readiness** (15) — CTA clarity, contact/inquiry paths, conversion friction  

Outcomes: **COMPLETE**, **PARTIAL**, or **LIMITED_VISIBILITY**.
Numerical overall scores and maturity bands are published only when evidence eligibility thresholds are met.
