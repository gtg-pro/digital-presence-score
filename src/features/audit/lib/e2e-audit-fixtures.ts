import "server-only";

import { scoreDigitalPresence } from "@/lib/audit/scoring/scoring-engine";
import {
  blockedWebsiteFixture,
  brochureFixture,
  strongLocalServiceFixture,
} from "@/lib/audit/scoring/test/fixtures";
import type { AssessmentRequest } from "@/lib/audit/orchestration/assessment.types";

export type E2EAuditFixtureKind = "complete" | "partial" | "limited";

/**
 * Controlled assessment injectables for Playwright E2E only.
 *
 * Enabled exclusively when ALLOW_AUDIT_E2E_FIXTURES=1.
 * Must never be set on real production traffic — mocks crawl/PageSpeed/OpenAI
 * boundaries while keeping form → SSE → scoring → handoff → report real.
 */
export function resolveE2EAuditInjectables(
  overrideKind?: string | null,
):
  | (Pick<
      AssessmentRequest,
      "crawlFn" | "pagespeedFn" | "analysisFn" | "scoringFn" | "assessedAt"
    > & { kind: E2EAuditFixtureKind })
  | null {
  if (process.env.ALLOW_AUDIT_E2E_FIXTURES !== "1") {
    return null;
  }

  const raw = (
    overrideKind ??
    process.env.AUDIT_E2E_FIXTURE ??
    "complete"
  ).toLowerCase();
  const kind: E2EAuditFixtureKind =
    raw === "partial" || raw === "limited" ? raw : "complete";

  const fixture =
    kind === "complete"
      ? strongLocalServiceFixture()
      : kind === "partial"
        ? brochureFixture()
        : blockedWebsiteFixture();

  return {
    kind,
    assessedAt: "2026-10-21T06:00:00.000Z",
    crawlFn: async () => fixture.crawl,
    pagespeedFn: async () => fixture.performance,
    analysisFn: async () => fixture.analysis,
    scoringFn:
      kind === "partial"
        ? (input) => {
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
                reason: "E2E partial fixture",
              },
            };
          }
        : undefined,
  };
}
