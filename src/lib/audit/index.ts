/**
 * Server-side audit library (OpenAI-only web audit).
 * Import only from Server Components, Route Handlers, or scripts.
 */

export {
  isBlockedHostname,
  isBlockedIpAddress,
  normalizeCrawlUrl,
  validatePublicCrawlUrl,
  validateUrlStructure,
} from "@/lib/audit/crawler/url-validator";

export {
  DEFAULT_OPENAI_MODEL,
  redactOpenAISecrets,
  resolveOpenAIModel,
} from "@/lib/audit/integrations/openai/openai-client";

export type {
  AssessmentState,
  ApplicabilityState,
  AuditOutcomeStatus,
  CategoryScore,
  CoverageReport,
  MaturityBandId,
  ScoredCriterion,
  ScoringResult,
  ScoringVersionId,
} from "@/lib/audit/scoring/scoring.types";

export { SCORING_VERSION_STRICT_V1 } from "@/lib/audit/scoring/scoring.types";

export {
  getScoringConfig,
  SCORING_CONFIG_STRICT_V1,
  listScoringVersions,
} from "@/lib/audit/scoring/scoring-config";

export {
  assignMaturityBand,
  MATURITY_BANDS,
} from "@/lib/audit/scoring/maturity-bands";

export type {
  AssessmentBusinessContext,
  AssessmentError,
  AssessmentFinding,
  AssessmentRecommendation,
  AssessmentRequest,
  AssessmentResult,
  AssessmentWarning,
  IntegrationAvailability,
  IntegrationAvailabilityStatus,
} from "@/lib/audit/orchestration/assessment.types";

export {
  runAssessment,
  DEFAULT_ASSESSMENT_TIMEOUT_MS,
} from "@/lib/audit/orchestration/assessment";

export type {
  EvidenceValidationIssue,
  ValidatedEvidenceItem,
} from "@/lib/audit/validation/evidence-validator";

export type {
  AssessmentValidationIssue,
  AssessmentValidationResult,
} from "@/lib/audit/validation/assessment-validator";

export { validateScoringResult } from "@/lib/audit/validation/assessment-validator";

export {
  OPENAI_AUDIT_VERSION,
  type OpenAIWebAuditPayload,
  type OpenAIWebAuditCallResult,
} from "@/lib/audit/openai-audit/openai-audit.types";

export { scoreOpenAIWebAudit } from "@/lib/audit/openai-audit/score-openai-audit";
export { requestOpenAIWebAudit } from "@/lib/audit/openai-audit/openai-web-client";
