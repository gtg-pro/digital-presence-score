import { roundPoints } from "@/lib/audit/scoring/applicability";
import { assignMaturityBand } from "@/lib/audit/scoring/maturity-bands";
import { getScoringConfig } from "@/lib/audit/scoring/scoring-config";
import type {
  AssessmentState,
  AuditOutcomeStatus,
  CategoryScore,
  CoverageReport,
  CriterionId,
  ScoredCriterion,
  ScoringResult,
} from "@/lib/audit/scoring/scoring.types";
import { OPENAI_AUDIT_VERSION } from "@/lib/audit/openai-audit/openai-audit.types";
import type { OpenAIWebAuditPayload } from "@/lib/audit/openai-audit/openai-audit.types";

const FRACTION: Record<Exclude<AssessmentState, "NOT_ASSESSED">, number> = {
  PASS: 1,
  PARTIAL: 0.5,
  FAIL: 0,
};

function toAssessmentState(
  value: OpenAIWebAuditPayload["categories"][number]["criteria"][number]["assessment"],
): AssessmentState {
  return value;
}

/**
 * Deterministic category/overall scoring from validated OpenAI criterion assessments.
 * OpenAI does not invent the numeric totals — anchors map to fixed fractions.
 */
export function scoreOpenAIWebAudit(
  payload: OpenAIWebAuditPayload,
  assessedAt: string,
): ScoringResult {
  const config = getScoringConfig();

  const assessmentByCriterion = new Map<
    string,
    OpenAIWebAuditPayload["categories"][number]["criteria"][number]
  >();
  for (const category of payload.categories) {
    for (const criterion of category.criteria) {
      assessmentByCriterion.set(criterion.criterionId, criterion);
    }
  }

  const scoredCriteria: ScoredCriterion[] = config.criteria.map((definition) => {
    const ai = assessmentByCriterion.get(definition.id);
    const assessment = ai
      ? toAssessmentState(ai.assessment)
      : ("NOT_ASSESSED" as const);
    const effectiveMax = definition.baseMaxPoints;
    const earned =
      assessment === "NOT_ASSESSED"
        ? null
        : roundPoints(effectiveMax * FRACTION[assessment]);

    return {
      criterionId: definition.id as CriterionId,
      categoryId: definition.categoryId,
      scoringVersion: OPENAI_AUDIT_VERSION,
      name: definition.name,
      baseMaxPoints: definition.baseMaxPoints,
      effectiveMaxPoints: effectiveMax,
      assessment,
      applicability: "APPLICABLE",
      earnedPoints: earned,
      evidenceIds: [],
      sourceUrls: payload.sourceReferences.map((ref) => ref.url).slice(0, 3),
      observationTimestamps: [assessedAt],
      scoringRuleId: definition.ruleId,
      rationale: ai?.rationale ?? "No criterion assessment returned by the model.",
      observationFingerprint: `openai-web:${definition.id}:${assessment}`,
    };
  });

  const categories: CategoryScore[] = config.categories.map((category) => {
    const criteria = scoredCriteria.filter((c) => c.categoryId === category.id);
    const assessed = criteria.filter((c) => c.assessment !== "NOT_ASSESSED");
    const assessedEffectiveWeight = roundPoints(
      assessed.reduce((sum, c) => sum + c.effectiveMaxPoints, 0),
    );
    const unassessedEffectiveWeight = roundPoints(
      criteria
        .filter((c) => c.assessment === "NOT_ASSESSED")
        .reduce((sum, c) => sum + c.effectiveMaxPoints, 0),
    );
    const earnedPoints = roundPoints(
      assessed.reduce((sum, c) => sum + (c.earnedPoints ?? 0), 0),
    );

    return {
      categoryId: category.id,
      name: category.name,
      maxPoints: category.maxPoints,
      earnedPoints: assessedEffectiveWeight > 0 ? earnedPoints : null,
      assessedEffectiveWeight,
      unassessedEffectiveWeight,
      notApplicableBaseWeight: 0,
      methodologyReviewRequired: assessedEffectiveWeight <= 0,
      criteria,
    };
  });

  const pointsEarned = roundPoints(
    categories.reduce((sum, c) => sum + (c.earnedPoints ?? 0), 0),
  );
  const pointsAssessedCeiling = roundPoints(
    categories.reduce((sum, c) => sum + c.assessedEffectiveWeight, 0),
  );
  const pointsUnassessed = roundPoints(
    categories.reduce((sum, c) => sum + c.unassessedEffectiveWeight, 0),
  );

  const applicableEffectiveWeight = roundPoints(
    scoredCriteria.reduce((sum, c) => sum + c.effectiveMaxPoints, 0),
  );
  const assessedEffectiveWeight = pointsAssessedCeiling;
  const weightedCoverage =
    applicableEffectiveWeight > 0
      ? roundPoints(assessedEffectiveWeight / applicableEffectiveWeight)
      : 0;

  const coverage: CoverageReport = {
    weightedCoverage,
    assessedEffectiveWeight,
    applicableEffectiveWeight,
    categoriesWithAssessedEvidence: categories
      .filter((c) => c.assessedEffectiveWeight > 0)
      .map((c) => c.categoryId),
    categoriesMissingAssessedEvidence: categories
      .filter((c) => c.assessedEffectiveWeight <= 0)
      .map((c) => c.categoryId),
    verifiedWebsitePages: payload.retrievalSucceeded ? 1 : 0,
    meetsPublicationThresholds:
      payload.retrievalSucceeded &&
      weightedCoverage >= config.coverage.minWeightedCoverage &&
      categories.every((c) => c.assessedEffectiveWeight > 0),
  };

  let status: AuditOutcomeStatus = payload.assessmentStatus;
  if (!payload.retrievalSucceeded) {
    status = "LIMITED_VISIBILITY";
  } else if (
    status === "COMPLETE" &&
    !coverage.meetsPublicationThresholds
  ) {
    status = "PARTIAL";
  }

  const publishScore =
    status === "COMPLETE" &&
    coverage.meetsPublicationThresholds &&
    pointsAssessedCeiling > 0;

  const totalScore = publishScore ? pointsEarned : null;
  const bandResult = assignMaturityBand({
    totalScore,
    completeAudit: publishScore,
    categories,
  });

  return {
    ok: true,
    status,
    scoringVersion: OPENAI_AUDIT_VERSION,
    assessedAt,
    businessModel: "unknown",
    totalScore,
    totalMaxPoints: config.totalMaxPoints,
    pointsEarned: publishScore ? pointsEarned : 0,
    pointsAssessedCeiling,
    pointsUnassessed,
    maturity: bandResult.maturity,
    categories,
    coverage,
    unavailableChecks: scoredCriteria
      .filter((c) => c.assessment === "NOT_ASSESSED")
      .map((c) => c.criterionId),
    notApplicableChecks: [],
    rejectedAiFindingIds: [],
    duplicateDeductionsSuppressed: [],
    policyFlags: [
      "unassessed_weight_uses_absolute_points_earned",
      ...bandResult.policyFlags,
    ],
    unresolvedPolicyNotes: [
      "openai-web-v1.0 maps PASS/PARTIAL/FAIL anchors to fixed fractions; NOT_ASSESSED criteria do not reduce earned points as failures.",
    ],
    errors: [],
  };
}
