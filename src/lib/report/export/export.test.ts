import { describe, expect, it } from "vitest";

import { reportDemoFixtures } from "@/features/report/data/report.mock";
import {
  LIVE_SCORING_POLICY_EXPLANATION,
  LIVE_SCORING_POLICY_ID,
  mapAssessmentToReport,
} from "@/features/report/adapters/assessment-to-report";
import { runAssessment } from "@/lib/audit/orchestration/assessment";
import {
  blockedWebsiteFixture,
  brochureFixture,
  strongLocalServiceFixture,
} from "@/lib/audit/scoring/test/fixtures";
import { scoreDigitalPresence } from "@/lib/audit/scoring/scoring-engine";
import {
  buildExportFilename,
  escapeHtml,
  isValidReportExportId,
  validateReportForExport,
} from "@/lib/report/export/export-validation";
import { exportReport, resolveReportForExport } from "@/lib/report/export/report-export";
import { renderReportExportHtml } from "@/lib/report/export/report-renderer";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

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

function isPdf(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString("utf8").startsWith("%PDF");
}

function isPng(bytes: Buffer): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

describe("export validation helpers", () => {
  it("accepts demo and live report ids only", () => {
    expect(isValidReportExportId("demo-complete")).toBe(true);
    expect(isValidReportExportId("live-abcdef12-3456-7890")).toBe(true);
    expect(isValidReportExportId("../etc/passwd")).toBe(false);
    expect(isValidReportExportId("https://evil.example")).toBe(false);
  });

  it("builds safe filenames", () => {
    const name = buildExportFilename(reportDemoFixtures.complete, "pdf");
    expect(name.endsWith(".pdf")).toBe(true);
    expect(name).not.toContain("/");
    expect(name).not.toContain("\\");
    expect(name).toContain("demo");
  });

  it("escapes unsafe HTML content", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("rejects live validation when demo flag is set", () => {
    const error = validateReportForExport(reportDemoFixtures.complete, {
      expectLive: true,
    });
    expect(error?.code).toBe("demo_forbidden_as_live");
  });
});

describe("report export HTML rendering", () => {
  it("preserves decimal scores and escapes content", () => {
    const report: DigitalPresenceReport = {
      ...reportDemoFixtures.complete,
      overallScore: 80.8,
      businessName: `Acme <img src=x onerror=alert(1)>`,
    };
    const html = renderReportExportHtml(report);
    expect(html).toContain("80.8");
    expect(html).not.toContain("81/100");
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img src=x");
  });

  it("omits overall score for partial and limited outcomes", () => {
    const partialHtml = renderReportExportHtml(reportDemoFixtures.partial);
    expect(partialHtml).toContain("Partial Audit");
    expect(partialHtml).not.toMatch(/Overall digital presence score/);

    const limitedHtml = renderReportExportHtml(reportDemoFixtures.limited);
    expect(limitedHtml).toContain("Limited Visibility Snapshot");
    expect(limitedHtml).not.toMatch(/Overall digital presence score/);
  });

  it("includes methodology / policy disclosure text for live-shaped reports", () => {
    const report: DigitalPresenceReport = {
      ...reportDemoFixtures.complete,
      isDemo: false,
      scoringPolicyId: LIVE_SCORING_POLICY_ID,
      methodology: {
        ...reportDemoFixtures.complete.methodology,
        limitations: [LIVE_SCORING_POLICY_EXPLANATION],
      },
    };
    const html = renderReportExportHtml(report);
    expect(html).toContain(LIVE_SCORING_POLICY_ID);
    expect(html).toContain("Unassessed checks are not automatically treated as failures");
  });
});

describe("resolveReportForExport", () => {
  it("loads demo reports without treating them as live", async () => {
    const resolved = await resolveReportForExport("demo-complete");
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.source).toBe("demo");
    expect(resolved.report.isDemo).toBe(true);
  });

  it("rejects invalid ids", async () => {
    const resolved = await resolveReportForExport("not-a-report");
    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(resolved.code).toBe("invalid_id");
  });

  it("does not fall back to demo for missing live sessions", async () => {
    const resolved = await resolveReportForExport(
      "live-00000000-0000-0000-0000-000000000099",
    );
    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(resolved.code).toBe("expired_session");
  });
});

describe("Playwright PDF/PNG export", () => {
  it("generates valid PDF and PNG for COMPLETE demo report", async () => {
    const report = reportDemoFixtures.complete;
    const pdf = await exportReport({ format: "pdf", report, timeoutMs: 60_000 });
    expect(pdf.ok).toBe(true);
    if (!pdf.ok) return;
    expect(pdf.contentType).toBe("application/pdf");
    expect(isPdf(pdf.bytes)).toBe(true);
    expect(pdf.filename.endsWith(".pdf")).toBe(true);

    const png = await exportReport({ format: "png", report, timeoutMs: 60_000 });
    expect(png.ok).toBe(true);
    if (!png.ok) return;
    expect(png.contentType).toBe("image/png");
    expect(isPng(png.bytes)).toBe(true);
  }, 90_000);

  it("generates PDF/PNG for PARTIAL demo report without inventing scores", async () => {
    const report = reportDemoFixtures.partial;
    expect(report.overallScore).toBeNull();
    const pdf = await exportReport({ format: "pdf", report, timeoutMs: 60_000 });
    expect(pdf.ok).toBe(true);
    if (!pdf.ok) return;
    expect(isPdf(pdf.bytes)).toBe(true);

    const png = await exportReport({ format: "png", report, timeoutMs: 60_000 });
    expect(png.ok).toBe(true);
    if (!png.ok) return;
    expect(isPng(png.bytes)).toBe(true);
  }, 90_000);

  it("generates LIMITED_VISIBILITY exports", async () => {
    const report = reportDemoFixtures.limited;
    const pdf = await exportReport({ format: "pdf", report, timeoutMs: 60_000 });
    expect(pdf.ok).toBe(true);
    if (!pdf.ok) return;
    expect(isPdf(pdf.bytes)).toBe(true);
  }, 60_000);

  it("exports COMPLETE assessment-mapped report with decimal score preserved in HTML", async () => {
    const assessment = await runAssessment(inject(strongLocalServiceFixture()));
    const report = mapAssessmentToReport(assessment);
    expect(report.overallScore).toBe(80.8);
    expect(report.isDemo).toBe(false);

    const html = renderReportExportHtml(report);
    expect(html).toContain("80.8");

    const pdf = await exportReport({ format: "pdf", report, timeoutMs: 60_000 });
    expect(pdf.ok).toBe(true);
    if (!pdf.ok) return;
    expect(isPdf(pdf.bytes)).toBe(true);
  }, 90_000);

  it("exports PARTIAL mapped assessment with null score", async () => {
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
    expect(report.overallScore).toBeNull();
    const pdf = await exportReport({ format: "pdf", report, timeoutMs: 60_000 });
    expect(pdf.ok).toBe(true);
    if (!pdf.ok) return;
    expect(isPdf(pdf.bytes)).toBe(true);
  }, 90_000);

  it("exports LIMITED mapped assessment", async () => {
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
    const png = await exportReport({ format: "png", report, timeoutMs: 60_000 });
    expect(png.ok).toBe(true);
    if (!png.ok) return;
    expect(isPng(png.bytes)).toBe(true);
  }, 90_000);

  it("returns timeout errors for extremely low budgets", async () => {
    const result = await exportReport({
      format: "pdf",
      report: reportDemoFixtures.complete,
      timeoutMs: 1,
    });
    // May be timeout or browser_failure depending on how fast launch fails
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(["timeout", "browser_failure", "render_failure"]).toContain(
      result.code,
    );
  }, 30_000);

  it("refuses unsupported PNG height rather than truncating", async () => {
    const result = await exportReport({
      format: "png",
      report: reportDemoFixtures.complete,
      timeoutMs: 60_000,
      htmlOverride: `<!DOCTYPE html><html><body style="height:20000px;width:900px;background:#fff"><h1>Too tall</h1></body></html>`,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("unsupported_size");
  }, 60_000);
});
