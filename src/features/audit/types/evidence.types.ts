/**
 * Structured crawl evidence types.
 * Kept separate from scoring — observations only, no score decisions.
 */

export type AssessmentAvailability =
  | "available"
  | "partial"
  | "unavailable"
  | "blocked"
  | "error";

export type EvidenceExtractionMethod =
  | "playwright_dom"
  | "cheerio_html"
  | "http_headers"
  | "sitemap_xml"
  | "robots_txt"
  | "manual_fixture";

export type EvidenceSource = {
  url: string;
  observedAt: string;
  extractionMethod: EvidenceExtractionMethod;
  availability: AssessmentAvailability;
  /** Optional 0–1 confidence for downstream consumers */
  confidence?: number;
  notes?: string;
};

export type CrawlErrorCode =
  | "invalid_url"
  | "ssrf_blocked"
  | "dns_failure"
  | "robots_blocked"
  | "timeout"
  | "redirect_error"
  | "unsupported_content_type"
  | "browser_failure"
  | "response_too_large"
  | "crawl_limit_reached"
  | "network_error"
  | "partial_crawl"
  | "unknown";

export type CrawlError = {
  code: CrawlErrorCode;
  message: string;
  url?: string;
  details?: string;
};

export type CrawlRequest = {
  /** User-supplied website URL (will be normalized). */
  url: string;
  /** Max pages to fetch (default 20). */
  maxPages?: number;
  /** Max link depth from homepage (default 2). */
  maxDepth?: number;
  /** Per-navigation timeout in ms (default 15000). */
  navigationTimeoutMs?: number;
  /** Max HTML bytes retained per page (default 1_500_000). */
  maxResponseBytes?: number;
  /** User-Agent for crawl requests. */
  userAgent?: string;
};

export type HeadingEvidence = {
  level: 1 | 2 | 3;
  text: string;
};

export type CtaEvidence = {
  text: string;
  href: string | null;
};

export type ContactEvidence = {
  emails: string[];
  phones: string[];
  addresses: string[];
};

export type PageEvidence = {
  source: EvidenceSource;
  originalUrl: string;
  finalUrl: string;
  httpStatus: number | null;
  title: string | null;
  metaDescription: string | null;
  headings: HeadingEvidence[];
  canonicalUrl: string | null;
  internalLinks: string[];
  /** Truncated main text — not a full page archive */
  mainTextExcerpt: string;
  hasStructuredData: boolean;
  structuredDataTypes: string[];
  ctas: CtaEvidence[];
  contact: ContactEvidence;
  /** Attributable publication/update date only — never footer copyright years */
  publicationDate: string | null;
  contentType: string | null;
};

export type WebsiteEvidence = {
  source: EvidenceSource;
  seedUrl: string;
  normalizedSeedUrl: string;
  homepageUrl: string | null;
  discoveredServicePages: string[];
  contactPageAvailable: AssessmentAvailability;
  contactPageUrl: string | null;
  aboutPageAvailable: AssessmentAvailability;
  aboutPageUrl: string | null;
  serviceAreaSignals: string[];
  publicSocialProfileLinks: string[];
  faqOrResourcePages: string[];
  primaryConversionPathways: CtaEvidence[];
  pagesCrawled: number;
  pagesSkipped: number;
  robotsRespected: boolean;
};

export type CrawlResult = {
  ok: boolean;
  request: Required<
    Pick<
      CrawlRequest,
      | "maxPages"
      | "maxDepth"
      | "navigationTimeoutMs"
      | "maxResponseBytes"
      | "userAgent"
    >
  > & { url: string; normalizedUrl: string };
  website: WebsiteEvidence | null;
  pages: PageEvidence[];
  errors: CrawlError[];
  startedAt: string;
  finishedAt: string;
  partial: boolean;
};
