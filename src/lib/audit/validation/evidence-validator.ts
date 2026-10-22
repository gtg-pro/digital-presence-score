/**
 * Evidence catalog types for OpenAI-only audits.
 * Hybrid crawl/PageSpeed collectors were removed; this module retains the
 * validated evidence item shape used by AssessmentResult and report mapping.
 */

export type ValidatedEvidenceItem = {
  id: string;
  kind: "website" | "page" | "pagespeed";
  sourceUrl: string;
  observedAt: string;
  collectionMethod:
    | "openai_web_search"
    | "playwright_dom"
    | "cheerio_html"
    | "http_headers"
    | "sitemap_xml"
    | "robots_txt"
    | "manual_fixture"
    | "google_pagespeed_insights";
  availability: string;
  /** Compact collected value summary — never fabricated. */
  valueSummary?: string;
  title?: string;
  deviceStrategy?: "mobile" | "desktop";
  metricClassificationNotes?: string[];
};

export type EvidenceValidationIssue = {
  code:
    | "missing_evidence_id"
    | "missing_source_url"
    | "missing_timestamp"
    | "missing_collection_method"
    | "missing_availability"
    | "duplicate_evidence"
    | "unsupported_ai_reference"
    | "empty_ai_evidence"
    | "invalid_pagespeed_metric"
    | "inaccessible_page_not_feature_absence";
  message: string;
  evidenceId?: string;
  findingId?: string;
};

export type EvidenceValidationResult = {
  ok: boolean;
  websiteConfirmed: boolean;
  items: ValidatedEvidenceItem[];
  issues: EvidenceValidationIssue[];
};
