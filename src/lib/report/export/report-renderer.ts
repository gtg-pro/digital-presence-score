import "server-only";

import type { DigitalPresenceReport } from "@/features/report/types/report.types";
import {
  buildPdfDocumentHeader,
  getPoppinsFontFaceCss,
} from "@/lib/report/export/pdf-chrome";
import { escapeHtml } from "@/lib/report/export/export-validation";
import { EXPORT_PAGE_WIDTH_PX } from "@/lib/report/export/export.types";
import {
  PDF_BODY_SIDE_PADDING,
  PDF_CONTINUATION_PAGE_TOP_MARGIN,
  PDF_THEME,
} from "@/lib/report/export/pdf-theme";

function scoreDisplay(score: number): string {
  return String(score);
}

export type ReportExportRenderOptions = {
  /**
   * `pdf` — black/sky-blue themed body for Chromium PDF (first-page header inlined; footer via Playwright).
   * `png` — existing compact document style for PNG screenshots.
   */
  variant?: "pdf" | "png";
};

function renderPdfBody(report: DigitalPresenceReport): string {
  const documentHeader = buildPdfDocumentHeader(report);
  const poppinsFonts = getPoppinsFontFaceCss();
  const demoBanner = report.isDemo
    ? `<p class="banner">Illustrative sample report — not a verified assessment result.</p>`
    : "";

  const summary = report.executiveSummary
    ? `<p class="lead">${escapeHtml(report.executiveSummary)}</p>`
    : "";

  const scoreBlock =
    report.outcome === "complete" && report.overallScore !== null
      ? `<section class="card score-card avoid-break">
          <div class="section-kicker">Overall digital presence score</div>
          <p class="score">${escapeHtml(scoreDisplay(report.overallScore))}<span class="score-max">/${report.maxScore}</span></p>
          ${report.maturityBand ? `<p class="band">${escapeHtml(report.maturityBand)}</p>` : ""}
          ${summary}
        </section>`
      : report.outcome === "partial"
        ? `<section class="card avoid-break">
            <div class="section-kicker">Digital Presence Overview</div>
            <h2>Supported findings overview</h2>
            ${summary || `<p>This overview shares the publicly supported observations available for this website. An overall score out of 100 is not shown when available information is incomplete.</p>`}
          </section>`
        : `<section class="card avoid-break">
            <div class="section-kicker">Digital Presence Overview</div>
            <h2>Limited public information</h2>
            ${summary || `<p>A complete numerical digital presence score could not be published because public website information was insufficient for this run.</p>`}
          </section>`;

  const categoriesHtml =
    report.outcome === "limited" || report.categories.length === 0
      ? ""
      : `<section class="block">
          <h2><span class="accent-bar"></span>Category results</h2>
          ${report.categories
            .map((category) => {
              const earned =
                category.earned === null
                  ? "—"
                  : scoreDisplay(category.earned);
              const pct =
                category.earned === null
                  ? 0
                  : Math.min(
                      100,
                      Math.round((category.earned / category.maxPoints) * 100),
                    );
              return `<article class="card category-card avoid-break">
                <div class="category-top">
                  <h3>${escapeHtml(category.title)}</h3>
                  <p class="mono">${escapeHtml(earned)}/${category.maxPoints}</p>
                </div>
                <div class="meter" aria-hidden="true"><span style="width:${pct}%"></span></div>
                <p>${escapeHtml(category.summary)}</p>
              </article>`;
            })
            .join("")}
        </section>`;

  const strengthsHtml =
    report.outcome === "limited" || report.strengths.length === 0
      ? ""
      : `<section class="block avoid-break">
          <h2><span class="accent-bar"></span>Key strengths</h2>
          <ul class="styled-list">${report.strengths
            .map(
              (item) => `<li class="avoid-break">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.explanation)}</p>
              </li>`,
            )
            .join("")}</ul>
        </section>`;

  const improvementsHtml =
    report.outcome === "limited" || report.improvements.length === 0
      ? ""
      : `<section class="block">
          <h2><span class="accent-bar"></span>Areas for improvement</h2>
          <ul class="styled-list">${report.improvements
            .map(
              (item) => `<li class="avoid-break">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.description)}</p>
                <p class="muted small">${escapeHtml(item.recommendedAction)}</p>
              </li>`,
            )
            .join("")}</ul>
        </section>`;

  const nextStepsHtml =
    report.outcome === "limited" || report.actionPlan.length === 0
      ? ""
      : `<section class="block avoid-break">
          <h2><span class="accent-bar"></span>Suggested next steps</h2>
          <ol class="styled-list numbered">${report.actionPlan
            .map(
              (item) =>
                `<li class="avoid-break"><p>${escapeHtml(item.action)}</p></li>`,
            )
            .join("")}</ol>
        </section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.businessName)} — Digital Presence Report</title>
  <style>
    ${poppinsFonts}
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    /* Page 1 flush to top; later pages get top breathing room. */
    @page {
      size: A4;
      margin-top: ${PDF_CONTINUATION_PAGE_TOP_MARGIN};
      margin-left: 0;
      margin-right: 0;
    }
    @page :first {
      margin-top: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      max-width: 100%;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: ${PDF_THEME.bodyText};
      background: ${PDF_THEME.white};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .pdf-doc-header { page-break-after: avoid; break-after: avoid; }
    .pdf-doc-content {
      padding: 14px ${PDF_BODY_SIDE_PADDING} 14px;
    }
    h1, h2, h3 { font-family: Helvetica, Arial, sans-serif; color: ${PDF_THEME.darkGray}; }
    h2 {
      font-size: 15px;
      margin: 0 0 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      page-break-after: avoid;
    }
    h3 { font-size: 13px; margin: 0; font-weight: 700; page-break-after: avoid; }
    p { margin: 0 0 8px; }
    ul, ol { margin: 0; padding-left: 0; list-style: none; }
    .accent-bar {
      display: inline-block;
      width: 4px;
      height: 14px;
      background: ${PDF_THEME.sky};
      border-radius: 2px;
      flex: 0 0 auto;
    }
    .section-kicker {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${PDF_THEME.skyBright};
      margin-bottom: 6px;
    }
    .banner {
      border: 1px solid ${PDF_THEME.sky};
      background: #F0F9FF;
      color: ${PDF_THEME.darkGray};
      padding: 8px 10px;
      margin-bottom: 14px;
      font-size: 11px;
      border-radius: 8px;
    }
    .card {
      border: 1px solid ${PDF_THEME.softBorder};
      border-left: 3px solid ${PDF_THEME.sky};
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 12px;
      background: ${PDF_THEME.cardBg};
    }
    .score-card { border-left-width: 4px; }
    .score {
      font-size: 34px;
      font-weight: 700;
      margin: 2px 0 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: ${PDF_THEME.darkGray};
    }
    .score-max { font-size: 16px; color: ${PDF_THEME.mutedGray}; font-weight: 600; }
    .band { font-size: 13px; font-weight: 700; color: ${PDF_THEME.skyBright}; margin-bottom: 8px; }
    .lead { color: #374151; }
    .muted { color: #6B7280; }
    .small { font-size: 11px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; font-weight: 700; color: ${PDF_THEME.darkGray}; }
    .block { margin-bottom: 18px; }
    .category-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 8px; }
    .meter {
      height: 6px;
      background: #E5E7EB;
      border-radius: 999px;
      overflow: hidden;
      margin: 0 0 10px;
    }
    .meter > span {
      display: block;
      height: 100%;
      background: ${PDF_THEME.sky};
      border-radius: 999px;
    }
    .styled-list li {
      border: 1px solid ${PDF_THEME.softBorder};
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 8px;
      border-left: 3px solid ${PDF_THEME.sky};
    }
    .styled-list.numbered { counter-reset: step; }
    .styled-list.numbered li { counter-increment: step; position: relative; padding-left: 42px; }
    .styled-list.numbered li::before {
      content: counter(step);
      position: absolute;
      left: 12px;
      top: 12px;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      background: ${PDF_THEME.sky};
      color: ${PDF_THEME.black};
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      line-height: 20px;
    }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>
<body>
  ${documentHeader}
  <div class="pdf-doc-content">
  ${demoBanner}
  ${scoreBlock}
  ${categoriesHtml}
  ${strengthsHtml}
  ${improvementsHtml}
  ${nextStepsHtml}
  </div>
</body>
</html>`;
}

function renderPngBody(report: DigitalPresenceReport): string {
  const demoBanner = report.isDemo
    ? `<p class="banner">Illustrative sample report — not a verified assessment result.</p>`
    : "";

  const summary = report.executiveSummary
    ? `<p>${escapeHtml(report.executiveSummary)}</p>`
    : "";

  const scoreBlock =
    report.outcome === "complete" && report.overallScore !== null
      ? `<section class="card avoid-break">
          <h2>Overall digital presence score</h2>
          <p class="score">${escapeHtml(scoreDisplay(report.overallScore))}<span class="muted">/${report.maxScore}</span></p>
          ${report.maturityBand ? `<p class="band">${escapeHtml(report.maturityBand)}</p>` : ""}
          ${summary}
        </section>`
      : report.outcome === "partial"
        ? `<section class="card avoid-break">
            <h2>Digital Presence Overview</h2>
            ${summary || `<p>This overview shares the publicly supported observations available for this website. An overall score out of 100 is not shown when available information is incomplete.</p>`}
          </section>`
        : `<section class="card avoid-break">
            <h2>Limited Digital Presence Overview</h2>
            ${summary || `<p>A complete numerical digital presence score could not be published because public website information was insufficient for this run.</p>`}
          </section>`;

  const categoriesHtml =
    report.outcome === "limited" || report.categories.length === 0
      ? ""
      : `<section class="block">
          <h2>Category results</h2>
          ${report.categories
            .map((category) => {
              const earned =
                category.earned === null
                  ? "—"
                  : scoreDisplay(category.earned);
              return `<article class="card avoid-break">
                <h3>${escapeHtml(category.title)}</h3>
                <p class="mono">${escapeHtml(earned)}/${category.maxPoints}</p>
                <p>${escapeHtml(category.summary)}</p>
              </article>`;
            })
            .join("")}
        </section>`;

  const strengthsHtml =
    report.outcome === "limited" || report.strengths.length === 0
      ? ""
      : `<section class="block avoid-break">
          <h2>Key strengths</h2>
          <ul>${report.strengths
            .map(
              (item) => `<li class="avoid-break">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.explanation)}</p>
              </li>`,
            )
            .join("")}</ul>
        </section>`;

  const improvementsHtml =
    report.outcome === "limited" || report.improvements.length === 0
      ? ""
      : `<section class="block">
          <h2>Areas for improvement</h2>
          <ul>${report.improvements
            .map(
              (item) => `<li class="avoid-break">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.description)}</p>
                <p class="muted small">${escapeHtml(item.recommendedAction)}</p>
              </li>`,
            )
            .join("")}</ul>
        </section>`;

  const nextStepsHtml =
    report.outcome === "limited" || report.actionPlan.length === 0
      ? ""
      : `<section class="block avoid-break">
          <h2>Suggested next steps</h2>
          <ol>${report.actionPlan
            .map(
              (item) =>
                `<li class="avoid-break"><p>${escapeHtml(item.action)}</p></li>`,
            )
            .join("")}</ol>
        </section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(report.businessName)} — Digital Presence Report</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: #111;
      background: #fff;
      width: ${EXPORT_PAGE_WIDTH_PX}px;
      padding: 32px 40px 48px;
      line-height: 1.45;
    }
    h1, h2, h3 { font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 0 0 12px; }
    h3 { font-size: 15px; margin: 0 0 8px; }
    p { margin: 0 0 8px; }
    ul, ol { margin: 0; padding-left: 18px; }
    li { margin-bottom: 8px; }
    .muted { color: #555; }
    .small { font-size: 12px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
    .banner { background: #f3f3f3; border: 1px solid #ddd; padding: 10px 12px; margin-bottom: 16px; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 16px; margin-bottom: 14px; }
    .block { margin-top: 22px; }
    .score { font-size: 36px; font-weight: 700; margin: 4px 0 8px; }
    .band { font-weight: 600; }
    .header { margin-bottom: 20px; }
    .meta { color: #555; font-size: 13px; margin-top: 6px; }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>
<body>
  ${demoBanner}
  <header class="header avoid-break">
    <p class="muted small">Digital Presence Audit Report</p>
    <h1>${escapeHtml(report.businessName)}</h1>
    <p class="meta">${escapeHtml(report.website ?? "Website submitted for assessment")}</p>
    <p class="meta">${escapeHtml(report.auditDateLabel)} · ${escapeHtml(report.statusLabel)}</p>
  </header>
  ${scoreBlock}
  ${categoriesHtml}
  ${strengthsHtml}
  ${improvementsHtml}
  ${nextStepsHtml}
</body>
</html>`;
}

/**
 * Build a trusted print/export HTML document from a validated report snapshot.
 * All dynamic strings are escaped. No external scripts. No arbitrary URL fetches.
 */
export function renderReportExportHtml(
  report: DigitalPresenceReport,
  options?: ReportExportRenderOptions,
): string {
  if (options?.variant === "pdf") {
    return renderPdfBody(report);
  }
  return renderPngBody(report);
}
