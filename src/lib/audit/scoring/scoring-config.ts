import type {
  CategoryDefinition,
  CoverageConfig,
  CriterionDefinition,
  ScoringConfig,
  ScoringVersionId,
} from "@/lib/audit/scoring/scoring.types";
import { SCORING_VERSION_STRICT_V1 } from "@/lib/audit/scoring/scoring.types";

const STRICT_V1_CATEGORIES: CategoryDefinition[] = [
  {
    id: "website_experience",
    name: "Website Experience",
    maxPoints: 25,
    criterionIds: [
      "WE.mobile_usability",
      "WE.measured_performance",
      "WE.design_readability",
      "WE.structural_clarity",
      "WE.business_service_info",
    ],
  },
  {
    id: "local_seo_presence",
    name: "Local SEO Presence",
    maxPoints: 25,
    criterionIds: [
      "SEO.search_intent_geo",
      "SEO.service_market_coverage",
      "SEO.crawlability_schema",
      "SEO.discovery_profiles",
      "SEO.consistent_signals",
    ],
  },
  {
    id: "reputation_trust",
    name: "Reputation & Trust",
    maxPoints: 20,
    criterionIds: [
      "REP.third_party_reviews",
      "REP.credentials_guarantees",
      "REP.testimonials_portfolio",
      "REP.public_activity",
    ],
  },
  {
    id: "content_authority",
    name: "Content Authority",
    maxPoints: 15,
    criterionIds: [
      "CA.service_page_depth",
      "CA.education_resources",
      "CA.content_upkeep",
      "CA.topical_breadth",
    ],
  },
  {
    id: "conversion_readiness",
    name: "Conversion Readiness",
    maxPoints: 15,
    criterionIds: [
      "CR.primary_cta",
      "CR.inquiry_path",
      "CR.service_next_steps",
      "CR.trust_alongside_cta",
      "CR.mobile_completion",
    ],
  },
];

const STRICT_V1_CRITERIA: CriterionDefinition[] = [
  {
    id: "WE.mobile_usability",
    categoryId: "website_experience",
    name: "Mobile usability/navigation",
    baseMaxPoints: 6,
    ruleId: "rule.WE.mobile_usability.v1",
    eligibilityRuleId: null,
  },
  {
    id: "WE.measured_performance",
    categoryId: "website_experience",
    name: "Measured performance",
    baseMaxPoints: 7,
    ruleId: "rule.WE.measured_performance.v1",
    eligibilityRuleId: null,
  },
  {
    id: "WE.design_readability",
    categoryId: "website_experience",
    name: "Design/readability/accessibility basics",
    baseMaxPoints: 4,
    ruleId: "rule.WE.design_readability.v1",
    eligibilityRuleId: null,
  },
  {
    id: "WE.structural_clarity",
    categoryId: "website_experience",
    name: "Structural clarity/navigation",
    baseMaxPoints: 4,
    ruleId: "rule.WE.structural_clarity.v1",
    eligibilityRuleId: null,
  },
  {
    id: "WE.business_service_info",
    categoryId: "website_experience",
    name: "Transparent business/service-area information",
    baseMaxPoints: 4,
    ruleId: "rule.WE.business_service_info.v1",
    eligibilityRuleId: null,
  },
  {
    id: "SEO.search_intent_geo",
    categoryId: "local_seo_presence",
    name: "Search-intent and geography-relevant titles/headings/metadata",
    baseMaxPoints: 6,
    ruleId: "rule.SEO.search_intent_geo.v1",
    eligibilityRuleId: "eligibility.geo_metadata.v1",
  },
  {
    id: "SEO.service_market_coverage",
    categoryId: "local_seo_presence",
    name: "Substantial service/offer and applicable market coverage",
    baseMaxPoints: 8,
    ruleId: "rule.SEO.service_market_coverage.v1",
    eligibilityRuleId: null,
  },
  {
    id: "SEO.crawlability_schema",
    categoryId: "local_seo_presence",
    name: "Crawlability/indexability/schema basics",
    baseMaxPoints: 4,
    ruleId: "rule.SEO.crawlability_schema.v1",
    eligibilityRuleId: null,
  },
  {
    id: "SEO.discovery_profiles",
    categoryId: "local_seo_presence",
    name: "Verified appropriate discovery profiles",
    baseMaxPoints: 5,
    ruleId: "rule.SEO.discovery_profiles.v1",
    eligibilityRuleId: "eligibility.local_discovery_profiles.v1",
  },
  {
    id: "SEO.consistent_signals",
    categoryId: "local_seo_presence",
    name: "Consistent business/contact/service-area signals",
    baseMaxPoints: 2,
    ruleId: "rule.SEO.consistent_signals.v1",
    eligibilityRuleId: null,
  },
  {
    id: "REP.third_party_reviews",
    categoryId: "reputation_trust",
    name: "Verifiable third-party reviews or independent client feedback",
    baseMaxPoints: 8,
    ruleId: "rule.REP.third_party_reviews.v1",
    eligibilityRuleId: null,
  },
  {
    id: "REP.credentials_guarantees",
    categoryId: "reputation_trust",
    name: "Visible relevant credentials/guarantees (substantiated)",
    baseMaxPoints: 4,
    ruleId: "rule.REP.credentials_guarantees.v1",
    eligibilityRuleId: null,
  },
  {
    id: "REP.testimonials_portfolio",
    categoryId: "reputation_trust",
    name: "Authentic testimonials/portfolio/case proof",
    baseMaxPoints: 4,
    ruleId: "rule.REP.testimonials_portfolio.v1",
    eligibilityRuleId: null,
  },
  {
    id: "REP.public_activity",
    categoryId: "reputation_trust",
    name: "Applicable verified public activity/industry profile presence",
    baseMaxPoints: 4,
    ruleId: "rule.REP.public_activity.v1",
    eligibilityRuleId: "eligibility.public_profiles.v1",
  },
  {
    id: "CA.service_page_depth",
    categoryId: "content_authority",
    name: "Helpful original service/offer-page depth",
    baseMaxPoints: 6,
    ruleId: "rule.CA.service_page_depth.v1",
    eligibilityRuleId: null,
  },
  {
    id: "CA.education_resources",
    categoryId: "content_authority",
    name: "Useful education/FAQs/portfolio/case studies",
    baseMaxPoints: 4,
    ruleId: "rule.CA.education_resources.v1",
    eligibilityRuleId: null,
  },
  {
    id: "CA.content_upkeep",
    categoryId: "content_authority",
    name: "Demonstrable meaningful content upkeep",
    baseMaxPoints: 3,
    ruleId: "rule.CA.content_upkeep.v1",
    eligibilityRuleId: null,
  },
  {
    id: "CA.topical_breadth",
    categoryId: "content_authority",
    name: "Relevant topical breadth and factual quality",
    baseMaxPoints: 2,
    ruleId: "rule.CA.topical_breadth.v1",
    eligibilityRuleId: null,
  },
  {
    id: "CR.primary_cta",
    categoryId: "conversion_readiness",
    name: "Visible mobile-friendly primary CTA",
    baseMaxPoints: 4,
    ruleId: "rule.CR.primary_cta.v1",
    eligibilityRuleId: null,
  },
  {
    id: "CR.inquiry_path",
    categoryId: "conversion_readiness",
    name: "Working appropriate inquiry/booking/quote path",
    baseMaxPoints: 4,
    ruleId: "rule.CR.inquiry_path.v1",
    eligibilityRuleId: null,
  },
  {
    id: "CR.service_next_steps",
    categoryId: "conversion_readiness",
    name: "Service-specific next steps",
    baseMaxPoints: 3,
    ruleId: "rule.CR.service_next_steps.v1",
    eligibilityRuleId: null,
  },
  {
    id: "CR.trust_alongside_cta",
    categoryId: "conversion_readiness",
    name: "Trust/context alongside CTAs",
    baseMaxPoints: 2,
    ruleId: "rule.CR.trust_alongside_cta.v1",
    eligibilityRuleId: null,
  },
  {
    id: "CR.mobile_completion",
    categoryId: "conversion_readiness",
    name: "Low-friction mobile completion experience",
    baseMaxPoints: 2,
    ruleId: "rule.CR.mobile_completion.v1",
    eligibilityRuleId: null,
  },
];

const STRICT_V1_COVERAGE: CoverageConfig = {
  minWeightedCoverage: 0.7,
  requireEvidenceInAllCategories: true,
  requireVerifiedWebsitePage: true,
  /**
   * Absolute points-earned: unassessed weight is not awarded and not treated as FAIL.
   * Completeness uses 70% coverage thresholds; score is not extrapolated to 100.
   */
  requireFullApplicableAssessmentForScore: false,
};

function assertConfigIntegrity(config: ScoringConfig): void {
  const categorySum = config.categories.reduce((sum, c) => sum + c.maxPoints, 0);
  if (categorySum !== config.totalMaxPoints) {
    throw new Error(
      `Scoring config ${config.version}: category maxima sum ${categorySum} !== ${config.totalMaxPoints}`,
    );
  }
  const criterionSum = config.criteria.reduce((sum, c) => sum + c.baseMaxPoints, 0);
  if (criterionSum !== config.totalMaxPoints) {
    throw new Error(
      `Scoring config ${config.version}: criterion base weights sum ${criterionSum} !== ${config.totalMaxPoints}`,
    );
  }
  for (const category of config.categories) {
    const catSum = config.criteria
      .filter((c) => c.categoryId === category.id)
      .reduce((sum, c) => sum + c.baseMaxPoints, 0);
    if (catSum !== category.maxPoints) {
      throw new Error(
        `Scoring config ${config.version}: category ${category.id} weights ${catSum} !== ${category.maxPoints}`,
      );
    }
  }
}

export const SCORING_CONFIG_STRICT_V1: ScoringConfig = {
  version: SCORING_VERSION_STRICT_V1,
  categories: STRICT_V1_CATEGORIES,
  criteria: STRICT_V1_CRITERIA,
  coverage: STRICT_V1_COVERAGE,
  totalMaxPoints: 100,
};

assertConfigIntegrity(SCORING_CONFIG_STRICT_V1);

const CONFIG_REGISTRY: Record<string, ScoringConfig> = {
  [SCORING_VERSION_STRICT_V1]: SCORING_CONFIG_STRICT_V1,
};

export function getScoringConfig(version?: ScoringVersionId): ScoringConfig {
  const key = version ?? SCORING_VERSION_STRICT_V1;
  const config = CONFIG_REGISTRY[key];
  if (!config) {
    throw new Error(`Unknown scoring version: ${key}`);
  }
  return config;
}

export function listScoringVersions(): ScoringVersionId[] {
  return Object.keys(CONFIG_REGISTRY);
}
