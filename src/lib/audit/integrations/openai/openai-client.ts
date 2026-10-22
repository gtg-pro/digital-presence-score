import "server-only";

import OpenAI from "openai";

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
/** Per-request timeout. Audits use two OpenAI calls (retrieve + score). */
export const DEFAULT_OPENAI_TIMEOUT_MS = 90_000;
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
