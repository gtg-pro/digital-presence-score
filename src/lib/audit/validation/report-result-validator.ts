import {
  LIVE_SCORING_POLICY_ID,
  safeHttpUrl,
} from "@/features/report/adapters/assessment-to-report";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

export type ReportResultValidationIssue = {
  code:
    | "demo_flag_on_live_report"
    | "complete_missing_score"
    | "incomplete_has_score"
    | "incomplete_has_maturity"
    | "score_precision_lost"
    | "invalid_evidence_url"
    | "missing_scoring_version"
    | "missing_policy_id"
    | "category_maxima_mismatch";
  message: string;
};

export type ReportResultValidation = {
  ok: boolean;
  issues: ReportResultValidationIssue[];
};

/**
 * Validate a mapped report before UI render.
 * Rejects live↔demo confusion and fabricated complete scores.
 */
export function validateReportResult(
  report: DigitalPresenceReport,
  options?: { expectLive?: boolean; sourceOverallScore?: number | null },
): ReportResultValidation {
  const issues: ReportResultValidationIssue[] = [];
  const expectLive = options?.expectLive ?? !report.isDemo;

  if (expectLive && report.isDemo) {
    issues.push({
      code: "demo_flag_on_live_report",
      message: "Live assessment mapping must not set isDemo=true.",
    });
  }

  if (!report.scoringVersion) {
    issues.push({
      code: "missing_scoring_version",
      message: "Report is missing scoring version.",
    });
  }

  // Policy id is an internal integrity marker for live mappings when present.
  // OpenAI-web reports still set it; absence is allowed only for non-live demos.
  if (
    expectLive &&
    report.scoringPolicyId != null &&
    report.scoringPolicyId !== LIVE_SCORING_POLICY_ID
  ) {
    issues.push({
      code: "missing_policy_id",
      message: `Live report scoring policy id must be ${LIVE_SCORING_POLICY_ID}.`,
    });
  }

  if (report.outcome === "complete") {
    if (report.overallScore === null) {
      issues.push({
        code: "complete_missing_score",
        message: "Complete report is missing overallScore.",
      });
    }
  } else {
    if (report.overallScore !== null) {
      issues.push({
        code: "incomplete_has_score",
        message: `${report.outcome} report must keep overallScore null.`,
      });
    }
    if (report.maturityBand !== null) {
      issues.push({
        code: "incomplete_has_maturity",
        message: `${report.outcome} report must keep maturityBand null.`,
      });
    }
  }

  if (
    options?.sourceOverallScore !== undefined &&
    options.sourceOverallScore !== null &&
    report.overallScore !== null &&
    report.overallScore !== options.sourceOverallScore
  ) {
    issues.push({
      code: "score_precision_lost",
      message: `Mapped score ${report.overallScore} does not match source ${options.sourceOverallScore}.`,
    });
  }

  const expectedById: Record<string, number> = {
    "website-experience": 25,
    "local-seo-presence": 25,
    "reputation-trust": 20,
    "content-authority": 15,
    "conversion-readiness": 15,
  };
  for (const category of report.categories) {
    const expected = expectedById[category.id];
    if (expected !== undefined && category.maxPoints !== expected) {
      issues.push({
        code: "category_maxima_mismatch",
        message: `Category ${category.id} maxPoints ${category.maxPoints} !== ${expected}.`,
      });
    }
  }

  for (const category of report.categories) {
    for (const finding of category.findings) {
      if (
        finding.evidenceUrl &&
        safeHttpUrl(finding.evidenceUrl) !== finding.evidenceUrl
      ) {
        issues.push({
          code: "invalid_evidence_url",
          message: `Unsafe evidence URL on finding ${finding.id}.`,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
