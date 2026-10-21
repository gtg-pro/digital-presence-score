import { validateReportResult } from "@/lib/audit/validation/report-result-validator";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";
import type { ReportExportError } from "@/lib/report/export/export.types";

const LIVE_ID_RE = /^live-[A-Za-z0-9_-]{8,128}$/;
const DEMO_ID_RE = /^(demo|demo-complete|demo-partial|demo-limited)$/;

export function isValidReportExportId(id: string): boolean {
  if (!id || id.length > 160) return false;
  if (id.includes("..") || id.includes("/") || id.includes("\\")) return false;
  return LIVE_ID_RE.test(id) || DEMO_ID_RE.test(id);
}

export function isLiveExportId(id: string): boolean {
  return id.startsWith("live-");
}

/**
 * Safe downloadable filename from report metadata.
 * Never includes path separators or control characters.
 */
export function buildExportFilename(
  report: DigitalPresenceReport,
  format: "pdf" | "png",
): string {
  const base = (report.businessName || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "report";
  const outcome = report.outcome;
  const demo = report.isDemo ? "-demo" : "";
  const idShort = report.reportId.replace(/[^a-zA-Z0-9_-]/g, "").slice(-12);
  return `digital-presence-${base}-${outcome}${demo}-${idShort}.${format}`;
}

export function validateReportForExport(
  report: DigitalPresenceReport,
  options: { expectLive: boolean },
): ReportExportError | null {
  if (options.expectLive && report.isDemo) {
    return {
      ok: false,
      code: "demo_forbidden_as_live",
      message: "Live report requests cannot use demo fixtures.",
      httpStatus: 404,
    };
  }

  const validation = validateReportResult(report, {
    expectLive: options.expectLive,
    sourceOverallScore: report.overallScore,
  });

  // Demo reports intentionally fail expectLive policy checks — validate lightly.
  if (options.expectLive && !validation.ok) {
    return {
      ok: false,
      code: "invalid_report",
      message: "Report data failed validation and cannot be exported.",
      httpStatus: 422,
    };
  }

  if (!options.expectLive) {
    // Still require structural integrity for demos
    if (report.outcome === "complete" && report.overallScore === null) {
      return {
        ok: false,
        code: "invalid_report",
        message: "Complete demo report is missing an overall score.",
        httpStatus: 422,
      };
    }
    if (report.outcome !== "complete" && report.overallScore !== null) {
      return {
        ok: false,
        code: "invalid_report",
        message: "Incomplete report must not include an overall score.",
        httpStatus: 422,
      };
    }
  }

  return null;
}

/** Escape text for safe HTML text nodes / attributes. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
