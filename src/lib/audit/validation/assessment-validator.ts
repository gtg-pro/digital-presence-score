import "server-only";

import type { ScoringResult } from "@/lib/audit/scoring/scoring.types";

export type AssessmentValidationIssue = {
  code:
    | "category_maxima_mismatch"
    | "total_exceeds_100"
    | "complete_with_score_missing"
    | "incomplete_with_score_present"
    | "incomplete_with_maturity_present"
    | "missing_scoring_version"
    | "missing_policy_disclosure"
    | "fabricated_score_suspected";
  message: string;
};

export type AssessmentValidationResult = {
  ok: boolean;
  issues: AssessmentValidationIssue[];
};

const EXPECTED_MAXIMA: Record<string, number> = {
  website_experience: 25,
  local_seo_presence: 25,
  reputation_trust: 20,
  content_authority: 15,
  conversion_readiness: 15,
};

/**
 * Validate scoring output integrity before packaging AssessmentResult.
 * Does not re-run scoring rules.
 */
export function validateScoringResult(
  scoring: ScoringResult,
): AssessmentValidationResult {
  const issues: AssessmentValidationIssue[] = [];

  if (!scoring.scoringVersion) {
    issues.push({
      code: "missing_scoring_version",
      message: "Scoring result is missing scoringVersion.",
    });
  }

  for (const category of scoring.categories) {
    const expected = EXPECTED_MAXIMA[category.categoryId];
    if (expected !== undefined && category.maxPoints !== expected) {
      issues.push({
        code: "category_maxima_mismatch",
        message: `Category ${category.categoryId} maxPoints ${category.maxPoints} !== ${expected}.`,
      });
    }
  }

  if (
    scoring.totalScore !== null &&
    (scoring.totalScore < 0 || scoring.totalScore > scoring.totalMaxPoints)
  ) {
    issues.push({
      code: "total_exceeds_100",
      message: `totalScore ${scoring.totalScore} outside 0–${scoring.totalMaxPoints}.`,
    });
  }

  if (scoring.status === "COMPLETE") {
    if (scoring.totalScore === null) {
      issues.push({
        code: "complete_with_score_missing",
        message: "COMPLETE assessment is missing overall score.",
      });
    }
  } else {
    if (scoring.totalScore !== null) {
      issues.push({
        code: "incomplete_with_score_present",
        message: `${scoring.status} assessment must have null overall score.`,
      });
    }
    if (scoring.maturity.band !== null) {
      issues.push({
        code: "incomplete_with_maturity_present",
        message: `${scoring.status} assessment must have null maturity band.`,
      });
    }
  }

  if (
    scoring.status === "COMPLETE" &&
    scoring.coverage.verifiedWebsitePages < 1
  ) {
    issues.push({
      code: "fabricated_score_suspected",
      message:
        "COMPLETE score produced without verified public website retrieval.",
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
