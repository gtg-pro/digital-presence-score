/**
 * OpenAI-only digital presence assessment orchestration types.
 * Ephemeral AssessmentResult — no durable storage implied.
 */

import type { OpenAIWebAuditCallResult } from "@/lib/audit/openai-audit/openai-audit.types";
import type {
  AuditOutcomeStatus,
  BusinessModelHint,
  CategoryScore,
  CoverageReport,
  CriterionId,
  MaturityBandResult,
  ScoringPolicyFlag,
  ScoringResult,
  ScoringVersionId,
} from "@/lib/audit/scoring/scoring.types";
import type {
  EvidenceValidationIssue,
  ValidatedEvidenceItem,
} from "@/lib/audit/validation/evidence-validator";
import type { AssessmentValidationIssue } from "@/lib/audit/validation/assessment-validator";

export type IntegrationAvailabilityStatus =
  | "available"
  | "unavailable"
  | "error"
  | "skipped"
  | "not_requested";

export type IntegrationAvailability = {
  /** Retained for report/session compatibility; always not_requested in OpenAI-only mode. */
  crawler: IntegrationAvailabilityStatus;
  /** Retained for report/session compatibility; always not_requested in OpenAI-only mode. */
  pagespeed: IntegrationAvailabilityStatus;
  openai: IntegrationAvailabilityStatus;
  scoring: IntegrationAvailabilityStatus;
};

export type AssessmentWarning = {
  code: string;
  message: string;
  integration?: keyof IntegrationAvailability;
};

export type AssessmentError = {
  code:
    | "invalid_input"
    | "website_unreachable"
    | "robots_restricted"
    | "partial_crawl"
    | "pagespeed_failure"
    | "openai_failure"
    | "invalid_ai_output"
    | "insufficient_evidence"
    | "scoring_validation_failure"
    | "assessment_timeout"
    | "unknown";
  message: string;
  details?: string;
};

export type AssessmentBusinessContext = {
  businessName: string | null;
  websiteUrl: string;
  normalizedWebsiteUrl: string | null;
  serviceAreaSignals: string[];
  businessModel: BusinessModelHint;
};

export type AssessmentFinding = {
  id: string;
  categoryId: string;
  kind: "strength" | "weakness" | "observation";
  title: string;
  description: string;
  evidenceIds: string[];
  confidence: string | null;
  source: "scoring" | "ai_grounded";
};

export type AssessmentRecommendation = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  evidenceIds: string[];
  priority: "high" | "medium" | "low";
  source: "scoring" | "ai_grounded";
};

/** Pipeline stages reported via optional onProgress (genuine work markers). */
export type AssessmentProgressStage =
  | "validating"
  | "retrieving"
  | "analyzing"
  | "scoring"
  | "preparing_report";

export type AssessmentProgressEvent = {
  stage: AssessmentProgressStage;
  status: "started" | "completed" | "skipped" | "failed";
  /** Safe, user-facing message — never secrets or stack traces. */
  message: string;
  at: string;
};

export type AssessmentRequest = {
  websiteUrl: string;
  businessName?: string | null;
  businessModelHint?: BusinessModelHint;
  scoringVersion?: ScoringVersionId;
  /** Overall wall-clock budget for the assessment (default 120s). */
  timeoutMs?: number;
  assessedAt?: string;
  /**
   * Allow empty website URL (minimal-info path).
   * Produces LIMITED_VISIBILITY without OpenAI retrieval.
   */
  allowMissingWebsite?: boolean;
  /** Optional abort for disconnected clients / cancellation. */
  signal?: AbortSignal;
  /** Optional genuine stage progress reporter. */
  onProgress?: (event: AssessmentProgressEvent) => void;
  /**
   * Test-only injectable. Production uses live OpenAI web audit.
   * When provided, the live OpenAI network call is skipped.
   */
  openaiAuditFn?: (input: {
    websiteUrl: string;
    signal?: AbortSignal;
  }) => Promise<OpenAIWebAuditCallResult>;
};

/**
 * Structured OpenAI-only audit output.
 * Compatible with DigitalPresenceReport mapping (nullable score/band, categories).
 */
export type AssessmentResult = {
  assessmentId: string;
  ok: boolean;
  status: AuditOutcomeStatus;
  assessedAt: string;
  scoringVersion: ScoringVersionId;
  business: AssessmentBusinessContext;
  websiteUrl: string;
  overallScore: number | null;
  totalMaxPoints: number;
  maturityBand: MaturityBandResult;
  evidenceCoverage: CoverageReport;
  categories: CategoryScore[];
  findings: AssessmentFinding[];
  recommendations: AssessmentRecommendation[];
  unassessedCriteria: CriterionId[];
  notApplicableCriteria: CriterionId[];
  integrationAvailability: IntegrationAvailability;
  evidenceCatalog: ValidatedEvidenceItem[];
  evidenceValidationIssues: EvidenceValidationIssue[];
  assessmentValidationIssues: AssessmentValidationIssue[];
  scoringPolicyFlags: ScoringPolicyFlag[];
  scoringPolicyDisclosures: string[];
  limitationReasons: string[];
  warnings: AssessmentWarning[];
  errors: AssessmentError[];
  /** Raw scoring snapshot for validation / future mapping. */
  scoring: ScoringResult | null;
  rejectedAiFindingIds: string[];
  startedAt: string;
  finishedAt: string;
  ephemeral: true;
  /** Customer-facing executive summary from validated OpenAI payload. */
  executiveSummary: string | null;
  /** Prioritized next steps (professional copy). */
  nextSteps: string[];
  /** Category narrative summaries keyed by scoring category id. */
  categoryNarratives: Record<string, string>;
};
