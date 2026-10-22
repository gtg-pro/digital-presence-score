import type { AuditOutcomeStatus } from "@/lib/audit/scoring/scoring.types";

export const OPENAI_AUDIT_VERSION = "openai-web-v1.0" as const;

export type OpenAICriterionAssessment = "PASS" | "PARTIAL" | "FAIL" | "NOT_ASSESSED";

export type OpenAICategoryId =
  | "website_experience"
  | "local_seo_presence"
  | "reputation_trust"
  | "content_authority"
  | "conversion_readiness";

export type OpenAIAuditSourceRef = {
  url: string;
  title: string;
};

export type OpenAIAuditCriterionResult = {
  criterionId: string;
  assessment: OpenAICriterionAssessment;
  rationale: string;
};

export type OpenAIAuditObservation = {
  title: string;
  detail: string;
  kind: "strength" | "improvement" | "neutral";
};

export type OpenAIAuditCategoryResult = {
  categoryId: OpenAICategoryId;
  summary: string;
  observations: OpenAIAuditObservation[];
  criteria: OpenAIAuditCriterionResult[];
};

export type OpenAIAuditRecommendation = {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  categoryId: OpenAICategoryId;
};

/** Validated structured audit payload from OpenAI (post-Zod). */
export type OpenAIWebAuditPayload = {
  websiteUrl: string;
  businessName: string | null;
  retrievalSucceeded: boolean;
  retrievalNotes: string;
  sourceReferences: OpenAIAuditSourceRef[];
  assessmentStatus: AuditOutcomeStatus;
  executiveSummary: string;
  categories: OpenAIAuditCategoryResult[];
  strengths: Array<{ title: string; description: string; categoryId: OpenAICategoryId }>;
  improvements: Array<{
    title: string;
    description: string;
    recommendedAction: string;
    categoryId: OpenAICategoryId;
    severity: "high" | "medium" | "low";
  }>;
  recommendations: OpenAIAuditRecommendation[];
  nextSteps: string[];
  limitationSummary: string | null;
};

export type OpenAIWebAuditCallResult =
  | {
      ok: true;
      payload: OpenAIWebAuditPayload;
      model: string;
      webSearchUsed: boolean;
      citedUrls: string[];
    }
  | {
      ok: false;
      code:
        | "missing_api_key"
        | "timeout"
        | "rate_limited"
        | "quota_exceeded"
        | "invalid_response"
        | "provider_error"
        | "aborted";
      message: string;
      retryable: boolean;
    };
