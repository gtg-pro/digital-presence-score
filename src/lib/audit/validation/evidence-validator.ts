import "server-only";

import type {
  CrawlResult,
  EvidenceExtractionMethod,
  PageEvidence,
} from "@/features/audit/types/evidence.types";
import type {
  AIAnalysisFinding,
  AIAnalysisResult,
} from "@/lib/audit/integrations/openai/analysis.types";
import type {
  PerformanceEvidence,
  PerformanceMetric,
  PerformanceResult,
} from "@/lib/audit/integrations/pagespeed/pagespeed.types";

export type ValidatedEvidenceItem = {
  id: string;
  kind: "website" | "page" | "pagespeed";
  sourceUrl: string;
  observedAt: string;
  collectionMethod: EvidenceExtractionMethod | "google_pagespeed_insights";
  availability: string;
  /** Compact collected value summary — never fabricated. */
  valueSummary: string;
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
  verifiedPageCount: number;
  evidenceCatalog: ValidatedEvidenceItem[];
  allowedEvidenceIds: string[];
  groundedFindings: AIAnalysisFinding[];
  rejectedAiFindingIds: string[];
  duplicateEvidenceIds: string[];
  inaccessiblePageUrls: string[];
  issues: EvidenceValidationIssue[];
  performance: {
    available: boolean;
    mobileAvailable: boolean;
    desktopAvailable: boolean;
    fieldMetricsPresent: boolean;
    labMetricsPresent: boolean;
  };
};

function isIsoTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function pageIsVerified(page: PageEvidence): boolean {
  return (
    page.source.availability === "available" &&
    page.httpStatus !== null &&
    page.httpStatus >= 200 &&
    page.httpStatus < 400
  );
}

function summarizePage(page: PageEvidence): string {
  const parts = [
    page.title ? `title=${page.title}` : null,
    `headings=${page.headings.length}`,
    `ctas=${page.ctas.length}`,
    `excerptChars=${page.mainTextExcerpt.length}`,
  ];
  return parts.filter(Boolean).join("; ");
}

function summarizeMetric(metric: PerformanceMetric): string {
  return `${metric.name}:${metric.availability}:${metric.classification}:${metric.value ?? "null"}`;
}

function metricNotes(evidence: PerformanceEvidence): string[] {
  const notes: string[] = [];
  for (const metric of Object.values(evidence.metrics)) {
    if (metric.classification === "field") {
      notes.push(`field:${metric.name}:${metric.availability}`);
    } else {
      notes.push(`lab:${metric.name}:${metric.availability}`);
    }
  }
  return notes;
}

/**
 * Validate crawl + PageSpeed + AI analysis evidence before scoring.
 * Does not fabricate missing observations.
 */
export function validateCollectedEvidence(options: {
  crawl: CrawlResult;
  performance: PerformanceResult | null;
  analysis: AIAnalysisResult | null;
}): EvidenceValidationResult {
  const issues: EvidenceValidationIssue[] = [];
  const catalog: ValidatedEvidenceItem[] = [];
  const seenKeys = new Map<string, string>();
  const duplicateEvidenceIds: string[] = [];
  const inaccessiblePageUrls: string[] = [];

  const website = options.crawl.website;
  if (website) {
    const id = "website-1";
    const key = `website:${website.normalizedSeedUrl}`;
    if (seenKeys.has(key)) {
      duplicateEvidenceIds.push(id);
      issues.push({
        code: "duplicate_evidence",
        message: `Duplicate website evidence for ${website.normalizedSeedUrl}`,
        evidenceId: id,
      });
    } else {
      seenKeys.set(key, id);
    }

    if (!website.source.url) {
      issues.push({
        code: "missing_source_url",
        message: "Website evidence missing source URL.",
        evidenceId: id,
      });
    }
    if (!website.source.observedAt || !isIsoTimestamp(website.source.observedAt)) {
      issues.push({
        code: "missing_timestamp",
        message: "Website evidence missing valid UTC observation timestamp.",
        evidenceId: id,
      });
    }
    if (!website.source.extractionMethod) {
      issues.push({
        code: "missing_collection_method",
        message: "Website evidence missing collection method.",
        evidenceId: id,
      });
    }
    if (!website.source.availability) {
      issues.push({
        code: "missing_availability",
        message: "Website evidence missing availability status.",
        evidenceId: id,
      });
    }

    catalog.push({
      id,
      kind: "website",
      sourceUrl: website.source.url || website.normalizedSeedUrl,
      observedAt: website.source.observedAt,
      collectionMethod: website.source.extractionMethod,
      availability: website.source.availability,
      valueSummary: `pagesCrawled=${website.pagesCrawled}; robotsRespected=${website.robotsRespected}`,
    });
  }

  options.crawl.pages.forEach((page, index) => {
    const id = `page-${index + 1}`;
    const key = `page:${page.finalUrl}`;
    if (seenKeys.has(key)) {
      duplicateEvidenceIds.push(id);
      issues.push({
        code: "duplicate_evidence",
        message: `Duplicate page evidence for ${page.finalUrl}`,
        evidenceId: id,
      });
    } else {
      seenKeys.set(key, id);
    }

    if (!page.source.url && !page.finalUrl) {
      issues.push({
        code: "missing_source_url",
        message: "Page evidence missing source URL.",
        evidenceId: id,
      });
    }
    if (!page.source.observedAt || !isIsoTimestamp(page.source.observedAt)) {
      issues.push({
        code: "missing_timestamp",
        message: "Page evidence missing valid UTC observation timestamp.",
        evidenceId: id,
      });
    }
    if (!page.source.extractionMethod) {
      issues.push({
        code: "missing_collection_method",
        message: "Page evidence missing collection method.",
        evidenceId: id,
      });
    }
    if (!page.source.availability) {
      issues.push({
        code: "missing_availability",
        message: "Page evidence missing availability status.",
        evidenceId: id,
      });
    }

    if (!pageIsVerified(page)) {
      inaccessiblePageUrls.push(page.finalUrl);
      issues.push({
        code: "inaccessible_page_not_feature_absence",
        message: `Page ${page.finalUrl} is inaccessible/unavailable; this is not proof the business lacks related features.`,
        evidenceId: id,
      });
    }

    catalog.push({
      id,
      kind: "page",
      sourceUrl: page.finalUrl || page.source.url,
      observedAt: page.source.observedAt,
      collectionMethod: page.source.extractionMethod,
      availability: page.source.availability,
      valueSummary: summarizePage(page),
    });
  });

  let fieldMetricsPresent = false;
  let labMetricsPresent = false;
  let mobileAvailable = false;
  let desktopAvailable = false;

  if (options.performance) {
    options.performance.evidence.forEach((item, index) => {
      const id = `pagespeed-${item.deviceStrategy}-${index + 1}`;
      const key = `pagespeed:${item.deviceStrategy}:${item.testedUrl}`;
      if (seenKeys.has(key)) {
        duplicateEvidenceIds.push(id);
        issues.push({
          code: "duplicate_evidence",
          message: `Duplicate PageSpeed evidence for ${item.deviceStrategy} ${item.testedUrl}`,
          evidenceId: id,
        });
      } else {
        seenKeys.set(key, id);
      }

      if (!item.testedUrl) {
        issues.push({
          code: "missing_source_url",
          message: "PageSpeed evidence missing tested URL.",
          evidenceId: id,
        });
      }
      if (!item.measuredAt || !isIsoTimestamp(item.measuredAt)) {
        issues.push({
          code: "missing_timestamp",
          message: "PageSpeed evidence missing valid measurement timestamp.",
          evidenceId: id,
        });
      }

      for (const metric of Object.values(item.metrics)) {
        if (!metric.name || !metric.availability || !metric.classification) {
          issues.push({
            code: "invalid_pagespeed_metric",
            message: "PageSpeed metric missing name, availability, or classification.",
            evidenceId: id,
          });
        }
        if (metric.classification === "field") fieldMetricsPresent = true;
        if (metric.classification === "lab") labMetricsPresent = true;
      }

      if (item.availability === "available") {
        if (item.deviceStrategy === "mobile") mobileAvailable = true;
        if (item.deviceStrategy === "desktop") desktopAvailable = true;
      }

      catalog.push({
        id,
        kind: "pagespeed",
        sourceUrl: item.finalUrl ?? item.testedUrl,
        observedAt: item.measuredAt,
        collectionMethod: "google_pagespeed_insights",
        availability: item.availability,
        valueSummary: Object.values(item.metrics)
          .map(summarizeMetric)
          .slice(0, 6)
          .join(" | "),
        deviceStrategy: item.deviceStrategy,
        metricClassificationNotes: metricNotes(item),
      });
    });
  }

  const allowedEvidenceIds = catalog
    .filter((item) => item.kind === "website" || item.kind === "page")
    .map((item) => item.id);
  const allowedSet = new Set(allowedEvidenceIds);

  const groundedFindings: AIAnalysisFinding[] = [];
  const rejectedAiFindingIds: string[] = [];

  if (options.analysis?.ok) {
    for (const finding of options.analysis.findings) {
      if (!finding.evidenceIds.length) {
        rejectedAiFindingIds.push(finding.id);
        issues.push({
          code: "empty_ai_evidence",
          message: `AI finding ${finding.id} has no evidence references.`,
          findingId: finding.id,
        });
        continue;
      }
      const valid = finding.evidenceIds.filter((id) => allowedSet.has(id));
      if (valid.length === 0) {
        rejectedAiFindingIds.push(finding.id);
        issues.push({
          code: "unsupported_ai_reference",
          message: `AI finding ${finding.id} cites unknown evidence IDs.`,
          findingId: finding.id,
        });
        continue;
      }
      if (valid.length !== finding.evidenceIds.length) {
        issues.push({
          code: "unsupported_ai_reference",
          message: `AI finding ${finding.id} had unsupported evidence IDs removed.`,
          findingId: finding.id,
        });
      }
      groundedFindings.push({ ...finding, evidenceIds: valid });
    }
  }

  const verifiedPageCount = options.crawl.pages.filter(pageIsVerified).length;
  const websiteConfirmed = Boolean(
    website?.homepageUrl && verifiedPageCount > 0,
  );

  const blocking = issues.some(
    (issue) =>
      issue.code === "missing_evidence_id" ||
      issue.code === "missing_source_url" ||
      issue.code === "missing_timestamp",
  );

  return {
    ok: !blocking || catalog.length > 0,
    websiteConfirmed,
    verifiedPageCount,
    evidenceCatalog: catalog,
    allowedEvidenceIds,
    groundedFindings,
    rejectedAiFindingIds,
    duplicateEvidenceIds,
    inaccessiblePageUrls,
    issues,
    performance: {
      available: mobileAvailable || desktopAvailable,
      mobileAvailable,
      desktopAvailable,
      fieldMetricsPresent,
      labMetricsPresent,
    },
  };
}

/** Strip AI findings that fail grounding; return analysis copy for scoring. */
export function applyGroundedAnalysis(
  analysis: AIAnalysisResult | null,
  groundedFindings: AIAnalysisFinding[],
  rejectedAiFindingIds: string[],
): AIAnalysisResult | null {
  if (!analysis) return null;
  if (!analysis.ok) return analysis;
  return {
    ...analysis,
    findings: groundedFindings,
    unsupportedClaimsDropped:
      analysis.unsupportedClaimsDropped + rejectedAiFindingIds.length,
  };
}
