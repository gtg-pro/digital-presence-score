/**
 * Server-side audit crawl library.
 * Import only from Server Components, Route Handlers, or scripts.
 */

export type {
  AssessmentAvailability,
  CrawlError,
  CrawlErrorCode,
  CrawlRequest,
  CrawlResult,
  EvidenceExtractionMethod,
  EvidenceSource,
  PageEvidence,
  WebsiteEvidence,
} from "@/features/audit/types/evidence.types";

export {
  crawlWebsite,
  DEFAULT_CRAWL_LIMITS,
  extractEvidenceFromHtmlFixture,
} from "@/lib/audit/crawler/crawler";

export {
  isBlockedHostname,
  isBlockedIpAddress,
  normalizeCrawlUrl,
  validatePublicCrawlUrl,
  validateUrlStructure,
} from "@/lib/audit/crawler/url-validator";

export {
  createRobotsRulesFromBody,
  isPathAllowedByRules,
  matchesRobotsPattern,
  parseRobotsTxt,
} from "@/lib/audit/crawler/robots";

export { extractPageEvidence } from "@/lib/audit/extraction/extract-page";
export { aggregateWebsiteEvidence } from "@/lib/audit/extraction/extract-website";

export type {
  MeasurementAvailability,
  PerformanceDeviceStrategy,
  PerformanceError,
  PerformanceEvidence,
  PerformanceMetric,
  PerformanceMetrics,
  PerformanceRequest,
  PerformanceResult,
} from "@/lib/audit/integrations/pagespeed/pagespeed.types";

export {
  collectPagespeedEvidence,
  DEFAULT_PAGESPEED_OPTIONS,
  GOOGLE_PAGESPEED_ENDPOINT,
  redactSecrets,
} from "@/lib/audit/integrations/pagespeed/pagespeed";

export {
  createUnavailableEvidence,
  parsePagespeedResponse,
} from "@/lib/audit/integrations/pagespeed/pagespeed-parser";

export type {
  AIAnalysisError,
  AIAnalysisFinding,
  AIAnalysisRequest,
  AIAnalysisResult,
  AIRecommendation,
  AnalysisAvailability,
  AnalysisCategoryId,
  PreparedAnalysisInput,
} from "@/lib/audit/integrations/openai/analysis.types";

export {
  analyzeWebsiteEvidence,
  enforceEvidenceGrounding,
  prepareAnalysisInput,
  DEFAULT_ANALYSIS_PREP,
} from "@/lib/audit/integrations/openai/analysis";

export {
  DEFAULT_OPENAI_MODEL,
  redactOpenAISecrets,
  resolveOpenAIModel,
  requestStructuredAnalysis,
} from "@/lib/audit/integrations/openai/openai-client";

export { validateModelOutput } from "@/lib/audit/integrations/openai/analysis-schema";

export type {
  AssessmentState,
  ApplicabilityState,
  AuditOutcomeStatus,
  CategoryScore,
  CoverageReport,
  MaturityBandId,
  ScoredCriterion,
  ScoringInput,
  ScoringResult,
  ScoringVersionId,
} from "@/lib/audit/scoring/scoring.types";

export {
  SCORING_VERSION_STRICT_V1,
} from "@/lib/audit/scoring/scoring.types";

export {
  getScoringConfig,
  SCORING_CONFIG_STRICT_V1,
  listScoringVersions,
} from "@/lib/audit/scoring/scoring-config";

export { scoreDigitalPresence } from "@/lib/audit/scoring/scoring-engine";

export { assignMaturityBand, MATURITY_BANDS } from "@/lib/audit/scoring/maturity-bands";

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
  EvidenceValidationResult,
  ValidatedEvidenceItem,
} from "@/lib/audit/validation/evidence-validator";

export {
  validateCollectedEvidence,
  applyGroundedAnalysis,
} from "@/lib/audit/validation/evidence-validator";

export type {
  AssessmentValidationIssue,
  AssessmentValidationResult,
} from "@/lib/audit/validation/assessment-validator";

export { validateScoringResult } from "@/lib/audit/validation/assessment-validator";
