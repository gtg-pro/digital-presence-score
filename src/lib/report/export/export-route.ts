import "server-only";

import type { DigitalPresenceReport } from "@/features/report/types/report.types";
import {
  isValidReportExportId,
  validateReportForExport,
} from "@/lib/report/export/export-validation";
import { exportReport, exportReportById } from "@/lib/report/export/report-export";
import type { ReportExportResult } from "@/lib/report/export/export.types";

const MAX_EXPORT_BODY_BYTES = 1_500_000;

function reportMatchesExportId(
  report: DigitalPresenceReport,
  id: string,
): boolean {
  return (
    report.id === id ||
    report.reportId === id ||
    `live-${report.id.replace(/^live-/, "")}` === id
  );
}

export function exportResultToResponse(result: ReportExportResult): Response {
  if (!result.ok) {
    return Response.json(
      { error: result.code, message: result.message },
      {
        status: result.httpStatus,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }

  return new Response(new Uint8Array(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Report-Demo": result.isDemo ? "1" : "0",
    },
  });
}

/**
 * Cookie/session-based export (demo fixtures + live cookie stash).
 */
export async function handleExportGet(
  id: string,
  format: "pdf" | "png",
): Promise<Response> {
  return exportResultToResponse(await exportReportById(id, format));
}

/**
 * Export using the report payload already loaded on the report page.
 * Avoids depending on the short-lived cookie still being present.
 */
export async function handleExportPost(
  request: Request,
  id: string,
  format: "pdf" | "png",
): Promise<Response> {
  if (!isValidReportExportId(id)) {
    return exportResultToResponse({
      ok: false,
      code: "invalid_id",
      message: "Invalid report identifier.",
      httpStatus: 400,
    });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_EXPORT_BODY_BYTES) {
    return exportResultToResponse({
      ok: false,
      code: "invalid_report",
      message: "Export payload is too large.",
      httpStatus: 413,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return exportResultToResponse({
      ok: false,
      code: "invalid_report",
      message: "Export request body must be JSON.",
      httpStatus: 400,
    });
  }

  const report =
    body &&
    typeof body === "object" &&
    "report" in body &&
    body.report &&
    typeof body.report === "object"
      ? (body.report as DigitalPresenceReport)
      : null;

  if (!report) {
    return exportResultToResponse({
      ok: false,
      code: "invalid_report",
      message: "Export request must include a report payload.",
      httpStatus: 400,
    });
  }

  if (!reportMatchesExportId(report, id)) {
    return exportResultToResponse({
      ok: false,
      code: "invalid_id",
      message: "Report identifier does not match export payload.",
      httpStatus: 400,
    });
  }

  const expectLive = !report.isDemo;
  const invalid = validateReportForExport(report, { expectLive });
  if (invalid) return exportResultToResponse(invalid);

  return exportResultToResponse(
    await exportReport({
      format,
      report,
    }),
  );
}
