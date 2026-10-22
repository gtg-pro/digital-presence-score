import "server-only";

import OpenAI from "openai";

import {
  openAIWebAuditJsonSchema,
  validateOpenAIWebAuditPayload,
} from "@/lib/audit/openai-audit/audit-schema";
import {
  buildOpenAIWebAuditUserPrompt,
  buildOpenAIWebRetrievalPrompt,
  OPENAI_WEB_AUDIT_SYSTEM_PROMPT,
} from "@/lib/audit/openai-audit/audit-prompt";
import type { OpenAIWebAuditCallResult } from "@/lib/audit/openai-audit/openai-audit.types";
import {
  createOpenAIClient,
  DEFAULT_OPENAI_MAX_RETRIES,
  DEFAULT_OPENAI_TIMEOUT_MS,
  redactOpenAISecrets,
  resolveOpenAIApiKey,
  resolveOpenAIModel,
} from "@/lib/audit/integrations/openai/openai-client";

const MAX_RESEARCH_BRIEF_CHARS = 24_000;

function extractOutputText(response: OpenAI.Responses.Response): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }
  const chunks: string[] = [];
  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text) {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function collectCitedUrls(response: OpenAI.Responses.Response): string[] {
  const urls = new Set<string>();
  for (const item of response.output ?? []) {
    if (item.type === "web_search_call") {
      const action = item.action as
        | { type?: string; sources?: Array<{ url?: string }> }
        | undefined;
      if (action?.sources) {
        for (const source of action.sources) {
          if (source.url) urls.add(source.url);
        }
      }
    }
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type !== "output_text") continue;
      for (const annotation of part.annotations ?? []) {
        if (
          annotation.type === "url_citation" &&
          typeof annotation.url === "string"
        ) {
          urls.add(annotation.url);
        }
      }
    }
  }
  return [...urls];
}

function didUseWebSearch(response: OpenAI.Responses.Response): boolean {
  return (response.output ?? []).some((item) => item.type === "web_search_call");
}

function extractSourceUrlsFromBrief(brief: string): string[] {
  const urls = new Set<string>();
  const sourceLine = /^SOURCE:\s*(\S+)/gim;
  let match: RegExpExecArray | null;
  while ((match = sourceLine.exec(brief)) !== null) {
    urls.add(match[1]!.trim());
  }
  const markdownOrBare =
    /https?:\/\/[^\s)\]>"']+/gi;
  while ((match = markdownOrBare.exec(brief)) !== null) {
    urls.add(match[0]!.replace(/[.,;]+$/, ""));
  }
  return [...urls].slice(0, 20);
}

function mapError(
  error: unknown,
  apiKey: string,
): Extract<OpenAIWebAuditCallResult, { ok: false }> {
  const message =
    error instanceof Error ? error.message : "OpenAI request failed.";
  const sanitized = redactOpenAISecrets(message, apiKey);
  const status =
    typeof error === "object" &&
    error &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;

  if (
    error instanceof Error &&
    (error.name === "AbortError" || /aborted/i.test(error.message))
  ) {
    return {
      ok: false,
      code: "aborted",
      message: "OpenAI request was cancelled.",
      retryable: true,
    };
  }
  if (
    error instanceof Error &&
    (error.name === "APIUserAbortError" || /timeout/i.test(error.message))
  ) {
    return {
      ok: false,
      code: "timeout",
      message: "OpenAI request timed out.",
      retryable: true,
    };
  }
  if (status === 429 || /rate limit/i.test(sanitized)) {
    return {
      ok: false,
      code: "rate_limited",
      message: "OpenAI rate limit reached. Please retry shortly.",
      retryable: true,
    };
  }
  if (status === 402 || /quota/i.test(sanitized)) {
    return {
      ok: false,
      code: "quota_exceeded",
      message: "OpenAI quota exceeded.",
      retryable: false,
    };
  }
  return {
    ok: false,
    code: "provider_error",
    message: "OpenAI analysis failed. Please retry.",
    retryable: status !== undefined ? status >= 500 : true,
  };
}

async function withRetries<T>(
  options: {
    maxRetries: number;
    signal?: AbortSignal;
    apiKey: string;
  },
  run: () => Promise<T>,
): Promise<
  | { ok: true; value: T }
  | { ok: false; failure: Extract<OpenAIWebAuditCallResult, { ok: false }> }
> {
  let attempt = 0;
  let lastFailure: Extract<OpenAIWebAuditCallResult, { ok: false }> | null =
    null;

  while (attempt <= options.maxRetries) {
    if (options.signal?.aborted) {
      return {
        ok: false,
        failure: {
          ok: false,
          code: "aborted",
          message: "OpenAI request was cancelled.",
          retryable: true,
        },
      };
    }
    try {
      return { ok: true, value: await run() };
    } catch (error) {
      lastFailure = mapError(error, options.apiKey);
      if (!lastFailure.retryable || attempt >= options.maxRetries) {
        return { ok: false, failure: lastFailure };
      }
      attempt += 1;
    }
  }

  return {
    ok: false,
    failure:
      lastFailure ??
      ({
        ok: false,
        code: "provider_error",
        message: "OpenAI analysis failed. Please retry.",
        retryable: true,
      } as const),
  };
}

export type RequestOpenAIWebAuditOptions = {
  websiteUrl: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
  signal?: AbortSignal;
};

/**
 * OpenAI-only web audit.
 *
 * OpenAI does not allow web_search + JSON/structured output in one request
 * ("Web Search cannot be used with JSON mode"). We therefore:
 * 1) retrieve with Responses + web_search (plain text brief)
 * 2) score with structured JSON schema (no tools)
 */
export async function requestOpenAIWebAudit(
  options: RequestOpenAIWebAuditOptions,
): Promise<OpenAIWebAuditCallResult> {
  const apiKey = resolveOpenAIApiKey(options.apiKey);
  if (!apiKey) {
    return {
      ok: false,
      code: "missing_api_key",
      message: "OPENAI_API_KEY is not configured.",
      retryable: false,
    };
  }

  const model = resolveOpenAIModel(options.model);
  const timeoutMs = options.timeoutMs ?? DEFAULT_OPENAI_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_OPENAI_MAX_RETRIES;
  const client = createOpenAIClient(apiKey, timeoutMs);
  const retryOpts = { maxRetries, signal: options.signal, apiKey };

  const retrieval = await withRetries(retryOpts, async () => {
    const response = await client.responses.create(
      {
        model,
        store: false,
        tools: [{ type: "web_search" }],
        tool_choice: "required",
        include: ["web_search_call.action.sources"],
        input: buildOpenAIWebRetrievalPrompt(options.websiteUrl),
      },
      { signal: options.signal },
    );
    return response;
  });

  if (!retrieval.ok) {
    return retrieval.failure;
  }

  const retrievalResponse = retrieval.value;
  const webSearchUsed = didUseWebSearch(retrievalResponse);
  const citedUrls = collectCitedUrls(retrievalResponse);
  const researchBrief = extractOutputText(retrievalResponse).slice(
    0,
    MAX_RESEARCH_BRIEF_CHARS,
  );
  const briefUrls = extractSourceUrlsFromBrief(researchBrief);
  const allCitedUrls = [...new Set([...citedUrls, ...briefUrls])];

  if (!researchBrief.trim()) {
    return {
      ok: false,
      code: "invalid_response",
      message: "OpenAI returned an empty website research brief.",
      retryable: true,
    };
  }

  const scoring = await withRetries(retryOpts, async () => {
    const response = await client.responses.create(
      {
        model,
        store: false,
        input: [
          {
            role: "system",
            content: OPENAI_WEB_AUDIT_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: buildOpenAIWebAuditUserPrompt({
              websiteUrl: options.websiteUrl,
              researchBrief,
              citedUrls: allCitedUrls,
              webSearchUsed,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "digital_presence_web_audit",
            strict: true,
            schema: openAIWebAuditJsonSchema,
          },
        },
      },
      { signal: options.signal },
    );
    return response;
  });

  if (!scoring.ok) {
    return scoring.failure;
  }

  const scoringResponse = scoring.value;
  const rawText = extractOutputText(scoringResponse);
  if (!rawText) {
    return {
      ok: false,
      code: "invalid_response",
      message: "OpenAI returned an empty audit payload.",
      retryable: true,
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      code: "invalid_response",
      message: "OpenAI returned non-JSON audit output.",
      retryable: true,
    };
  }

  const validated = validateOpenAIWebAuditPayload(parsedJson);
  if (!validated.success) {
    return {
      ok: false,
      code: "invalid_response",
      message: "OpenAI audit payload failed schema validation.",
      retryable: true,
    };
  }

  const payload = validated.data;

  // If retrieval clearly worked, do not let the model falsely claim failure.
  if (webSearchUsed && researchBrief.trim().length > 80) {
    const failureSignals =
      /could not (find|retrieve|access)|no usable|unable to retrieve|retrieval failed/i.test(
        researchBrief,
      );
    if (!failureSignals) {
      payload.retrievalSucceeded = true;
      if (payload.assessmentStatus === "LIMITED_VISIBILITY") {
        payload.assessmentStatus = "PARTIAL";
      }
    }
  }

  if (payload.sourceReferences.length === 0 && allCitedUrls.length > 0) {
    payload.sourceReferences = allCitedUrls.slice(0, 12).map((url) => ({
      url,
      title: url,
    }));
  }

  // Honesty gate: no search, no citations, no sources → limited.
  if (
    !webSearchUsed &&
    allCitedUrls.length === 0 &&
    payload.sourceReferences.length === 0
  ) {
    payload.retrievalSucceeded = false;
    payload.assessmentStatus = "LIMITED_VISIBILITY";
    payload.limitationSummary =
      payload.limitationSummary ??
      "Public website information could not be retrieved through OpenAI web search for this run.";
  }

  return {
    ok: true,
    payload,
    model,
    webSearchUsed,
    citedUrls: allCitedUrls,
  };
}
