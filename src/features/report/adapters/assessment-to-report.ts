import { scoringFrameworkSummary } from "@/config/scoring";
import type { AssessmentResult } from "@/lib/audit/orchestration/assessment.types";
import type {
  CategoryScore,
  MaturityBandId,
  ScoredCriterion,
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

export const LIVE_SCORING_POLICY_ID =
  "unassessed_weight_uses_absolute_points_earned" as const;

export const LIVE_SCORING_POLICY_EXPLANATION =
  "Unassessed checks are not automatically treated as failures. Published scores reflect verified points earned under the current scoring methodology; unavailable checks are disclosed separately.";

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
  if (status === "COMPLETE") return "Complete Audit";
  if (status === "PARTIAL") return "Partial Audit";
  return "Limited Visibility Snapshot";
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

function evidenceLookup(result: AssessmentResult) {
  const byId = new Map(
    result.evidenceCatalog.map((item) => [item.id, item] as const),
  );
  return byId;
}

function findingFromCriterion(
  criterion: ScoredCriterion,
  evidenceById: ReturnType<typeof evidenceLookup>,
): ReportCategoryFinding {
  const primaryId = criterion.evidenceIds[0];
  const evidence = primaryId ? evidenceById.get(primaryId) : undefined;
  return {
    id: criterion.criterionId,
    title: criterion.name,
    detail: criterion.rationale,
    evidenceId: primaryId,
    evidenceUrl: safeHttpUrl(evidence?.sourceUrl ?? criterion.sourceUrls[0]),
    observedAtLabel: evidence
      ? formatUtcLabel(evidence.observedAt)
      : criterion.observationTimestamps[0]
        ? formatUtcLabel(criterion.observationTimestamps[0])
        : undefined,
    collectionMethod: evidence?.collectionMethod,
  };
}

function mapCategories(result: AssessmentResult): ReportCategoryResult[] {
  if (result.status === "LIMITED_VISIBILITY") {
    return [];
  }

  const evidenceById = evidenceLookup(result);
  return result.categories.map((category) => {
    const assessedCriteria = category.criteria.filter(
      (c) =>
        c.applicability === "APPLICABLE" && c.assessment !== "NOT_ASSESSED",
    );
    const findings = assessedCriteria.map((c) =>
      findingFromCriterion(c, evidenceById),
    );

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
      summary:
        category.methodologyReviewRequired
          ? "Category requires methodology review; no score invented."
          : category.assessedEffectiveWeight <= 0
            ? "No assessed checks in this category."
            : `Assessed ${category.assessedEffectiveWeight} of ${category.maxPoints} effective points` +
              (category.unassessedEffectiveWeight > 0
                ? ` (${category.unassessedEffectiveWeight} unassessed).`
                : "."),
      findings,
    };
  });
}

function mapStrengths(result: AssessmentResult): ReportStrength[] {
  const evidenceById = evidenceLookup(result);
  return result.findings
    .filter((f) => f.kind === "strength")
    .slice(0, 12)
    .map((finding) => {
      const evidence = finding.evidenceIds
        .map((id) => evidenceById.get(id))
        .find(Boolean);
      return {
        id: finding.id,
        title: finding.title,
        explanation: finding.description,
        evidenceLabel: evidence
          ? `${safeHttpUrl(evidence.sourceUrl) ?? evidence.sourceUrl} · ${formatUtcLabel(evidence.observedAt)}`
          : finding.evidenceIds[0],
      };
    });
}

function severityForPriority(
  priority: "high" | "medium" | "low",
): IssueSeverity {
  return priority;
}

function mapImprovements(result: AssessmentResult): ReportImprovement[] {
  const evidenceById = evidenceLookup(result);
  const fromWeaknesses = result.findings
    .filter((f) => f.kind === "weakness")
    .map((finding) => {
      const evidence = finding.evidenceIds
        .map((id) => evidenceById.get(id))
        .find(Boolean);
      return {
        id: finding.id,
        title: finding.title,
        severity: "medium" as IssueSeverity,
        description: finding.description,
        whyItMatters:
          "Addressing this gap improves publicly observable digital presence.",
        evidenceLabel: evidence
          ? `${safeHttpUrl(evidence.sourceUrl) ?? "source"} · ${formatUtcLabel(evidence.observedAt)}`
          : undefined,
        recommendedAction: finding.description,
      };
    });

  const fromRecs = result.recommendations.map((rec) => {
    const evidence = rec.evidenceIds
      .map((id) => evidenceById.get(id))
      .find(Boolean);
    return {
      id: rec.id,
      title: rec.title,
      severity: severityForPriority(rec.priority),
      description: rec.description,
      whyItMatters: "Supported recommendation grounded in collected evidence.",
      evidenceLabel: evidence
        ? `${safeHttpUrl(evidence.sourceUrl) ?? "source"} · ${formatUtcLabel(evidence.observedAt)}`
        : undefined,
      recommendedAction: rec.description,
    };
  });

  return [...fromWeaknesses, ...fromRecs].slice(0, 20);
}

function mapActionPlan(result: AssessmentResult): ReportActionItem[] {
  return result.recommendations.slice(0, 10).map((rec) => ({
    id: rec.id,
    action: rec.title,
    priority: rec.priority,
    effort: rec.priority === "high" ? "high" : rec.priority === "low" ? "low" : "medium",
    impact: rec.priority,
  }));
}

function mapUnableToVerify(result: AssessmentResult): UnableToVerifyItem[] {
  const items: UnableToVerifyItem[] = result.unassessedCriteria.map((id) => ({
    id,
    title: id,
    detail:
      "Not assessed — reliable evidence was unavailable. This is not treated as a failure.",
  }));

  for (const warning of result.warnings) {
    items.push({
      id: `warn-${warning.code}`,
      title: warning.code,
      detail: warning.message,
    });
  }

  for (const reason of result.limitationReasons) {
    items.push({
      id: `limit-${items.length}`,
      title: "Assessment limitation",
      detail: reason,
    });
  }

  return items;
}

function mapEvidenceItems(result: AssessmentResult): ReportEvidenceItem[] {
  return result.evidenceCatalog
    .filter((item) => safeHttpUrl(item.sourceUrl) || item.kind === "website")
    .slice(0, 40)
    .map((item) => ({
      id: item.id,
      label: `${item.kind}: ${safeHttpUrl(item.sourceUrl) ?? item.sourceUrl}`,
      observedAtLabel: formatUtcLabel(item.observedAt),
    }));
}

function coveragePercent(result: AssessmentResult): number {
  const raw = result.evidenceCoverage.weightedCoverage * 100;
  // Preserve one decimal when present; avoid inventing precision.
  return Math.round(raw * 10) / 10;
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

  const policyPresent = result.scoringPolicyFlags.includes(
    LIVE_SCORING_POLICY_ID,
  );

  const limitations = [
    ...result.limitationReasons,
    ...result.errors.map((e) => e.message),
    ...(policyPresent ? [LIVE_SCORING_POLICY_EXPLANATION] : []),
    ...result.scoringPolicyDisclosures,
  ].filter((value, index, arr) => arr.indexOf(value) === index);

  const integrationWarnings = [
    ...result.warnings.map((w) => w.message),
    result.integrationAvailability.pagespeed !== "available"
      ? `PageSpeed: ${result.integrationAvailability.pagespeed}`
      : null,
    result.integrationAvailability.openai !== "available"
      ? `OpenAI: ${result.integrationAvailability.openai}`
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    id: result.assessmentId,
    isDemo: false,
    outcome,
    businessName: result.business.businessName ?? "Business",
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
    evidenceCoveragePercent: coveragePercent(result),
    overallScore,
    maxScore: result.totalMaxPoints,
    maturityBand,
    categories: mapCategories(result),
    strengths: mapStrengths(result),
    improvements: mapImprovements(result),
    actionPlan: mapActionPlan(result),
    unableToVerify: mapUnableToVerify(result),
    methodology: {
      frameworkSummary: scoringFrameworkSummary,
      scoringVersion: result.scoringVersion,
      assessmentScope:
        "Publicly observable website and business signals only. Not a measure of service quality or official search rankings.",
      evidenceCoverageNote: `Weighted evidence coverage: ${coveragePercent(result)}% under ${result.scoringVersion}.`,
      limitations:
        limitations.length > 0
          ? limitations
          : [LIVE_SCORING_POLICY_EXPLANATION],
      sources: mapEvidenceItems(result).map((item) => ({
        label: item.label,
        observedAtLabel: item.observedAtLabel,
      })),
      partialAndLimitedExplanation:
        "Partial audits omit an overall /100 score when evidence is incomplete. Limited Visibility Snapshots apply when a website cannot be confidently verified — they present available observations without inventing scores.",
      disclaimer:
        "This report evaluates publicly observable digital presence, not actual service quality or official search-engine rankings.",
    },
    scoringPolicyId: policyPresent ? LIVE_SCORING_POLICY_ID : null,
    integrationWarnings,
    evidenceItems: mapEvidenceItems(result),
  };
}
