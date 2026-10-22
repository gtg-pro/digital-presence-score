/**
 * Optional live OpenAI web-audit smoke (not part of routine CI).
 * Exercises retrieve-then-score because web_search cannot use JSON mode.
 *
 * Usage: node --env-file=.env.local scripts/openai-web-audit-smoke.mjs [url]
 */
import OpenAI from "openai";

const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("SMOKE_SKIPPED: OPENAI_API_KEY not set");
  process.exit(0);
}

const model = (process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim();
const websiteUrl = process.argv[2] ?? "https://example.com";
const client = new OpenAI({ apiKey, timeout: 120_000 });

const retrieval = await client.responses.create({
  model,
  store: false,
  tools: [{ type: "web_search" }],
  tool_choice: "required",
  include: ["web_search_call.action.sources"],
  input: `Use web_search and summarize public information about ${websiteUrl} for a digital-presence audit. Include SOURCE: urls.`,
});

const webSearchUsed = (retrieval.output ?? []).some(
  (item) => item.type === "web_search_call",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      model,
      websiteUrl,
      webSearchUsed,
      briefPreview: String(retrieval.output_text ?? "").slice(0, 320),
    },
    null,
    2,
  ),
);
