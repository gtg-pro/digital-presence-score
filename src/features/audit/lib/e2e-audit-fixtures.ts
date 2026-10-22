import "server-only";

import {
  completeOpenAIAuditPayload,
  limitedOpenAIAuditPayload,
  mockOpenAIAuditSuccess,
  partialOpenAIAuditPayload,
} from "@/lib/audit/openai-audit/fixtures";
import type { AssessmentRequest } from "@/lib/audit/orchestration/assessment.types";

export type E2EAuditFixtureKind = "complete" | "partial" | "limited";

/**
 * Controlled OpenAI audit injectables for Playwright E2E only.
 *
 * Enabled exclusively when ALLOW_AUDIT_E2E_FIXTURES=1.
 * Must never be set on real production traffic.
 */
export function resolveE2EAuditInjectables(
  overrideKind?: string | null,
):
  | (Pick<AssessmentRequest, "openaiAuditFn" | "assessedAt"> & {
      kind: E2EAuditFixtureKind;
    })
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

  const payload =
    kind === "complete"
      ? completeOpenAIAuditPayload()
      : kind === "partial"
        ? partialOpenAIAuditPayload()
        : limitedOpenAIAuditPayload();

  return {
    kind,
    assessedAt: "2026-10-21T06:00:00.000Z",
    openaiAuditFn: async () => mockOpenAIAuditSuccess(payload),
  };
}
