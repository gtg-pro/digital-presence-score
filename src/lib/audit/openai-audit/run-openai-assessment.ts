import "server-only";

import { randomUUID } from "node:crypto";

import { validateUrlStructure } from "@/lib/audit/crawler/url-validator";
import { requestOpenAIWebAudit } from "@/lib/audit/openai-audit/openai-web-client";
import { scoreOpenAIWebAudit } from "@/lib/audit/openai-audit/score-openai-audit";
import {
  OPENAI_AUDIT_VERSION,
  type OpenAIWebAuditPayload,
} from "@/lib/audit/openai-audit/openai-audit.types";
import type {
  AssessmentError,
  AssessmentFinding,
  AssessmentProgressEvent,
  AssessmentRecommendation,
  AssessmentRequest,
  AssessmentResult,
  AssessmentWarning,
  IntegrationAvailability,
} from "@/lib/audit/orchestration/assessment.types";
import type { ValidatedEvidenceItem } from "@/lib/audit/validation/evidence-validator";

/** Wall-clock budget for retrieve + structured scoring OpenAI calls. */
export const DEFAULT_ASSESSMENT_TIMEOUT_MS = 180_000;

function utcNow(): string {
  return new Date().toISOString();
}

function emitProgress(
  request: AssessmentRequest,
  stage: AssessmentProgressEvent["stage"],
  status: AssessmentProgressEvent["status"],
  message: string,
) {
  request.onProgress?.({ stage, status, message, at: utcNow() });
}

function emptyAvailability(
  openai: IntegrationAvailability["openai"],
): IntegrationAvailability {
  return {
    crawler: "not_requested",
    pagespeed: "not_requested",
    openai,
    scoring: "available",
  };
}

function buildEvidenceCatalog(
  payload: OpenAIWebAuditPayload,
  assessedAt: string,
): ValidatedEvidenceItem[] {
  return payload.sourceReferences.slice(0, 20).map((ref, index) => ({
    id: `openai-source-${index + 1}`,
    kind: "website" as const,
    sourceUrl: ref.url,
    observedAt: assessedAt,
    collectionMethod: "openai_web_search" as const,
    availability: "available" as const,
    title: ref.title,
  }));
}

function mapFindings(payload: OpenAIWebAuditPayload): AssessmentFinding[] {
  const strengths = payload.strengths.map((item, index) => ({
    id: `strength-${index + 1}`,
    categoryId: item.categoryId,
    kind: "strength" as const,
    title: item.title,
    description: item.description,
    evidenceIds: [] as string[],
    confidence: "medium",
    source: "ai_grounded" as const,
  }));
  const weaknesses = payload.improvements.map((item, index) => ({
    id: `weakness-${index + 1}`,
    categoryId: item.categoryId,
    kind: "weakness" as const,
    title: item.title,
    description: item.description,
    evidenceIds: [] as string[],
    confidence: "medium",
    source: "ai_grounded" as const,
  }));
  return [...strengths, ...weaknesses];
}

function mapRecommendations(
  payload: OpenAIWebAuditPayload,
): AssessmentRecommendation[] {
  return payload.recommendations.slice(0, 12).map((item, index) => ({
    id: `rec-${index + 1}`,
    categoryId: item.categoryId,
    title: item.title,
    description: item.description,
    evidenceIds: [],
    priority: item.priority,
    source: "ai_grounded" as const,
  }));
}

/**
 * OpenAI-only digital presence assessment (web_search retrieval + structured audit).
 */
export async function runAssessment(
  request: AssessmentRequest,
): Promise<AssessmentResult> {
  const assessmentId = `live-${randomUUID()}`;
  const startedAt = request.assessedAt ?? utcNow();
  const timeoutMs = request.timeoutMs ?? DEFAULT_ASSESSMENT_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;

  const assertNotAborted = () => {
    if (request.signal?.aborted) {
      throw new Error("Assessment aborted.");
    }
    if (Date.now() > deadline) {
      throw new Error("Assessment timed out.");
    }
  };

  if (
    request.allowMissingWebsite &&
    (!request.websiteUrl || !request.websiteUrl.trim())
  ) {
    return limitedFailure({
      assessmentId,
      startedAt,
      finishedAt: utcNow(),
      websiteUrl: request.websiteUrl || "",
      businessName: request.businessName ?? null,
      errors: [
        {
          code: "insufficient_evidence",
          message: "A website URL is required for a digital presence audit.",
        },
      ],
      openai: "not_requested",
    });
  }

  emitProgress(request, "validating", "started", "Validating website URL.");
  const structure = validateUrlStructure(request.websiteUrl);
  if (!structure.ok) {
    emitProgress(request, "validating", "failed", "Website URL is invalid.");
    return limitedFailure({
      assessmentId,
      startedAt,
      finishedAt: utcNow(),
      websiteUrl: request.websiteUrl,
      businessName: request.businessName ?? null,
      errors: [
        {
          code: "invalid_input",
          message: structure.error.message || "Invalid website URL.",
        },
      ],
      openai: "not_requested",
    });
  }

  const normalizedWebsiteUrl = structure.url.href;
  emitProgress(request, "validating", "completed", "Website URL validated.");

  assertNotAborted();
  emitProgress(
    request,
    "retrieving",
    "started",
    "Retrieving public website information.",
  );

  const call = request.openaiAuditFn
    ? await request.openaiAuditFn({
        websiteUrl: normalizedWebsiteUrl,
        signal: request.signal,
      })
    : await requestOpenAIWebAudit({
        websiteUrl: normalizedWebsiteUrl,
        signal: request.signal,
        timeoutMs: Math.max(5_000, deadline - Date.now()),
      });

  if (!call.ok) {
    emitProgress(request, "retrieving", "failed", call.message);
    const errors: AssessmentError[] = [
      {
        code:
          call.code === "missing_api_key" || call.code === "quota_exceeded"
            ? "openai_failure"
            : call.code === "timeout"
              ? "assessment_timeout"
              : call.code === "invalid_response"
                ? "invalid_ai_output"
                : "openai_failure",
        message: call.message,
      },
    ];
    return limitedFailure({
      assessmentId,
      startedAt,
      finishedAt: utcNow(),
      websiteUrl: request.websiteUrl,
      businessName: request.businessName ?? null,
      normalizedWebsiteUrl,
      errors,
      openai: call.code === "missing_api_key" ? "unavailable" : "error",
      limitationReasons: [
        "Some aspects of the website could not be assessed using the available public information.",
      ],
    });
  }

  emitProgress(
    request,
    "retrieving",
    "completed",
    call.payload.retrievalSucceeded
      ? "Public website information retrieved."
      : "Limited public information retrieved.",
  );

  assertNotAborted();
  emitProgress(
    request,
    "analyzing",
    "started",
    "Analyzing digital presence signals.",
  );
  emitProgress(
    request,
    "analyzing",
    "completed",
    "Digital presence analysis complete.",
  );

  emitProgress(request, "scoring", "started", "Calculating category scores.");
  const scoring = scoreOpenAIWebAudit(call.payload, startedAt);
  emitProgress(request, "scoring", "completed", "Scores calculated.");

  emitProgress(
    request,
    "preparing_report",
    "started",
    "Preparing your Digital Presence Report.",
  );

  const warnings: AssessmentWarning[] = [];
  if (!call.webSearchUsed && call.payload.retrievalSucceeded) {
    warnings.push({
      code: "web_search_not_observed",
      message:
        "OpenAI did not report a web search tool call for this audit run.",
      integration: "openai",
    });
  }

  const limitationReasons = [
    ...(call.payload.limitationSummary
      ? [call.payload.limitationSummary]
      : []),
    ...(!call.payload.retrievalSucceeded
      ? [
          "Some aspects of the website could not be assessed using the available public information.",
        ]
      : []),
  ].filter((value, index, arr) => arr.indexOf(value) === index);

  const evidenceCatalog = buildEvidenceCatalog(call.payload, startedAt);
  const finishedAt = utcNow();

  emitProgress(
    request,
    "preparing_report",
    "completed",
    "Report preparation complete.",
  );

  return {
    assessmentId,
    ok: true,
    status: scoring.status,
    assessedAt: startedAt,
    scoringVersion: OPENAI_AUDIT_VERSION,
    business: {
      businessName: call.payload.businessName ?? request.businessName ?? null,
      websiteUrl: request.websiteUrl,
      normalizedWebsiteUrl,
      serviceAreaSignals: [],
      businessModel: request.businessModelHint ?? "unknown",
    },
    websiteUrl: request.websiteUrl,
    overallScore: scoring.totalScore,
    totalMaxPoints: scoring.totalMaxPoints,
    maturityBand: scoring.maturity,
    evidenceCoverage: scoring.coverage,
    categories: scoring.categories,
    findings: mapFindings(call.payload),
    recommendations: mapRecommendations(call.payload),
    unassessedCriteria: scoring.unavailableChecks,
    notApplicableCriteria: scoring.notApplicableChecks,
    integrationAvailability: emptyAvailability("available"),
    evidenceCatalog,
    evidenceValidationIssues: [],
    assessmentValidationIssues: [],
    scoringPolicyFlags: scoring.policyFlags,
    scoringPolicyDisclosures: [],
    limitationReasons,
    warnings,
    errors: [],
    scoring,
    rejectedAiFindingIds: [],
    startedAt,
    finishedAt,
    ephemeral: true,
    executiveSummary: call.payload.executiveSummary,
    nextSteps: call.payload.nextSteps,
    categoryNarratives: Object.fromEntries(
      call.payload.categories.map((category) => [
        category.categoryId,
        category.summary,
      ]),
    ),
  };
}

function limitedFailure(input: {
  assessmentId: string;
  startedAt: string;
  finishedAt: string;
  websiteUrl: string;
  businessName: string | null;
  normalizedWebsiteUrl?: string | null;
  errors: AssessmentError[];
  openai: IntegrationAvailability["openai"];
  limitationReasons?: string[];
}): AssessmentResult {
  return {
    assessmentId: input.assessmentId,
    ok: false,
    status: "LIMITED_VISIBILITY",
    assessedAt: input.startedAt,
    scoringVersion: OPENAI_AUDIT_VERSION,
    business: {
      businessName: input.businessName,
      websiteUrl: input.websiteUrl,
      normalizedWebsiteUrl: input.normalizedWebsiteUrl ?? null,
      serviceAreaSignals: [],
      businessModel: "unknown",
    },
    websiteUrl: input.websiteUrl,
    overallScore: null,
    totalMaxPoints: 100,
    maturityBand: {
      band: null,
      label: null,
      eligible: false,
      reason: "No maturity band for limited visibility snapshot.",
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
    integrationAvailability: emptyAvailability(input.openai),
    evidenceCatalog: [],
    evidenceValidationIssues: [],
    assessmentValidationIssues: [],
    scoringPolicyFlags: [],
    scoringPolicyDisclosures: [],
    limitationReasons: input.limitationReasons ?? [
      "Some aspects of the website could not be assessed using the available public information.",
    ],
    warnings: [],
    errors: input.errors,
    scoring: null,
    rejectedAiFindingIds: [],
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    ephemeral: true,
    executiveSummary:
      "A complete numerical digital presence score could not be published because public website information was insufficient for this run.",
    nextSteps: [
      "Confirm the website is publicly reachable and try the audit again.",
    ],
    categoryNarratives: {},
  };
}
