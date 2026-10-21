import "server-only";

import {
  createUnavailableEvidence,
  parsePagespeedResponse,
  type PsiApiResponse,
} from "@/lib/audit/integrations/pagespeed/pagespeed-parser";
import type {
  PerformanceDeviceStrategy,
  PerformanceError,
  PerformanceRequest,
  PerformanceResult,
} from "@/lib/audit/integrations/pagespeed/pagespeed.types";
import {
  validatePublicCrawlUrl,
  validateUrlStructure,
} from "@/lib/audit/crawler/url-validator";

/** Hard-locked official Google endpoint — never accept user-provided hosts. */
export const GOOGLE_PAGESPEED_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export const DEFAULT_PAGESPEED_OPTIONS = {
  timeoutMs: 60_000,
  maxRetries: 2,
  maxResponseBytes: 5_000_000,
  maxServicePages: 1,
  strategies: ["mobile", "desktop"] as PerformanceDeviceStrategy[],
};

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function utcNow(): string {
  return new Date().toISOString();
}

/** Strip API keys / bearer tokens from strings before returning to callers. */
export function redactSecrets(value: string, apiKey?: string): string {
  let output = value;
  if (apiKey && apiKey.length > 0) {
    output = output.split(apiKey).join("[REDACTED_API_KEY]");
  }
  output = output.replace(/([?&]key=)[^&\s]+/gi, "$1[REDACTED_API_KEY]");
  output = output.replace(
    /(api[_-]?key["']?\s*[:=]\s*["']?)[^"'\s&]+/gi,
    "$1[REDACTED_API_KEY]",
  );
  return output;
}

function resolveApiKey(explicit?: string): string | null {
  const key = (explicit ?? process.env.GOOGLE_PAGESPEED_API_KEY ?? "").trim();
  return key.length > 0 ? key : null;
}

function buildPagespeedUrl(options: {
  pageUrl: string;
  strategy: PerformanceDeviceStrategy;
  apiKey: string;
}): string {
  const endpoint = new URL(GOOGLE_PAGESPEED_ENDPOINT);
  endpoint.searchParams.set("url", options.pageUrl);
  endpoint.searchParams.set("strategy", options.strategy);
  endpoint.searchParams.set("category", "performance");
  endpoint.searchParams.set("key", options.apiKey);
  return endpoint.toString();
}

function mapHttpError(
  status: number,
  bodyText: string,
  apiKey: string,
): PerformanceError {
  const sanitized = redactSecrets(bodyText.slice(0, 500), apiKey);
  if (status === 429) {
    return {
      code: "rate_limited",
      message: "Google PageSpeed API rate limit reached.",
      httpStatus: status,
      details: sanitized || undefined,
    };
  }
  if (status === 403 && /quota|dailyLimitExceeded|rateLimitExceeded/i.test(bodyText)) {
    return {
      code: "quota_exceeded",
      message: "Google PageSpeed API quota exceeded.",
      httpStatus: status,
      details: sanitized || undefined,
    };
  }
  return {
    code: "provider_error",
    message: "Google PageSpeed API returned an error response.",
    httpStatus: status,
    details: sanitized || undefined,
  };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPagespeedOnce(options: {
  pageUrl: string;
  strategy: PerformanceDeviceStrategy;
  apiKey: string;
  timeoutMs: number;
  maxResponseBytes: number;
}): Promise<
  | { ok: true; json: PsiApiResponse }
  | { ok: false; error: PerformanceError; retryable: boolean }
> {
  const requestUrl = buildPagespeedUrl({
    pageUrl: options.pageUrl,
    strategy: options.strategy,
    apiKey: options.apiKey,
  });

  // Defense in depth: only allow the official Google host.
  const parsedEndpoint = new URL(requestUrl);
  if (
    parsedEndpoint.origin !== "https://www.googleapis.com" ||
    !parsedEndpoint.pathname.startsWith("/pagespeedonline/")
  ) {
    return {
      ok: false,
      retryable: false,
      error: {
        code: "provider_error",
        message: "Refusing to call a non-official PageSpeed endpoint.",
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    const contentLength = response.headers.get("content-length");
    if (
      contentLength &&
      Number(contentLength) > options.maxResponseBytes
    ) {
      return {
        ok: false,
        retryable: false,
        error: {
          code: "invalid_response",
          message: "PageSpeed response exceeded size limit.",
          httpStatus: response.status,
          url: options.pageUrl,
          strategy: options.strategy,
        },
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > options.maxResponseBytes) {
      return {
        ok: false,
        retryable: false,
        error: {
          code: "invalid_response",
          message: "PageSpeed response exceeded size limit.",
          httpStatus: response.status,
          url: options.pageUrl,
          strategy: options.strategy,
        },
      };
    }

    const text = buffer.toString("utf8");

    if (!response.ok) {
      const error = mapHttpError(response.status, text, options.apiKey);
      error.url = options.pageUrl;
      error.strategy = options.strategy;
      return {
        ok: false,
        retryable: RETRYABLE_STATUS.has(response.status),
        error,
      };
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        ok: false,
        retryable: false,
        error: {
          code: "invalid_response",
          message: "PageSpeed response was not valid JSON.",
          url: options.pageUrl,
          strategy: options.strategy,
          httpStatus: response.status,
        },
      };
    }

    if (!json || typeof json !== "object") {
      return {
        ok: false,
        retryable: false,
        error: {
          code: "invalid_response",
          message: "PageSpeed response payload was empty or invalid.",
          url: options.pageUrl,
          strategy: options.strategy,
        },
      };
    }

    return { ok: true, json: json as PsiApiResponse };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      retryable: !aborted,
      error: {
        code: aborted ? "timeout" : "network_error",
        message: aborted
          ? "PageSpeed request timed out."
          : "PageSpeed network request failed.",
        url: options.pageUrl,
        strategy: options.strategy,
        details: redactSecrets(message, options.apiKey),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function measureUrl(options: {
  pageUrl: string;
  strategy: PerformanceDeviceStrategy;
  apiKey: string;
  timeoutMs: number;
  maxRetries: number;
  maxResponseBytes: number;
}): Promise<
  | { ok: true; evidence: ReturnType<typeof parsePagespeedResponse> }
  | { ok: false; error: PerformanceError }
> {
  let lastError: PerformanceError | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    const result = await fetchPagespeedOnce(options);
    if (result.ok) {
      const lh = result.json.lighthouseResult;
      if (!lh?.categories?.performance && !lh?.audits) {
        return {
          ok: false,
          error: {
            code: "not_measurable",
            message:
              "PageSpeed returned no measurable Lighthouse performance data.",
            url: options.pageUrl,
            strategy: options.strategy,
          },
        };
      }

      return {
        ok: true,
        evidence: parsePagespeedResponse({
          response: result.json,
          testedUrl: options.pageUrl,
          strategy: options.strategy,
          measuredAt: utcNow(),
        }),
      };
    }

    lastError = result.error;
    if (!result.retryable || attempt === options.maxRetries) {
      break;
    }
    await sleep(500 * (attempt + 1));
  }

  return {
    ok: false,
    error: lastError ?? {
      code: "unknown",
      message: "PageSpeed measurement failed.",
      url: options.pageUrl,
      strategy: options.strategy,
    },
  };
}

/**
 * Collect Google PageSpeed Insights evidence for a homepage and optional service pages.
 * Server-only. Never invent scores on failure — returns not_assessed / not_measured.
 */
export async function collectPagespeedEvidence(
  request: PerformanceRequest,
): Promise<PerformanceResult> {
  const startedAt = utcNow();
  const strategies =
    request.strategies?.length
      ? request.strategies
      : DEFAULT_PAGESPEED_OPTIONS.strategies;
  const maxServicePages =
    request.maxServicePages ?? DEFAULT_PAGESPEED_OPTIONS.maxServicePages;
  const timeoutMs = request.timeoutMs ?? DEFAULT_PAGESPEED_OPTIONS.timeoutMs;
  const maxRetries = request.maxRetries ?? DEFAULT_PAGESPEED_OPTIONS.maxRetries;

  const apiKey = resolveApiKey(request.apiKey);
  if (!apiKey) {
    return {
      ok: false,
      request: {
        url: request.url,
        normalizedUrl: request.url,
        strategies,
        servicePageUrls: [],
      },
      evidence: [],
      errors: [
        {
          code: "missing_api_key",
          message:
            "GOOGLE_PAGESPEED_API_KEY is not configured. Performance was not assessed.",
        },
      ],
      startedAt,
      finishedAt: utcNow(),
      partial: false,
    };
  }

  const structural = validateUrlStructure(request.url);
  if (!structural.ok) {
    return {
      ok: false,
      request: {
        url: request.url,
        normalizedUrl: request.url,
        strategies,
        servicePageUrls: [],
      },
      evidence: [],
      errors: [
        {
          code:
            structural.error.code === "ssrf_blocked"
              ? "ssrf_blocked"
              : "invalid_url",
          message: structural.error.message,
          url: request.url,
          details: structural.error.details,
        },
      ],
      startedAt,
      finishedAt: utcNow(),
      partial: false,
    };
  }

  const validated = await validatePublicCrawlUrl(structural.url.href);
  if (!validated.ok) {
    return {
      ok: false,
      request: {
        url: request.url,
        normalizedUrl: structural.url.href,
        strategies,
        servicePageUrls: [],
      },
      evidence: [],
      errors: [
        {
          code:
            validated.error.code === "ssrf_blocked"
              ? "ssrf_blocked"
              : validated.error.code === "dns_failure"
                ? "invalid_url"
                : "invalid_url",
          message: validated.error.message,
          url: structural.url.href,
          details: validated.error.details,
        },
      ],
      startedAt,
      finishedAt: utcNow(),
      partial: false,
    };
  }

  const homepageUrl = validated.url.href;
  const servicePageUrls: string[] = [];

  for (const candidate of request.servicePageUrls ?? []) {
    if (servicePageUrls.length >= maxServicePages) break;
    const serviceValidation = await validatePublicCrawlUrl(candidate);
    if (!serviceValidation.ok) continue;
    if (serviceValidation.url.origin !== validated.url.origin) continue;
    if (serviceValidation.url.href === homepageUrl) continue;
    servicePageUrls.push(serviceValidation.url.href);
  }

  const targets = [homepageUrl, ...servicePageUrls];
  const evidence: PerformanceResult["evidence"] = [];
  const errors: PerformanceError[] = [];
  let partial = false;

  for (const target of targets) {
    for (const strategy of strategies) {
      const measured = await measureUrl({
        pageUrl: target,
        strategy,
        apiKey,
        timeoutMs,
        maxRetries,
        maxResponseBytes: DEFAULT_PAGESPEED_OPTIONS.maxResponseBytes,
      });

      if (measured.ok) {
        evidence.push(measured.evidence);
        continue;
      }

      partial = true;
      errors.push(measured.error);
      evidence.push(
        createUnavailableEvidence({
          testedUrl: target,
          strategy,
          measuredAt: utcNow(),
          availability:
            measured.error.code === "not_measurable"
              ? "not_measured"
              : "not_assessed",
          notes: measured.error.message,
        }),
      );
    }
  }

  const finishedAt = utcNow();
  const ok = evidence.some((item) => item.availability === "available");

  return {
    ok,
    request: {
      url: request.url,
      normalizedUrl: homepageUrl,
      strategies,
      servicePageUrls,
    },
    evidence,
    errors,
    startedAt,
    finishedAt,
    partial: partial || (!ok && evidence.length > 0),
  };
}
