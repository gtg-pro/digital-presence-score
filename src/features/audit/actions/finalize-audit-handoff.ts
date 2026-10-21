"use server";

import { unsealAssessmentHandoff } from "@/features/audit/lib/assessment-handoff";
import { consumeHandoffToken } from "@/features/audit/lib/handoff-consumption";
import { clearPendingAudit } from "@/features/audit/lib/pending-audit-session";
import { stashAssessmentResultForReport } from "@/features/report/actions/stash-live-report";

export type FinalizeAuditHandoffResult =
  | { ok: true; reportId: string; href: string }
  | {
      ok: false;
      message: string;
      code?: "expired" | "invalid" | "too_large" | "failed" | "replayed";
    };

/**
 * Same-origin handoff: decrypt sealed assessment, stash encrypted report cookies, return live href.
 * Must run as a Server Action so Set-Cookie is applied before navigation.
 */
export async function finalizeAuditHandoff(
  sealedHandoff: string,
): Promise<FinalizeAuditHandoffResult> {
  if (!sealedHandoff || typeof sealedHandoff !== "string") {
    return { ok: false, code: "invalid", message: "Missing audit handoff." };
  }

  if (sealedHandoff.length > 400_000) {
    return {
      ok: false,
      code: "invalid",
      message: "Audit handoff token is too large.",
    };
  }

  const opened = unsealAssessmentHandoff(sealedHandoff);
  if (!opened.ok) {
    const expired = /expired/i.test(opened.message);
    return {
      ok: false,
      code: expired ? "expired" : "invalid",
      message: opened.message,
    };
  }

  if (!consumeHandoffToken(sealedHandoff)) {
    return {
      ok: false,
      code: "replayed",
      message: "This audit handoff was already used. Start a new assessment.",
    };
  }

  const stashed = await stashAssessmentResultForReport(opened.assessment);
  await clearPendingAudit();

  if (!stashed.ok) {
    const tooLarge = /exceeds ephemeral cookie|payload/i.test(stashed.message);
    return {
      ok: false,
      code: tooLarge ? "too_large" : "failed",
      message: stashed.message,
    };
  }

  if (!stashed.reportId.startsWith("live-")) {
    return {
      ok: false,
      code: "failed",
      message: "Refusing to navigate to a non-live report id.",
    };
  }

  return {
    ok: true,
    reportId: stashed.reportId,
    href: stashed.href,
  };
}
