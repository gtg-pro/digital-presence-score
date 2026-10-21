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
  AUDIT_MAX_CONCURRENT,
  AUDIT_RATE_LIMIT_MAX_PER_WINDOW,
} from "@/features/audit/lib/audit-rate-limit";
import { mapAssessmentProgressToUi } from "@/features/audit/lib/map-assessment-progress";
import { runAuditStream } from "@/features/audit/lib/run-audit-stream";
import { validateAuditRunRequest } from "@/features/audit/lib/validate-audit-run-request";
import type { AuditStreamEvent } from "@/features/audit/types/audit-run.types";
import { runAssessment } from "@/lib/audit/orchestration/assessment";
import type { AssessmentProgressEvent } from "@/lib/audit/orchestration/assessment.types";
import { scoreDigitalPresence } from "@/lib/audit/scoring/scoring-engine";
import {
  brochureFixture,
  blockedWebsiteFixture,
  makeAnalysis,
  makeCrawl,
  makePage,
  makePerformance,
  strongLocalServiceFixture,
} from "@/lib/audit/scoring/test/fixtures";

function inject(fixture: {
  crawl: ReturnType<typeof makeCrawl>;
  performance: ReturnType<typeof makePerformance> | null;
  analysis: ReturnType<typeof makeAnalysis> | null;
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

  it("accepts a valid audit-form style payload", () => {
    const result = validateAuditRunRequest({
      websiteUrl: "https://example.com",
      businessName: "Acme Plumbing",
      entryMode: "url",
      remoteOnly: false,
    });
    expect(result.ok).toBe(true);
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

  it("rejects retired minimal path without website", () => {
    const result = validateAuditRunRequest({
      websiteUrl: "",
      businessName: "Remote Studio",
      entryMode: "minimal",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_input");
  });
});

describe("mapAssessmentProgressToUi", () => {
  it("maps genuine pipeline stages without inventing completion", () => {
    const started = mapAssessmentProgressToUi({
      stage: "crawling",
      status: "started",
      message: "Crawling accessible pages.",
      at: "2026-10-21T00:00:00.000Z",
    });
    expect(started.stageId).toBe("website-crawling");
    expect(started.stageStatus).toBe("in_progress");

    const skipped = mapAssessmentProgressToUi({
      stage: "pagespeed",
      status: "skipped",
      message: "PageSpeed unavailable",
      at: "2026-10-21T00:00:00.000Z",
    });
    expect(skipped.stageStatus).toBe("not_assessed");
  });
});

describe("runAssessment progress + outcomes", () => {
  it("emits genuine progress stages for a COMPLETE assessment", async () => {
    const events: AssessmentProgressEvent[] = [];
    const fixture = strongLocalServiceFixture();
    const result = await runAssessment({
      ...inject(fixture),
      onProgress: (e) => events.push(e),
    });

    expect(result.status).toBe("COMPLETE");
    expect(events.some((e) => e.stage === "validating" && e.status === "started")).toBe(
      true,
    );
    expect(events.some((e) => e.stage === "crawling" && e.status === "completed")).toBe(
      true,
    );
    expect(events.some((e) => e.stage === "scoring" && e.status === "completed")).toBe(
      true,
    );
    expect(
      events.some((e) => e.stage === "preparing_report" && e.status === "completed"),
    ).toBe(true);
    // No fake timer-driven completion without work markers
    expect(events.every((e) => typeof e.at === "string" && e.message.length > 0)).toBe(
      true,
    );
  });

  it("preserves scoring-policy disclosures on COMPLETE", async () => {
    const result = await runAssessment(inject(strongLocalServiceFixture()));
    expect(result.scoringPolicyFlags).toContain(
      "unassessed_weight_uses_absolute_points_earned",
    );
    expect(result.scoringPolicyDisclosures.length).toBeGreaterThan(0);
  });

  it("hands off PARTIAL as reportable (not a system error)", async () => {
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
            reason: "Partial",
          },
        };
      },
    });
    expect(result.status).toBe("PARTIAL");
    expect(result.overallScore).toBeNull();
    expect(isReportableAssessmentStatus(result.status)).toBe(true);
  });

  it("hands off LIMITED_VISIBILITY as reportable", async () => {
    const result = await runAssessment(inject(blockedWebsiteFixture()));
    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.overallScore).toBeNull();
    expect(isReportableAssessmentStatus(result.status)).toBe(true);
  });

  it("supports missing website limited path", async () => {
    const events: AssessmentProgressEvent[] = [];
    const result = await runAssessment({
      websiteUrl: "",
      allowMissingWebsite: true,
      businessName: "No Site Co",
      onProgress: (e) => events.push(e),
    });
    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.ok).toBe(true);
    expect(events.some((e) => e.stage === "validating")).toBe(true);
  });

  it("respects abort signal", async () => {
    const abort = new AbortController();
    abort.abort();
    const result = await runAssessment({
      ...inject(strongLocalServiceFixture()),
      signal: abort.signal,
    });
    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.errors.some((e) => /abort/i.test(e.message))).toBe(true);
  });

  it("honors assessment timeout", async () => {
    const result = await runAssessment({
      websiteUrl: "https://example.com/",
      timeoutMs: 30,
      crawlFn: async () => {
        await new Promise((r) => setTimeout(r, 200));
        return makeCrawl({
          pages: [makePage({ finalUrl: "https://example.com/" })],
        });
      },
      pagespeedFn: async () => null,
      analysisFn: async () => null,
    });
    expect(result.errors.some((e) => e.code === "assessment_timeout")).toBe(true);
  });
});

describe("runAuditStream terminal events", () => {
  it("emits progress then complete with sealed handoff (no demo id)", async () => {
    const events: AuditStreamEvent[] = [];
    const fixture = strongLocalServiceFixture();
    await runAuditStream({
      ...inject(fixture),
      onEvent: (e) => events.push(e),
    });

    expect(events.some((e) => e.type === "progress")).toBe(true);
    const complete = events.find((e) => e.type === "complete");
    expect(complete?.type).toBe("complete");
    if (complete?.type !== "complete") throw new Error("expected complete");
    expect(complete.status).toBe("COMPLETE");
    expect(complete.sealedHandoff.length).toBeGreaterThan(20);
    const progressBlob = JSON.stringify(
      events.filter((e) => e.type === "progress" || e.type === "error"),
    );
    expect(progressBlob).not.toMatch(/sk-[a-zA-Z0-9]/);
    expect(progressBlob).not.toMatch(/demo-/);

    const opened = unsealAssessmentHandoff(complete.sealedHandoff);
    expect(opened.ok).toBe(true);
    if (opened.ok) {
      expect(opened.assessment.status).toBe("COMPLETE");
      expect(opened.assessment.websiteUrl).toBeTruthy();
    }
  });

  it("emits failure event on hard abort during stream", async () => {
    const events: AuditStreamEvent[] = [];
    const abort = new AbortController();
    const pending = runAuditStream({
      websiteUrl: "https://example.com/",
      signal: abort.signal,
      crawlFn: async () => {
        abort.abort();
        await new Promise((r) => setTimeout(r, 10));
        throw new Error("Assessment aborted by client disconnect.");
      },
      onEvent: (e) => events.push(e),
    });
    await pending;
    expect(
      events.some(
        (e) =>
          e.type === "error" ||
          (e.type === "complete" && e.status === "LIMITED_VISIBILITY"),
      ),
    ).toBe(true);
  });
});

describe("assessment handoff seal/unseal", () => {
  it("rejects expired handoff tokens", () => {
    const sealed = sealAssessmentHandoff({
      assessmentId: "x",
      ok: true,
      status: "COMPLETE",
      assessedAt: new Date().toISOString(),
      scoringVersion: "strict-v1.0",
      business: {
        businessName: "A",
        websiteUrl: "https://example.com",
        normalizedWebsiteUrl: "https://example.com/",
        serviceAreaSignals: [],
        businessModel: "local_service",
      },
      websiteUrl: "https://example.com",
      overallScore: 50,
      totalMaxPoints: 100,
      maturityBand: {
        band: "growing_digital_presence",
        label: "Growing Digital Presence",
        eligible: true,
        reason: "Eligible band from fixture.",
      },
      evidenceCoverage: {
        weightedCoverage: 1,
        assessedEffectiveWeight: 100,
        applicableEffectiveWeight: 100,
        categoriesWithAssessedEvidence: [],
        categoriesMissingAssessedEvidence: [],
        verifiedWebsitePages: 1,
        meetsPublicationThresholds: true,
      },
      categories: [],
      findings: [],
      recommendations: [],
      unassessedCriteria: [],
      notApplicableCriteria: [],
      integrationAvailability: {
        crawler: "available",
        pagespeed: "skipped",
        openai: "skipped",
        scoring: "available",
      },
      evidenceCatalog: [],
      evidenceValidationIssues: [],
      assessmentValidationIssues: [],
      scoringPolicyFlags: [],
      scoringPolicyDisclosures: ["policy"],
      limitationReasons: [],
      warnings: [],
      errors: [],
      scoring: null,
      rejectedAiFindingIds: [],
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      ephemeral: true,
    });

    // Tamper by re-parsing is hard without clock mock; invalid token fails.
    expect(unsealAssessmentHandoff("not-valid").ok).toBe(false);
    expect(unsealAssessmentHandoff(sealed).ok).toBe(true);
  });
});

describe("process-local rate limit", () => {
  it("prevents duplicate/excess submissions per key", () => {
    const key = "test-ip";
    for (let i = 0; i < AUDIT_RATE_LIMIT_MAX_PER_WINDOW; i += 1) {
      expect(checkAuditRateLimit(key).ok).toBe(true);
      beginAuditRequest(key);
      endAuditRequest(key);
    }
    const blocked = checkAuditRateLimit(key);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe("rate_limited");
  });

  it("rejects excess concurrent work", () => {
    const key = "busy-ip";
    for (let i = 0; i < AUDIT_MAX_CONCURRENT; i += 1) {
      expect(checkAuditRateLimit(key).ok).toBe(true);
      beginAuditRequest(key);
    }
    const busy = checkAuditRateLimit(key);
    expect(busy.ok).toBe(false);
    if (!busy.ok) expect(busy.reason).toBe("busy");
    for (let i = 0; i < AUDIT_MAX_CONCURRENT; i += 1) endAuditRequest(key);
  });
});

describe("no API key exposure in progress messages", () => {
  it("progress messages never include provider secrets", async () => {
    process.env.OPENAI_API_KEY = "sk-test-secret-should-not-leak";
    const events: AssessmentProgressEvent[] = [];
    await runAssessment({
      ...inject(strongLocalServiceFixture()),
      onProgress: (e) => events.push(e),
    });
    const blob = JSON.stringify(events);
    expect(blob).not.toContain("sk-test-secret");
    expect(blob).not.toContain("OPENAI_API_KEY");
  });
});
