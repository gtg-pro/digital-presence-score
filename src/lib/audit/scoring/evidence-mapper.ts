import type {
  CrawlResult,
  PageEvidence,
} from "@/features/audit/types/evidence.types";
import type {
  AIAnalysisFinding,
  AIAnalysisResult,
} from "@/lib/audit/integrations/openai/analysis.types";
import type {
  PerformanceEvidence,
  PerformanceResult,
} from "@/lib/audit/integrations/pagespeed/pagespeed.types";
import type { BusinessModelHint } from "@/lib/audit/scoring/scoring.types";

export type MappedEvidenceBundle = {
  websiteConfirmed: boolean;
  verifiedPages: PageEvidence[];
  allowedEvidenceIds: Set<string>;
  pageByEvidenceId: Map<string, PageEvidence>;
  mobilePerformance: PerformanceEvidence | null;
  desktopPerformance: PerformanceEvidence | null;
  performanceAvailable: boolean;
  reputationProviderAvailable: boolean;
  groundedFindings: AIAnalysisFinding[];
  rejectedAiFindingIds: string[];
  businessModel: BusinessModelHint;
};

function buildCrawlEvidenceIds(crawl: CrawlResult): {
  allowed: Set<string>;
  pageById: Map<string, PageEvidence>;
} {
  const allowed = new Set<string>();
  const pageById = new Map<string, PageEvidence>();
  if (crawl.website) {
    allowed.add("website-1");
  }
  crawl.pages.forEach((page, index) => {
    const id = `page-${index + 1}`;
    allowed.add(id);
    pageById.set(id, page);
  });
  return { allowed, pageById };
}

/**
 * Ground AI findings against crawl evidence IDs.
 * Reject findings with unknown IDs or empty evidence.
 * Does not accept the reduced smoke-test schema as a substitute.
 */
export function groundAiFindings(
  analysis: AIAnalysisResult | null,
  allowedEvidenceIds: Set<string>,
): { grounded: AIAnalysisFinding[]; rejectedIds: string[] } {
  if (!analysis || !analysis.ok) {
    return { grounded: [], rejectedIds: [] };
  }

  const grounded: AIAnalysisFinding[] = [];
  const rejectedIds: string[] = [];

  for (const finding of analysis.findings) {
    if (!finding.evidenceIds.length) {
      rejectedIds.push(finding.id);
      continue;
    }
    const valid = finding.evidenceIds.filter((id) => allowedEvidenceIds.has(id));
    if (valid.length === 0) {
      rejectedIds.push(finding.id);
      continue;
    }
    grounded.push({ ...finding, evidenceIds: valid });
  }

  return { grounded, rejectedIds };
}

export function findingsForCategory(
  findings: AIAnalysisFinding[],
  category: AIAnalysisFinding["category"],
): AIAnalysisFinding[] {
  return findings.filter((finding) => finding.category === category);
}

export function hasStrongAiSupport(
  findings: AIAnalysisFinding[],
  predicate: (finding: AIAnalysisFinding) => boolean,
): boolean {
  return findings.some(
    (finding) =>
      predicate(finding) &&
      (finding.confidence === "high" || finding.confidence === "medium") &&
      (finding.kind === "strength" || finding.kind === "observation"),
  );
}

export function hasAiWeakness(
  findings: AIAnalysisFinding[],
  predicate: (finding: AIAnalysisFinding) => boolean,
): boolean {
  return findings.some(
    (finding) =>
      predicate(finding) &&
      finding.kind === "weakness" &&
      (finding.confidence === "high" || finding.confidence === "medium"),
  );
}

export function textBlob(pages: PageEvidence[]): string {
  return pages
    .map(
      (page) =>
        `${page.title ?? ""} ${page.metaDescription ?? ""} ${page.headings.map((h) => h.text).join(" ")} ${page.mainTextExcerpt}`,
    )
    .join(" \n ");
}

export function selectMobilePerformance(
  performance: PerformanceResult | null,
): PerformanceEvidence | null {
  if (!performance) return null;
  return (
    performance.evidence.find(
      (item) =>
        item.deviceStrategy === "mobile" && item.availability === "available",
    ) ?? null
  );
}

export function selectDesktopPerformance(
  performance: PerformanceResult | null,
): PerformanceEvidence | null {
  if (!performance) return null;
  return (
    performance.evidence.find(
      (item) =>
        item.deviceStrategy === "desktop" && item.availability === "available",
    ) ?? null
  );
}

export function mapScoringEvidence(options: {
  crawl: CrawlResult;
  performance: PerformanceResult | null;
  analysis: AIAnalysisResult | null;
  businessModel: BusinessModelHint;
}): MappedEvidenceBundle {
  const { allowed, pageById } = buildCrawlEvidenceIds(options.crawl);
  const verifiedPages = options.crawl.pages.filter(
    (page) =>
      page.source.availability === "available" &&
      page.httpStatus !== null &&
      page.httpStatus >= 200 &&
      page.httpStatus < 400,
  );

  const websiteConfirmed = Boolean(
    options.crawl.website &&
      options.crawl.website.homepageUrl &&
      verifiedPages.length > 0,
  );

  const mobilePerformance = selectMobilePerformance(options.performance);
  const desktopPerformance = selectDesktopPerformance(options.performance);
  const performanceAvailable = Boolean(mobilePerformance || desktopPerformance);

  // No reputation provider integration in this scope.
  const reputationProviderAvailable = false;

  const { grounded, rejectedIds } = groundAiFindings(options.analysis, allowed);

  return {
    websiteConfirmed,
    verifiedPages,
    allowedEvidenceIds: allowed,
    pageByEvidenceId: pageById,
    mobilePerformance,
    desktopPerformance,
    performanceAvailable,
    reputationProviderAvailable,
    groundedFindings: grounded,
    rejectedAiFindingIds: rejectedIds,
    businessModel: options.businessModel,
  };
}

export function evidenceRefsFromPages(pages: PageEvidence[]): {
  evidenceIds: string[];
  sourceUrls: string[];
  observationTimestamps: string[];
} {
  // Prefer stable page-N ids via URL match is handled by caller; here use source URLs/timestamps.
  return {
    evidenceIds: [],
    sourceUrls: pages.map((page) => page.finalUrl),
    observationTimestamps: pages.map((page) => page.source.observedAt),
  };
}
