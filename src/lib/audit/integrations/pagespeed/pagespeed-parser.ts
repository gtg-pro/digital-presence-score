import type {
  MeasurementAvailability,
  PerformanceDeviceStrategy,
  PerformanceEvidence,
  PerformanceMetric,
  PerformanceMetricName,
  PerformanceMetrics,
  PerformanceMetricSource,
} from "@/lib/audit/integrations/pagespeed/pagespeed.types";

/** Official PSI response shapes we care about (partial). */
export type PsiApiResponse = {
  id?: string;
  analysisUTCTimestamp?: string;
  lighthouseResult?: {
    requestedUrl?: string;
    finalUrl?: string;
    fetchTime?: string;
    lighthouseVersion?: string;
    categories?: {
      performance?: {
        score?: number | null;
        title?: string;
      };
    };
    audits?: Record<
      string,
      {
        id?: string;
        title?: string;
        numericValue?: number;
        numericUnit?: string;
        displayValue?: string;
        score?: number | null;
        details?: {
          type?: string;
          overallSavingsMs?: number;
          items?: unknown[];
          overallSavingsBytes?: number;
        };
      }
    >;
  };
  loadingExperience?: PsiLoadingExperience;
  originLoadingExperience?: PsiLoadingExperience;
};

type PsiLoadingExperience = {
  overall_category?: string;
  metrics?: Record<
    string,
    {
      percentile?: number;
      category?: string;
      distributions?: unknown[];
    }
  >;
};

function notMeasured(
  name: PerformanceMetricName,
  classification: PerformanceMetricSource,
  notes?: string,
): PerformanceMetric {
  return {
    name,
    value: null,
    unit: null,
    classification,
    availability: "not_measured",
    displayValue: null,
    notes,
  };
}

function metric(options: {
  name: PerformanceMetricName;
  value: number | null;
  unit: string | null;
  classification: PerformanceMetricSource;
  availability: MeasurementAvailability;
  displayValue?: string | null;
  providerMetricId?: string;
  notes?: string;
}): PerformanceMetric {
  return {
    name: options.name,
    value: options.value,
    unit: options.unit,
    classification: options.classification,
    availability: options.availability,
    displayValue: options.displayValue ?? null,
    providerMetricId: options.providerMetricId,
    notes: options.notes,
  };
}

function readLabAudit(
  audits: NonNullable<PsiApiResponse["lighthouseResult"]>["audits"],
  id: string,
): {
  value: number | null;
  unit: string | null;
  displayValue: string | null;
} {
  const audit = audits?.[id];
  if (!audit || typeof audit.numericValue !== "number") {
    return { value: null, unit: null, displayValue: null };
  }
  return {
    value: audit.numericValue,
    unit: audit.numericUnit ?? null,
    displayValue: audit.displayValue ?? null,
  };
}

/**
 * Field INP comes from CrUX loadingExperience — never from lab TBT.
 */
function readFieldMetric(
  experience: PsiLoadingExperience | undefined,
  key: string,
  unit: string,
): { value: number | null; availability: MeasurementAvailability } {
  const entry = experience?.metrics?.[key];
  if (!entry || typeof entry.percentile !== "number") {
    return { value: null, availability: "not_measured" };
  }
  // CrUX percentiles for timing metrics are typically milliseconds already.
  void unit;
  return { value: entry.percentile, availability: "available" };
}

function emptyMetrics(): PerformanceMetrics {
  return {
    lighthousePerformanceScore: notMeasured(
      "lighthouse_performance_score",
      "lab",
    ),
    largestContentfulPaint: notMeasured("largest_contentful_paint", "lab"),
    interactionToNextPaint: notMeasured(
      "interaction_to_next_paint",
      "field",
      "INP is field-only; lab TBT is reported separately.",
    ),
    cumulativeLayoutShift: notMeasured("cumulative_layout_shift", "lab"),
    firstContentfulPaint: notMeasured("first_contentful_paint", "lab"),
    totalBlockingTime: notMeasured("total_blocking_time", "lab"),
    speedIndex: notMeasured("speed_index", "lab"),
    totalByteWeight: notMeasured("total_byte_weight", "lab"),
    renderBlockingResources: notMeasured("render_blocking_resources", "lab"),
  };
}

/**
 * Parse a raw PSI JSON payload into typed performance evidence.
 * Missing metrics become not_measured — never fabricated zeros for failures.
 */
export function parsePagespeedResponse(options: {
  response: PsiApiResponse;
  testedUrl: string;
  strategy: PerformanceDeviceStrategy;
  measuredAt: string;
}): PerformanceEvidence {
  const { response, testedUrl, strategy, measuredAt } = options;
  const lh = response.lighthouseResult;
  const audits = lh?.audits ?? {};
  const metrics = emptyMetrics();

  const score = lh?.categories?.performance?.score;
  if (typeof score === "number") {
    metrics.lighthousePerformanceScore = metric({
      name: "lighthouse_performance_score",
      // Lighthouse category score is 0–1; expose as 0–100 for readability
      value: Math.round(score * 1000) / 10,
      unit: "score",
      classification: "lab",
      availability: "available",
      displayValue: `${Math.round(score * 100)}`,
      providerMetricId: "performance",
    });
  }

  const lcp = readLabAudit(audits, "largest-contentful-paint");
  if (lcp.value !== null) {
    metrics.largestContentfulPaint = metric({
      name: "largest_contentful_paint",
      value: lcp.value,
      unit: lcp.unit ?? "millisecond",
      classification: "lab",
      availability: "available",
      displayValue: lcp.displayValue,
      providerMetricId: "largest-contentful-paint",
    });
  }

  const cls = readLabAudit(audits, "cumulative-layout-shift");
  if (cls.value !== null) {
    metrics.cumulativeLayoutShift = metric({
      name: "cumulative_layout_shift",
      value: cls.value,
      unit: cls.unit ?? "unitless",
      classification: "lab",
      availability: "available",
      displayValue: cls.displayValue,
      providerMetricId: "cumulative-layout-shift",
    });
  }

  const fcp = readLabAudit(audits, "first-contentful-paint");
  if (fcp.value !== null) {
    metrics.firstContentfulPaint = metric({
      name: "first_contentful_paint",
      value: fcp.value,
      unit: fcp.unit ?? "millisecond",
      classification: "lab",
      availability: "available",
      displayValue: fcp.displayValue,
      providerMetricId: "first-contentful-paint",
    });
  }

  const tbt = readLabAudit(audits, "total-blocking-time");
  if (tbt.value !== null) {
    metrics.totalBlockingTime = metric({
      name: "total_blocking_time",
      value: tbt.value,
      unit: tbt.unit ?? "millisecond",
      classification: "lab",
      availability: "available",
      displayValue: tbt.displayValue,
      providerMetricId: "total-blocking-time",
      notes: "Lab Total Blocking Time — not Interaction to Next Paint (INP).",
    });
  }

  const speedIndex = readLabAudit(audits, "speed-index");
  if (speedIndex.value !== null) {
    metrics.speedIndex = metric({
      name: "speed_index",
      value: speedIndex.value,
      unit: speedIndex.unit ?? "millisecond",
      classification: "lab",
      availability: "available",
      displayValue: speedIndex.displayValue,
      providerMetricId: "speed-index",
    });
  }

  const bytes = readLabAudit(audits, "total-byte-weight");
  if (bytes.value !== null) {
    metrics.totalByteWeight = metric({
      name: "total_byte_weight",
      value: bytes.value,
      unit: bytes.unit ?? "byte",
      classification: "lab",
      availability: "available",
      displayValue: bytes.displayValue,
      providerMetricId: "total-byte-weight",
    });
  }

  const blocking = audits["render-blocking-resources"];
  if (blocking) {
    const itemCount = Array.isArray(blocking.details?.items)
      ? blocking.details.items.length
      : null;
    const savings = blocking.details?.overallSavingsMs;
    metrics.renderBlockingResources = metric({
      name: "render_blocking_resources",
      value: typeof itemCount === "number" ? itemCount : (savings ?? null),
      unit:
        typeof itemCount === "number"
          ? "count"
          : typeof savings === "number"
            ? "millisecond"
            : null,
      classification: "lab",
      availability:
        itemCount !== null || typeof savings === "number"
          ? "available"
          : "not_measured",
      displayValue: blocking.displayValue ?? null,
      providerMetricId: "render-blocking-resources",
      notes:
        typeof itemCount === "number"
          ? "Value is count of render-blocking resource items."
          : typeof savings === "number"
            ? "Value is estimated overall savings in milliseconds."
            : undefined,
    });
  }

  // Field INP from CrUX (page or origin experience)
  const fieldInp =
    readFieldMetric(
      response.loadingExperience,
      "INTERACTION_TO_NEXT_PAINT",
      "millisecond",
    ).availability === "available"
      ? readFieldMetric(
          response.loadingExperience,
          "INTERACTION_TO_NEXT_PAINT",
          "millisecond",
        )
      : readFieldMetric(
          response.originLoadingExperience,
          "INTERACTION_TO_NEXT_PAINT",
          "millisecond",
        );

  if (fieldInp.availability === "available" && fieldInp.value !== null) {
    metrics.interactionToNextPaint = metric({
      name: "interaction_to_next_paint",
      value: fieldInp.value,
      unit: "millisecond",
      classification: "field",
      availability: "available",
      providerMetricId: "INTERACTION_TO_NEXT_PAINT",
      notes: "CrUX field data (real-user). Not derived from lab TBT.",
    });
  }

  // Prefer page-level field LCP/CLS/FCP when present (supplement notes only —
  // primary LCP/CLS/FCP remain lab unless we add parallel field metrics later).
  const hasLabCategory = typeof score === "number";
  const availability: MeasurementAvailability = hasLabCategory
    ? "available"
    : "not_measured";

  return {
    testedUrl,
    finalUrl: lh?.finalUrl ?? response.id ?? null,
    deviceStrategy: strategy,
    provider: "google_pagespeed_insights",
    measuredAt,
    availability,
    metrics,
    providerMetadata: {
      lighthouseVersion: lh?.lighthouseVersion ?? null,
      fetchTime: lh?.fetchTime ?? null,
      analysisUTCTimestamp: response.analysisUTCTimestamp ?? null,
      overallCategory:
        response.loadingExperience?.overall_category ??
        response.originLoadingExperience?.overall_category ??
        null,
    },
    sourceNotes: hasLabCategory
      ? "Lab metrics from Lighthouse; field INP from CrUX when available."
      : "Provider response lacked a Lighthouse performance category.",
  };
}

export function createUnavailableEvidence(options: {
  testedUrl: string;
  strategy: PerformanceDeviceStrategy;
  measuredAt: string;
  availability: MeasurementAvailability;
  notes: string;
}): PerformanceEvidence {
  return {
    testedUrl: options.testedUrl,
    finalUrl: null,
    deviceStrategy: options.strategy,
    provider: "google_pagespeed_insights",
    measuredAt: options.measuredAt,
    availability: options.availability,
    metrics: emptyMetrics(),
    providerMetadata: {
      lighthouseVersion: null,
      fetchTime: null,
      analysisUTCTimestamp: null,
      overallCategory: null,
    },
    sourceNotes: options.notes,
  };
}
