"use server";

import { mapAssessmentToReport } from "@/features/report/adapters/assessment-to-report";
import { stashLiveReport } from "@/features/report/session/ephemeral-report-session";
import type { AssessmentResult } from "@/lib/audit/orchestration/assessment.types";
import { validateReportResult } from "@/lib/audit/validation/report-result-validator";

/**
 * Map an AssessmentResult and stash it in a short-lived encrypted cookie session.
 * Intended for Prompt 21 audit-form wiring. Does not persist to a database.
 */
export async function stashAssessmentResultForReport(
  assessment: AssessmentResult,
): Promise<
  | { ok: true; reportId: string; href: string }
  | { ok: false; message: string }
> {
  const mapped = mapAssessmentToReport(assessment);
  const liveId = mapped.id.startsWith("live-")
    ? mapped.id
    : `live-${mapped.id}`;
  const liveReport = {
    ...mapped,
    id: liveId,
    reportId: liveId,
    isDemo: false,
  };

  const validation = validateReportResult(liveReport, {
    expectLive: true,
    sourceOverallScore: assessment.overallScore,
  });
  if (!validation.ok) {
    return {
      ok: false,
      message: validation.issues.map((issue) => issue.message).join("; "),
    };
  }

  const stashed = await stashLiveReport(liveReport);
  if (!stashed.ok) {
    return { ok: false, message: stashed.message };
  }

  return {
    ok: true,
    reportId: stashed.reportId,
    href: `/report/${stashed.reportId}`,
  };
}
