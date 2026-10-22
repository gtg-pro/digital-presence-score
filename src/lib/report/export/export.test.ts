import { describe, expect, it } from "vitest";

import { mapAssessmentToReport } from "@/features/report/adapters/assessment-to-report";
import {
  completeOpenAIAuditPayload,
  limitedOpenAIAuditPayload,
  mockOpenAIAuditSuccess,
  partialOpenAIAuditPayload,
} from "@/lib/audit/openai-audit/fixtures";
import { runAssessment } from "@/lib/audit/orchestration/assessment";
import { renderReportExportHtml } from "@/lib/report/export/report-renderer";

describe("report export HTML", () => {
  it("renders the same professional snapshot for COMPLETE reports", async () => {
    const assessment = await runAssessment({
      websiteUrl: "https://example-plumbing.example/",
      assessedAt: "2026-10-21T06:00:00.000Z",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(completeOpenAIAuditPayload()),
    });
    const report = mapAssessmentToReport(assessment);
    const html = renderReportExportHtml(report);

    expect(html).toContain("Overall digital presence score");
    expect(html).toContain(String(report.overallScore));
    expect(html).toContain("Key strengths");
    expect(html).toContain("Suggested next steps");
    expect(html).not.toMatch(/Unable to verify/i);
    expect(html).not.toMatch(/Evidence coverage:/i);
    expect(html).not.toMatch(/NOT_ASSESSED/);
    expect(html).not.toMatch(/PageSpeed/i);
  });

  it("renders overview copy for PARTIAL reports", async () => {
    const assessment = await runAssessment({
      websiteUrl: "https://brochure.example/",
      assessedAt: "2026-10-21T06:00:00.000Z",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(partialOpenAIAuditPayload()),
    });
    const html = renderReportExportHtml(mapAssessmentToReport(assessment));
    expect(html).toContain("Digital Presence Overview");
    expect(html).not.toMatch(/\/100/);
  });

  it("renders limited overview without inventing scores", async () => {
    const assessment = await runAssessment({
      websiteUrl: "https://unreachable.example/",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(limitedOpenAIAuditPayload()),
    });
    const html = renderReportExportHtml(mapAssessmentToReport(assessment));
    expect(html).toContain("Limited Digital Presence Overview");
    expect(html).not.toMatch(/Overall digital presence score/);
  });
});
