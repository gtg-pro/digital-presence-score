import "server-only";

import { chromium, type Browser } from "playwright";

import { getReportDemoById } from "@/features/report/data/report.mock";
import {
  isLiveReportId,
  loadLiveReport,
} from "@/features/report/session/ephemeral-report-session";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";
import {
  buildExportFilename,
  isLiveExportId,
  isValidReportExportId,
  validateReportForExport,
} from "@/lib/report/export/export-validation";
import { renderReportExportHtml } from "@/lib/report/export/report-renderer";
import type {
  ReportExportError,
  ReportExportOptions,
  ReportExportResult,
} from "@/lib/report/export/export.types";
import {
  EXPORT_DEFAULT_TIMEOUT_MS,
  EXPORT_MAX_PNG_HEIGHT_PX,
  EXPORT_PAGE_WIDTH_PX,
} from "@/lib/report/export/export.types";

/**
 * Resolve a report for export without falling back from live → demo.
 * Live IDs only load from the encrypted session. Demo IDs only load fixtures.
 */
export async function resolveReportForExport(
  id: string,
): Promise<
  | { ok: true; report: DigitalPresenceReport; source: "live" | "demo" }
  | ReportExportError
> {
  if (!isValidReportExportId(id)) {
    return {
      ok: false,
      code: "invalid_id",
      message: "Invalid report identifier.",
      httpStatus: 400,
    };
  }

  if (isLiveExportId(id) || isLiveReportId(id)) {
    const live = await loadLiveReport(id);
    if (!live) {
      return {
        ok: false,
        code: "expired_session",
        message:
          "Live report session is missing or expired. Re-run the assessment to export again.",
        httpStatus: 404,
      };
    }
    const invalid = validateReportForExport(live, { expectLive: true });
    if (invalid) return invalid;
    return { ok: true, report: live, source: "live" };
  }

  const demo = getReportDemoById(id);
  if (!demo) {
    return {
      ok: false,
      code: "missing_report",
      message: "Report not found.",
      httpStatus: 404,
    };
  }
  const invalid = validateReportForExport(demo, { expectLive: false });
  if (invalid) return invalid;
  return { ok: true, report: demo, source: "demo" };
}

async function withBrowser<T>(
  timeoutMs: number,
  run: (browser: Browser) => Promise<T>,
): Promise<T> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
      timeout: timeoutMs,
    });
    return await run(browser);
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

/**
 * Render a validated DigitalPresenceReport to PDF or PNG via Playwright.
 * Uses page.setContent only — never navigates to arbitrary URLs.
 */
export async function exportReport(
  options: ReportExportOptions,
): Promise<ReportExportResult> {
  const timeoutMs = options.timeoutMs ?? EXPORT_DEFAULT_TIMEOUT_MS;
  const expectLive = !options.report.isDemo;
  const invalid = validateReportForExport(options.report, { expectLive });
  if (invalid) return invalid;

  const html =
    options.htmlOverride ?? renderReportExportHtml(options.report);
  const filename = buildExportFilename(options.report, options.format);

  try {
    return await withBrowser(timeoutMs, async (browser) => {
      const page = await browser.newPage({
        viewport: { width: EXPORT_PAGE_WIDTH_PX, height: 1200 },
        javaScriptEnabled: false,
      });

      try {
        page.setDefaultTimeout(timeoutMs);

        // Block any unexpected network requests (defense in depth).
        await page.route("**/*", async (route) => {
          const url = route.request().url();
          if (
            url.startsWith("data:") ||
            url === "about:blank" ||
            url.startsWith("blob:")
          ) {
            await route.continue();
            return;
          }
          await route.abort();
        });

        await page.setContent(html, {
          waitUntil: "domcontentloaded",
          timeout: timeoutMs,
        });

        if (options.format === "pdf") {
          const bytes = Buffer.from(
            await page.pdf({
              format: "A4",
              printBackground: true,
              preferCSSPageSize: true,
              margin: {
                top: "14mm",
                right: "12mm",
                bottom: "14mm",
                left: "12mm",
              },
            }),
          );

          if (!bytes.subarray(0, 4).equals(Buffer.from("%PDF"))) {
            return {
              ok: false,
              code: "render_failure",
              message: "PDF render produced an invalid file.",
              httpStatus: 500,
            };
          }

          return {
            ok: true,
            format: "pdf",
            bytes,
            filename,
            contentType: "application/pdf",
            reportId: options.report.reportId,
            isDemo: options.report.isDemo,
          };
        }

        const metrics = await page.evaluate(() => {
          const body = document.body;
          return {
            width: Math.ceil(
              Math.max(
                body.scrollWidth,
                document.documentElement.scrollWidth,
              ),
            ),
            height: Math.ceil(
              Math.max(
                body.scrollHeight,
                document.documentElement.scrollHeight,
              ),
            ),
          };
        });

        if (metrics.height > EXPORT_MAX_PNG_HEIGHT_PX) {
          return {
            ok: false,
            code: "unsupported_size",
            message:
              "Report exceeds the maximum supported PNG height. Try PDF export instead.",
            httpStatus: 413,
          };
        }

        await page.setViewportSize({
          width: EXPORT_PAGE_WIDTH_PX,
          height: Math.min(Math.max(metrics.height, 600), EXPORT_MAX_PNG_HEIGHT_PX),
        });

        const bytes = Buffer.from(
          await page.screenshot({
            type: "png",
            fullPage: true,
            animations: "disabled",
            timeout: timeoutMs,
          }),
        );

        // PNG signature: 89 50 4E 47
        if (
          bytes.length < 8 ||
          bytes[0] !== 0x89 ||
          bytes[1] !== 0x50 ||
          bytes[2] !== 0x4e ||
          bytes[3] !== 0x47
        ) {
          return {
            ok: false,
            code: "render_failure",
            message: "PNG render produced an invalid file.",
            httpStatus: 500,
          };
        }

        return {
          ok: true,
          format: "png",
          bytes,
          filename,
          contentType: "image/png",
          reportId: options.report.reportId,
          isDemo: options.report.isDemo,
        };
      } finally {
        await page.close().catch(() => undefined);
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    if (/timeout/i.test(message)) {
      return {
        ok: false,
        code: "timeout",
        message: "Report export timed out.",
        httpStatus: 504,
      };
    }
    return {
      ok: false,
      code: "browser_failure",
      message: "Unable to render report export.",
      httpStatus: 500,
    };
  }
}

export async function exportReportById(
  id: string,
  format: "pdf" | "png",
  timeoutMs?: number,
): Promise<ReportExportResult> {
  const resolved = await resolveReportForExport(id);
  if (!resolved.ok) return resolved;
  return exportReport({
    format,
    report: resolved.report,
    timeoutMs,
  });
}
