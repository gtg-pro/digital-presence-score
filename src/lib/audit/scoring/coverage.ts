import { roundPoints } from "@/lib/audit/scoring/applicability";
import type {
  CoverageConfig,
  CoverageReport,
  ScoredCriterion,
  ScoringCategoryId,
} from "@/lib/audit/scoring/scoring.types";

export function calculateCoverage(
  criteria: ScoredCriterion[],
  config: CoverageConfig,
  verifiedWebsitePages: number,
  categoryIds: ScoringCategoryId[],
): CoverageReport {
  const applicable = criteria.filter((c) => c.applicability === "APPLICABLE");
  const assessed = applicable.filter((c) => c.assessment !== "NOT_ASSESSED");

  const applicableEffectiveWeight = roundPoints(
    applicable.reduce((sum, c) => sum + c.effectiveMaxPoints, 0),
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
