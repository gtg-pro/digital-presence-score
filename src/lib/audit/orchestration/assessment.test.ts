import { describe, expect, it } from "vitest";

import {
  completeOpenAIAuditPayload,
  limitedOpenAIAuditPayload,
  mockOpenAIAuditFailure,
  mockOpenAIAuditSuccess,
  partialOpenAIAuditPayload,
} from "@/lib/audit/openai-audit/fixtures";
import { runAssessment } from "@/lib/audit/orchestration/assessment";

describe("runAssessment OpenAI-only orchestration", () => {
  it("produces a COMPLETE report from a successful web-audit fixture", async () => {
    const result = await runAssessment({
      websiteUrl: "https://example-plumbing.example/",
      assessedAt: "2026-10-21T06:00:00.000Z",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(completeOpenAIAuditPayload()),
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe("COMPLETE");
    expect(result.overallScore).not.toBeNull();
    expect(result.categories).toHaveLength(5);
    expect(result.executiveSummary).toBeTruthy();
    expect(result.integrationAvailability.pagespeed).toBe("not_requested");
    expect(result.integrationAvailability.crawler).toBe("not_requested");
    expect(result.ephemeral).toBe(true);
  });

  it("rejects unsafe / invalid URLs before calling OpenAI", async () => {
    let called = false;
    const result = await runAssessment({
      websiteUrl: "javascript:alert(1)",
      openaiAuditFn: async () => {
        called = true;
        return mockOpenAIAuditSuccess(completeOpenAIAuditPayload());
      },
    });

    expect(called).toBe(false);
    expect(result.ok).toBe(false);
    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.errors[0]?.code).toBe("invalid_input");
    expect(result.overallScore).toBeNull();
  });

  it("maps PARTIAL audits without inventing an overall /100 score", async () => {
    const result = await runAssessment({
      websiteUrl: "https://brochure.example/",
      assessedAt: "2026-10-21T06:00:00.000Z",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(partialOpenAIAuditPayload()),
    });

    expect(result.status).toBe("PARTIAL");
    expect(result.overallScore).toBeNull();
    expect(result.maturityBand.eligible).toBe(false);
    expect(result.categories.length).toBe(5);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("maps LIMITED_VISIBILITY when retrieval fails", async () => {
    const result = await runAssessment({
      websiteUrl: "https://unreachable.example/",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(limitedOpenAIAuditPayload()),
    });

    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.overallScore).toBeNull();
    expect(result.categories).toHaveLength(5);
  });

  it("handles OpenAI provider failures safely", async () => {
    const result = await runAssessment({
      websiteUrl: "https://example.com/",
      openaiAuditFn: async () =>
        mockOpenAIAuditFailure("rate_limited", "OpenAI rate limit reached."),
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.overallScore).toBeNull();
    expect(result.errors[0]?.code).toBe("openai_failure");
  });

  it("handles timeout failures", async () => {
    const result = await runAssessment({
      websiteUrl: "https://example.com/",
      openaiAuditFn: async () =>
        mockOpenAIAuditFailure("timeout", "OpenAI request timed out."),
    });

    expect(result.errors[0]?.code).toBe("assessment_timeout");
  });

  it("emits OpenAI-only progress stages", async () => {
    const stages: string[] = [];
    await runAssessment({
      websiteUrl: "https://example-plumbing.example/",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(completeOpenAIAuditPayload()),
      onProgress: (event) => {
        stages.push(`${event.stage}:${event.status}`);
      },
    });

    expect(stages.some((s) => s.startsWith("retrieving:"))).toBe(true);
    expect(stages.some((s) => s.startsWith("analyzing:"))).toBe(true);
    expect(stages.some((s) => s.startsWith("scoring:"))).toBe(true);
    expect(stages.some((s) => s.includes("crawling"))).toBe(false);
    expect(stages.some((s) => s.includes("pagespeed"))).toBe(false);
  });

  it("is deterministic for the same OpenAI fixture payload", async () => {
    const request = {
      websiteUrl: "https://example-plumbing.example/",
      assessedAt: "2026-10-21T06:00:00.000Z",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(completeOpenAIAuditPayload()),
    };
    const a = await runAssessment(request);
    const b = await runAssessment(request);
    expect(a.overallScore).toBe(b.overallScore);
    expect(a.status).toBe(b.status);
  });
});
