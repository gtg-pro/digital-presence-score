/**
 * Controlled live OpenAI smoke using fixture-like evidence JSON.
 * Does not print API keys.
 *
 * Usage: node scripts/openai-analysis-smoke.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
const model = (process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim();

if (!apiKey) {
  console.error("SMOKE_SKIPPED: OPENAI_API_KEY not set");
  process.exit(2);
}

const evidence = {
  allowedEvidenceIds: ["website-1", "page-1"],
  evidence: [
    {
      id: "website-1",
      kind: "website",
      url: "https://example.com/",
      observedAt: "2026-10-21T05:00:00.000Z",
    },
    {
      id: "page-1",
      kind: "page",
      url: "https://example.com/",
      observedAt: "2026-10-21T05:00:00.000Z",
      title: "Acme Plumbing",
      headings: [{ level: 1, text: "Trusted plumbing for Austin homes" }],
      excerpt:
        "We provide drain cleaning and emergency plumbing. Request a Quote.",
      ctas: [{ text: "Request a Quote", href: "/contact" }],
    },
  ],
};

const schema = {
  name: "digital_presence_qualitative_analysis_smoke",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "status",
      "industryContext",
      "businessContext",
      "findings",
      "overallConfidence",
    ],
    properties: {
      status: {
        type: "string",
        enum: ["available", "partial", "insufficient_evidence", "not_assessed"],
      },
      industryContext: { type: ["string", "null"] },
      businessContext: { type: ["string", "null"] },
      findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "category",
            "title",
            "description",
            "evidenceIds",
            "confidence",
          ],
          properties: {
            id: { type: "string" },
            category: {
              type: "string",
              enum: [
                "website_experience",
                "local_seo_presence",
                "reputation_trust",
                "content_authority",
                "conversion_readiness",
              ],
            },
            title: { type: "string" },
            description: { type: "string" },
            evidenceIds: { type: "array", items: { type: "string" } },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
        },
      },
      overallConfidence: { type: "string", enum: ["high", "medium", "low"] },
    },
  },
};

const client = new OpenAI({ apiKey, timeout: 60_000 });

try {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Return qualitative analysis only. Cite only provided evidenceIds. Do not invent scores.",
      },
      {
        role: "user",
        content: `Analyze this evidence JSON:\n${JSON.stringify(evidence)}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: schema },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  const allowed = new Set(evidence.allowedEvidenceIds);
  const findings = Array.isArray(parsed.findings) ? parsed.findings : [];
  const validFindings = findings.filter(
    (finding) =>
      Array.isArray(finding.evidenceIds) &&
      finding.evidenceIds.every((id) => allowed.has(id)),
  );

  const sanitized = {
    ok: true,
    model: completion.model ?? model,
    status: parsed.status ?? null,
    industryContext: parsed.industryContext ?? null,
    findingsCount: findings.length,
    validEvidenceBackedFindings: validFindings.length,
    overallConfidence: parsed.overallConfidence ?? null,
    note: "Sanitized live smoke summary — API key omitted.",
  };

  const out = path.join(root, "docs/examples/sample-openai-live-smoke.json");
  writeFileSync(out, `${JSON.stringify(sanitized, null, 2)}\n`);
  console.log("SMOKE_OK");
  console.log(JSON.stringify(sanitized, null, 2));
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown";
  console.error(
    "SMOKE_FAILED:",
    message.replace(/sk-[a-zA-Z0-9_-]+/g, "[REDACTED]").slice(0, 200),
  );
  process.exit(1);
}
