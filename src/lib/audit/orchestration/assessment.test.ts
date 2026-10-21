import { describe, expect, it } from "vitest";

import type { CrawlResult } from "@/features/audit/types/evidence.types";
import { runAssessment } from "@/lib/audit/orchestration/assessment";
import type { AIAnalysisResult } from "@/lib/audit/integrations/openai/analysis.types";
import type { PerformanceResult } from "@/lib/audit/integrations/pagespeed/pagespeed.types";
import { scoreDigitalPresence } from "@/lib/audit/scoring/scoring-engine";
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

function inject(fixture: {
  crawl: CrawlResult;
  performance: PerformanceResult | null;
  analysis: AIAnalysisResult | null;
  businessModelHint?: "remote_online" | "local_service";
}) {
  // Prefer a structurally valid public URL; crawlFn supplies the fixture outcome.
  const candidate =
    fixture.crawl.website?.normalizedSeedUrl ??
    fixture.crawl.request.normalizedUrl ??
    "https://example.com/";
  const websiteUrl =
    candidate.includes("localhost") || fixture.crawl.request.url === "localhost"
      ? "https://example.com/"
      : candidate;
  return {
    websiteUrl,
    businessName: "Fixture Business",
    businessModelHint: fixture.businessModelHint,
    assessedAt: "2026-10-21T06:00:00.000Z",
    crawlFn: async () => fixture.crawl,
    pagespeedFn: async () => fixture.performance,
    analysisFn: async () => fixture.analysis,
  };
}

describe("runAssessment orchestration", () => {
  it("produces a COMPLETE assessment with sufficient evidence", async () => {
    const result = await runAssessment(inject(strongLocalServiceFixture()));
    expect(result.ephemeral).toBe(true);
    expect(result.assessmentId).toBeTruthy();
    expect(result.status).toBe("COMPLETE");
    expect(result.overallScore).not.toBeNull();
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.totalMaxPoints).toBe(100);
    expect(result.scoringVersion).toBe("strict-v1.0");
    expect(result.scoringPolicyFlags).toContain(
      "unassessed_weight_uses_absolute_points_earned",
    );
    expect(result.scoringPolicyDisclosures.length).toBeGreaterThan(0);
    expect(result.categories.map((c) => c.maxPoints)).toEqual([25, 25, 20, 15, 15]);
    expect(result.evidenceCoverage.meetsPublicationThresholds).toBe(true);
    expect(result.integrationAvailability.crawler).toBe("available");
    expect(result.integrationAvailability.scoring).toBe("available");
  });

  it("produces PARTIAL with null score and maturity when coverage is insufficient", async () => {
    const fixture = brochureFixture();
    const result = await runAssessment({
      ...inject(fixture),
      scoringFn: (input) => {
        const scored = scoreDigitalPresence({
          ...input,
          assessedAt: "2026-10-21T06:00:00.000Z",
        });
        return {
          ...scored,
          status: "PARTIAL",
          totalScore: null,
          maturity: {
            band: null,
            label: null,
            eligible: false,
            reason: "No maturity band for partial audit.",
          },
          coverage: {
            ...scored.coverage,
            weightedCoverage: 0.45,
            meetsPublicationThresholds: false,
            categoriesMissingAssessedEvidence: ["reputation_trust"],
          },
        };
      },
    });
    expect(result.status).toBe("PARTIAL");
    expect(result.overallScore).toBeNull();
    expect(result.maturityBand.band).toBeNull();
    expect(result.limitationReasons.length).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.evidenceCoverage.meetsPublicationThresholds).toBe(false);
  });

  it("returns LIMITED_VISIBILITY without a confirmed website", async () => {
    const result = await runAssessment(inject(blockedWebsiteFixture()));
    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.overallScore).toBeNull();
    expect(result.maturityBand.band).toBeNull();
    expect(result.categories).toEqual([]);
    expect(result.limitationReasons.some((r) => /verified website/i.test(r))).toBe(
      true,
    );
  });

  it("continues when PageSpeed is missing", async () => {
    const fixture = strongLocalServiceFixture();
    const result = await runAssessment(
      inject({
        ...fixture,
        performance: makePerformance(null),
      }),
    );
    expect(result.errors.some((e) => e.code === "pagespeed_failure")).toBe(true);
    expect(result.integrationAvailability.pagespeed).toMatch(/unavailable|error/);
    expect(result.unassessedCriteria).toContain("WE.measured_performance");
    // Crawler evidence preserved — not a full assessment failure solely due to PSI
    expect(result.evidenceCatalog.some((e) => e.kind === "page")).toBe(true);
    expect(result.scoring).not.toBeNull();
  });

  it("continues when OpenAI is missing without fabricating findings", async () => {
    const fixture = strongLocalServiceFixture();
    const result = await runAssessment(
      inject({
        ...fixture,
        analysis: {
          ...makeAnalysis([]),
          ok: false,
          status: "error",
          findings: [],
          errors: [{ code: "timeout", message: "OpenAI timed out" }],
        },
      }),
    );
    expect(result.errors.some((e) => e.code === "openai_failure")).toBe(true);
    expect(result.recommendations).toEqual([]);
    expect(result.rejectedAiFindingIds).not.toContain("fabricated");
    expect(result.evidenceCatalog.some((e) => e.kind === "page")).toBe(true);
  });

  it("rejects unsupported AI evidence references", async () => {
    const result = await runAssessment(inject(strongLocalServiceFixture()));
    expect(result.rejectedAiFindingIds).toContain("bad");
    expect(
      result.warnings.some((w) => w.code === "unsupported_ai_references"),
    ).toBe(true);
  });

  it("handles duplicate evidence with warnings", async () => {
    const page = makePage({
      finalUrl: "https://example.com/",
      title: "Acme",
      metaDescription: "Local services",
      headings: [{ level: 1, text: "Home" }],
      internalLinks: ["https://example.com/a", "https://example.com/b"],
      mainTextExcerpt: "We provide services. Request a Quote.",
      ctas: [{ text: "Request a Quote", href: "/contact" }],
      contact: { emails: ["a@b.c"], phones: ["555"], addresses: [] },
    });
    const crawl = makeCrawl({
      pages: [page, { ...page }],
      websiteOverrides: {
        discoveredServicePages: ["https://example.com/services"],
        contactPageAvailable: "available",
        primaryConversionPathways: [{ text: "Request a Quote", href: "/contact" }],
      },
    });
    const result = await runAssessment(
      inject({
        crawl,
        performance: makePerformance(80),
        analysis: makeAnalysis([]),
      }),
    );
    expect(result.warnings.some((w) => w.code === "duplicate_evidence")).toBe(true);
  });

  it("handles blocked website crawl", async () => {
    const result = await runAssessment(inject(blockedWebsiteFixture()));
    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.overallScore).toBeNull();
  });

  it("records partial crawler completion", async () => {
    const fixture = strongLocalServiceFixture();
    const crawl: CrawlResult = {
      ...fixture.crawl,
      partial: true,
      errors: [
        ...fixture.crawl.errors,
        { code: "partial_crawl", message: "Limit reached" },
      ],
    };
    const result = await runAssessment(
      inject({ ...fixture, crawl }),
    );
    expect(result.errors.some((e) => e.code === "partial_crawl")).toBe(true);
    expect(result.limitationReasons.some((r) => /partial crawl/i.test(r))).toBe(
      true,
    );
  });

  it("handles invalid OpenAI provider response", async () => {
    const fixture = strongLocalServiceFixture();
    const result = await runAssessment(
      inject({
        ...fixture,
        analysis: {
          ...makeAnalysis([]),
          ok: false,
          status: "error",
          findings: [],
          errors: [
            {
              code: "schema_validation_failed",
              message: "Invalid structured output",
            },
          ],
        },
      }),
    );
    expect(result.errors.some((e) => e.code === "invalid_ai_output")).toBe(true);
    expect(result.scoring).not.toBeNull();
  });

  it("returns assessment_timeout when wall clock is exceeded", async () => {
    const result = await runAssessment({
      websiteUrl: "https://example.com",
      timeoutMs: 30,
      crawlFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return strongLocalServiceFixture().crawl;
      },
      pagespeedFn: async () => null,
      analysisFn: async () => null,
    });
    expect(result.errors.some((e) => e.code === "assessment_timeout")).toBe(true);
    expect(result.overallScore).toBeNull();
  });

  it("preserves category maxima and scoring version", async () => {
    const result = await runAssessment(inject(strongLocalServiceFixture()));
    expect(result.scoringVersion).toBe("strict-v1.0");
    expect(result.totalMaxPoints).toBe(100);
    expect(result.categories.reduce((s, c) => s + c.maxPoints, 0)).toBe(100);
  });

  it("keeps scores nullable for incomplete assessments", async () => {
    const result = await runAssessment(inject(blockedWebsiteFixture()));
    expect(result.overallScore).toBeNull();
    expect(result.maturityBand.band).toBeNull();
  });

  it("preserves scoring-policy disclosure", async () => {
    const result = await runAssessment(inject(strongLocalServiceFixture()));
    expect(result.scoringPolicyFlags).toContain(
      "unassessed_weight_uses_absolute_points_earned",
    );
    expect(
      result.scoringPolicyDisclosures.some((d) =>
        /absolute points earned/i.test(d),
      ),
    ).toBe(true);
  });

  it("is deterministic for identical validated inputs", async () => {
    const fixture = strongLocalServiceFixture();
    const a = await runAssessment(inject(fixture));
    const b = await runAssessment(inject(fixture));
    expect(a.overallScore).toBe(b.overallScore);
    expect(a.status).toBe(b.status);
    expect(a.categories.map((c) => c.earnedPoints)).toEqual(
      b.categories.map((c) => c.earnedPoints),
    );
    expect(a.scoringVersion).toBe(b.scoringVersion);
  });

  it("marks remote discovery profiles NOT_APPLICABLE without failing assessment", async () => {
    const fixture = remoteConsultancyFixture();
    const result = await runAssessment({
      ...inject({
        crawl: fixture.crawl,
        performance: fixture.performance,
        analysis: fixture.analysis,
        businessModelHint: "remote_online",
      }),
      websiteUrl: "https://remote.example/",
    });
    expect(result.notApplicableCriteria).toContain("SEO.discovery_profiles");
    expect(result.scoring).not.toBeNull();
  });

  it("rejects invalid business input", async () => {
    const result = await runAssessment({
      websiteUrl: "not a url",
      crawlFn: async () => strongLocalServiceFixture().crawl,
    });
    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.errors.some((e) => e.code === "invalid_input")).toBe(true);
  });
});
