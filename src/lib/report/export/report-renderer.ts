import "server-only";

import type { DigitalPresenceReport } from "@/features/report/types/report.types";
import { LIVE_SCORING_POLICY_EXPLANATION } from "@/features/report/adapters/assessment-to-report";
import { escapeHtml } from "@/lib/report/export/export-validation";
import { EXPORT_PAGE_WIDTH_PX } from "@/lib/report/export/export.types";

function scoreDisplay(score: number): string {
  // Preserve source precision (e.g. 80.8) without inventing trailing zeros.
  return String(score);
}

function listItems(items: string[]): string {
  if (items.length === 0) return "<p class=\"muted\">None listed.</p>";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

/**
 * Build a trusted print/export HTML document from a validated report snapshot.
 * All dynamic strings are escaped. No external scripts. No arbitrary URL fetches.
 */
export function renderReportExportHtml(report: DigitalPresenceReport): string {
  const demoBanner = report.isDemo
    ? `<p class="banner">Illustrative demo report — not a verified assessment result.</p>`
    : "";

  const scoreBlock =
    report.outcome === "complete" && report.overallScore !== null
      ? `<section class="card avoid-break">
          <h2>Overall digital presence score</h2>
          <p class="score">${escapeHtml(scoreDisplay(report.overallScore))}<span class="muted">/${report.maxScore}</span></p>
          ${report.maturityBand ? `<p class="band">${escapeHtml(report.maturityBand)}</p>` : ""}
          <p class="muted">Evidence coverage: ${escapeHtml(String(report.evidenceCoveragePercent))}%</p>
        </section>`
      : report.outcome === "partial"
        ? `<section class="card avoid-break">
            <h2>Partial Audit</h2>
            <p>Some checks could not be completed. Unverified areas are shown as Not Assessed rather than counted as failures. No overall /100 score or maturity band is displayed.</p>
            <p class="muted">Evidence coverage: ${escapeHtml(String(report.evidenceCoveragePercent))}%</p>
          </section>`
        : `<section class="card avoid-break">
            <h2>Limited Visibility Snapshot</h2>
            <p>A business website could not be confidently verified. This snapshot contains only limited available information. No numerical score is displayed.</p>
            <p class="muted">Evidence coverage: ${escapeHtml(String(report.evidenceCoveragePercent))}%</p>
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
              const findings =
                category.findings.length === 0
                  ? "<p class=\"muted\">No supporting findings listed.</p>"
                  : `<ul class="findings">${category.findings
                      .map((finding) => {
                        const evidenceBits = [
                          finding.evidenceUrl
                            ? `Source: ${escapeHtml(finding.evidenceUrl)}`
                            : null,
                          finding.observedAtLabel
                            ? `Observed: ${escapeHtml(finding.observedAtLabel)}`
                            : null,
                          finding.collectionMethod
                            ? `Method: ${escapeHtml(finding.collectionMethod)}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ");
                        return `<li class="avoid-break">
                          <strong>${escapeHtml(finding.title)}</strong>
                          <p>${escapeHtml(finding.detail)}</p>
                          ${evidenceBits ? `<p class="muted small">${evidenceBits}</p>` : ""}
                        </li>`;
                      })
                      .join("")}</ul>`;
              return `<article class="card avoid-break">
                <h3>${escapeHtml(category.title)}</h3>
                <p class="mono">${escapeHtml(earned)}/${category.maxPoints} · ${escapeHtml(category.status.replace(/_/g, " "))}</p>
                <p>${escapeHtml(category.summary)}</p>
                ${findings}
              </article>`;
            })
            .join("")}
        </section>`;

  const strengthsHtml =
    report.outcome === "limited" || report.strengths.length === 0
      ? ""
      : `<section class="block avoid-break">
          <h2>Strengths</h2>
          <ul>${report.strengths
            .map(
              (item) => `<li class="avoid-break">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.explanation)}</p>
                ${item.evidenceLabel ? `<p class="muted small">${escapeHtml(item.evidenceLabel)}</p>` : ""}
              </li>`,
            )
            .join("")}</ul>
        </section>`;

  const improvementsHtml =
    report.outcome === "limited" || report.improvements.length === 0
      ? ""
      : `<section class="block">
          <h2>Improvement opportunities</h2>
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

  const unableHtml =
    report.unableToVerify.length === 0
      ? ""
      : `<section class="block">
          <h2>Unable to verify</h2>
          <p class="muted">Not Assessed does not automatically mean the business failed the check.</p>
          <ul>${report.unableToVerify
            .map(
              (item) =>
                `<li class="avoid-break"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></li>`,
            )
            .join("")}</ul>
        </section>`;

  const methodology = report.methodology;
  const policyNote = report.scoringPolicyId
    ? `<p><strong>Scoring policy:</strong> ${escapeHtml(report.scoringPolicyId)}</p>
       <p>${escapeHtml(LIVE_SCORING_POLICY_EXPLANATION)}</p>`
    : report.isDemo
      ? ""
      : `<p>${escapeHtml(LIVE_SCORING_POLICY_EXPLANATION)}</p>`;

  const methodologyHtml = `<section class="block">
      <h2>Methodology &amp; limitations</h2>
      <p>${escapeHtml(methodology.frameworkSummary)}</p>
      <p><strong>Scoring version:</strong> <span class="mono">${escapeHtml(methodology.scoringVersion)}</span></p>
      <p>${escapeHtml(methodology.assessmentScope)}</p>
      <p>${escapeHtml(methodology.evidenceCoverageNote)}</p>
      ${policyNote}
      <h3>Limitations</h3>
      ${listItems(methodology.limitations)}
      <h3>Sources</h3>
      ${
        methodology.sources.length === 0
          ? "<p class=\"muted\">No sources listed.</p>"
          : `<ul>${methodology.sources
              .map(
                (source) =>
                  `<li class="url-break">${escapeHtml(source.label)} — ${escapeHtml(source.observedAtLabel)}</li>`,
              )
              .join("")}</ul>`
      }
      <p>${escapeHtml(methodology.partialAndLimitedExplanation)}</p>
      <p class="muted">${escapeHtml(methodology.disclaimer)}</p>
    </section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.businessName)} — Digital Presence Report</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      width: ${EXPORT_PAGE_WIDTH_PX}px;
      max-width: 100%;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12px;
      line-height: 1.5;
      color: #111;
      background: #fff;
    }
    h1 { font-size: 22px; margin: 0 0 6px; font-weight: 600; }
    h2 { font-size: 16px; margin: 0 0 10px; font-weight: 600; page-break-after: avoid; }
    h3 { font-size: 13px; margin: 0 0 6px; font-weight: 600; page-break-after: avoid; }
    p { margin: 0 0 8px; }
    ul, ol { margin: 0 0 10px; padding-left: 18px; }
    li { margin-bottom: 6px; }
    .meta { color: #333; margin-bottom: 16px; }
    .meta span { display: inline-block; margin-right: 14px; margin-bottom: 4px; }
    .banner {
      border: 1px solid #111;
      padding: 8px 10px;
      margin-bottom: 16px;
      font-size: 11px;
      background: #f5f5f5;
    }
    .card {
      border: 1px solid #ccc;
      padding: 12px 14px;
      margin-bottom: 12px;
      background: #fff;
    }
    .block { margin-bottom: 18px; }
    .score { font-size: 28px; font-weight: 700; margin: 4px 0 8px; font-family: ui-monospace, monospace; }
    .band { font-size: 14px; font-weight: 600; }
    .muted { color: #555; }
    .small { font-size: 11px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .url-break, .findings p { overflow-wrap: anywhere; word-break: break-word; }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
    header { margin-bottom: 18px; border-bottom: 1px solid #111; padding-bottom: 12px; }
  </style>
</head>
<body>
  <header class="avoid-break">
    <p class="muted small">Digital Presence Report Card</p>
    <h1>${escapeHtml(report.businessName)}</h1>
    <p>${escapeHtml(report.website ?? "Website not confidently verified")}</p>
    <div class="meta">
      <span>Status: <strong>${escapeHtml(report.statusLabel)}</strong></span>
      <span>Date: ${escapeHtml(report.auditDateLabel)}</span>
      <span>Scoring: <span class="mono">${escapeHtml(report.scoringVersion)}</span></span>
      <span>Coverage: ${escapeHtml(String(report.evidenceCoveragePercent))}%</span>
    </div>
    ${demoBanner}
  </header>
  ${scoreBlock}
  ${categoriesHtml}
  ${strengthsHtml}
  ${improvementsHtml}
  ${unableHtml}
  ${methodologyHtml}
</body>
</html>`;
}
