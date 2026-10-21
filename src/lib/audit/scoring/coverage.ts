import { roundPoints } from "@/lib/audit/scoring/applicability";
import type {
  CoverageConfig,
  CoverageReport,
  CriterionId,
  ScoredCriterion,
  ScoringCategoryId,
} from "@/lib/audit/scoring/scoring.types";

/**
 * Criteria that this product version cannot measure without external
 * integrations. Including them in the coverage denominator makes almost every
 * live report converge on the same ~77% figure even when website evidence
 * differs. They remain in scoring as NOT_ASSESSED (not FAIL); they simply do
 * not count toward evidence-coverage %.
 */
const PROVIDER_GAP_COVERAGE_EXCLUSIONS = new Set<CriterionId>([
  "WE.measured_performance",
  "SEO.discovery_profiles",
  "REP.third_party_reviews",
  "REP.public_activity",
]);

function countsTowardEvidenceCoverage(criterion: ScoredCriterion): boolean {
  if (criterion.applicability !== "APPLICABLE") return false;
  if (
    criterion.assessment === "NOT_ASSESSED" &&
    PROVIDER_GAP_COVERAGE_EXCLUSIONS.has(criterion.criterionId) &&
    criterion.evidenceIds.length === 0
  ) {
    return false;
  }
  return true;
}

export function calculateCoverage(
  criteria: ScoredCriterion[],
  config: CoverageConfig,
  verifiedWebsitePages: number,
  categoryIds: ScoringCategoryId[],
): CoverageReport {
  const coveragePool = criteria.filter(countsTowardEvidenceCoverage);
  const assessed = coveragePool.filter((c) => c.assessment !== "NOT_ASSESSED");

  const applicableEffectiveWeight = roundPoints(
    coveragePool.reduce((sum, c) => sum + c.effectiveMaxPoints, 0),
  );
  const assessedEffectiveWeight = roundPoints(
    assessed.reduce((sum, c) => sum + c.effectiveMaxPoints, 0),
  );

  const weightedCoverage =
    applicableEffectiveWeight > 0
      ? roundPoints(assessedEffectiveWeight / applicableEffectiveWeight)
      : 0;

  const categoriesWithAssessedEvidence = categoryIds.filter((categoryId) =>
    assessed.some((c) => c.categoryId === categoryId),
  );
  const categoriesMissingAssessedEvidence = categoryIds.filter(
    (categoryId) => !categoriesWithAssessedEvidence.includes(categoryId),
  );

  const meetsPublicationThresholds =
    weightedCoverage >= config.minWeightedCoverage &&
    (!config.requireEvidenceInAllCategories ||
      categoriesMissingAssessedEvidence.length === 0) &&
    (!config.requireVerifiedWebsitePage || verifiedWebsitePages >= 1);

  return {
    weightedCoverage,
    assessedEffectiveWeight,
    applicableEffectiveWeight,
    categoriesWithAssessedEvidence,
    categoriesMissingAssessedEvidence,
    verifiedWebsitePages,
    meetsPublicationThresholds,
  };
}
