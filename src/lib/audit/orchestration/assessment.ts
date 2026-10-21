import "server-only";

import { randomUUID } from "node:crypto";

import type { CrawlResult } from "@/features/audit/types/evidence.types";
import { crawlWebsite } from "@/lib/audit/crawler/crawler";
import { validateUrlStructure } from "@/lib/audit/crawler/url-validator";
import { analyzeWebsiteEvidence } from "@/lib/audit/integrations/openai/analysis";
import type { AIAnalysisResult } from "@/lib/audit/integrations/openai/analysis.types";
import { collectPagespeedEvidence } from "@/lib/audit/integrations/pagespeed/pagespeed";
import type { PerformanceResult } from "@/lib/audit/integrations/pagespeed/pagespeed.types";
import { inferBusinessModel } from "@/lib/audit/scoring/applicability";
import { scoreDigitalPresence } from "@/lib/audit/scoring/scoring-engine";
import {
  SCORING_VERSION_STRICT_V1,
  type ScoringResult,
} from "@/lib/audit/scoring/scoring.types";
import { validateScoringResult } from "@/lib/audit/validation/assessment-validator";
import {
  applyGroundedAnalysis,
  validateCollectedEvidence,
} from "@/lib/audit/validation/evidence-validator";
import type {
  AssessmentError,
  AssessmentFinding,
  AssessmentProgressEvent,
  AssessmentProgressStage,
  AssessmentRecommendation,
  AssessmentRequest,
  AssessmentResult,
  AssessmentWarning,
  IntegrationAvailability,
} from "@/lib/audit/orchestration/assessment.types";

export const DEFAULT_ASSESSMENT_TIMEOUT_MS = 120_000;

function utcNow(): string {
  return new Date().toISOString();
}

function emitProgress(
  request: AssessmentRequest,
  stage: AssessmentProgressStage,
  status: AssessmentProgressEvent["status"],
  message: string,
): void {
  try {
    request.onProgress?.({ stage, status, message, at: utcNow() });
  } catch {
    // Progress listeners must never break the assessment.
  }
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Assessment aborted by client disconnect.");
  }
}

function emptyAvailability(): IntegrationAvailability {
  return {
    crawler: "not_requested",
    pagespeed: "not_requested",
    openai: "not_requested",
    scoring: "not_requested",
  };
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function baseResult(partial: {
  assessmentId: string;
  startedAt: string;
  websiteUrl: string;
  businessName: string | null;
  status: AssessmentResult["status"];
  errors: AssessmentError[];
  warnings?: AssessmentWarning[];
  limitationReasons?: string[];
  integrationAvailability?: IntegrationAvailability;
  scoringVersion?: string;
}): AssessmentResult {
  const finishedAt = utcNow();
  return {
    assessmentId: partial.assessmentId,
    ok: false,
    status: partial.status,
    assessedAt: finishedAt,
    scoringVersion: partial.scoringVersion ?? SCORING_VERSION_STRICT_V1,
    business: {
      businessName: partial.businessName,
      websiteUrl: partial.websiteUrl,
      normalizedWebsiteUrl: null,
      serviceAreaSignals: [],
      businessModel: "unknown",
    },
    websiteUrl: partial.websiteUrl,
    overallScore: null,
    totalMaxPoints: 100,
    maturityBand: {
      band: null,
      label: null,
      eligible: false,
      reason: "No maturity band for incomplete assessment.",
    },
    evidenceCoverage: {
      weightedCoverage: 0,
      assessedEffectiveWeight: 0,
      applicableEffectiveWeight: 0,
      categoriesWithAssessedEvidence: [],
      categoriesMissingAssessedEvidence: [
        "website_experience",
        "local_seo_presence",
        "reputation_trust",
        "content_authority",
        "conversion_readiness",
      ],
      verifiedWebsitePages: 0,
      meetsPublicationThresholds: false,
    },
    categories: [],
    findings: [],
    recommendations: [],
    unassessedCriteria: [],
    notApplicableCriteria: [],
    integrationAvailability: partial.integrationAvailability ?? emptyAvailability(),
    evidenceCatalog: [],
    evidenceValidationIssues: [],
    assessmentValidationIssues: [],
    scoringPolicyFlags: ["unassessed_weight_uses_absolute_points_earned"],
    scoringPolicyDisclosures: [
      "strict-v1.0 uses absolute points earned; unassessed weight is not extrapolated to 100 and is not treated as FAIL.",
    ],
    limitationReasons: partial.limitationReasons ?? [],
    warnings: partial.warnings ?? [],
    errors: partial.errors,
    scoring: null,
    rejectedAiFindingIds: [],
    startedAt: partial.startedAt,
    finishedAt,
    ephemeral: true,
  };
}

function mapFindings(scoring: ScoringResult): AssessmentFinding[] {
  const findings: AssessmentFinding[] = [];
  for (const category of scoring.categories) {
    for (const criterion of category.criteria) {
      if (
        criterion.assessment === "NOT_ASSESSED" ||
        criterion.applicability === "NOT_APPLICABLE"
      ) {
        continue;
      }
      const kind =
        criterion.assessment === "PASS"
          ? "strength"
          : criterion.assessment === "FAIL"
            ? "weakness"
            : "observation";
      findings.push({
        id: `crit-${criterion.criterionId}`,
        categoryId: criterion.categoryId,
        kind,
        title: criterion.name,
        description: criterion.rationale,
        evidenceIds: criterion.evidenceIds,
        confidence: null,
        source: "scoring",
      });
    }
  }
  return findings;
}

function mapRecommendations(
  analysis: AIAnalysisResult | null,
): AssessmentRecommendation[] {
  if (!analysis?.ok) return [];
  return analysis.recommendations
    .filter((item) => item.evidenceIds.length > 0)
    .map((item) => ({
      id: item.id,
      categoryId: item.category,
      title: item.title,
      description: item.description,
      evidenceIds: item.evidenceIds,
      priority: item.priority,
      source: "ai_grounded" as const,
    }));
}

async function defaultCrawl(url: string): Promise<CrawlResult> {
  return crawlWebsite({ url });
}

async function defaultPagespeed(crawl: CrawlResult): Promise<PerformanceResult | null> {
  const homepage =
    crawl.website?.homepageUrl ?? crawl.request.normalizedUrl ?? null;
  if (!homepage) return null;
  const servicePageUrls = crawl.website?.discoveredServicePages.slice(0, 1) ?? [];
  return collectPagespeedEvidence({
    url: homepage,
    servicePageUrls,
  });
}

async function defaultAnalysis(crawl: CrawlResult): Promise<AIAnalysisResult | null> {
  return analyzeWebsiteEvidence({ crawl });
}

/**
 * Bounded Hybrid Audit orchestration.
 * Not a durable job system — runs in-process with a wall-clock timeout.
 */
export async function runAssessment(
  request: AssessmentRequest,
): Promise<AssessmentResult> {
  const assessmentId = randomUUID();
  const startedAt = utcNow();
  const timeoutMs = request.timeoutMs ?? DEFAULT_ASSESSMENT_TIMEOUT_MS;
  const businessName = request.businessName ?? null;
  const availability = emptyAvailability();
  const warnings: AssessmentWarning[] = [];
  const errors: AssessmentError[] = [];
  const limitationReasons: string[] = [];

  try {
    emitProgress(request, "validating", "started", "Validating website.");
    assertNotAborted(request.signal);

    const trimmedUrl = request.websiteUrl.trim();
    if (!trimmedUrl) {
      if (!request.allowMissingWebsite) {
        emitProgress(
          request,
          "validating",
          "failed",
          "Website URL is required.",
        );
        return baseResult({
          assessmentId,
          startedAt,
          websiteUrl: request.websiteUrl,
          businessName,
          status: "LIMITED_VISIBILITY",
          errors: [
            {
              code: "invalid_input",
              message: "Website URL is required.",
            },
          ],
          limitationReasons: ["No website URL was provided."],
          integrationAvailability: availability,
        });
      }

      emitProgress(
        request,
        "validating",
        "completed",
        "No website URL; limited visibility snapshot.",
      );
      emitProgress(
        request,
        "preparing_report",
        "completed",
        "Preparing limited visibility report.",
      );
      return {
        ...baseResult({
          assessmentId,
          startedAt,
          websiteUrl: "",
          businessName,
          status: "LIMITED_VISIBILITY",
          errors: [
            {
              code: "insufficient_evidence",
              message:
                "No website URL was provided; only submitted business details are available.",
            },
          ],
          limitationReasons: [
            "Minimal-info path without a crawlable website URL.",
            "Website verification and crawl were not performed.",
          ],
          integrationAvailability: availability,
          warnings: [
            {
              code: "missing_website",
              message: "Assessment limited because no website URL was supplied.",
            },
          ],
        }),
        ok: true,
      };
    }

    const structure = validateUrlStructure(trimmedUrl);
    if (!structure.ok) {
      emitProgress(
        request,
        "validating",
        "failed",
        "Website URL failed validation.",
      );
      return baseResult({
        assessmentId,
        startedAt,
        websiteUrl: request.websiteUrl,
        businessName,
        status: "LIMITED_VISIBILITY",
        errors: [
          {
            code: "invalid_input",
            message: structure.error.message,
            details: structure.error.code,
          },
        ],
        limitationReasons: [
          "Website URL failed structural validation; assessment limited.",
        ],
        integrationAvailability: availability,
      });
    }

    emitProgress(
      request,
      "validating",
      "completed",
      "Website URL validated.",
    );

    return await withTimeout(
      executeAssessment({
        request,
        assessmentId,
        startedAt,
        businessName,
        availability,
        warnings,
        errors,
        limitationReasons,
        normalizedUrl: structure.url.href,
      }),
      timeoutMs,
      "Assessment",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assessment failed.";
    const isTimeout = /timed out/i.test(message);
    const isAbort = /abort/i.test(message);
    emitProgress(
      request,
      "preparing_report",
      "failed",
      isTimeout
        ? "Assessment timed out."
        : isAbort
          ? "Assessment cancelled."
          : "Assessment failed.",
    );
    return baseResult({
      assessmentId,
      startedAt,
      websiteUrl: request.websiteUrl,
      businessName,
      status: "LIMITED_VISIBILITY",
      errors: [
        {
          code: isTimeout ? "assessment_timeout" : "unknown",
          message: isTimeout
            ? `Assessment exceeded timeout of ${timeoutMs}ms.`
            : message,
        },
      ],
      limitationReasons: [
        isTimeout
          ? "Assessment timed out before a complete result could be produced."
          : isAbort
            ? "Assessment was cancelled before completion."
            : "Assessment failed unexpectedly.",
      ],
      warnings,
      integrationAvailability: availability,
    });
  }
}

async function executeAssessment(ctx: {
  request: AssessmentRequest;
  assessmentId: string;
  startedAt: string;
  businessName: string | null;
  availability: IntegrationAvailability;
  warnings: AssessmentWarning[];
  errors: AssessmentError[];
  limitationReasons: string[];
  normalizedUrl: string;
}): Promise<AssessmentResult> {
  const {
    request,
    assessmentId,
    startedAt,
    businessName,
    availability,
    warnings,
    errors,
    limitationReasons,
    normalizedUrl,
  } = ctx;

  // --- Crawl ---
  assertNotAborted(request.signal);
  emitProgress(
    request,
    "crawling",
    "started",
    "Crawling accessible pages.",
  );
  availability.crawler = "available";
  let crawl: CrawlResult;
  try {
    const crawlFn = request.crawlFn ?? defaultCrawl;
    crawl = await crawlFn(request.websiteUrl);
  } catch (error) {
    availability.crawler = "error";
    const message = error instanceof Error ? error.message : "Crawl failed.";
    emitProgress(request, "crawling", "failed", "Website crawl failed.");
    return baseResult({
      assessmentId,
      startedAt,
      websiteUrl: request.websiteUrl,
      businessName,
      status: "LIMITED_VISIBILITY",
      errors: [{ code: "website_unreachable", message }],
      limitationReasons: ["Website crawl failed; no confirmed website evidence."],
      warnings,
      integrationAvailability: availability,
    });
  }

  emitProgress(
    request,
    "crawling",
    "completed",
    "Finished crawling accessible pages.",
  );
  emitProgress(
    request,
    "collecting_evidence",
    "started",
    "Collecting website evidence.",
  );
  emitProgress(
    request,
    "collecting_evidence",
    "completed",
    "Website evidence collected.",
  );

  if (crawl.errors.some((e) => e.code === "robots_blocked")) {
    errors.push({
      code: "robots_restricted",
      message: "Crawl respected robots.txt restrictions.",
    });
    limitationReasons.push("Robots restrictions limited crawl coverage.");
  }

  // Only label partial_crawl when the crawler actually marked a partial success
  // path — not when Chromium failed to launch (0 pages / total failure).
  if (crawl.partial && crawl.pages.length > 0) {
    errors.push({
      code: "partial_crawl",
      message: "Crawl completed only partially.",
    });
    limitationReasons.push("Partial crawl reduced available website evidence.");
    warnings.push({
      code: "partial_crawl",
      message: "Crawler returned a partial result.",
      integration: "crawler",
    });
  } else if (crawl.partial && crawl.pages.length === 0) {
    const primaryCode = crawl.errors[0]?.code;
    if (
      primaryCode &&
      primaryCode !== "browser_executable_missing" &&
      primaryCode !== "browser_launch_failed"
    ) {
      errors.push({
        code: "partial_crawl",
        message: "Crawl completed only partially.",
        details: primaryCode,
      });
      limitationReasons.push(
        `Partial crawl with no verified pages (${primaryCode}).`,
      );
    }
  }

  if (!crawl.website || crawl.pages.length === 0) {
    const primary = crawl.errors[0];
    const launchFailed =
      primary?.code === "browser_executable_missing" ||
      primary?.code === "browser_launch_failed";
    availability.crawler =
      crawl.errors.some(
        (e) =>
          e.code === "ssrf_blocked" ||
          e.code === "invalid_url" ||
          e.code === "browser_executable_missing" ||
          e.code === "browser_launch_failed",
      )
        ? "error"
        : "unavailable";

    // Providers were never eligible — record explicit skip reasons (not not_requested).
    availability.pagespeed = "skipped";
    availability.openai = "skipped";
    availability.scoring = "skipped";

    const pagespeedSkip =
      crawl.diagnostics?.providerSkipReasons.pagespeed ??
      "PageSpeed skipped: no verified website pages were collected.";
    const openaiSkip =
      crawl.diagnostics?.providerSkipReasons.openai ??
      "OpenAI skipped: no verified website pages were collected.";
    limitationReasons.push(pagespeedSkip, openaiSkip);

    if (crawl.diagnostics?.sanitizedBrowserLaunchFailure) {
      limitationReasons.push(
        `Browser launch: ${crawl.diagnostics.sanitizedBrowserLaunchFailure}`,
      );
      warnings.push({
        code: primary?.code ?? "browser_launch_failed",
        message: crawl.diagnostics.sanitizedBrowserLaunchFailure,
        integration: "crawler",
      });
    }

    emitProgress(
      request,
      "preparing_report",
      "completed",
      "Preparing limited visibility report.",
    );
    return baseResult({
      assessmentId,
      startedAt,
      websiteUrl: request.websiteUrl,
      businessName,
      status: "LIMITED_VISIBILITY",
      errors: [
        ...errors,
        {
          code:
            primary?.code === "ssrf_blocked" || launchFailed
              ? "website_unreachable"
              : "insufficient_evidence",
          message:
            primary?.message ??
            "Website could not be confidently confirmed.",
          details: primary?.details ?? primary?.code,
        },
      ],
      limitationReasons: [
        ...limitationReasons,
        "No verified website pages were collected.",
      ],
      warnings,
      integrationAvailability: availability,
    });
  }

  // --- PageSpeed (optional) ---
  assertNotAborted(request.signal);
  let performance: PerformanceResult | null = null;
  if (request.skipPagespeed) {
    availability.pagespeed = "skipped";
    limitationReasons.push("PageSpeed measurement was skipped by request.");
    emitProgress(
      request,
      "pagespeed",
      "skipped",
      "PageSpeed check skipped.",
    );
  } else {
    emitProgress(
      request,
      "pagespeed",
      "started",
      "Checking PageSpeed performance.",
    );
    try {
      const pagespeedFn = request.pagespeedFn ?? defaultPagespeed;
      performance = await pagespeedFn(crawl);
      if (!performance || !performance.ok || performance.evidence.length === 0) {
        availability.pagespeed = "unavailable";
        errors.push({
          code: "pagespeed_failure",
          message:
            performance?.errors[0]?.message ??
            "PageSpeed measurements unavailable.",
        });
        warnings.push({
          code: "pagespeed_unavailable",
          message:
            "PageSpeed failed or returned no measurements; performance checks remain NOT_ASSESSED.",
          integration: "pagespeed",
        });
        limitationReasons.push(
          "Measured performance unavailable; related checks are not assessed (not failed).",
        );
        performance = performance ?? null;
        emitProgress(
          request,
          "pagespeed",
          "skipped",
          "PageSpeed unavailable; marked not assessed.",
        );
      } else {
        availability.pagespeed = "available";
        emitProgress(
          request,
          "pagespeed",
          "completed",
          "PageSpeed performance collected.",
        );
      }
    } catch (error) {
      availability.pagespeed = "error";
      const message =
        error instanceof Error ? error.message : "PageSpeed request failed.";
      errors.push({ code: "pagespeed_failure", message });
      warnings.push({
        code: "pagespeed_error",
        message:
          "PageSpeed integration errored; crawler evidence preserved.",
        integration: "pagespeed",
      });
      limitationReasons.push(
        "PageSpeed error; performance remains NOT_ASSESSED.",
      );
      performance = null;
      emitProgress(
        request,
        "pagespeed",
        "skipped",
        "PageSpeed error; marked not assessed.",
      );
    }
  }

  // --- OpenAI (optional) ---
  assertNotAborted(request.signal);
  let analysis: AIAnalysisResult | null = null;
  if (request.skipOpenAI) {
    availability.openai = "skipped";
    limitationReasons.push("OpenAI qualitative analysis was skipped by request.");
    emitProgress(
      request,
      "content_analysis",
      "skipped",
      "Content analysis skipped.",
    );
  } else {
    emitProgress(
      request,
      "content_analysis",
      "started",
      "Analyzing website content.",
    );
    try {
      const analysisFn = request.analysisFn ?? defaultAnalysis;
      analysis = await analysisFn(crawl);
      if (!analysis || !analysis.ok) {
        availability.openai = analysis?.errors.length ? "error" : "unavailable";
        const code =
          analysis?.errors[0]?.code === "schema_validation_failed" ||
          analysis?.errors[0]?.code === "invalid_response"
            ? "invalid_ai_output"
            : "openai_failure";
        errors.push({
          code,
          message:
            analysis?.errors[0]?.message ??
            "OpenAI qualitative analysis unavailable.",
        });
        warnings.push({
          code: "openai_unavailable",
          message:
            "OpenAI analysis failed; no fabricated findings were introduced.",
          integration: "openai",
        });
        limitationReasons.push(
          "Qualitative AI analysis unavailable; scoring continues on crawl/performance evidence only.",
        );
        analysis = analysis?.ok ? analysis : null;
        emitProgress(
          request,
          "content_analysis",
          "skipped",
          "Content analysis unavailable.",
        );
      } else {
        availability.openai = "available";
        emitProgress(
          request,
          "content_analysis",
          "completed",
          "Website content analyzed.",
        );
      }
    } catch (error) {
      availability.openai = "error";
      const message =
        error instanceof Error ? error.message : "OpenAI request failed.";
      errors.push({ code: "openai_failure", message });
      warnings.push({
        code: "openai_error",
        message: "OpenAI integration errored; prior evidence preserved.",
        integration: "openai",
      });
      limitationReasons.push(
        "OpenAI error; qualitative findings omitted.",
      );
      analysis = null;
      emitProgress(
        request,
        "content_analysis",
        "skipped",
        "Content analysis error; continuing without it.",
      );
    }
  }

  // --- Evidence validation ---
  assertNotAborted(request.signal);
  emitProgress(
    request,
    "validating_findings",
    "started",
    "Validating findings.",
  );
  const evidenceValidation = validateCollectedEvidence({
    crawl,
    performance,
    analysis,
  });

  const groundedAnalysis = applyGroundedAnalysis(
    analysis,
    evidenceValidation.groundedFindings,
    evidenceValidation.rejectedAiFindingIds,
  );

  if (evidenceValidation.rejectedAiFindingIds.length > 0) {
    warnings.push({
      code: "unsupported_ai_references",
      message: `Rejected ${evidenceValidation.rejectedAiFindingIds.length} AI finding(s) with unsupported evidence references.`,
      integration: "openai",
    });
  }

  if (evidenceValidation.duplicateEvidenceIds.length > 0) {
    warnings.push({
      code: "duplicate_evidence",
      message: `Detected duplicate evidence entries: ${evidenceValidation.duplicateEvidenceIds.join(", ")}`,
    });
  }

  if (evidenceValidation.inaccessiblePageUrls.length > 0) {
    limitationReasons.push(
      "Some pages were inaccessible; this is not treated as proof that related business features are absent.",
    );
  }

  emitProgress(
    request,
    "validating_findings",
    "completed",
    "Findings validated.",
  );

  // --- Scoring ---
  assertNotAborted(request.signal);
  emitProgress(
    request,
    "scoring",
    "started",
    "Calculating the assessment.",
  );
  availability.scoring = "available";
  let scoring: ScoringResult;
  try {
    const scoringInput = {
      crawl,
      performance,
      analysis: groundedAnalysis,
      businessModelHint: request.businessModelHint,
      scoringVersion: request.scoringVersion ?? SCORING_VERSION_STRICT_V1,
      assessedAt: request.assessedAt ?? utcNow(),
    };
    scoring = request.scoringFn
      ? request.scoringFn(scoringInput)
      : scoreDigitalPresence(scoringInput);
  } catch (error) {
    availability.scoring = "error";
    const message =
      error instanceof Error ? error.message : "Scoring engine failed.";
    emitProgress(request, "scoring", "failed", "Assessment calculation failed.");
    return baseResult({
      assessmentId,
      startedAt,
      websiteUrl: request.websiteUrl,
      businessName,
      status: evidenceValidation.websiteConfirmed ? "PARTIAL" : "LIMITED_VISIBILITY",
      errors: [...errors, { code: "scoring_validation_failure", message }],
      limitationReasons: [
        ...limitationReasons,
        "Scoring engine failed; no fabricated scores were produced.",
      ],
      warnings,
      integrationAvailability: availability,
    });
  }

  const assessmentValidation = validateScoringResult(scoring, evidenceValidation);
  if (!assessmentValidation.ok) {
    availability.scoring = "error";
    errors.push({
      code: "scoring_validation_failure",
      message: assessmentValidation.issues.map((i) => i.message).join("; "),
    });
  }

  emitProgress(
    request,
    "scoring",
    "completed",
    "Assessment calculated.",
  );
  emitProgress(
    request,
    "preparing_report",
    "started",
    "Preparing the report.",
  );

  // Enforce nullable score/band for non-complete after validation
  let status = scoring.status;
  let overallScore = scoring.totalScore;
  let maturityBand = scoring.maturity;

  if (status !== "COMPLETE") {
    overallScore = null;
    maturityBand = {
      band: null,
      label: null,
      eligible: false,
      reason:
        status === "LIMITED_VISIBILITY"
          ? "No maturity band for limited visibility snapshot."
          : "No maturity band for partial audit.",
    };
  }

  if (status === "PARTIAL") {
    limitationReasons.push(
      "Confirmed website with insufficient evidence coverage for a complete numerical audit.",
    );
  }

  if (!evidenceValidation.websiteConfirmed && status !== "LIMITED_VISIBILITY") {
    status = "LIMITED_VISIBILITY";
    overallScore = null;
    maturityBand = {
      band: null,
      label: null,
      eligible: false,
      reason: "No maturity band for limited visibility snapshot.",
    };
  }

  const businessModel = inferBusinessModel(
    crawl,
    request.businessModelHint ?? scoring.businessModel,
  );

  const ok =
    assessmentValidation.ok &&
    (status === "COMPLETE" ||
      status === "PARTIAL" ||
      status === "LIMITED_VISIBILITY");

  emitProgress(
    request,
    "preparing_report",
    "completed",
    "Report preparation complete.",
  );

  return {
    assessmentId,
    ok: ok && errors.every((e) => e.code !== "scoring_validation_failure"),
    status,
    assessedAt: scoring.assessedAt,
    scoringVersion: scoring.scoringVersion,
    business: {
      businessName,
      websiteUrl: request.websiteUrl,
      normalizedWebsiteUrl:
        crawl.website?.normalizedSeedUrl ?? normalizedUrl,
      serviceAreaSignals: crawl.website?.serviceAreaSignals ?? [],
      businessModel,
    },
    websiteUrl: request.websiteUrl,
    overallScore,
    totalMaxPoints: scoring.totalMaxPoints,
    maturityBand,
    evidenceCoverage: scoring.coverage,
    categories: scoring.categories,
    findings: mapFindings(scoring),
    recommendations: mapRecommendations(groundedAnalysis),
    unassessedCriteria: scoring.unavailableChecks,
    notApplicableCriteria: scoring.notApplicableChecks,
    integrationAvailability: availability,
    evidenceCatalog: evidenceValidation.evidenceCatalog,
    evidenceValidationIssues: evidenceValidation.issues,
    assessmentValidationIssues: assessmentValidation.issues,
    scoringPolicyFlags: scoring.policyFlags,
    scoringPolicyDisclosures: [
      ...scoring.unresolvedPolicyNotes,
      "Policy flag unassessed_weight_uses_absolute_points_earned is preserved from strict-v1.0.",
    ],
    limitationReasons: [...new Set(limitationReasons)],
    warnings,
    errors,
    scoring,
    rejectedAiFindingIds: [
      ...new Set([
        ...evidenceValidation.rejectedAiFindingIds,
        ...scoring.rejectedAiFindingIds,
      ]),
    ],
    startedAt,
    finishedAt: utcNow(),
    ephemeral: true,
  };
}
