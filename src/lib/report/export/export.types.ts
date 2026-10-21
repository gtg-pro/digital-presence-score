import type { DigitalPresenceReport } from "@/features/report/types/report.types";

export type ReportExportFormat = "pdf" | "png";

export type ReportExportErrorCode =
  | "invalid_id"
  | "missing_report"
  | "expired_session"
  | "invalid_report"
  | "demo_forbidden_as_live"
  | "timeout"
  | "render_failure"
  | "unsupported_size"
  | "browser_failure";

export type ReportExportError = {
  ok: false;
  code: ReportExportErrorCode;
  message: string;
  httpStatus: number;
};

export type ReportExportSuccess = {
  ok: true;
  format: ReportExportFormat;
  bytes: Buffer;
  filename: string;
  contentType: "application/pdf" | "image/png";
  reportId: string;
  isDemo: boolean;
};

export type ReportExportResult = ReportExportSuccess | ReportExportError;

export type ReportExportOptions = {
  format: ReportExportFormat;
  report: DigitalPresenceReport;
  /** Wall-clock timeout for Playwright render (default 30s). */
  timeoutMs?: number;
  /** Test-only: inject HTML instead of rendering (must still be trusted builder output). */
  htmlOverride?: string;
};

export const EXPORT_PAGE_WIDTH_PX = 900;
/** Chromium screenshot practical ceiling — refuse rather than truncate. */
export const EXPORT_MAX_PNG_HEIGHT_PX = 16_000;
export const EXPORT_DEFAULT_TIMEOUT_MS = 30_000;
