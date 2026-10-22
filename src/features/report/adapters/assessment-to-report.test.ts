import { describe, expect, it } from "vitest";

import { mapAssessmentToReport } from "@/features/report/adapters/assessment-to-report";
import {
  completeOpenAIAuditPayload,
  limitedOpenAIAuditPayload,
  mockOpenAIAuditSuccess,
  partialOpenAIAuditPayload,
} from "@/lib/audit/openai-audit/fixtures";
import { runAssessment } from "@/lib/audit/orchestration/assessment";

describe("mapAssessmentToReport professional copy", () => {
  it("maps a COMPLETE assessment without technical jargon", async () => {
    const assessment = await runAssessment({
      websiteUrl: "https://example-plumbing.example/",
      assessedAt: "2026-10-21T06:00:00.000Z",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(completeOpenAIAuditPayload()),
    });
    const report = mapAssessmentToReport(assessment);

    expect(report.isDemo).toBe(false);
    expect(report.outcome).toBe("complete");
    expect(report.overallScore).not.toBeNull();
    expect(report.executiveSummary).toBeTruthy();
    expect(report.categories).toHaveLength(5);
    expect(report.actionPlan.length).toBeGreaterThan(0);

    const blob = JSON.stringify(report);
    expect(blob).not.toMatch(/NOT_ASSESSED/);
    expect(blob).not.toMatch(/Unable to verify/i);
    expect(blob).not.toMatch(/Evidence coverage:/i);
    expect(blob).not.toMatch(/Assessed \d+ of \d+ effective points/);
    expect(blob).not.toMatch(/PageSpeed/i);
  });

  it("maps PARTIAL as an overview without /100 score", async () => {
    const assessment = await runAssessment({
      websiteUrl: "https://brochure.example/",
      assessedAt: "2026-10-21T06:00:00.000Z",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(partialOpenAIAuditPayload()),
    });
    const report = mapAssessmentToReport(assessment);

    expect(report.outcome).toBe("partial");
    expect(report.overallScore).toBeNull();
    expect(report.maturityBand).toBeNull();
    expect(report.statusLabel).toMatch(/Overview/i);
  });

  it("maps LIMITED visibility without inventing scores", async () => {
    const assessment = await runAssessment({
      websiteUrl: "https://unreachable.example/",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(limitedOpenAIAuditPayload()),
    });
    const report = mapAssessmentToReport(assessment);

    expect(report.outcome).toBe("limited");
    expect(report.overallScore).toBeNull();
    expect(report.categories).toHaveLength(0);
    expect(report.unableToVerify.length).toBeLessThanOrEqual(1);
  });
});
