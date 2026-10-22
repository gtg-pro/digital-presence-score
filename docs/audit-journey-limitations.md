# Audit journey — operational notes

## Environment

Required server-only variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional; default `gpt-4o-mini` — prefer a model that supports Responses API `web_search`)
- `REPORT_SESSION_SECRET`

Do not set `NEXT_PUBLIC_` prefixes on credentials.
Google PageSpeed is no longer part of the audit engine.

## Honest retrieval limits

Sending a URL to OpenAI does not automatically mean the model visited the site.
This application uses a two-step OpenAI flow: Responses API `web_search` first (required), then a separate structured JSON scoring call. OpenAI rejects combining web_search with JSON/structured output in a single request.

If web search/citations are not observed, or retrieved information is insufficient:

- the run is marked LIMITED_VISIBILITY or PARTIAL as appropriate
- numerical /100 scores and maturity bands are withheld when eligibility thresholds are not met
- the Report Card presents a professional Digital Presence Overview instead of inventing findings

## Playwright usage

Playwright remains installed for:

- PDF export rendering
- PNG export rendering
- Playwright end-to-end tests

It is **not** used as a production website crawler for the OpenAI-only audit engine.

## Session and delivery limits

- Live reports are ephemeral encrypted cookie sessions (~30 minutes).
- Email delivery and public sharing are not available.
- No durable report database is used.
