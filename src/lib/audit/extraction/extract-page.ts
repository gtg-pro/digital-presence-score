import * as cheerio from "cheerio";

import type {
  ContactEvidence,
  CtaEvidence,
  HeadingEvidence,
  PageEvidence,
} from "@/features/audit/types/evidence.types";
import { resolveInternalUrl } from "@/lib/audit/crawler/page-discovery";

const EMAIL_RE =
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3,4}[\s.-]?\d{3,4}/g;

const CTA_KEYWORDS =
  /contact|call|book|schedule|quote|get started|request|enquire|inquire|sign up|subscribe|order|buy|demo/i;

const DATE_META_NAMES = [
  "article:published_time",
  "article:modified_time",
  "date",
  "publish-date",
  "pubdate",
  "DC.date",
  "DC.date.issued",
];

const MAX_EXCERPT_CHARS = 4_000;
const MAX_LINKS = 100;
const MAX_CTAS = 25;
const MAX_HEADINGS = 40;

export type RawPageInput = {
  originalUrl: string;
  finalUrl: string;
  httpStatus: number | null;
  html: string;
  contentType: string | null;
  allowedOrigin: string;
  observedAt: string;
};

function uniqueStrings(values: string[], limit = 50): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

function stripNoise($: cheerio.CheerioAPI) {
  $("script, style, noscript, svg, iframe, canvas, template").remove();
}

function extractHeadings($: cheerio.CheerioAPI): HeadingEvidence[] {
  const headings: HeadingEvidence[] = [];
  $("h1, h2, h3").each((_, el) => {
    if (headings.length >= MAX_HEADINGS) return false;
    const tag = (el as { tagName?: string }).tagName?.toLowerCase();
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!text) return;
    if (tag === "h1") headings.push({ level: 1, text });
    else if (tag === "h2") headings.push({ level: 2, text });
    else if (tag === "h3") headings.push({ level: 3, text });
  });
  return headings;
}

function extractInternalLinks(
  $: cheerio.CheerioAPI,
  baseUrl: string,
  allowedOrigin: string,
): string[] {
  const hrefs: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const absolute = resolveInternalUrl(href, baseUrl, allowedOrigin);
    if (absolute) hrefs.push(absolute);
  });
  return uniqueStrings(hrefs, MAX_LINKS);
}

function extractCtas(
  $: cheerio.CheerioAPI,
  baseUrl: string,
  allowedOrigin: string,
): CtaEvidence[] {
  const ctas: CtaEvidence[] = [];

  $("a[href], button").each((_, el) => {
    if (ctas.length >= MAX_CTAS) return false;
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!text || text.length > 120) return;
    if (!CTA_KEYWORDS.test(text)) return;

    const hrefAttr = $(el).attr("href") ?? null;
    let href: string | null = null;
    if (hrefAttr) {
      href =
        resolveInternalUrl(hrefAttr, baseUrl, allowedOrigin) ??
        (/^https?:\/\//i.test(hrefAttr) ? hrefAttr.split("#")[0]! : hrefAttr);
    }
    ctas.push({ text, href });
  });

  return ctas;
}

function extractContact($: cheerio.CheerioAPI, text: string): ContactEvidence {
  const mailto = $("a[href^='mailto:']")
    .map((_, el) => ($(el).attr("href") ?? "").replace(/^mailto:/i, "").split("?")[0] ?? "")
    .get();
  const tel = $("a[href^='tel:']")
    .map((_, el) => ($(el).attr("href") ?? "").replace(/^tel:/i, ""))
    .get();

  const emails = uniqueStrings([...(text.match(EMAIL_RE) ?? []), ...mailto], 10);
  const phones = uniqueStrings([...(text.match(PHONE_RE) ?? []), ...tel], 10).filter(
    (phone) => phone.replace(/\D/g, "").length >= 7,
  );

  const addresses: string[] = [];
  $("[itemprop='address'], address").each((_, el) => {
    const value = $(el).text().replace(/\s+/g, " ").trim();
    if (value && value.length < 300) addresses.push(value);
  });

  return {
    emails,
    phones,
    addresses: uniqueStrings(addresses, 5),
  };
}

function extractStructuredData($: cheerio.CheerioAPI): {
  hasStructuredData: boolean;
  structuredDataTypes: string[];
} {
  const types: string[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw.trim()) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      const collect = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) {
          node.forEach(collect);
          return;
        }
        const record = node as Record<string, unknown>;
        const type = record["@type"];
        if (typeof type === "string") types.push(type);
        if (Array.isArray(type)) {
          for (const item of type) {
            if (typeof item === "string") types.push(item);
          }
        }
        if (record["@graph"]) collect(record["@graph"]);
      };
      collect(parsed);
    } catch {
      types.push("InvalidJSON-LD");
    }
  });

  if ($("[itemscope]").length > 0) types.push("Microdata");

  const unique = uniqueStrings(types, 30);
  return {
    hasStructuredData: unique.length > 0 && !unique.every((t) => t === "InvalidJSON-LD"),
    structuredDataTypes: unique.filter((t) => t !== "InvalidJSON-LD"),
  };
}

/**
 * Never treat footer copyright years as publication dates.
 */
function extractPublicationDate($: cheerio.CheerioAPI): string | null {
  for (const name of DATE_META_NAMES) {
    const content =
      $(`meta[property="${name}"]`).attr("content") ??
      $(`meta[name="${name}"]`).attr("content");
    if (content?.trim()) return content.trim();
  }

  const time = $("article time[datetime], main time[datetime]").first().attr("datetime");
  if (time?.trim()) return time.trim();

  return null;
}

function extractMainText($: cheerio.CheerioAPI): string {
  const root =
    $("main").first().length > 0
      ? $("main").first()
      : $("article").first().length > 0
        ? $("article").first()
        : $("body");

  const clone = root.clone();
  clone.find("nav, footer, header, aside, form").remove();
  const text = clone.text().replace(/\s+/g, " ").trim();
  return text.slice(0, MAX_EXCERPT_CHARS);
}

/**
 * Extract page-level evidence from HTML. Does not archive the full page.
 */
export function extractPageEvidence(input: RawPageInput): PageEvidence {
  const $ = cheerio.load(input.html);

  // Capture JSON-LD / meta before removing script noise.
  const structured = extractStructuredData($);
  const publicationDate = extractPublicationDate($);
  const title = $("title").first().text().replace(/\s+/g, " ").trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;
  const canonicalUrl =
    $('link[rel="canonical"]').attr("href")?.trim() ||
    $('meta[property="og:url"]').attr("content")?.trim() ||
    null;

  stripNoise($);

  const headings = extractHeadings($);
  const internalLinks = extractInternalLinks($, input.finalUrl, input.allowedOrigin);
  const mainTextExcerpt = extractMainText($);
  const ctas = extractCtas($, input.finalUrl, input.allowedOrigin);
  const contact = extractContact($, mainTextExcerpt);

  return {
    source: {
      url: input.finalUrl,
      observedAt: input.observedAt,
      extractionMethod: "cheerio_html",
      availability: "available",
      confidence: 0.8,
    },
    originalUrl: input.originalUrl,
    finalUrl: input.finalUrl,
    httpStatus: input.httpStatus,
    title,
    metaDescription,
    headings,
    canonicalUrl,
    internalLinks,
    mainTextExcerpt,
    hasStructuredData: structured.hasStructuredData,
    structuredDataTypes: structured.structuredDataTypes,
    ctas,
    contact,
    publicationDate,
    contentType: input.contentType,
  };
}

export function collectAnchorHrefs(html: string): string[] {
  const $ = cheerio.load(html);
  const hrefs: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) hrefs.push(href);
  });
  return hrefs;
}
