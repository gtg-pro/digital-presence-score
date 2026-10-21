import "server-only";

import type { CrawlResult, PageEvidence } from "@/features/audit/types/evidence.types";
import {
  detectPromptInjectionSignals,
} from "@/lib/audit/integrations/openai/analysis-prompt";
import { validateModelOutput } from "@/lib/audit/integrations/openai/analysis-schema";
import type {
  AIAnalysisFinding,
  AIAnalysisRequest,
  AIAnalysisResult,
  AIRecommendation,
  AnalysisPrepOptions,
  CategoryObservation,
  PreparedAnalysisInput,
  PreparedEvidenceItem,
} from "@/lib/audit/integrations/openai/analysis.types";
import {
  DEFAULT_OPENAI_MAX_RETRIES,
  DEFAULT_OPENAI_TIMEOUT_MS,
  redactOpenAISecrets,
  requestStructuredAnalysis,
  resolveOpenAIApiKey,
  resolveOpenAIModel,
} from "@/lib/audit/integrations/openai/openai-client";

export const DEFAULT_ANALYSIS_PREP: Required<AnalysisPrepOptions> = {
  maxPages: 12,
  maxExcerptCharsPerPage: 1_200,
  maxInputChars: 24_000,
};

function utcNow(): string {
  return new Date().toISOString();
}

function truncate(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

function pagePriority(page: PageEvidence): number {
  const path = (() => {
    try {
      return new URL(page.finalUrl).pathname.toLowerCase();
    } catch {
      return page.finalUrl.toLowerCase();
    }
  })();
  if (path === "/" || path === "") return 100;
  if (/service/.test(path)) return 90;
  if (/about|contact/.test(path)) return 80;
  if (/faq|resource|blog|guide/.test(path)) return 60;
  return 20;
}

/**
 * Convert crawl evidence into a bounded, ID'd payload for the model.
 * Does not send raw HTML documents.
 */
export function prepareAnalysisInput(
  crawl: CrawlResult,
  options: AnalysisPrepOptions = {},
):
  | { ok: true; input: PreparedAnalysisInput; injectionSignals: string[] }
  | { ok: false; reason: "empty_evidence" | "insufficient_evidence" } {
  const maxPages = options.maxPages ?? DEFAULT_ANALYSIS_PREP.maxPages;
  const maxExcerpt =
    options.maxExcerptCharsPerPage ?? DEFAULT_ANALYSIS_PREP.maxExcerptCharsPerPage;
  const maxInputChars = options.maxInputChars ?? DEFAULT_ANALYSIS_PREP.maxInputChars;

  if (!crawl.website || crawl.pages.length === 0) {
    return { ok: false, reason: "empty_evidence" };
  }

  const rankedPages = [...crawl.pages]
    .sort((a, b) => pagePriority(b) - pagePriority(a))
    .slice(0, maxPages);

  const evidence: PreparedEvidenceItem[] = [];
  const injectionSignals = new Set<string>();

  evidence.push({
    id: "website-1",
    kind: "website",
    url: crawl.website.normalizedSeedUrl,
    observedAt: crawl.website.source.observedAt,
    notes: `pagesCrawled=${crawl.website.pagesCrawled}; skipped=${crawl.website.pagesSkipped}; robotsRespected=${crawl.website.robotsRespected}`,
  });

  let budget = maxInputChars;
  rankedPages.forEach((page, index) => {
    const excerpt = truncate(page.mainTextExcerpt, Math.min(maxExcerpt, Math.max(budget, 0)));
    for (const signal of detectPromptInjectionSignals(
      `${page.title ?? ""} ${excerpt}`,
    )) {
      injectionSignals.add(signal);
    }

    const item: PreparedEvidenceItem = {
      id: `page-${index + 1}`,
      kind: "page",
      url: page.finalUrl,
      observedAt: page.source.observedAt,
      title: page.title,
      metaDescription: page.metaDescription
        ? truncate(page.metaDescription, 300)
        : null,
      headings: page.headings.slice(0, 12).map((heading) => ({
        level: heading.level,
        text: truncate(heading.text, 160),
      })),
      excerpt,
      ctas: page.ctas.slice(0, 8),
      contact: {
        emails: page.contact.emails.slice(0, 5),
        phones: page.contact.phones.slice(0, 5),
        addresses: page.contact.addresses.slice(0, 3),
      },
      hasStructuredData: page.hasStructuredData,
      structuredDataTypes: page.structuredDataTypes.slice(0, 10),
      publicationDate: page.publicationDate,
    };

    const estimated = JSON.stringify(item).length;
    if (estimated > budget && evidence.length > 1) {
      return;
    }
    budget -= estimated;
    evidence.push(item);
  });

  // Need at least website + one page
  if (evidence.length < 2) {
    return { ok: false, reason: "insufficient_evidence" };
  }

  const website = crawl.website;
  const input: PreparedAnalysisInput = {
    seedUrl: crawl.request.url,
    normalizedUrl: crawl.request.normalizedUrl,
    pagesCrawled: crawl.website.pagesCrawled,
    pagesSkipped: crawl.website.pagesSkipped,
    partialCrawl: crawl.partial,
    websiteSummary: {
      homepageUrl: website.homepageUrl,
      discoveredServicePages: website.discoveredServicePages.slice(0, 15),
      contactPageAvailable: website.contactPageAvailable,
      aboutPageAvailable: website.aboutPageAvailable,
      serviceAreaSignals: website.serviceAreaSignals.slice(0, 10),
      publicSocialProfileLinks: website.publicSocialProfileLinks.slice(0, 10),
      faqOrResourcePages: website.faqOrResourcePages.slice(0, 10),
      primaryConversionPathways: website.primaryConversionPathways.slice(0, 10),
    },
    evidence,
    evidenceIdSet: evidence.map((item) => item.id),
  };

  return {
    ok: true,
    input,
    injectionSignals: [...injectionSignals],
  };
}

function filterEvidenceIds(
  ids: string[],
  allowed: Set<string>,
): { kept: string[]; dropped: boolean } {
  const kept = ids.filter((id) => allowed.has(id));
  return { kept, dropped: kept.length !== ids.length || kept.length === 0 };
}

/**
 * Drop findings/recommendations that cite unknown evidence IDs.
 */
export function enforceEvidenceGrounding<T extends {
  findings: AIAnalysisFinding[];
  recommendations: AIRecommendation[];
  categoryObservations: CategoryObservation[];
}>(
  output: T,
  allowedEvidenceIds: string[],
): { data: T; unsupportedClaimsDropped: number } {
  const allowed = new Set(allowedEvidenceIds);
  let dropped = 0;

  const findings: AIAnalysisFinding[] = [];
  for (const finding of output.findings) {
    const { kept, dropped: wasDropped } = filterEvidenceIds(
      finding.evidenceIds,
      allowed,
    );
    if (wasDropped && kept.length === 0) {
      dropped += 1;
      continue;
    }
    if (wasDropped) dropped += 1;
    findings.push({ ...finding, evidenceIds: kept });
  }

  const recommendations: AIRecommendation[] = [];
  for (const recommendation of output.recommendations) {
    const { kept, dropped: wasDropped } = filterEvidenceIds(
      recommendation.evidenceIds,
      allowed,
    );
    if (wasDropped && kept.length === 0) {
      dropped += 1;
      continue;
    }
    if (wasDropped) dropped += 1;
    recommendations.push({ ...recommendation, evidenceIds: kept });
  }

  const findingIdSet = new Set(findings.map((finding) => finding.id));
  const categoryObservations = output.categoryObservations.map((observation) => ({
    ...observation,
    findingIds: observation.findingIds.filter((id) => findingIdSet.has(id)),
  }));

  return {
    data: {
      ...output,
      findings,
      recommendations,
      categoryObservations,
    },
    unsupportedClaimsDropped: dropped,
  };
}

/**
 * Orchestrate OpenAI qualitative analysis from crawl evidence.
 * Does not assign numerical scores. Does not erase crawler/PageSpeed data.
 */
export async function analyzeWebsiteEvidence(
  request: AIAnalysisRequest,
): Promise<AIAnalysisResult> {
  const startedAt = utcNow();
  const model = resolveOpenAIModel(request.model);
  const apiKey = resolveOpenAIApiKey(request.apiKey);

  const baseResult = {
    analyzedAt: startedAt,
    model,
    industryContext: null as string | null,
    businessContext: null as string | null,
    categoryObservations: [] as CategoryObservation[],
    findings: [] as AIAnalysisFinding[],
    recommendations: [] as AIRecommendation[],
    areasRequiringVerification: [] as string[],
    unavailableObservations: [] as string[],
    overallConfidence: null as AIAnalysisResult["overallConfidence"],
    unsupportedClaimsDropped: 0,
    preparedEvidenceIds: [] as string[],
    startedAt,
  };

  if (!apiKey) {
    return {
      ...baseResult,
      ok: false,
      status: "not_assessed",
      errors: [
        {
          code: "missing_api_key",
          message:
            "OPENAI_API_KEY is not configured. Qualitative analysis was not assessed.",
        },
      ],
      finishedAt: utcNow(),
    };
  }

  const prepared = prepareAnalysisInput(request.crawl, {
    maxPages: request.maxPages,
    maxInputChars: request.maxInputChars,
  });

  if (!prepared.ok) {
    return {
      ...baseResult,
      ok: false,
      status:
        prepared.reason === "empty_evidence"
          ? "not_assessed"
          : "insufficient_evidence",
      errors: [
        {
          code: prepared.reason,
          message:
            prepared.reason === "empty_evidence"
              ? "No crawl evidence was available for analysis."
              : "Crawl evidence was insufficient for qualitative analysis.",
        },
      ],
      finishedAt: utcNow(),
    };
  }

  const requestArgs = {
    apiKey,
    model,
    input: prepared.input,
    timeoutMs: request.timeoutMs ?? DEFAULT_OPENAI_TIMEOUT_MS,
    maxRetries: request.maxRetries ?? DEFAULT_OPENAI_MAX_RETRIES,
  };
  const call = request.requestFn
    ? await request.requestFn(requestArgs)
    : await requestStructuredAnalysis(requestArgs);

  if (!call.ok) {
    return {
      ...baseResult,
      ok: false,
      status: "error",
      preparedEvidenceIds: prepared.input.evidenceIdSet,
      errors: [
        {
          ...call.error,
          details: call.error.details
            ? redactOpenAISecrets(call.error.details, apiKey)
            : undefined,
        },
      ],
      unavailableObservations: prepared.injectionSignals.length
        ? [
            `Prompt-injection-like phrases detected in website text (${prepared.injectionSignals.join(", ")}); content was treated as untrusted data.`,
          ]
        : [],
      finishedAt: utcNow(),
    };
  }

  const validated = validateModelOutput(call.output);
  if (!validated.ok) {
    return {
      ...baseResult,
      ok: false,
      status: "error",
      preparedEvidenceIds: prepared.input.evidenceIdSet,
      model: call.model,
      errors: [
        {
          code: "schema_validation_failed",
          message: "OpenAI structured output failed schema validation.",
          details: validated.message,
        },
      ],
      finishedAt: utcNow(),
    };
  }

  const grounded = enforceEvidenceGrounding(
    validated.data,
    prepared.input.evidenceIdSet,
  );

  const unavailable = [...grounded.data.unavailableObservations];
  if (prepared.injectionSignals.length > 0) {
    unavailable.push(
      `Untrusted website text contained prompt-injection-like phrases (${prepared.injectionSignals.join(", ")}); ignored as instructions.`,
    );
  }

  const status =
    grounded.data.findings.length === 0 &&
    grounded.data.status === "available"
      ? "insufficient_evidence"
      : grounded.data.status;

  return {
    ok: status === "available" || status === "partial",
    status,
    analyzedAt: utcNow(),
    model: call.model,
    industryContext: grounded.data.industryContext,
    businessContext: grounded.data.businessContext,
    categoryObservations: grounded.data.categoryObservations,
    findings: grounded.data.findings,
    recommendations: grounded.data.recommendations,
    areasRequiringVerification: grounded.data.areasRequiringVerification,
    unavailableObservations: unavailable,
    overallConfidence: grounded.data.overallConfidence,
    unsupportedClaimsDropped: grounded.unsupportedClaimsDropped,
    preparedEvidenceIds: prepared.input.evidenceIdSet,
    errors: [],
    startedAt,
    finishedAt: utcNow(),
  };
}
