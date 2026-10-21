import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const html = readFileSync(
  path.join(root, "src/lib/audit/test/fixtures/sample-home.html"),
  "utf8",
);

/**
 * Lightweight sample printer mirroring extract-page fields for documentation.
 * Full extraction is covered by Vitest (TypeScript path aliases).
 */
const $ = load(html);
$("script, style, noscript").remove();

const sample = {
  ok: true,
  partial: false,
  request: {
    url: "https://example.com",
    normalizedUrl: "https://example.com/",
    maxPages: 20,
  },
  website: {
    seedUrl: "https://example.com",
    normalizedSeedUrl: "https://example.com/",
    homepageUrl: "https://example.com/",
    contactPageAvailable: "unavailable",
    aboutPageAvailable: "unavailable",
    discoveredServicePages: ["https://example.com/services"],
    pagesCrawled: 1,
    pagesSkipped: 0,
    robotsRespected: true,
  },
  pages: [
    {
      originalUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      httpStatus: 200,
      title: $("title").text().trim(),
      metaDescription: $('meta[name="description"]').attr("content") ?? null,
      headings: $("h1, h2")
        .map((_, el) => ({
          level: Number(el.tagName.replace("h", "")),
          text: $(el).text().replace(/\s+/g, " ").trim(),
        }))
        .get(),
      hasStructuredData: true,
      structuredDataTypes: ["LocalBusiness"],
      internalLinks: $("a[href]")
        .map((_, el) => $(el).attr("href"))
        .get()
        .filter((href) => href?.startsWith("/"))
        .map((href) => `https://example.com${href}`),
      contact: {
        emails: ["hello@acme-plumbing.example"],
        phones: ["(512) 555-0100"],
        addresses: [],
      },
      publicationDate: $('meta[property="article:modified_time"]').attr(
        "content",
      ),
      mainTextExcerpt: $("main")
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400),
      source: {
        url: "https://example.com/",
        observedAt: new Date().toISOString(),
        extractionMethod: "cheerio_html",
        availability: "available",
        confidence: 0.8,
      },
    },
  ],
  errors: [],
  note: "Sanitized fixture sample — not a live third-party crawl. Full typed extraction is validated in Vitest.",
};

const outPath = path.join(
  root,
  "docs/examples/sample-crawl-evidence.json",
);
writeFileSync(outPath, `${JSON.stringify(sample, null, 2)}\n`, "utf8");
console.log(`Wrote ${outPath}`);
console.log(JSON.stringify(sample, null, 2));
