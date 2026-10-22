import { afterEach, describe, expect, it } from "vitest";

import {
  isReportableAssessmentStatus,
  sealAssessmentHandoff,
  unsealAssessmentHandoff,
} from "@/features/audit/lib/assessment-handoff";
import {
  beginAuditRequest,
  checkAuditRateLimit,
  endAuditRequest,
  resetAuditRateLimitForTests,
  AUDIT_RATE_LIMIT_MAX_PER_WINDOW,
} from "@/features/audit/lib/audit-rate-limit";
import { mapAssessmentProgressToUi } from "@/features/audit/lib/map-assessment-progress";
import { runAuditStream } from "@/features/audit/lib/run-audit-stream";
import { validateAuditRunRequest } from "@/features/audit/lib/validate-audit-run-request";
import type { AuditStreamEvent } from "@/features/audit/types/audit-run.types";
import {
  completeOpenAIAuditPayload,
  limitedOpenAIAuditPayload,
  mockOpenAIAuditFailure,
  mockOpenAIAuditSuccess,
  partialOpenAIAuditPayload,
} from "@/lib/audit/openai-audit/fixtures";
import { runAssessment } from "@/lib/audit/orchestration/assessment";
import type { AssessmentProgressEvent } from "@/lib/audit/orchestration/assessment.types";

afterEach(() => {
  resetAuditRateLimitForTests();
});

describe("validateAuditRunRequest", () => {
  it("accepts a valid homepage URL submission", () => {
    const result = validateAuditRunRequest({
      websiteUrl: "example-service.com",
      entryMode: "url",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalizedWebsiteUrl).toMatch(/^https:\/\//);
    }
  });

  it("rejects invalid URLs", () => {
    const result = validateAuditRunRequest({
      websiteUrl: "not a url",
      entryMode: "url",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_input");
  });

  it("rejects unsafe/private URLs", () => {
    const result = validateAuditRunRequest({
      websiteUrl: "http://127.0.0.1/",
      entryMode: "url",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("unsafe_url");
  });
});

describe("mapAssessmentProgressToUi", () => {
  it("maps OpenAI retrieval stages to UI stage ids", () => {
    const started: AssessmentProgressEvent = {
      stage: "retrieving",
      status: "started",
      message: "Retrieving public website information.",
      at: "2026-10-21T06:00:00.000Z",
    };
    const mapped = mapAssessmentProgressToUi(started);
    expect(mapped.stageId).toBe("website-crawling");
    expect(mapped.stageStatus).toBe("in_progress");
  });
});

describe("runAssessment progress + outcomes", () => {
  it("emits retrieving/analyzing/scoring progress for COMPLETE", async () => {
    const events: AssessmentProgressEvent[] = [];
    const result = await runAssessment({
      websiteUrl: "https://example-plumbing.example/",
      assessedAt: "2026-10-21T06:00:00.000Z",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(completeOpenAIAuditPayload()),
      onProgress: (event) => events.push(event),
    });

    expect(result.status).toBe("COMPLETE");
    expect(events.some((e) => e.stage === "retrieving")).toBe(true);
    expect(events.some((e) => e.stage === "analyzing")).toBe(true);
    expect(events.some((e) => e.stage === "scoring")).toBe(true);
    expect(events.some((e) => e.stage === "preparing_report")).toBe(true);
  });

  it("keeps PARTIAL overall score null", async () => {
    const result = await runAssessment({
      websiteUrl: "https://brochure.example/",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(partialOpenAIAuditPayload()),
    });
    expect(result.status).toBe("PARTIAL");
    expect(result.overallScore).toBeNull();
  });

  it("keeps LIMITED_VISIBILITY overall score null", async () => {
    const result = await runAssessment({
      websiteUrl: "https://unreachable.example/",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(limitedOpenAIAuditPayload()),
    });
    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.overallScore).toBeNull();
  });
});

describe("runAuditStream + handoff", () => {
  it("streams progress then sealed complete handoff", async () => {
    const events: AuditStreamEvent[] = [];
    await runAuditStream({
      websiteUrl: "https://example-plumbing.example/",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(completeOpenAIAuditPayload()),
      onEvent: (event) => events.push(event),
    });

    expect(events[0]?.type).toBe("progress");
    const complete = events.find((e) => e.type === "complete");
    expect(complete?.type).toBe("complete");
    if (complete?.type === "complete") {
      expect(isReportableAssessmentStatus(complete.status)).toBe(true);
      const opened = unsealAssessmentHandoff(complete.sealedHandoff);
      expect(opened.ok).toBe(true);
      if (opened.ok) {
        expect(opened.assessment.status).toBe("COMPLETE");
        expect(opened.assessment.overallScore).not.toBeNull();
      }
    }
  });

  it("does not invent COMPLETE on OpenAI failure", async () => {
    const events: AuditStreamEvent[] = [];
    await runAuditStream({
      websiteUrl: "https://example.com/",
      openaiAuditFn: async () =>
        mockOpenAIAuditFailure("provider_error", "OpenAI analysis failed."),
      onEvent: (event) => events.push(event),
    });
    const complete = events.find((e) => e.type === "complete");
    // LIMITED_VISIBILITY is still reportable via handoff path in runAssessment,
    // but stream only completes for reportable statuses — LIMITED is reportable.
    if (complete?.type === "complete") {
      expect(complete.status).not.toBe("COMPLETE");
    }
  });

  it("round-trips sealed assessment handoff", async () => {
    const assessment = await runAssessment({
      websiteUrl: "https://example-plumbing.example/",
      assessedAt: "2026-10-21T06:00:00.000Z",
      openaiAuditFn: async () =>
        mockOpenAIAuditSuccess(completeOpenAIAuditPayload()),
    });
    const sealed = sealAssessmentHandoff(assessment);
    const opened = unsealAssessmentHandoff(sealed);
    expect(opened.ok).toBe(true);
    if (opened.ok) {
      expect(opened.assessment.assessmentId).toBe(assessment.assessmentId);
      expect(opened.assessment.overallScore).toBe(assessment.overallScore);
    }
  });
});

describe("rate limiting", () => {
  it("enforces per-key submission limits", () => {
    const key = "journey-rate-key";
    for (let i = 0; i < AUDIT_RATE_LIMIT_MAX_PER_WINDOW; i += 1) {
      expect(checkAuditRateLimit(key).ok).toBe(true);
      beginAuditRequest(key);
      endAuditRequest(key);
    }
    expect(checkAuditRateLimit(key).ok).toBe(false);
  });
});
