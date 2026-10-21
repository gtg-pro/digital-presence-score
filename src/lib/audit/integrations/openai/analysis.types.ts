/**
 * OpenAI qualitative analysis types.
 * Separate from raw crawl evidence and from deterministic numerical scoring.
 */

import type {
  CrawlResult,
  PageEvidence,
  WebsiteEvidence,
} from "@/features/audit/types/evidence.types";

export type AnalysisAvailability =
  | "available"
  | "partial"
  | "insufficient_evidence"
  | "not_assessed"
  | "error";

export type AnalysisCategoryId =
  | "website_experience"
  | "local_seo_presence"
  | "reputation_trust"
  | "content_authority"
  | "conversion_readiness";

export type AnalysisConfidence = "high" | "medium" | "low";

export type AnalysisFindingKind = "strength" | "weakness" | "observation";

export type AIAnalysisFinding = {
  id: string;
  category: AnalysisCategoryId;
  kind: AnalysisFindingKind;
  title: string;
  description: string;
  evidenceIds: string[];
  reasoningSummary: string;
  suggestedImprovement: string | null;
  confidence: AnalysisConfidence;
};

export type AIRecommendation = {
  id: string;
  category: AnalysisCategoryId;
  title: string;
  description: string;
  evidenceIds: string[];
  priority: "high" | "medium" | "low";
  confidence: AnalysisConfidence;
};

export type CategoryObservation = {
  category: AnalysisCategoryId;
  availability: AnalysisAvailability;
  summary: string;
  findingIds: string[];
};

export type AIAnalysisErrorCode =
  | "missing_api_key"
  | "empty_evidence"
  | "insufficient_evidence"
  | "timeout"
  | "rate_limited"
  | "quota_exceeded"
  | "invalid_response"
  | "schema_validation_failed"
  | "model_refusal"
  | "network_error"
  | "provider_error"
  | "unknown";

export type AIAnalysisError = {
  code: AIAnalysisErrorCode;
  message: string;
  details?: string;
};

export type PreparedEvidenceItem = {
  id: string;
  kind: "page" | "website";
  url: string;
  observedAt: string;
  title?: string | null;
  metaDescription?: string | null;
  headings?: Array<{ level: number; text: string }>;
  excerpt?: string;
  ctas?: Array<{ text: string; href: string | null }>;
  contact?: {
    emails: string[];
    phones: string[];
    addresses: string[];
  };
  hasStructuredData?: boolean;
  structuredDataTypes?: string[];
  publicationDate?: string | null;
  notes?: string;
};

export type PreparedAnalysisInput = {
  seedUrl: string;
  normalizedUrl: string;
  pagesCrawled: number;
  pagesSkipped: number;
  partialCrawl: boolean;
  websiteSummary: {
    homepageUrl: string | null;
    discoveredServicePages: string[];
    contactPageAvailable: string;
    aboutPageAvailable: string;
    serviceAreaSignals: string[];
    publicSocialProfileLinks: string[];
    faqOrResourcePages: string[];
    primaryConversionPathways: Array<{ text: string; href: string | null }>;
  } | null;
  evidence: PreparedEvidenceItem[];
  evidenceIdSet: string[];
};

export type AIAnalysisRequest = {
  crawl: CrawlResult;
  /** Optional override for tests. Production uses OPENAI_API_KEY. */
  apiKey?: string;
  /** Optional override. Production uses OPENAI_MODEL (default gpt-4o-mini). */
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
  /** Max characters of combined excerpts (default 24_000). */
  maxInputChars?: number;
  /** Max pages included in the prompt (default 12). */
  maxPages?: number;
  /**
   * Test-only injectable transport. Production uses requestStructuredAnalysis.
   */
  requestFn?: (args: {
    apiKey: string;
    model: string;
    input: PreparedAnalysisInput;
    timeoutMs?: number;
    maxRetries?: number;
  }) => Promise<
    | { ok: true; output: unknown; model: string }
    | {
        ok: false;
        error: AIAnalysisError;
        retryable: boolean;
      }
  >;
};

export type AIAnalysisResult = {
  ok: boolean;
  status: AnalysisAvailability;
  analyzedAt: string;
  model: string;
  industryContext: string | null;
  businessContext: string | null;
  categoryObservations: CategoryObservation[];
  findings: AIAnalysisFinding[];
  recommendations: AIRecommendation[];
  areasRequiringVerification: string[];
  unavailableObservations: string[];
  overallConfidence: AnalysisConfidence | null;
  unsupportedClaimsDropped: number;
  preparedEvidenceIds: string[];
  errors: AIAnalysisError[];
  startedAt: string;
  finishedAt: string;
};

/** Raw model JSON before evidence-ID enforcement. */
export type AIAnalysisModelOutput = {
  status: AnalysisAvailability;
  industryContext: string | null;
  businessContext: string | null;
  categoryObservations: CategoryObservation[];
  findings: AIAnalysisFinding[];
  recommendations: AIRecommendation[];
  areasRequiringVerification: string[];
  unavailableObservations: string[];
  overallConfidence: AnalysisConfidence;
};

export type AnalysisPrepOptions = {
  maxPages?: number;
  maxExcerptCharsPerPage?: number;
  maxInputChars?: number;
};

/** Re-export crawl shapes for consumers preparing analysis input. */
export type { CrawlResult, PageEvidence, WebsiteEvidence };
