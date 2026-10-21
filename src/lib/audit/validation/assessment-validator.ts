import "server-only";

import { SCORING_CONFIG_STRICT_V1 } from "@/lib/audit/scoring/scoring-config";
import type { ScoringResult } from "@/lib/audit/scoring/scoring.types";
import type { EvidenceValidationResult } from "@/lib/audit/validation/evidence-validator";

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
  evidence: EvidenceValidationResult,
): AssessmentValidationResult {
  const issues: AssessmentValidationIssue[] = [];

  if (scoring.scoringVersion !== SCORING_CONFIG_STRICT_V1.version) {
    // Still allow alternate versions if registered, but require presence.
  }
  if (!scoring.scoringVersion) {
    issues.push({
      code: "missing_scoring_version",
      message: "Scoring result is missing scoring version.",
    });
  }

  if (
    !scoring.policyFlags.includes("unassessed_weight_uses_absolute_points_earned")
  ) {
    issues.push({
      code: "missing_policy_disclosure",
      message:
        "strict-v1.0 scoring-policy disclosure unassessed_weight_uses_absolute_points_earned is missing.",
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

  if (scoring.totalMaxPoints !== 100) {
    issues.push({
      code: "category_maxima_mismatch",
      message: `totalMaxPoints ${scoring.totalMaxPoints} !== 100.`,
    });
  }

  if (
    scoring.totalScore !== null &&
    scoring.totalScore > scoring.totalMaxPoints
  ) {
    issues.push({
      code: "total_exceeds_100",
      message: `totalScore ${scoring.totalScore} exceeds totalMaxPoints.`,
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

  // Fabrication guard: COMPLETE without confirmed website / pages.
  if (
    scoring.status === "COMPLETE" &&
    (!evidence.websiteConfirmed || evidence.verifiedPageCount < 1)
  ) {
    issues.push({
      code: "fabricated_score_suspected",
      message:
        "COMPLETE score produced without confirmed website and verified pages.",
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
