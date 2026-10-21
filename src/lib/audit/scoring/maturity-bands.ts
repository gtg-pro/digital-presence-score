import type {
  CategoryScore,
  MaturityBandId,
  MaturityBandResult,
  ScoringPolicyFlag,
} from "@/lib/audit/scoring/scoring.types";

export const MATURITY_BANDS: Array<{
  id: MaturityBandId;
  label: string;
  minInclusive: number;
  maxInclusive: number;
}> = [
  {
    id: "digital_leader",
    label: "Digital Leader",
    minInclusive: 85,
    maxInclusive: 100,
  },
  {
    id: "growing_digital_presence",
    label: "Growing Digital Presence",
    minInclusive: 70,
    maxInclusive: 84,
  },
  {
    id: "optimization_opportunity",
    label: "Optimization Opportunity",
    minInclusive: 50,
    maxInclusive: 69,
  },
  {
    id: "foundation_opportunity",
    label: "Foundation Opportunity",
    minInclusive: 0,
    maxInclusive: 49,
  },
];

function bandForScore(score: number): { id: MaturityBandId; label: string } {
  for (const band of MATURITY_BANDS) {
    if (score >= band.minInclusive && score <= band.maxInclusive) {
      return { id: band.id, label: band.label };
    }
  }
  return {
    id: "foundation_opportunity",
    label: "Foundation Opportunity",
  };
}

/**
 * Digital Leader requires strong corroborated evidence across all five categories:
 * each category must have assessed weight, and earned/assessedCeiling >= 0.7
 * with overall score in 85–100.
 */
export function evaluateDigitalLeaderCorroboration(
  categories: CategoryScore[],
): { ok: boolean; reason: string } {
  for (const category of categories) {
    if (category.methodologyReviewRequired) {
      return {
        ok: false,
        reason: `Category ${category.categoryId} requires methodology review.`,
      };
    }
    if (category.assessedEffectiveWeight <= 0) {
      return {
        ok: false,
        reason: `Category ${category.categoryId} lacks assessed evidence.`,
      };
    }
    const earned = category.earnedPoints ?? 0;
    const ratio = earned / category.assessedEffectiveWeight;
    if (ratio < 0.7) {
      return {
        ok: false,
        reason: `Category ${category.categoryId} lacks strong corroborated performance (${Math.round(ratio * 100)}% of assessed ceiling).`,
      };
    }
  }
  return { ok: true, reason: "All five categories show strong corroborated evidence." };
}

export function assignMaturityBand(options: {
  totalScore: number | null;
  completeAudit: boolean;
  categories: CategoryScore[];
}): { maturity: MaturityBandResult; policyFlags: ScoringPolicyFlag[] } {
  const policyFlags: ScoringPolicyFlag[] = [];

  if (!options.completeAudit || options.totalScore === null) {
    return {
      maturity: {
        band: null,
        label: null,
        eligible: false,
        reason: "Maturity band requires an eligible complete numerical audit.",
      },
      policyFlags,
    };
  }

  const score = options.totalScore;
  const candidate = bandForScore(score);

  if (candidate.id === "digital_leader") {
    const corroboration = evaluateDigitalLeaderCorroboration(options.categories);
    if (!corroboration.ok) {
      policyFlags.push("digital_leader_corroboration_failed");
      // Downgrade to Growing Digital Presence when score is 85+ but corroboration fails.
      return {
        maturity: {
          band: "growing_digital_presence",
          label: "Growing Digital Presence",
          eligible: true,
          reason: `Score ${score} meets Digital Leader range but ${corroboration.reason} Downgraded per strict-v1.0.`,
        },
        policyFlags,
      };
    }
  }

  return {
    maturity: {
      band: candidate.id,
      label: candidate.label,
      eligible: true,
      reason: `Score ${score} maps to ${candidate.label}.`,
    },
    policyFlags,
  };
}
