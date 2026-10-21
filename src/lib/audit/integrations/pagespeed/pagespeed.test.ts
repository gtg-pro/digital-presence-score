import { afterEach, describe, expect, it, vi } from "vitest";

import {
  collectPagespeedEvidence,
  GOOGLE_PAGESPEED_ENDPOINT,
  redactSecrets,
} from "@/lib/audit/integrations/pagespeed/pagespeed";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function mockPsiOk() {
  return {
    id: "https://example.com/",
    lighthouseResult: {
      finalUrl: "https://example.com/",
      lighthouseVersion: "12.0.0",
      categories: { performance: { score: 0.9 } },
      audits: {
        "largest-contentful-paint": {
          numericValue: 1500,
          numericUnit: "millisecond",
          displayValue: "1.5 s",
        },
        "total-blocking-time": {
          numericValue: 50,
          numericUnit: "millisecond",
          displayValue: "50 ms",
        },
      },
    },
  };
}

describe("redactSecrets", () => {
  it("redacts API keys from strings and query params", () => {
    const key = "secret-key-12345";
    expect(redactSecrets(`Bearer ${key}`, key)).toContain("[REDACTED_API_KEY]");
    expect(
      redactSecrets(`${GOOGLE_PAGESPEED_ENDPOINT}?key=${key}&url=x`, key),
    ).not.toContain(key);
  });
});

describe("collectPagespeedEvidence", () => {
  it("fails closed when API key is missing", async () => {
    const result = await collectPagespeedEvidence({
      url: "https://example.com",
      apiKey: "",
      strategies: ["mobile"],
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("missing_api_key");
    expect(result.evidence).toHaveLength(0);
  });

  it("rejects unsafe URLs before calling Google", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await collectPagespeedEvidence({
      url: "http://127.0.0.1/",
      apiKey: "test-key",
      strategies: ["mobile"],
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "ssrf_blocked")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parses a successful mocked mobile response", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url.startsWith(GOOGLE_PAGESPEED_ENDPOINT)).toBe(true);
      expect(url).toContain("strategy=mobile");
      expect(url).toContain("key=test-key");
      return new Response(JSON.stringify(mockPsiOk()), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const result = await collectPagespeedEvidence({
      url: "https://example.com",
      apiKey: "test-key",
      strategies: ["mobile"],
      maxRetries: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]?.deviceStrategy).toBe("mobile");
    expect(result.evidence[0]?.metrics.lighthousePerformanceScore.value).toBe(
      90,
    );
  });

  it("requests desktop strategy when configured", async () => {
    const strategies: string[] = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      strategies.push(url.searchParams.get("strategy") ?? "");
      return new Response(JSON.stringify(mockPsiOk()), { status: 200 });
    }) as unknown as typeof fetch;

    await collectPagespeedEvidence({
      url: "https://example.com",
      apiKey: "test-key",
      strategies: ["desktop"],
      maxRetries: 0,
    });

    expect(strategies).toEqual(["desktop"]);
  });

  it("maps rate-limit responses without leaking the API key", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({ error: { message: "key=super-secret-key rate limit" } }),
        { status: 429 },
      );
    }) as unknown as typeof fetch;

    const result = await collectPagespeedEvidence({
      url: "https://example.com",
      apiKey: "super-secret-key",
      strategies: ["mobile"],
      maxRetries: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("rate_limited");
    expect(JSON.stringify(result)).not.toContain("super-secret-key");
    expect(result.evidence[0]?.availability).toBe("not_assessed");
    expect(
      result.evidence[0]?.metrics.lighthousePerformanceScore.value,
    ).toBeNull();
  });

  it("maps quota exceeded responses", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({ error: { message: "dailyLimitExceeded" } }),
        { status: 403 },
      );
    }) as unknown as typeof fetch;

    const result = await collectPagespeedEvidence({
      url: "https://example.com",
      apiKey: "test-key",
      strategies: ["mobile"],
      maxRetries: 0,
    });

    expect(result.errors[0]?.code).toBe("quota_exceeded");
    expect(result.evidence[0]?.availability).toBe("not_assessed");
  });

  it("handles invalid JSON provider responses", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response("not-json", { status: 200 });
    }) as unknown as typeof fetch;

    const result = await collectPagespeedEvidence({
      url: "https://example.com",
      apiKey: "test-key",
      strategies: ["mobile"],
      maxRetries: 0,
    });

    expect(result.errors[0]?.code).toBe("invalid_response");
    expect(result.evidence[0]?.availability).toBe("not_assessed");
  });

  it("handles timeouts as not_assessed", async () => {
    globalThis.fetch = vi.fn(async () => {
      const error = new Error("Aborted");
      error.name = "AbortError";
      throw error;
    }) as unknown as typeof fetch;

    const result = await collectPagespeedEvidence({
      url: "https://example.com",
      apiKey: "test-key",
      strategies: ["mobile"],
      maxRetries: 0,
      timeoutMs: 10,
    });

    expect(result.errors[0]?.code).toBe("timeout");
    expect(result.evidence[0]?.availability).toBe("not_assessed");
  });
});
