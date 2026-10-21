/**
 * Optional live PageSpeed smoke test.
 * Loads GOOGLE_PAGESPEED_API_KEY from .env.local without printing secrets.
 *
 * Usage: node --env-file=.env.local scripts/pagespeed-smoke.mjs
 *    or: node scripts/pagespeed-smoke.mjs  (if env already set)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
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

const apiKey = (process.env.GOOGLE_PAGESPEED_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("SMOKE_SKIPPED: GOOGLE_PAGESPEED_API_KEY not set");
  process.exit(2);
}

const target = process.env.PAGESPEED_SMOKE_URL ?? "https://example.com";
const endpoint = new URL(
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
);
endpoint.searchParams.set("url", target);
endpoint.searchParams.set("strategy", "mobile");
endpoint.searchParams.set("category", "performance");
endpoint.searchParams.set("key", apiKey);

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 90_000);

try {
  const response = await fetch(endpoint.toString(), {
    signal: controller.signal,
    headers: { accept: "application/json" },
  });
  const json = await response.json();
  const score = json?.lighthouseResult?.categories?.performance?.score;
  const sanitized = {
    ok: response.ok,
    httpStatus: response.status,
    testedUrl: target,
    strategy: "mobile",
    lighthousePerformanceScore:
      typeof score === "number" ? Math.round(score * 100) : null,
    finalUrl: json?.lighthouseResult?.finalUrl ?? null,
    lighthouseVersion: json?.lighthouseResult?.lighthouseVersion ?? null,
    hasLabLcp: Boolean(
      json?.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue,
    ),
    hasFieldInp: Boolean(
      json?.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile ??
        json?.originLoadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT
          ?.percentile,
    ),
    note: "Sanitized live smoke summary — API key omitted.",
  };

  const out = path.join(root, "docs/examples/sample-pagespeed-live-smoke.json");
  writeFileSync(out, `${JSON.stringify(sanitized, null, 2)}\n`);
  console.log("SMOKE_OK");
  console.log(JSON.stringify(sanitized, null, 2));
  process.exit(response.ok ? 0 : 1);
} catch (error) {
  console.error(
    "SMOKE_FAILED:",
    error instanceof Error ? error.name : "unknown",
  );
  process.exit(1);
} finally {
  clearTimeout(timer);
}
