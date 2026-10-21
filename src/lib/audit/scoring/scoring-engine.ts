import {
  evaluateApplicability,
  inferBusinessModel,
  redistributeCategoryWeights,
  roundPoints,
} from "@/lib/audit/scoring/applicability";
import { calculateCoverage } from "@/lib/audit/scoring/coverage";
import { mapScoringEvidence } from "@/lib/audit/scoring/evidence-mapper";
import { assignMaturityBand } from "@/lib/audit/scoring/maturity-bands";
import { getScoringConfig } from "@/lib/audit/scoring/scoring-config";
import {
  evaluateAllRules,
  pointsFromFraction,
} from "@/lib/audit/scoring/scoring-rules";
import type {
  ApplicabilityState,
  CategoryScore,
  CriterionId,
  ScoredCriterion,
  ScoringInput,
  ScoringPolicyFlag,
  ScoringResult,
} from "@/lib/audit/scoring/scoring.types";

function utcNow(): string {
  return new Date().toISOString();
}

/**
 * Deterministic custom 100-point scoring engine (strict-v1.0).
 * Accepts normalized crawl + performance + production AIAnalysisResult.
 */
export function scoreDigitalPresence(input: ScoringInput): ScoringResult {
  const config = getScoringConfig(input.scoringVersion);
  const assessedAt = input.assessedAt ?? utcNow();
  const businessModel = inferBusinessModel(
    input.crawl,
    input.businessModelHint,
  );

  const policyFlags: ScoringPolicyFlag[] = [
    "unassessed_weight_uses_absolute_points_earned",
  ];
  const unresolvedPolicyNotes: string[] = [
    "strict-v1.0 publishes absolute points earned on the 100-point scale without extrapolating unassessed weight to 100 and without treating NOT_ASSESSED as FAIL/zero. Product may later specify an alternate aggregation formula.",
  ];
  const errors: string[] = [];

  const bundle = mapScoringEvidence({
    crawl: input.crawl,
    performance: input.performance,
    analysis: input.analysis,
    businessModel,
  });

  if (!bundle.performanceAvailable) {
    policyFlags.push("pagespeed_unavailable");
  }
  if (!bundle.reputationProviderAvailable) {
    policyFlags.push("reputation_provider_unavailable");
  }

  // Limited visibility: no confirmed website / pages
  if (!bundle.websiteConfirmed) {
    return {
      ok: true,
      status: "LIMITED_VISIBILITY",
      scoringVersion: config.version,
      assessedAt,
      businessModel,
      totalScore: null,
      totalMaxPoints: config.totalMaxPoints,
      pointsEarned: 0,
      pointsAssessedCeiling: 0,
      pointsUnassessed: 0,
      maturity: {
        band: null,
        label: null,
        eligible: false,
        reason: "No maturity band for limited visibility snapshot.",
      },
      categories: [],
      coverage: {
        weightedCoverage: 0,
        assessedEffectiveWeight: 0,
        applicableEffectiveWeight: 0,
        categoriesWithAssessedEvidence: [],
        categoriesMissingAssessedEvidence: config.categories.map((c) => c.id),
        verifiedWebsitePages: bundle.verifiedPages.length,
        meetsPublicationThresholds: false,
      },
      unavailableChecks: config.criteria.map((c) => c.id),
      notApplicableChecks: [],
      rejectedAiFindingIds: bundle.rejectedAiFindingIds,
      duplicateDeductionsSuppressed: [],
      policyFlags,
      unresolvedPolicyNotes,
      errors: [
        ...errors,
        "Website could not be confidently confirmed; returning limited visibility snapshot without numerical score.",
      ],
    };
  }

  const applicabilityList = evaluateApplicability(
    config.criteria,
    input.crawl,
    businessModel,
  );
  const applicability = new Map<CriterionId, ApplicabilityState>();
  for (const decision of applicabilityList) {
    applicability.set(decision.criterionId, decision.applicability);
  }

  const effectiveByCriterion = new Map<CriterionId, number>();
  let methodologyReview = false;
  for (const category of config.categories) {
    const { effective, methodologyReviewRequired } = redistributeCategoryWeights(
      category.id,
      category.maxPoints,
      config.criteria,
      applicability,
    );
    if (methodologyReviewRequired) {
      methodologyReview = true;
      policyFlags.push("category_methodology_review_required");
    }
    for (const criterion of config.criteria.filter(
      (c) => c.categoryId === category.id,
    )) {
      effectiveByCriterion.set(criterion.id, effective[criterion.id] ?? 0);
    }
  }

  const ruleResults = evaluateAllRules(bundle, input.crawl.website);
  const ruleByCriterion = new Map(
    ruleResults.map((result) => [result.criterionId, result]),
  );

  // Duplicate deduction prevention: same fingerprint FAIL across categories → keep first by criterion id order.
  const seenFailFingerprints = new Set<string>();
  const duplicateDeductionsSuppressed: string[] = [];

  const scoredCriteria: ScoredCriterion[] = config.criteria.map((definition) => {
    const appl = applicability.get(definition.id) ?? "APPLICABLE";
    const effectiveMax = effectiveByCriterion.get(definition.id) ?? 0;
    const rule = ruleByCriterion.get(definition.id);

    if (appl === "NOT_APPLICABLE") {
      return {
        criterionId: definition.id,
        categoryId: definition.categoryId,
        scoringVersion: config.version,
        name: definition.name,
        baseMaxPoints: definition.baseMaxPoints,
        effectiveMaxPoints: 0,
        assessment: "NOT_ASSESSED",
        applicability: "NOT_APPLICABLE",
        earnedPoints: null,
        evidenceIds: [],
        sourceUrls: [],
        observationTimestamps: [],
        scoringRuleId: definition.ruleId,
        rationale: "Criterion marked NOT_APPLICABLE; weight redistributed within category.",
        observationFingerprint: null,
      };
    }

    if (!rule) {
      return {
        criterionId: definition.id,
        categoryId: definition.categoryId,
        scoringVersion: config.version,
        name: definition.name,
        baseMaxPoints: definition.baseMaxPoints,
        effectiveMaxPoints: effectiveMax,
        assessment: "NOT_ASSESSED",
        applicability: "APPLICABLE",
        earnedPoints: null,
        evidenceIds: [],
        sourceUrls: [],
        observationTimestamps: [],
        scoringRuleId: definition.ruleId,
        rationale: "No scoring rule result produced.",
        observationFingerprint: null,
      };
    }

    let assessment = rule.assessment;
    let fraction = rule.scoreFraction;
    let fingerprint = rule.observationFingerprint;

    if (
      assessment === "FAIL" &&
      fingerprint &&
      seenFailFingerprints.has(fingerprint)
    ) {
      duplicateDeductionsSuppressed.push(
        `${definition.id}:${fingerprint}`,
      );
      // Convert duplicate FAIL into NOT_ASSESSED for the secondary criterion (no double penalty).
      assessment = "NOT_ASSESSED";
      fraction = 0;
      fingerprint = fingerprint;
    } else if (assessment === "FAIL" && fingerprint) {
      seenFailFingerprints.add(fingerprint);
    }

    const earned =
      assessment === "NOT_ASSESSED"
        ? null
        : pointsFromFraction(fraction, effectiveMax);

    return {
      criterionId: definition.id,
      categoryId: definition.categoryId,
      scoringVersion: config.version,
      name: definition.name,
      baseMaxPoints: definition.baseMaxPoints,
      effectiveMaxPoints: effectiveMax,
      assessment,
      applicability: "APPLICABLE",
      earnedPoints: earned,
      evidenceIds: rule.evidenceIds.filter((id) =>
        // Allow pagespeed synthetic id through validation separately
        bundle.allowedEvidenceIds.has(id) || id.startsWith("pagespeed-"),
      ),
      sourceUrls: rule.sourceUrls,
      observationTimestamps: rule.observationTimestamps,
      scoringRuleId: rule.ruleId,
      rationale: rule.rationale,
      observationFingerprint: fingerprint,
    };
  });

  const categories: CategoryScore[] = config.categories.map((category) => {
    const criteria = scoredCriteria.filter((c) => c.categoryId === category.id);
    const applicable = criteria.filter((c) => c.applicability === "APPLICABLE");
    const assessed = applicable.filter((c) => c.assessment !== "NOT_ASSESSED");
    const assessedEffectiveWeight = roundPoints(
      assessed.reduce((sum, c) => sum + c.effectiveMaxPoints, 0),
    );
    const unassessedEffectiveWeight = roundPoints(
      applicable
        .filter((c) => c.assessment === "NOT_ASSESSED")
        .reduce((sum, c) => sum + c.effectiveMaxPoints, 0),
    );
    const notApplicableBaseWeight = roundPoints(
      criteria
        .filter((c) => c.applicability === "NOT_APPLICABLE")
        .reduce((sum, c) => sum + c.baseMaxPoints, 0),
    );
    const earnedPoints = roundPoints(
      assessed.reduce((sum, c) => sum + (c.earnedPoints ?? 0), 0),
    );
    const allNa =
      applicable.length === 0 ||
      (methodologyReview &&
        criteria.every((c) => c.applicability === "NOT_APPLICABLE"));

    return {
      categoryId: category.id,
      name: category.name,
      maxPoints: category.maxPoints,
      earnedPoints: allNa ? null : earnedPoints,
      assessedEffectiveWeight,
      unassessedEffectiveWeight,
      notApplicableBaseWeight,
      methodologyReviewRequired: allNa,
      criteria,
    };
  });

  if (categories.some((c) => c.methodologyReviewRequired)) {
    if (!policyFlags.includes("category_methodology_review_required")) {
      policyFlags.push("category_methodology_review_required");
    }
  }

  const coverage = calculateCoverage(
    scoredCriteria,
    config.coverage,
    bundle.verifiedPages.length,
    config.categories.map((c) => c.id),
  );

  const pointsEarned = roundPoints(
    categories.reduce((sum, c) => sum + (c.earnedPoints ?? 0), 0),
  );
  const pointsAssessedCeiling = roundPoints(
    categories.reduce((sum, c) => sum + c.assessedEffectiveWeight, 0),
  );
  const pointsUnassessed = roundPoints(
    categories.reduce((sum, c) => sum + c.unassessedEffectiveWeight, 0),
  );

  const unavailableChecks = scoredCriteria
    .filter(
      (c) =>
        c.applicability === "APPLICABLE" && c.assessment === "NOT_ASSESSED",
    )
    .map((c) => c.criterionId);
  const notApplicableChecks = scoredCriteria
    .filter((c) => c.applicability === "NOT_APPLICABLE")
    .map((c) => c.criterionId);

  // Outcome selection
  let status: ScoringResult["status"] = "PARTIAL";
  let totalScore: number | null = null;

  if (coverage.meetsPublicationThresholds && !methodologyReview) {
    // Absolute points-earned publication (no extrapolation).
    if (
      config.coverage.requireFullApplicableAssessmentForScore &&
      unavailableChecks.length > 0
    ) {
      status = "PARTIAL";
      totalScore = null;
      unresolvedPolicyNotes.push(
        "requireFullApplicableAssessmentForScore blocked numerical publication due to remaining NOT_ASSESSED criteria.",
      );
    } else {
      status = "COMPLETE";
      totalScore = pointsEarned;
      // Cap at 100 for safety
      if (totalScore > config.totalMaxPoints) {
        totalScore = config.totalMaxPoints;
      }
    }
  } else {
    status = "PARTIAL";
    totalScore = null;
  }

  const { maturity, policyFlags: maturityFlags } = assignMaturityBand({
    totalScore,
    completeAudit: status === "COMPLETE",
    categories,
  });
  for (const flag of maturityFlags) {
    if (!policyFlags.includes(flag)) policyFlags.push(flag);
  }

  // Total never exceeds 100
  const safeTotal =
    totalScore === null ? null : Math.min(totalScore, config.totalMaxPoints);

  return {
    ok: true,
    status,
    scoringVersion: config.version,
    assessedAt,
    businessModel,
    totalScore: safeTotal,
    totalMaxPoints: config.totalMaxPoints,
    pointsEarned,
    pointsAssessedCeiling,
    pointsUnassessed,
    maturity,
    categories,
    coverage,
    unavailableChecks,
    notApplicableChecks,
    rejectedAiFindingIds: bundle.rejectedAiFindingIds,
    duplicateDeductionsSuppressed,
    policyFlags,
    unresolvedPolicyNotes,
    errors,
  };
}
