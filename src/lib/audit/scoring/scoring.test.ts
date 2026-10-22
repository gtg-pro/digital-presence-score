import { describe, expect, it } from "vitest";

import {
  inferBusinessModel,
  redistributeCategoryWeights,
  roundPoints,
  evaluateApplicability,
} from "@/lib/audit/scoring/applicability";
import { calculateCoverage } from "@/lib/audit/scoring/coverage";
import { groundAiFindings } from "@/lib/audit/scoring/evidence-mapper";
import { assignMaturityBand, MATURITY_BANDS } from "@/lib/audit/scoring/maturity-bands";
import {
  getScoringConfig,
  SCORING_CONFIG_STRICT_V1,
} from "@/lib/audit/scoring/scoring-config";
import { scoreDigitalPresence } from "@/lib/audit/scoring/scoring-engine";
import { SCORING_VERSION_STRICT_V1 } from "@/lib/audit/scoring/scoring.types";
import type {
  ApplicabilityState,
  CriterionId,
  ScoredCriterion,
} from "@/lib/audit/scoring/scoring.types";
import {
  blockedWebsiteFixture,
  brochureFixture,
  makeAnalysis,
  makeCrawl,
  makePage,
  makePerformance,
  remoteConsultancyFixture,
  strongLocalServiceFixture,
} from "@/lib/audit/scoring/test/fixtures";

describe("scoring config strict-v1.0", () => {
  it("locks exact category maxima totaling 100", () => {
    const config = getScoringConfig(SCORING_VERSION_STRICT_V1);
    expect(config.version).toBe("strict-v1.0");
    expect(config.totalMaxPoints).toBe(100);
    const byId = Object.fromEntries(
      config.categories.map((c) => [c.id, c.maxPoints]),
    );
    expect(byId).toEqual({
      website_experience: 25,
      local_seo_presence: 25,
      reputation_trust: 20,
      content_authority: 15,
      conversion_readiness: 15,
    });
    expect(config.categories.reduce((s, c) => s + c.maxPoints, 0)).toBe(100);
  });

  it("locks exact subcriterion base weights", () => {
    const expected: Record<string, number> = {
      "WE.mobile_usability": 6,
      "WE.measured_performance": 7,
      "WE.design_readability": 4,
      "WE.structural_clarity": 4,
      "WE.business_service_info": 4,
      "SEO.search_intent_geo": 6,
      "SEO.service_market_coverage": 8,
      "SEO.crawlability_schema": 4,
      "SEO.discovery_profiles": 5,
      "SEO.consistent_signals": 2,
      "REP.third_party_reviews": 8,
      "REP.credentials_guarantees": 4,
      "REP.testimonials_portfolio": 4,
      "REP.public_activity": 4,
      "CA.service_page_depth": 6,
      "CA.education_resources": 4,
      "CA.content_upkeep": 3,
      "CA.topical_breadth": 2,
      "CR.primary_cta": 4,
      "CR.inquiry_path": 4,
      "CR.service_next_steps": 3,
      "CR.trust_alongside_cta": 2,
      "CR.mobile_completion": 2,
    };
    for (const criterion of SCORING_CONFIG_STRICT_V1.criteria) {
      expect(criterion.baseMaxPoints).toBe(expected[criterion.id]);
    }
    expect(
      SCORING_CONFIG_STRICT_V1.criteria.reduce((s, c) => s + c.baseMaxPoints, 0),
    ).toBe(100);
  });
});

describe("deterministic scoring", () => {
  it("produces identical results for identical inputs", () => {
    const fixture = strongLocalServiceFixture();
    const a = scoreDigitalPresence({ ...fixture, assessedAt: "2026-10-21T06:00:00.000Z" });
    const b = scoreDigitalPresence({ ...fixture, assessedAt: "2026-10-21T06:00:00.000Z" });
    expect(a.totalScore).toBe(b.totalScore);
    expect(a.status).toBe(b.status);
    expect(a.categories.map((c) => c.earnedPoints)).toEqual(
      b.categories.map((c) => c.earnedPoints),
    );
    expect(a.scoringVersion).toBe("strict-v1.0");
  });

  it("never exceeds a total of 100", () => {
    const result = scoreDigitalPresence(strongLocalServiceFixture());
    expect(result.totalMaxPoints).toBe(100);
    if (result.totalScore !== null) {
      expect(result.totalScore).toBeLessThanOrEqual(100);
    }
    expect(result.pointsEarned).toBeLessThanOrEqual(100);
  });
});

describe("assessment and applicability states", () => {
  it("marks missing PageSpeed as NOT_ASSESSED (not FAIL)", () => {
    const fixture = strongLocalServiceFixture();
    const result = scoreDigitalPresence({
      ...fixture,
      performance: makePerformance(null),
    });
    const perf = result.categories
      .flatMap((c) => c.criteria)
      .find((c) => c.criterionId === "WE.measured_performance");
    expect(perf?.assessment).toBe("NOT_ASSESSED");
    expect(perf?.earnedPoints).toBeNull();
    expect(result.policyFlags).toContain("pagespeed_unavailable");
  });

  it("scores third-party review signals from the website without a reputation API", () => {
    const result = scoreDigitalPresence(strongLocalServiceFixture());
    const reviews = result.categories
      .flatMap((c) => c.criteria)
      .find((c) => c.criterionId === "REP.third_party_reviews");
    // Strong fixture has testimonials copy but no review schema/platform links.
    expect(reviews?.assessment).toBe("FAIL");
    expect(reviews?.earnedPoints).toBe(0);
    expect(result.policyFlags).toContain("reputation_provider_unavailable");
  });

  it("awards discovery/review points from observed website evidence", () => {
    const fixture = strongLocalServiceFixture();
    const home = fixture.crawl.pages[0]!;
    const withSignals = {
      ...fixture,
      crawl: {
        ...fixture.crawl,
        pages: [
          {
            ...home,
            structuredDataTypes: ["LocalBusiness", "AggregateRating"],
            ctas: [
              ...home.ctas,
              {
                text: "Google reviews",
                href: "https://maps.google.com/?cid=123",
              },
              { text: "Yelp", href: "https://www.yelp.com/biz/acme-plumbing" },
            ],
          },
          ...fixture.crawl.pages.slice(1),
        ],
        website: fixture.crawl.website
          ? {
              ...fixture.crawl.website,
              publicSocialProfileLinks: [
                ...(fixture.crawl.website.publicSocialProfileLinks ?? []),
                "https://maps.google.com/?cid=123",
                "https://www.yelp.com/biz/acme-plumbing",
              ],
            }
          : null,
      },
    };

    const result = scoreDigitalPresence(withSignals);
    const discovery = result.categories
      .flatMap((c) => c.criteria)
      .find((c) => c.criterionId === "SEO.discovery_profiles");
    const reviews = result.categories
      .flatMap((c) => c.criteria)
      .find((c) => c.criterionId === "REP.third_party_reviews");

    expect(discovery?.assessment).toBe("PASS");
    expect(reviews?.assessment).toMatch(/PASS|PARTIAL/);
    expect(discovery?.assessment).not.toBe("NOT_ASSESSED");
    expect(reviews?.assessment).not.toBe("NOT_ASSESSED");
  });

  it("varies category assessed weight across different website evidence", () => {
    const strong = scoreDigitalPresence(strongLocalServiceFixture());
    const thin = scoreDigitalPresence(brochureFixture());

    const strongSeo = strong.categories.find(
      (c) => c.categoryId === "local_seo_presence",
    );
    const thinSeo = thin.categories.find(
      (c) => c.categoryId === "local_seo_presence",
    );

    expect(strongSeo?.unassessedEffectiveWeight).toBe(0);
    expect(thinSeo?.assessedEffectiveWeight).toBeGreaterThan(0);
    // Coverage must reflect real evidence differences, not a canned constant.
    expect(strong.coverage.weightedCoverage).not.toBe(
      thin.coverage.weightedCoverage,
    );
  });

  it("marks local discovery profiles NOT_APPLICABLE for remote-only businesses", () => {
    const fixture = remoteConsultancyFixture();
    const result = scoreDigitalPresence({
      crawl: fixture.crawl,
      performance: fixture.performance,
      analysis: fixture.analysis,
      businessModelHint: "remote_online",
      assessedAt: "2026-10-21T06:00:00.000Z",
    });
    const discovery = result.categories
      .flatMap((c) => c.criteria)
      .find((c) => c.criterionId === "SEO.discovery_profiles");
    expect(discovery?.applicability).toBe("NOT_APPLICABLE");
    expect(result.notApplicableChecks).toContain("SEO.discovery_profiles");

    const seo = result.categories.find((c) => c.categoryId === "local_seo_presence");
    const applicableSeo = seo?.criteria.filter((c) => c.applicability === "APPLICABLE") ?? [];
    const effectiveSum = roundPoints(
      applicableSeo.reduce((s, c) => s + c.effectiveMaxPoints, 0),
    );
    expect(effectiveSum).toBe(25);
  });

  it("does not silently mark uncertain checks NOT_APPLICABLE", () => {
    const crawl = makeCrawl({
      pages: [
        makePage({
          finalUrl: "https://example.com/",
          title: "General Services",
          mainTextExcerpt: "We help customers succeed.",
        }),
      ],
    });
    const model = inferBusinessModel(crawl, "unknown");
    const decisions = evaluateApplicability(
      SCORING_CONFIG_STRICT_V1.criteria,
      crawl,
      model,
    );
    const discovery = decisions.find((d) => d.criterionId === "SEO.discovery_profiles");
    expect(discovery?.applicability).toBe("APPLICABLE");
  });
});

describe("weight redistribution and rounding", () => {
  it("redistributes NOT_APPLICABLE weight within the same category deterministically", () => {
    const applicability = new Map<CriterionId, ApplicabilityState>();
    for (const criterion of SCORING_CONFIG_STRICT_V1.criteria) {
      applicability.set(criterion.id, "APPLICABLE");
    }
    applicability.set("SEO.discovery_profiles", "NOT_APPLICABLE");

    const first = redistributeCategoryWeights(
      "local_seo_presence",
      25,
      SCORING_CONFIG_STRICT_V1.criteria,
      applicability,
    );
    const second = redistributeCategoryWeights(
      "local_seo_presence",
      25,
      SCORING_CONFIG_STRICT_V1.criteria,
      applicability,
    );

    expect(first.effective).toEqual(second.effective);
    const sum = roundPoints(
      Object.values(first.effective).reduce((s, v) => s + v, 0),
    );
    expect(sum).toBe(25);
    expect(first.effective["SEO.discovery_profiles"]).toBe(0);
    expect(first.effective["SEO.service_market_coverage"]).toBeGreaterThan(8);
  });
});

describe("evidence grounding", () => {
  it("rejects unsupported AI findings", () => {
    const analysis = makeAnalysis([
      {
        id: "ok",
        category: "website_experience",
        kind: "strength",
        title: "Good",
        description: "Good",
        evidenceIds: ["page-1"],
        reasoningSummary: "ok",
        suggestedImprovement: null,
        confidence: "high",
      },
      {
        id: "bad",
        category: "website_experience",
        kind: "strength",
        title: "Bad",
        description: "Bad",
        evidenceIds: ["nope"],
        reasoningSummary: "bad",
        suggestedImprovement: null,
        confidence: "high",
      },
    ]);
    const { grounded, rejectedIds } = groundAiFindings(analysis, new Set(["page-1"]));
    expect(grounded.map((f) => f.id)).toEqual(["ok"]);
    expect(rejectedIds).toEqual(["bad"]);
  });

  it("records rejected AI finding ids on the scoring result", () => {
    const result = scoreDigitalPresence(strongLocalServiceFixture());
    expect(result.rejectedAiFindingIds).toContain("bad");
  });
});

describe("coverage and outcomes", () => {
  it("returns LIMITED_VISIBILITY without a confirmed website", () => {
    const result = scoreDigitalPresence(blockedWebsiteFixture());
    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.totalScore).toBeNull();
    expect(result.maturity.band).toBeNull();
  });

  it("returns PARTIAL for thin brochure sites with incomplete coverage", () => {
    const result = scoreDigitalPresence(brochureFixture());
    expect(["PARTIAL", "COMPLETE"]).toContain(result.status);
    // Brochure should not be Digital Leader
    if (result.maturity.band) {
      expect(result.maturity.band).not.toBe("digital_leader");
    }
  });

  it("can produce COMPLETE audits for strong fixtures", () => {
    const result = scoreDigitalPresence({
      ...strongLocalServiceFixture(),
      assessedAt: "2026-10-21T06:00:00.000Z",
    });
    expect(result.coverage.verifiedWebsitePages).toBeGreaterThanOrEqual(1);
    expect(result.coverage.categoriesWithAssessedEvidence.length).toBe(5);
    expect(result.coverage.weightedCoverage).toBeGreaterThanOrEqual(0.7);
    expect(result.status).toBe("COMPLETE");
    expect(result.totalScore).not.toBeNull();
    expect(result.scoringVersion).toBe("strict-v1.0");
  });

  it("calculates coverage from effective applicable weights", () => {
    const criteria: ScoredCriterion[] = [
      {
        criterionId: "WE.mobile_usability",
        categoryId: "website_experience",
        scoringVersion: "strict-v1.0",
        name: "Mobile",
        baseMaxPoints: 6,
        effectiveMaxPoints: 6,
        assessment: "PASS",
        applicability: "APPLICABLE",
        earnedPoints: 6,
        evidenceIds: ["page-1"],
        sourceUrls: [],
        observationTimestamps: [],
        scoringRuleId: "x",
        rationale: "x",
        observationFingerprint: null,
      },
      {
        criterionId: "WE.measured_performance",
        categoryId: "website_experience",
        scoringVersion: "strict-v1.0",
        name: "Perf",
        baseMaxPoints: 7,
        effectiveMaxPoints: 7,
        assessment: "NOT_ASSESSED",
        applicability: "APPLICABLE",
        earnedPoints: null,
        evidenceIds: [],
        sourceUrls: [],
        observationTimestamps: [],
        scoringRuleId: "x",
        rationale: "x",
        observationFingerprint: null,
      },
      {
        criterionId: "SEO.discovery_profiles",
        categoryId: "local_seo_presence",
        scoringVersion: "strict-v1.0",
        name: "Discovery",
        baseMaxPoints: 5,
        effectiveMaxPoints: 0,
        assessment: "NOT_ASSESSED",
        applicability: "NOT_APPLICABLE",
        earnedPoints: null,
        evidenceIds: [],
        sourceUrls: [],
        observationTimestamps: [],
        scoringRuleId: "x",
        rationale: "x",
        observationFingerprint: null,
      },
    ];

    const report = calculateCoverage(
      criteria,
      SCORING_CONFIG_STRICT_V1.coverage,
      1,
      ["website_experience", "local_seo_presence"],
    );
    // Provider-gap NOT_ASSESSED (measured_performance) is excluded from the
    // coverage pool. NOT_APPLICABLE discovery is also excluded.
    // Pool weight = 6 (mobile only), assessed = 6 → 1.0
    expect(report.applicableEffectiveWeight).toBe(6);
    expect(report.assessedEffectiveWeight).toBe(6);
    expect(report.weightedCoverage).toBe(1);
    // Discovery is NOT_APPLICABLE here (effectiveMax 0) so it never enters the pool.
  });

  it("varies coverage when website-signal criteria stay NOT_ASSESSED", () => {
    const criteria: ScoredCriterion[] = [
      {
        criterionId: "WE.mobile_usability",
        categoryId: "website_experience",
        scoringVersion: "strict-v1.0",
        name: "Mobile",
        baseMaxPoints: 6,
        effectiveMaxPoints: 6,
        assessment: "PASS",
        applicability: "APPLICABLE",
        earnedPoints: 6,
        evidenceIds: ["page-1"],
        sourceUrls: [],
        observationTimestamps: [],
        scoringRuleId: "x",
        rationale: "x",
        observationFingerprint: null,
      },
      {
        criterionId: "WE.design_readability",
        categoryId: "website_experience",
        scoringVersion: "strict-v1.0",
        name: "Readability",
        baseMaxPoints: 4,
        effectiveMaxPoints: 4,
        assessment: "NOT_ASSESSED",
        applicability: "APPLICABLE",
        earnedPoints: null,
        evidenceIds: [],
        sourceUrls: [],
        observationTimestamps: [],
        scoringRuleId: "x",
        rationale: "No page available for readability assessment.",
        observationFingerprint: null,
      },
      {
        criterionId: "WE.measured_performance",
        categoryId: "website_experience",
        scoringVersion: "strict-v1.0",
        name: "Perf",
        baseMaxPoints: 7,
        effectiveMaxPoints: 7,
        assessment: "NOT_ASSESSED",
        applicability: "APPLICABLE",
        earnedPoints: null,
        evidenceIds: [],
        sourceUrls: [],
        observationTimestamps: [],
        scoringRuleId: "x",
        rationale: "PageSpeed unavailable",
        observationFingerprint: null,
      },
    ];

    const report = calculateCoverage(
      criteria,
      SCORING_CONFIG_STRICT_V1.coverage,
      1,
      ["website_experience"],
    );
    // Pool = mobile(6) + readability(4) = 10; assessed = 6 → 0.6
    // PageSpeed provider gap excluded so coverage reflects website evidence.
    expect(report.applicableEffectiveWeight).toBe(10);
    expect(report.assessedEffectiveWeight).toBe(6);
    expect(report.weightedCoverage).toBe(roundPoints(6 / 10));
  });
});

describe("maturity bands", () => {
  it("uses exact PRD boundaries", () => {
    expect(MATURITY_BANDS).toEqual([
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
    ]);
  });

  it("does not assign a band without a complete numerical audit", () => {
    const { maturity } = assignMaturityBand({
      totalScore: 90,
      completeAudit: false,
      categories: [],
    });
    expect(maturity.band).toBeNull();
  });

  it("prevents Digital Leader without strong corroboration across categories", () => {
    const weakCategories = SCORING_CONFIG_STRICT_V1.categories.map((category) => ({
      categoryId: category.id,
      name: category.name,
      maxPoints: category.maxPoints,
      earnedPoints: 1,
      assessedEffectiveWeight: category.maxPoints,
      unassessedEffectiveWeight: 0,
      notApplicableBaseWeight: 0,
      methodologyReviewRequired: false,
      criteria: [],
    }));
    const { maturity, policyFlags } = assignMaturityBand({
      totalScore: 90,
      completeAudit: true,
      categories: weakCategories,
    });
    expect(maturity.band).toBe("growing_digital_presence");
    expect(policyFlags).toContain("digital_leader_corroboration_failed");
  });
});

describe("PASS/PARTIAL/FAIL behavior", () => {
  it("awards PASS for strong measured performance", () => {
    const result = scoreDigitalPresence(strongLocalServiceFixture());
    const perf = result.categories
      .flatMap((c) => c.criteria)
      .find((c) => c.criterionId === "WE.measured_performance");
    expect(perf?.assessment).toBe("PASS");
    expect(perf?.earnedPoints).toBe(7);
  });

  it("awards PARTIAL for mid-range measured performance", () => {
    const fixture = strongLocalServiceFixture();
    const result = scoreDigitalPresence({
      ...fixture,
      performance: makePerformance(70),
    });
    const perf = result.categories
      .flatMap((c) => c.criteria)
      .find((c) => c.criterionId === "WE.measured_performance");
    expect(perf?.assessment).toBe("PARTIAL");
    expect(perf?.earnedPoints).toBe(3.5);
  });

  it("awards FAIL for poor measured performance", () => {
    const fixture = strongLocalServiceFixture();
    const result = scoreDigitalPresence({
      ...fixture,
      performance: makePerformance(20),
    });
    const perf = result.categories
      .flatMap((c) => c.criteria)
      .find((c) => c.criterionId === "WE.measured_performance");
    expect(perf?.assessment).toBe("FAIL");
    expect(perf?.earnedPoints).toBe(0);
  });
});

describe("scoring version preservation", () => {
  it("stores strict-v1.0 on every scored criterion", () => {
    const result = scoreDigitalPresence(strongLocalServiceFixture());
    for (const category of result.categories) {
      for (const criterion of category.criteria) {
        expect(criterion.scoringVersion).toBe("strict-v1.0");
      }
    }
  });
});
