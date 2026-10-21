/**
 * Google PageSpeed Insights performance evidence.
 * Separate from crawl evidence and from scoring decisions.
 */

export type PerformanceDeviceStrategy = "mobile" | "desktop";

export type PerformanceMetricSource = "field" | "lab";

/**
 * Measurement availability for PageSpeed metrics.
 * API/provider failures must use not_assessed / not_measured — never invent zeros.
 */
export type MeasurementAvailability =
  | "available"
  | "not_assessed"
  | "not_measured"
  | "error";

export type PerformanceMetricName =
  | "lighthouse_performance_score"
  | "largest_contentful_paint"
  | "interaction_to_next_paint"
  | "cumulative_layout_shift"
  | "first_contentful_paint"
  | "total_blocking_time"
  | "speed_index"
  | "total_byte_weight"
  | "render_blocking_resources";

export type PerformanceErrorCode =
  | "missing_api_key"
  | "invalid_url"
  | "ssrf_blocked"
  | "timeout"
  | "rate_limited"
  | "quota_exceeded"
  | "invalid_response"
  | "provider_error"
  | "network_error"
  | "not_measurable"
  | "unknown";

export type PerformanceError = {
  code: PerformanceErrorCode;
  message: string;
  url?: string;
  strategy?: PerformanceDeviceStrategy;
  /** Sanitized provider status if applicable — never includes secrets */
  httpStatus?: number;
  details?: string;
};

export type PerformanceRequest = {
  /** Homepage or primary URL to measure. */
  url: string;
  /** Optional important service page URLs discovered by the crawler. */
  servicePageUrls?: string[];
  /** Defaults to both mobile and desktop. */
  strategies?: PerformanceDeviceStrategy[];
  /** Max service pages to measure in addition to homepage (default 1). */
  maxServicePages?: number;
  timeoutMs?: number;
  maxRetries?: number;
  /** Test-only override; production reads GOOGLE_PAGESPEED_API_KEY. */
  apiKey?: string;
};

export type PerformanceMetric = {
  name: PerformanceMetricName;
  value: number | null;
  unit: string | null;
  classification: PerformanceMetricSource;
  availability: MeasurementAvailability;
  /** Human-readable display value from Lighthouse when present */
  displayValue?: string | null;
  /** Provider metric id (e.g. largest-contentful-paint) */
  providerMetricId?: string;
  notes?: string;
};

export type PerformanceMetrics = {
  lighthousePerformanceScore: PerformanceMetric;
  largestContentfulPaint: PerformanceMetric;
  interactionToNextPaint: PerformanceMetric;
  cumulativeLayoutShift: PerformanceMetric;
  firstContentfulPaint: PerformanceMetric;
  totalBlockingTime: PerformanceMetric;
  speedIndex: PerformanceMetric;
  totalByteWeight: PerformanceMetric;
  renderBlockingResources: PerformanceMetric;
};

export type PerformanceEvidence = {
  testedUrl: string;
  finalUrl: string | null;
  deviceStrategy: PerformanceDeviceStrategy;
  provider: "google_pagespeed_insights";
  measuredAt: string;
  availability: MeasurementAvailability;
  metrics: PerformanceMetrics;
  /** Lighthouse version / fetch time metadata from provider when present */
  providerMetadata: {
    lighthouseVersion: string | null;
    fetchTime: string | null;
    analysisUTCTimestamp: string | null;
    overallCategory: string | null;
  };
  sourceNotes?: string;
};

export type PerformanceResult = {
  ok: boolean;
  request: {
    url: string;
    normalizedUrl: string;
    strategies: PerformanceDeviceStrategy[];
    servicePageUrls: string[];
  };
  evidence: PerformanceEvidence[];
  errors: PerformanceError[];
  startedAt: string;
  finishedAt: string;
  partial: boolean;
};
