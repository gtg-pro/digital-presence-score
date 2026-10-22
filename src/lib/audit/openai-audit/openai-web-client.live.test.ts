import { describe, expect, it } from "vitest";

import { requestOpenAIWebAudit } from "@/lib/audit/openai-audit/openai-web-client";

const live = process.env.RUN_LIVE_OPENAI === "1";

describe.runIf(live)("live OpenAI web audit", () => {
  it(
    "retrieves public website info and returns a structured audit",
    async () => {
      const result = await requestOpenAIWebAudit({
        websiteUrl: "https://stripe.com",
        timeoutMs: 150_000,
      });

      if (!result.ok) {
        expect.fail(`${result.code}: ${result.message}`);
      }

      expect(result.webSearchUsed).toBe(true);
      expect(result.payload.retrievalSucceeded).toBe(true);
      expect(result.payload.assessmentStatus).not.toBe("LIMITED_VISIBILITY");
      expect(result.payload.categories).toHaveLength(5);
      expect(result.payload.executiveSummary.length).toBeGreaterThan(40);
    },
    180_000,
  );
});
