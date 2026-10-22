import "server-only";

import type { DigitalPresenceReport } from "@/features/report/types/report.types";
import { escapeHtml } from "@/lib/report/export/export-validation";
import { EXPORT_PAGE_WIDTH_PX } from "@/lib/report/export/export.types";

function scoreDisplay(score: number): string {
  return String(score);
}

/**
 * Build a trusted print/export HTML document from a validated report snapshot.
 * All dynamic strings are escaped. No external scripts. No arbitrary URL fetches.
 */
export function renderReportExportHtml(report: DigitalPresenceReport): string {
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
    .findings { margin-top: 8px; }
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
