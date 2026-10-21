import { describe, expect, it } from "vitest";

import { validateScoringResult } from "@/lib/audit/validation/assessment-validator";
import {
  applyGroundedAnalysis,
  validateCollectedEvidence,
} from "@/lib/audit/validation/evidence-validator";
import { scoreDigitalPresence } from "@/lib/audit/scoring/scoring-engine";
import {
  brochureFixture,
  makeAnalysis,
  makeCrawl,
  makePage,
  makePerformance,
  strongLocalServiceFixture,
} from "@/lib/audit/scoring/test/fixtures";

describe("validateCollectedEvidence", () => {
  it("builds a catalog with IDs, URLs, timestamps, and methods", () => {
    const fixture = strongLocalServiceFixture();
    const result = validateCollectedEvidence({
      crawl: fixture.crawl,
      performance: fixture.performance,
      analysis: fixture.analysis,
    });

    expect(result.websiteConfirmed).toBe(true);
    expect(result.verifiedPageCount).toBeGreaterThanOrEqual(1);
    expect(result.allowedEvidenceIds).toContain("website-1");
    expect(result.allowedEvidenceIds).toContain("page-1");
    for (const item of result.evidenceCatalog.filter((e) => e.kind !== "pagespeed")) {
      expect(item.id).toBeTruthy();
      expect(item.sourceUrl).toBeTruthy();
      expect(item.observedAt).toBeTruthy();
      expect(item.collectionMethod).toBeTruthy();
      expect(item.availability).toBeTruthy();
      expect(item.valueSummary).toBeTruthy();
    }
  });

  it("rejects unsupported AI evidence references", () => {
    const fixture = strongLocalServiceFixture();
    const result = validateCollectedEvidence({
      crawl: fixture.crawl,
      performance: fixture.performance,
      analysis: fixture.analysis,
    });
    expect(result.rejectedAiFindingIds).toContain("bad");
    expect(result.groundedFindings.every((f) => f.id !== "bad")).toBe(true);
  });

  it("detects duplicate page evidence consistently", () => {
    const page = makePage({
      finalUrl: "https://example.com/",
      title: "Dup",
      mainTextExcerpt: "Duplicate page body content for testing.",
    });
    const crawl = makeCrawl({ pages: [page, { ...page }] });
    const result = validateCollectedEvidence({
      crawl,
      performance: null,
      analysis: null,
    });
    expect(result.duplicateEvidenceIds.length).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.code === "duplicate_evidence")).toBe(true);
  });

  it("does not treat inaccessible pages as feature absence", () => {
    const page = makePage({
      finalUrl: "https://example.com/blocked",
      title: "Blocked",
      httpStatus: 403,
      source: {
        url: "https://example.com/blocked",
        observedAt: "2026-10-21T06:00:00.000Z",
        extractionMethod: "cheerio_html",
        availability: "blocked",
      },
    });
    const crawl = makeCrawl({ pages: [page] });
    const result = validateCollectedEvidence({
      crawl,
      performance: null,
      analysis: null,
    });
    expect(result.inaccessiblePageUrls).toContain("https://example.com/blocked");
    expect(
      result.issues.some((i) => i.code === "inaccessible_page_not_feature_absence"),
    ).toBe(true);
  });

  it("preserves field vs lab PageSpeed distinction", () => {
    const fixture = strongLocalServiceFixture();
    const result = validateCollectedEvidence({
      crawl: fixture.crawl,
      performance: fixture.performance,
      analysis: null,
    });
    expect(result.performance.labMetricsPresent).toBe(true);
    const psi = result.evidenceCatalog.find((e) => e.kind === "pagespeed");
    expect(psi?.metricClassificationNotes?.some((n) => n.startsWith("lab:"))).toBe(
      true,
    );
    expect(psi?.metricClassificationNotes?.some((n) => n.startsWith("field:"))).toBe(
      true,
    );
  });

  it("applyGroundedAnalysis drops unsupported findings without fabricating", () => {
    const analysis = makeAnalysis([
      {
        id: "ok",
        category: "website_experience",
        kind: "strength",
        title: "Ok",
        description: "Ok",
        evidenceIds: ["page-1"],
        reasoningSummary: "ok",
        suggestedImprovement: null,
        confidence: "high",
      },
    ]);
    const grounded = applyGroundedAnalysis(analysis, [], ["ok"]);
    expect(grounded?.findings).toEqual([]);
    expect(grounded?.unsupportedClaimsDropped).toBeGreaterThan(0);
  });
});

describe("validateScoringResult", () => {
  it("requires scoring-policy disclosure and category maxima", () => {
    const fixture = strongLocalServiceFixture();
    const evidence = validateCollectedEvidence({
      crawl: fixture.crawl,
      performance: fixture.performance,
      analysis: fixture.analysis,
    });
    const scoring = scoreDigitalPresence({
      ...fixture,
      assessedAt: "2026-10-21T06:00:00.000Z",
    });
    const validation = validateScoringResult(scoring, evidence);
    expect(validation.ok).toBe(true);
    expect(scoring.policyFlags).toContain(
      "unassessed_weight_uses_absolute_points_earned",
    );
    expect(scoring.categories.map((c) => c.maxPoints)).toEqual([25, 25, 20, 15, 15]);
  });

  it("flags incomplete assessments that incorrectly include scores", () => {
    const fixture = brochureFixture();
    const evidence = validateCollectedEvidence({
      crawl: fixture.crawl,
      performance: makePerformance(null),
      analysis: null,
    });
    const scoring = scoreDigitalPresence({
      crawl: fixture.crawl,
      performance: makePerformance(null),
      analysis: null,
      assessedAt: "2026-10-21T06:00:00.000Z",
    });
    // Force an invalid state to verify validator
    const invalid = {
      ...scoring,
      status: "PARTIAL" as const,
      totalScore: 50,
      maturity: { ...scoring.maturity, band: "digital_leader" as const, label: "x", eligible: true },
    };
    const validation = validateScoringResult(invalid, evidence);
    expect(validation.ok).toBe(false);
    expect(
      validation.issues.some((i) => i.code === "incomplete_with_score_present"),
    ).toBe(true);
  });
});
