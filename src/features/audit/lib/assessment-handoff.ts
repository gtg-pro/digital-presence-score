import "server-only";

import { sealPayload, unsealPayload } from "@/features/audit/lib/audit-crypto";
import type { AssessmentResult } from "@/lib/audit/orchestration/assessment.types";

export const AUDIT_HANDOFF_TTL_MS = 5 * 60 * 1000;

type SealedHandoffEnvelope = {
  exp: number;
  assessment: AssessmentResult;
};

export function sealAssessmentHandoff(assessment: AssessmentResult): string {
  const envelope: SealedHandoffEnvelope = {
    exp: Date.now() + AUDIT_HANDOFF_TTL_MS,
    assessment,
  };
  return sealPayload(JSON.stringify(envelope));
}

export function unsealAssessmentHandoff(
  token: string,
):
  | { ok: true; assessment: AssessmentResult }
  | { ok: false; message: string } {
  try {
    const envelope = JSON.parse(unsealPayload(token)) as SealedHandoffEnvelope;
    if (!envelope?.assessment || typeof envelope.exp !== "number") {
      return { ok: false, message: "Invalid audit handoff token." };
    }
    if (Date.now() > envelope.exp) {
      return {
        ok: false,
        message: "Audit handoff expired. Please run the assessment again.",
      };
    }
    return { ok: true, assessment: envelope.assessment };
  } catch {
    return { ok: false, message: "Unable to open audit handoff token." };
  }
}

/** Outcomes that are legitimate reports (not technical crashes). */
export function isReportableAssessmentStatus(
  status: AssessmentResult["status"],
): boolean {
  return (
    status === "COMPLETE" ||
    status === "PARTIAL" ||
    status === "LIMITED_VISIBILITY"
  );
}
