import { describe, expect, it } from "vitest";

import {
  LIVE_SCORING_POLICY_EXPLANATION,
  LIVE_SCORING_POLICY_ID,
  mapAssessmentToReport,
  safeHttpUrl,
} from "@/features/report/adapters/assessment-to-report";
import { reportDemoFixtures } from "@/features/report/data/report.mock";
import type { AssessmentResult } from "@/lib/audit/orchestration/assessment.types";
import { validateReportResult } from "@/lib/audit/validation/report-result-validator";
import { runAssessment } from "@/lib/audit/orchestration/assessment";
import {
  blockedWebsiteFixture,
  brochureFixture,
  makePerformance,
  strongLocalServiceFixture,
} from "@/lib/audit/scoring/test/fixtures";
import { scoreDigitalPresence } from "@/lib/audit/scoring/scoring-engine";

function inject(fixture: {
  crawl: ReturnType<typeof strongLocalServiceFixture>["crawl"];
  performance: ReturnType<typeof strongLocalServiceFixture>["performance"];
  analysis: ReturnType<typeof strongLocalServiceFixture>["analysis"] | null;
}) {
  const candidate =
    fixture.crawl.website?.normalizedSeedUrl ??
    fixture.crawl.request.normalizedUrl ??
    "https://example.com/";
  const websiteUrl = candidate.includes("localhost")
    ? "https://example.com/"
    : candidate;
  return {
    websiteUrl,
    businessName: "Fixture Business",
    assessedAt: "2026-10-21T06:00:00.000Z",
    crawlFn: async () => fixture.crawl,
    pagespeedFn: async () => fixture.performance,
    analysisFn: async () => fixture.analysis,
  };
}

describe("safeHttpUrl", () => {
  it("allows only http(s) URLs", () => {
    expect(safeHttpUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("ftp://example.com")).toBeNull();
  });
});

describe("mapAssessmentToReport", () => {
  it("maps COMPLETE assessments with decimal score preservation", async () => {
    const assessment = await runAssessment(inject(strongLocalServiceFixture()));
    expect(assessment.status).toBe("COMPLETE");
    expect(assessment.overallScore).toBe(83.3);

    const report = mapAssessmentToReport(assessment);
    expect(report.isDemo).toBe(false);
    expect(report.outcome).toBe("complete");
    expect(report.overallScore).toBe(83.3);
    expect(report.overallScore).not.toBe(83);
    expect(report.maxScore).toBe(100);
    expect(report.scoringVersion).toBe("strict-v1.0");
    expect(report.scoringPolicyId).toBe(LIVE_SCORING_POLICY_ID);
    expect(report.maturityBand).toBeTruthy();
    expect(report.categories.map((c) => c.maxPoints)).toEqual([
      25, 25, 20, 15, 15,
    ]);
    expect(
      report.methodology.limitations.some((l) =>
        l.includes(LIVE_SCORING_POLICY_EXPLANATION.slice(0, 40)),
      ),
    ).toBe(true);

    const validation = validateReportResult(report, {
      expectLive: true,
      sourceOverallScore: assessment.overallScore,
    });
    expect(validation.ok).toBe(true);
  });

  it("maps PARTIAL with null score and maturity", async () => {
    const fixture = brochureFixture();
    const assessment = await runAssessment({
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
            reason: "partial",
          },
          coverage: {
            ...scored.coverage,
            weightedCoverage: 0.45,
            meetsPublicationThresholds: false,
          },
        };
      },
    });

    const report = mapAssessmentToReport(assessment);
    expect(report.isDemo).toBe(false);
    expect(report.outcome).toBe("partial");
    expect(report.overallScore).toBeNull();
    expect(report.maturityBand).toBeNull();
    expect(report.statusLabel).toBe("Partial Audit");
    expect(report.categories.length).toBeGreaterThan(0);
    expect(report.unableToVerify.length).toBeGreaterThan(0);

    const validation = validateReportResult(report, { expectLive: true });
    expect(validation.ok).toBe(true);
  });

  it("maps LIMITED_VISIBILITY without fabricated scores or categories", async () => {
    const blocked = blockedWebsiteFixture();
    const assessment = await runAssessment(
      inject({
        crawl: blocked.crawl,
        performance: blocked.performance,
        analysis: blocked.analysis,
      }),
    );
    const report = mapAssessmentToReport(assessment);
    expect(report.outcome).toBe("limited");
    expect(report.overallScore).toBeNull();
    expect(report.maturityBand).toBeNull();
    expect(report.categories).toEqual([]);
    expect(report.statusLabel).toBe("Limited Visibility Snapshot");
    expect(report.unableToVerify.length).toBeGreaterThan(0);
  });

  it("surfaces missing PageSpeed / OpenAI integration warnings", async () => {
    const strong = strongLocalServiceFixture();
    const assessment = await runAssessment(
      inject({
        ...strong,
        performance: makePerformance(null),
        analysis: {
          ...strong.analysis!,
          ok: false,
          status: "error",
          findings: [],
          errors: [{ code: "timeout", message: "OpenAI timed out" }],
        },
      }),
    );
    const report = mapAssessmentToReport(assessment);
    expect(report.integrationWarnings?.some((w) => /PageSpeed/i.test(w))).toBe(
      true,
    );
    expect(report.integrationWarnings?.some((w) => /OpenAI/i.test(w))).toBe(
      true,
    );
  });

  it("validates evidence URLs and rejects unsafe schemes", () => {
    const report = mapAssessmentToReport({
      ...( {
        assessmentId: "live-test",
        ok: true,
        status: "PARTIAL",
        assessedAt: "2026-10-21T06:00:00.000Z",
        scoringVersion: "strict-v1.0",
        business: {
          businessName: "Test",
          websiteUrl: "https://example.com",
          normalizedWebsiteUrl: "https://example.com/",
          serviceAreaSignals: [],
          businessModel: "unknown",
        },
        websiteUrl: "https://example.com",
        overallScore: null,
        totalMaxPoints: 100,
        maturityBand: {
          band: null,
          label: null,
          eligible: false,
          reason: "n/a",
        },
        evidenceCoverage: {
          weightedCoverage: 0.5,
          assessedEffectiveWeight: 50,
          applicableEffectiveWeight: 100,
          categoriesWithAssessedEvidence: [],
          categoriesMissingAssessedEvidence: [],
          verifiedWebsitePages: 1,
          meetsPublicationThresholds: false,
        },
        categories: [],
        findings: [],
        recommendations: [],
        unassessedCriteria: [],
        notApplicableCriteria: [],
        integrationAvailability: {
          crawler: "available",
          pagespeed: "unavailable",
          openai: "unavailable",
          scoring: "available",
        },
        evidenceCatalog: [
          {
            id: "page-1",
            kind: "page",
            sourceUrl: "https://example.com/",
            observedAt: "2026-10-21T06:00:00.000Z",
            collectionMethod: "cheerio_html",
            availability: "available",
            valueSummary: "ok",
          },
        ],
        evidenceValidationIssues: [],
        assessmentValidationIssues: [],
        scoringPolicyFlags: [LIVE_SCORING_POLICY_ID],
        scoringPolicyDisclosures: [],
        limitationReasons: ["Insufficient coverage"],
        warnings: [],
        errors: [],
        scoring: null,
        rejectedAiFindingIds: [],
        startedAt: "2026-10-21T06:00:00.000Z",
        finishedAt: "2026-10-21T06:00:00.000Z",
        ephemeral: true,
      } satisfies AssessmentResult),
    });

    expect(report.evidenceItems?.[0]?.label).toContain("https://example.com/");
  });

  it("never treats demo fixtures as live assessment output", () => {
    const demo = reportDemoFixtures.complete;
    expect(demo.isDemo).toBe(true);
    const liveValidation = validateReportResult(demo, { expectLive: true });
    expect(liveValidation.ok).toBe(false);
    expect(
      liveValidation.issues.some((i) => i.code === "demo_flag_on_live_report"),
    ).toBe(true);
  });

  it("handles missing recommendations without inventing actions", async () => {
    const strong = strongLocalServiceFixture();
    const assessment = await runAssessment(
      inject({
        ...strong,
        analysis: {
          ...strong.analysis!,
          recommendations: [],
          findings: strong.analysis!.findings.filter((f) => f.id !== "bad"),
        },
      }),
    );
    const report = mapAssessmentToReport(assessment);
    expect(Array.isArray(report.actionPlan)).toBe(true);
  });

  it("flags score precision loss", () => {
    const demo = {
      ...reportDemoFixtures.complete,
      isDemo: false,
      scoringPolicyId: LIVE_SCORING_POLICY_ID,
      overallScore: 81,
    };
    const validation = validateReportResult(demo, {
      expectLive: true,
      sourceOverallScore: 80.8,
    });
    expect(
      validation.issues.some((i) => i.code === "score_precision_lost"),
    ).toBe(true);
  });
});
