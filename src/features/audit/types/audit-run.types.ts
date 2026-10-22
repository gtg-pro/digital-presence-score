import type { AuditProgressStageId } from "@/features/audit/types/audit-progress.types";
import type { AuditOutcomeStatus } from "@/lib/audit/scoring/scoring.types";

/** Client → server body for starting a streamed audit (also sealed in pending cookie). */
export type AuditRunRequestBody = {
  websiteUrl: string;
  businessName?: string;
  entryMode: "url" | "minimal";
  businessModelHint?: "remote_online" | "local_service" | "unknown";
  industry?: string;
  primaryServiceArea?: string;
  remoteOnly?: boolean;
};

export type AuditStreamProgressEvent = {
  type: "progress";
  stageId: AuditProgressStageId;
  stageStatus: "pending" | "in_progress" | "completed" | "not_assessed" | "failed";
  message: string;
  at: string;
};

export type AuditStreamCompleteEvent = {
  type: "complete";
  status: AuditOutcomeStatus;
  /** Encrypted AssessmentResult for same-origin finalize (not a public report). */
  sealedHandoff: string;
  at: string;
};

export type AuditStreamErrorEvent = {
  type: "error";
  code:
    | "invalid_input"
    | "unsafe_url"
    | "rate_limited"
    | "busy"
    | "duplicate"
    | "assessment_failed"
    | "aborted"
    | "timeout"
    | "handoff_failed"
    | "captcha_failed";
  message: string;
  retryable: boolean;
  at: string;
};

export type AuditStreamEvent =
  | AuditStreamProgressEvent
  | AuditStreamCompleteEvent
  | AuditStreamErrorEvent;

export type PendingAuditCookiePayload = AuditRunRequestBody & {
  createdAt: number;
  nonce: string;
  /** Set only after successful server-side reCAPTCHA verification. */
  captchaVerified: true;
};
