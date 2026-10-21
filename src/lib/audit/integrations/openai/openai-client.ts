import "server-only";

import OpenAI from "openai";

import { aiAnalysisJsonSchema } from "@/lib/audit/integrations/openai/analysis-schema";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisUserPrompt,
} from "@/lib/audit/integrations/openai/analysis-prompt";
import type {
  AIAnalysisError,
  PreparedAnalysisInput,
} from "@/lib/audit/integrations/openai/analysis.types";

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
export const DEFAULT_OPENAI_TIMEOUT_MS = 60_000;
export const DEFAULT_OPENAI_MAX_RETRIES = 2;

export function resolveOpenAIApiKey(explicit?: string): string | null {
  const key = (explicit ?? process.env.OPENAI_API_KEY ?? "").trim();
  return key.length > 0 ? key : null;
}

export function resolveOpenAIModel(explicit?: string): string {
  const model = (explicit ?? process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL).trim();
  return model.length > 0 ? model : DEFAULT_OPENAI_MODEL;
}

/** Redact API keys from error strings / logs. */
export function redactOpenAISecrets(value: string, apiKey?: string): string {
  let output = value;
  if (apiKey && apiKey.length > 0) {
    output = output.split(apiKey).join("[REDACTED_API_KEY]");
  }
  output = output.replace(/sk-[a-zA-Z0-9_-]{10,}/g, "[REDACTED_API_KEY]");
  output = output.replace(
    /(api[_-]?key["']?\s*[:=]\s*["']?)[^"'\s]+/gi,
    "$1[REDACTED_API_KEY]",
  );
  output = output.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, "Bearer [REDACTED_API_KEY]");
  return output;
}

export function createOpenAIClient(apiKey: string, timeoutMs: number): OpenAI {
  return new OpenAI({
    apiKey,
    timeout: timeoutMs,
    maxRetries: 0, // we manage retries ourselves
  });
}

export type OpenAIStructuredCallResult =
  | { ok: true; output: unknown; model: string }
  | { ok: false; error: AIAnalysisError; retryable: boolean };

function mapProviderError(
  error: unknown,
  apiKey: string,
): { error: AIAnalysisError; retryable: boolean } {
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
    (error.name === "AbortError" || /timeout/i.test(error.message))
  ) {
    return {
      retryable: false,
      error: {
        code: "timeout",
        message: "OpenAI request timed out.",
        details: sanitized,
      },
    };
  }

  if (status === 429) {
    const quota = /quota|billing|insufficient/i.test(message);
    return {
      retryable: !quota,
      error: {
        code: quota ? "quota_exceeded" : "rate_limited",
        message: quota
          ? "OpenAI API quota exceeded."
          : "OpenAI API rate limit reached.",
        details: sanitized,
      },
    };
  }

  if (typeof status === "number" && status >= 500) {
    return {
      retryable: true,
      error: {
        code: "provider_error",
        message: "OpenAI provider returned a server error.",
        details: sanitized,
      },
    };
  }

  if (/refus(e|al)|safety|content_policy/i.test(message)) {
    return {
      retryable: false,
      error: {
        code: "model_refusal",
        message: "The model refused to produce analysis for this evidence.",
        details: sanitized,
      },
    };
  }

  return {
    retryable: false,
    error: {
      code: "network_error",
      message: "OpenAI network request failed.",
      details: sanitized,
    },
  };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call OpenAI Chat Completions with Structured Outputs JSON schema.
 */
export async function requestStructuredAnalysis(options: {
  apiKey: string;
  model: string;
  input: PreparedAnalysisInput;
  timeoutMs?: number;
  maxRetries?: number;
  /** Optional injectable client for tests. */
  client?: OpenAI;
}): Promise<OpenAIStructuredCallResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_OPENAI_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_OPENAI_MAX_RETRIES;
  const client =
    options.client ?? createOpenAIClient(options.apiKey, timeoutMs);

  const userPrompt = buildAnalysisUserPrompt(options.input);
  let lastError: AIAnalysisError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const completion = await client.chat.completions.create({
        model: options.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: aiAnalysisJsonSchema,
        },
      });

      const choice = completion.choices[0];
      if (choice?.finish_reason === "content_filter") {
        return {
          ok: false,
          retryable: false,
          error: {
            code: "model_refusal",
            message: "OpenAI content filter blocked the analysis response.",
          },
        };
      }

      const content = choice?.message?.content;
      if (!content) {
        return {
          ok: false,
          retryable: false,
          error: {
            code: "invalid_response",
            message: "OpenAI returned an empty analysis response.",
          },
        };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        return {
          ok: false,
          retryable: false,
          error: {
            code: "invalid_response",
            message: "OpenAI response was not valid JSON.",
          },
        };
      }

      return {
        ok: true,
        output: parsed,
        model: completion.model ?? options.model,
      };
    } catch (error) {
      const mapped = mapProviderError(error, options.apiKey);
      lastError = mapped.error;
      if (!mapped.retryable || attempt === maxRetries) {
        return { ok: false, retryable: false, error: mapped.error };
      }
      await sleep(400 * (attempt + 1));
    }
  }

  return {
    ok: false,
    retryable: false,
    error: lastError ?? {
      code: "unknown",
      message: "OpenAI analysis failed.",
    },
  };
}
