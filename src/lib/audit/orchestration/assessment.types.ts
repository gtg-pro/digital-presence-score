/**
 * Hybrid Audit assessment orchestration types.
 * Ephemeral AssessmentResult — no durable storage implied.
 */

import type { CrawlResult } from "@/features/audit/types/evidence.types";
import type { AIAnalysisResult } from "@/lib/audit/integrations/openai/analysis.types";
import type { PerformanceResult } from "@/lib/audit/integrations/pagespeed/pagespeed.types";
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
  crawler: IntegrationAvailabilityStatus;
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
  | "crawling"
  | "collecting_evidence"
  | "pagespeed"
  | "content_analysis"
  | "validating_findings"
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
  /** Skip PageSpeed (still records unavailable). */
  skipPagespeed?: boolean;
  /** Skip OpenAI analysis (still records unavailable). */
  skipOpenAI?: boolean;
  assessedAt?: string;
  /**
   * Allow empty website URL (minimal-info path).
   * Produces LIMITED_VISIBILITY without crawling.
   */
  allowMissingWebsite?: boolean;
  /** Optional abort for disconnected clients / cancellation. */
  signal?: AbortSignal;
  /** Optional genuine stage progress reporter. */
  onProgress?: (event: AssessmentProgressEvent) => void;
  /**
   * Test-only injectables. Production uses live integrations.
   * When provided, live network calls for that stage are skipped.
   */
  crawlFn?: (url: string) => Promise<CrawlResult>;
  pagespeedFn?: (crawl: CrawlResult) => Promise<PerformanceResult | null>;
  analysisFn?: (crawl: CrawlResult) => Promise<AIAnalysisResult | null>;
  /** Test-only scoring override. Production uses scoreDigitalPresence. */
  scoringFn?: (input: {
    crawl: CrawlResult;
    performance: PerformanceResult | null;
    analysis: AIAnalysisResult | null;
  }) => ScoringResult;
};

/**
 * Structured Hybrid Audit output.
 * Compatible in spirit with DigitalPresenceReport (nullable score/band, categories, coverage).
 * Not wired to the frontend yet.
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
  /** Raw scoring snapshot for debugging / future report mapping. */
  scoring: ScoringResult | null;
  rejectedAiFindingIds: string[];
  startedAt: string;
  finishedAt: string;
  ephemeral: true;
};
