/**
 * Deterministic digital-presence scoring types.
 * Shared by OpenAI-web criterion anchors and maturity-band rules.
 */

export const SCORING_VERSION_STRICT_V1 = "strict-v1.0" as const;

export type ScoringVersionId = typeof SCORING_VERSION_STRICT_V1 | string;

export type ScoringCategoryId =
  | "website_experience"
  | "local_seo_presence"
  | "reputation_trust"
  | "content_authority"
  | "conversion_readiness";

export type AssessmentState = "PASS" | "PARTIAL" | "FAIL" | "NOT_ASSESSED";

export type ApplicabilityState = "APPLICABLE" | "NOT_APPLICABLE";

export type AuditOutcomeStatus =
  | "COMPLETE"
  | "PARTIAL"
  | "LIMITED_VISIBILITY";

export type MaturityBandId =
  | "digital_leader"
  | "growing_digital_presence"
  | "optimization_opportunity"
  | "foundation_opportunity";

export type BusinessModelHint =
  | "local_service"
  | "remote_online"
  | "at_premises"
  | "hybrid"
  | "unknown";

export type CriterionId =
  | "WE.mobile_usability"
  | "WE.measured_performance"
  | "WE.design_readability"
  | "WE.structural_clarity"
  | "WE.business_service_info"
  | "SEO.search_intent_geo"
  | "SEO.service_market_coverage"
  | "SEO.crawlability_schema"
  | "SEO.discovery_profiles"
  | "SEO.consistent_signals"
  | "REP.third_party_reviews"
  | "REP.credentials_guarantees"
  | "REP.testimonials_portfolio"
  | "REP.public_activity"
  | "CA.service_page_depth"
  | "CA.education_resources"
  | "CA.content_upkeep"
  | "CA.topical_breadth"
  | "CR.primary_cta"
  | "CR.inquiry_path"
  | "CR.service_next_steps"
  | "CR.trust_alongside_cta"
  | "CR.mobile_completion";

export type ScoringRuleId = string;

export type CriterionDefinition = {
  id: CriterionId;
  categoryId: ScoringCategoryId;
  name: string;
  baseMaxPoints: number;
  ruleId: ScoringRuleId;
  /** Documented eligibility rule id; null = always applicable unless rule says otherwise. */
  eligibilityRuleId: string | null;
};

export type CategoryDefinition = {
  id: ScoringCategoryId;
  name: string;
  maxPoints: number;
  criterionIds: CriterionId[];
};

export type CoverageConfig = {
  /** Minimum weighted assessment coverage for complete-audit eligibility. */
  minWeightedCoverage: number;
  /** Require at least one assessed (non-NOT_ASSESSED) criterion per category. */
  requireEvidenceInAllCategories: boolean;
  /** Require at least one verified crawled page. */
  requireVerifiedWebsitePage: boolean;
  /**
   * Fail-closed: when true, numerical COMPLETE scores require every applicable
   * criterion to be assessed (no remaining NOT_ASSESSED). When false, absolute
   * points-earned aggregation is used with unassessed weight excluded from awards.
   *
   * strict-v1.0 sets this false and uses absolute points-earned (see policyFlags).
   */
  requireFullApplicableAssessmentForScore: boolean;
};

export type ScoringConfig = {
  version: ScoringVersionId;
  categories: CategoryDefinition[];
  criteria: CriterionDefinition[];
  coverage: CoverageConfig;
  totalMaxPoints: number;
};

export type ScoredCriterion = {
  criterionId: CriterionId;
  categoryId: ScoringCategoryId;
  scoringVersion: ScoringVersionId;
  name: string;
  baseMaxPoints: number;
  effectiveMaxPoints: number;
  assessment: AssessmentState;
  applicability: ApplicabilityState;
  /** null when NOT_ASSESSED or NOT_APPLICABLE */
  earnedPoints: number | null;
  evidenceIds: string[];
  sourceUrls: string[];
  observationTimestamps: string[];
  scoringRuleId: ScoringRuleId;
  rationale: string;
  /** Fingerprint of the primary observation to prevent duplicate deductions. */
  observationFingerprint: string | null;
};

export type CategoryScore = {
  categoryId: ScoringCategoryId;
  name: string;
  maxPoints: number;
  earnedPoints: number | null;
  assessedEffectiveWeight: number;
  unassessedEffectiveWeight: number;
  notApplicableBaseWeight: number;
  methodologyReviewRequired: boolean;
  criteria: ScoredCriterion[];
};

export type CoverageReport = {
  weightedCoverage: number;
  assessedEffectiveWeight: number;
  applicableEffectiveWeight: number;
  categoriesWithAssessedEvidence: ScoringCategoryId[];
  categoriesMissingAssessedEvidence: ScoringCategoryId[];
  verifiedWebsitePages: number;
  meetsPublicationThresholds: boolean;
};

export type MaturityBandResult = {
  band: MaturityBandId | null;
  label: string | null;
  eligible: boolean;
  reason: string;
};

export type ScoringPolicyFlag =
  | "unassessed_weight_uses_absolute_points_earned"
  | "reputation_provider_unavailable"
  | "pagespeed_unavailable"
  | "category_methodology_review_required"
  | "digital_leader_corroboration_failed";

export type ScoringResult = {
  ok: boolean;
  status: AuditOutcomeStatus;
  scoringVersion: ScoringVersionId;
  assessedAt: string;
  businessModel: BusinessModelHint;
  totalScore: number | null;
  totalMaxPoints: number;
  pointsEarned: number;
  pointsAssessedCeiling: number;
  pointsUnassessed: number;
  maturity: MaturityBandResult;
  categories: CategoryScore[];
  coverage: CoverageReport;
  unavailableChecks: CriterionId[];
  notApplicableChecks: CriterionId[];
  rejectedAiFindingIds: string[];
  duplicateDeductionsSuppressed: string[];
  policyFlags: ScoringPolicyFlag[];
  unresolvedPolicyNotes: string[];
  errors: string[];
};
