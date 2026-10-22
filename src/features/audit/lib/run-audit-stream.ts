import "server-only";

import {
  isReportableAssessmentStatus,
  sealAssessmentHandoff,
} from "@/features/audit/lib/assessment-handoff";
import { mapAssessmentProgressToUi } from "@/features/audit/lib/map-assessment-progress";
import type { AuditStreamEvent } from "@/features/audit/types/audit-run.types";
import { runAssessment } from "@/lib/audit/orchestration/assessment";
import type { AssessmentRequest } from "@/lib/audit/orchestration/assessment.types";

export type RunAuditStreamOptions = {
  websiteUrl: string;
  businessName?: string | null;
  businessModelHint?: AssessmentRequest["businessModelHint"];
  allowMissingWebsite?: boolean;
  signal?: AbortSignal;
  /** Test injectable forwarded to runAssessment. */
  openaiAuditFn?: AssessmentRequest["openaiAuditFn"];
  timeoutMs?: number;
  onEvent: (event: AuditStreamEvent) => void;
};

/**
 * Runs assessment and emits typed stream events (progress + terminal).
 * Used by the SSE route; unit-testable without HTTP.
 */
export async function runAuditStream(
  options: RunAuditStreamOptions,
): Promise<void> {
  const { onEvent, signal } = options;

  try {
    const assessment = await runAssessment({
      websiteUrl: options.websiteUrl,
      businessName: options.businessName ?? null,
      businessModelHint: options.businessModelHint,
      allowMissingWebsite: options.allowMissingWebsite,
      signal,
      openaiAuditFn: options.openaiAuditFn,
      timeoutMs: options.timeoutMs,
      onProgress: (progress) => {
        if (signal?.aborted) return;
        const mapped = mapAssessmentProgressToUi(progress);
        onEvent({
          type: "progress",
          stageId: mapped.stageId,
          stageStatus: mapped.stageStatus,
          message: mapped.message,
          at: progress.at,
        });
      },
    });

    if (signal?.aborted) {
      onEvent({
        type: "error",
        code: "aborted",
        message: "Assessment cancelled because the connection closed.",
        retryable: true,
        at: new Date().toISOString(),
      });
      return;
    }

    if (!isReportableAssessmentStatus(assessment.status)) {
      onEvent({
        type: "error",
        code: "assessment_failed",
        message: "Assessment could not produce a reportable result.",
        retryable: true,
        at: new Date().toISOString(),
      });
      return;
    }

    onEvent({
      type: "complete",
      status: assessment.status,
      sealedHandoff: sealAssessmentHandoff(assessment),
      at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assessment failed.";
    const aborted = Boolean(signal?.aborted) || /abort/i.test(message);
    const timedOut = /timed out/i.test(message);
    onEvent({
      type: "error",
      code: aborted ? "aborted" : timedOut ? "timeout" : "assessment_failed",
      message: aborted
        ? "Assessment cancelled."
        : timedOut
          ? "Assessment timed out. Please retry."
          : "Assessment failed. Please retry.",
      retryable: true,
      at: new Date().toISOString(),
    });
  }
}
