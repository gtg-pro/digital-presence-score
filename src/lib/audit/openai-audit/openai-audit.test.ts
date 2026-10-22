import { describe, expect, it } from "vitest";

import {
  openAIWebAuditZodSchema,
  validateOpenAIWebAuditPayload,
} from "@/lib/audit/openai-audit/audit-schema";
import {
  completeOpenAIAuditPayload,
  limitedOpenAIAuditPayload,
  partialOpenAIAuditPayload,
} from "@/lib/audit/openai-audit/fixtures";
import { scoreOpenAIWebAudit } from "@/lib/audit/openai-audit/score-openai-audit";

describe("OpenAI web audit schema + scoring", () => {
  it("accepts a complete structured payload", () => {
    const validated = validateOpenAIWebAuditPayload(
      completeOpenAIAuditPayload(),
    );
    expect(validated.success).toBe(true);
  });

  it("rejects malformed payloads", () => {
    const validated = validateOpenAIWebAuditPayload({
      websiteUrl: "https://example.com",
      assessmentStatus: "COMPLETE",
    });
    expect(validated.success).toBe(false);
  });

  it("keeps json schema strict keys aligned with zod", () => {
    expect(openAIWebAuditZodSchema.shape.executiveSummary).toBeTruthy();
    expect(openAIWebAuditZodSchema.shape.categories).toBeTruthy();
  });

  it("does not invent an overall score for incomplete coverage", () => {
    const scored = scoreOpenAIWebAudit(
      partialOpenAIAuditPayload(),
      "2026-10-21T06:00:00.000Z",
    );
    expect(scored.totalScore).toBeNull();
    expect(scored.status).toBe("PARTIAL");
    expect(scored.maturity.eligible).toBe(false);
  });

  it("publishes a score only for complete eligible audits", () => {
    const scored = scoreOpenAIWebAudit(
      completeOpenAIAuditPayload(),
      "2026-10-21T06:00:00.000Z",
    );
    expect(scored.status).toBe("COMPLETE");
    expect(scored.totalScore).not.toBeNull();
    expect(typeof scored.totalScore).toBe("number");
    expect(scored.categories).toHaveLength(5);
  });

  it("forces LIMITED_VISIBILITY when retrievalSucceeded is false", () => {
    const scored = scoreOpenAIWebAudit(
      limitedOpenAIAuditPayload(),
      "2026-10-21T06:00:00.000Z",
    );
    expect(scored.status).toBe("LIMITED_VISIBILITY");
    expect(scored.totalScore).toBeNull();
  });
});
