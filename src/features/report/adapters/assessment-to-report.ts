import { scoringFrameworkSummary } from "@/config/scoring";
import type { AssessmentResult } from "@/lib/audit/orchestration/assessment.types";
import type {
  CategoryScore,
  MaturityBandId,
} from "@/lib/audit/scoring/scoring.types";
import type {
  CategoryAssessmentStatus,
  DigitalPresenceReport,
  IssueSeverity,
  MaturityBand,
  ReportActionItem,
  ReportCategoryFinding,
  ReportCategoryResult,
  ReportEvidenceItem,
  ReportImprovement,
  ReportOutcome,
  ReportStrength,
  UnableToVerifyItem,
} from "@/features/report/types/report.types";

/** Internal integrity marker for live report validation — not customer-facing copy. */
export const LIVE_SCORING_POLICY_ID =
  "unassessed_weight_uses_absolute_points_earned" as const;

/** Internal note retained for compatibility — not customer-facing copy. */
export const LIVE_SCORING_POLICY_EXPLANATION =
  "Published scores reflect publicly supported findings under the current methodology.";

const CATEGORY_UI_IDS: Record<string, string> = {
  website_experience: "website-experience",
  local_seo_presence: "local-seo-presence",
  reputation_trust: "reputation-trust",
  content_authority: "content-authority",
  conversion_readiness: "conversion-readiness",
};

const CATEGORY_TITLES: Record<string, string> = {
  website_experience: "Website Experience",
  local_seo_presence: "Local SEO Presence",
  reputation_trust: "Reputation & Trust",
  content_authority: "Content Authority",
  conversion_readiness: "Conversion Readiness",
};

function outcomeFromStatus(
  status: AssessmentResult["status"],
): ReportOutcome {
  if (status === "COMPLETE") return "complete";
  if (status === "PARTIAL") return "partial";
  return "limited";
}

function statusLabelFor(status: AssessmentResult["status"]): string {
  if (status === "COMPLETE") return "Digital Presence Report";
  if (status === "PARTIAL") return "Digital Presence Overview";
  return "Limited Digital Presence Overview";
}

function maturityLabel(
  band: MaturityBandId | null,
  eligible: boolean,
): MaturityBand | null {
  if (!eligible || !band) return null;
  const map: Record<MaturityBandId, MaturityBand> = {
    digital_leader: "Digital Leader",
    growing_digital_presence: "Growing Digital Presence",
    optimization_opportunity: "Optimization Opportunity",
    foundation_opportunity: "Foundation Opportunity",
  };
  return map[band] ?? null;
}

function formatUtcLabel(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(ms));
}

/** Allow only http(s) URLs for rendering. */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function categoryStatus(category: CategoryScore): CategoryAssessmentStatus {
  if (category.methodologyReviewRequired) return "not_assessed";
  if (category.assessedEffectiveWeight <= 0) return "not_assessed";
  if (category.unassessedEffectiveWeight > 0) return "partially_assessed";
  return "assessed";
}

function professionalCategoryStatusLabel(
  status: CategoryAssessmentStatus,
): string {
  if (status === "assessed") return "Reviewed";
  if (status === "partially_assessed") return "Partially reviewed";
  return "Limited information";
}

function mapCategories(result: AssessmentResult): ReportCategoryResult[] {
  if (result.status === "LIMITED_VISIBILITY") {
    return [];
  }

  return result.categories.map((category) => {
    const narrative =
      result.categoryNarratives[category.categoryId] ??
      (category.assessedEffectiveWeight <= 0
        ? "Limited public information was available for this category."
        : `${CATEGORY_TITLES[category.categoryId] ?? category.name} findings are based on publicly available website information.`);

    const findings: ReportCategoryFinding[] = category.criteria
      .filter(
        (c) =>
          c.applicability === "APPLICABLE" && c.assessment !== "NOT_ASSESSED",
      )
      .slice(0, 6)
      .map((criterion) => ({
        id: criterion.criterionId,
        title: criterion.name,
        detail: criterion.rationale,
        evidenceUrl: safeHttpUrl(criterion.sourceUrls[0]),
        observedAtLabel: criterion.observationTimestamps[0]
          ? formatUtcLabel(criterion.observationTimestamps[0])
          : undefined,
      }));

    const earned =
      result.status === "COMPLETE" || result.status === "PARTIAL"
        ? category.earnedPoints
        : null;

    return {
      id: CATEGORY_UI_IDS[category.categoryId] ?? category.categoryId,
      title: CATEGORY_TITLES[category.categoryId] ?? category.name,
      maxPoints: category.maxPoints,
      earned,
      status: categoryStatus(category),
      statusLabel: professionalCategoryStatusLabel(categoryStatus(category)),
      summary: narrative,
      findings,
    };
  });
}

function mapStrengths(result: AssessmentResult): ReportStrength[] {
  return result.findings
    .filter((f) => f.kind === "strength")
    .slice(0, 12)
    .map((finding) => ({
      id: finding.id,
      title: finding.title,
      explanation: finding.description,
    }));
}

function severityForPriority(
  priority: "high" | "medium" | "low",
): IssueSeverity {
  return priority;
}

function mapImprovements(result: AssessmentResult): ReportImprovement[] {
  const fromWeaknesses = result.findings
    .filter((f) => f.kind === "weakness")
    .map((finding) => ({
      id: finding.id,
      title: finding.title,
      severity: "medium" as IssueSeverity,
      description: finding.description,
      whyItMatters:
        "Improving this area can strengthen how prospective customers evaluate the business online.",
      recommendedAction: finding.description,
    }));

  const weaknessTitles = new Set(fromWeaknesses.map((item) => item.title));
  const fromRecs = result.recommendations
    .filter((rec) => !weaknessTitles.has(rec.title))
    .map((rec) => ({
      id: rec.id,
      title: rec.title,
      severity: severityForPriority(rec.priority),
      description: rec.description,
      whyItMatters:
        "This recommendation is based on publicly available website information reviewed for this report.",
      recommendedAction: rec.description,
    }));

  return [...fromWeaknesses, ...fromRecs].slice(0, 12);
}

function mapActionPlan(result: AssessmentResult): ReportActionItem[] {
  if (result.nextSteps.length > 0) {
    return result.nextSteps.slice(0, 8).map((step, index) => ({
      id: `next-${index + 1}`,
      action: step,
      priority: index === 0 ? "high" : index < 3 ? "medium" : "low",
      effort: index < 2 ? "medium" : "low",
      impact: index === 0 ? "high" : "medium",
    }));
  }

  return result.recommendations.slice(0, 8).map((rec) => ({
    id: rec.id,
    action: rec.title,
    priority: rec.priority,
    effort:
      rec.priority === "high" ? "high" : rec.priority === "low" ? "low" : "medium",
    impact: rec.priority,
  }));
}

function mapAssessmentScope(result: AssessmentResult): UnableToVerifyItem[] {
  const reasons = result.limitationReasons.filter(Boolean);
  if (reasons.length === 0) return [];

  return [
    {
      id: "assessment-scope",
      title: "Assessment scope",
      detail: reasons[0],
    },
  ];
}

function mapEvidenceItems(result: AssessmentResult): ReportEvidenceItem[] {
  return result.evidenceCatalog
    .filter((item) => safeHttpUrl(item.sourceUrl))
    .slice(0, 20)
    .map((item) => {
      const url = safeHttpUrl(item.sourceUrl) ?? item.sourceUrl;
      return {
        id: item.id,
        label: item.title ? `${item.title}: ${url}` : url,
        observedAtLabel: formatUtcLabel(item.observedAt),
      };
    });
}

/**
 * Convert a validated AssessmentResult into the Report Card UI model.
 * Does not recalculate scores. Never marks live reports as demos.
 */
export function mapAssessmentToReport(
  result: AssessmentResult,
): DigitalPresenceReport {
  const outcome = outcomeFromStatus(result.status);
  const overallScore =
    outcome === "complete" ? result.overallScore : null;
  const maturityBand =
    outcome === "complete"
      ? maturityLabel(result.maturityBand.band, result.maturityBand.eligible)
      : null;

  const scopeItems = mapAssessmentScope(result);
  const executiveSummary =
    result.executiveSummary?.trim() ||
    (outcome === "complete"
      ? "This Digital Presence Report summarizes publicly available website information reviewed for the submitted business."
      : "This Digital Presence Overview summarizes the publicly available website information that could be reviewed for this assessment.");

  return {
    id: result.assessmentId,
    isDemo: false,
    outcome,
    businessName: result.business.businessName ?? "Business website",
    website:
      safeHttpUrl(result.business.normalizedWebsiteUrl) ??
      safeHttpUrl(result.websiteUrl) ??
      result.business.normalizedWebsiteUrl ??
      result.websiteUrl,
    serviceArea:
      result.business.serviceAreaSignals[0] ??
      (result.business.businessModel !== "unknown"
        ? result.business.businessModel.replace(/_/g, " ")
        : "Not specified"),
    serviceAreaSource:
      result.business.serviceAreaSignals.length > 0
        ? "verified"
        : "user_supplied",
    auditDateLabel: formatUtcLabel(result.assessedAt),
    reportId: result.assessmentId,
    scoringVersion: result.scoringVersion,
    statusLabel: statusLabelFor(result.status),
    evidenceCoveragePercent: 0,
    overallScore,
    maxScore: result.totalMaxPoints,
    maturityBand,
    executiveSummary,
    categories: mapCategories(result),
    strengths: mapStrengths(result),
    improvements: mapImprovements(result),
    actionPlan: mapActionPlan(result),
    unableToVerify: scopeItems,
    methodology: {
      frameworkSummary: scoringFrameworkSummary,
      scoringVersion: result.scoringVersion,
      assessmentScope:
        "This report reviews publicly available website information for the submitted URL. It is not a measure of service quality or official search rankings.",
      evidenceCoverageNote:
        "Findings are based on publicly available information retrieved for this assessment.",
      limitations:
        scopeItems.length > 0
          ? [scopeItems[0].detail]
          : [
              "Some aspects of a website may not be visible through publicly available sources.",
            ],
      sources: mapEvidenceItems(result).map((item) => ({
        id: item.id,
        label: item.label,
        observedAtLabel: item.observedAtLabel,
      })),
      partialAndLimitedExplanation:
        "When available public information is incomplete, this report presents a Digital Presence Overview with supported observations instead of inventing an overall score.",
      disclaimer:
        "This report evaluates publicly observable digital presence, not actual service quality or official search-engine rankings.",
    },
    // Internal validation marker only — never rendered in customer-facing copy.
    scoringPolicyId: LIVE_SCORING_POLICY_ID,
    integrationWarnings: [],
    evidenceItems: mapEvidenceItems(result),
  };
}
