import { describe, expect, it, vi } from "vitest";

import { crawlWebsite } from "@/lib/audit/crawler/crawler";
import { runAssessment } from "@/lib/audit/orchestration/assessment";
import type { Browser } from "playwright";

describe("crawlWebsite browser launch failures", () => {
  it("records browser_executable_missing without labeling partial_crawl", async () => {
    const result = await crawlWebsite({
      url: "https://example.com/",
      maxPages: 1,
      launchBrowser: async () => {
        const error = new Error(
          "Failed to launch chromium because executable doesn't exist at /var/task/chrome",
        );
        (
          error as Error & {
            diagnostics: {
              launchAttempted: boolean;
              launchSucceeded: boolean;
              runtime: "serverless_linux";
              executableSource: "sparticuz_chromium";
              executablePresent: false;
              failureCode: "browser_executable_missing";
              sanitizedFailureReason: string;
            };
          }
        ).diagnostics = {
          launchAttempted: true,
          launchSucceeded: false,
          runtime: "serverless_linux",
          executableSource: "sparticuz_chromium",
          executablePresent: false,
          failureCode: "browser_executable_missing",
          sanitizedFailureReason:
            "Failed to launch chromium because executable doesn't exist at [path]",
        };
        throw error;
      },
    });

    expect(result.ok).toBe(false);
    expect(result.pages).toHaveLength(0);
    expect(result.partial).toBe(false);
    expect(
      result.errors.some((e) => e.code === "browser_executable_missing"),
    ).toBe(true);
    expect(result.diagnostics.browserLaunchAttempted).toBe(true);
    expect(result.diagnostics.browserLaunchSucceeded).toBe(false);
    expect(result.diagnostics.finalStatus).toBe("failed");
    expect(result.diagnostics.providerSkipReasons.pagespeed).toMatch(
      /PageSpeed skipped/i,
    );
    expect(result.diagnostics.providerSkipReasons.openai).toMatch(
      /OpenAI skipped/i,
    );
    expect(result.diagnostics.sanitizedBrowserLaunchFailure).not.toMatch(
      /\/var\/task/,
    );
  });

  it("records navigation timeout distinctly after successful launch", async () => {
    const page = {
      setDefaultNavigationTimeout: vi.fn(),
      setDefaultTimeout: vi.fn(),
      route: vi.fn(async () => undefined),
      on: vi.fn(),
      goto: vi.fn(async () => {
        throw new Error("Timeout 15000ms exceeded while navigating");
      }),
      url: vi.fn(() => "https://example.com/"),
      content: vi.fn(),
    };
    const context = {
      newPage: vi.fn(async () => page),
      close: vi.fn(async () => undefined),
    };
    const browser = {
      newContext: vi.fn(async () => context),
      close: vi.fn(async () => undefined),
    } as unknown as Browser;

    const result = await crawlWebsite({
      url: "https://example.com/",
      maxPages: 1,
      launchBrowser: async () => ({
        browser,
        diagnostics: {
          launchAttempted: true,
          launchSucceeded: true,
          runtime: "local",
          executableSource: "playwright_bundled",
          executablePresent: true,
          failureCode: null,
          sanitizedFailureReason: null,
        },
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.pages).toHaveLength(0);
    expect(result.errors.map((e) => e.code)).toContain("timeout");
    expect(result.diagnostics.browserLaunchSucceeded).toBe(true);
    expect(result.diagnostics.navigationAttempted).toBeGreaterThan(0);
  });
});

describe("runAssessment provider skip reasons after crawl failure", () => {
  it("marks PageSpeed/OpenAI skipped with crawl failure reason", async () => {
    const result = await runAssessment({
      websiteUrl: "https://example.com/",
      crawlFn: async () =>
        crawlWebsite({
          url: "https://example.com/",
          maxPages: 1,
          launchBrowser: async () => {
            const error = new Error("browserType.launch: Failed to launch");
            (
              error as Error & {
                diagnostics: {
                  launchAttempted: boolean;
                  launchSucceeded: boolean;
                  runtime: "serverless_linux";
                  executableSource: "sparticuz_chromium";
                  executablePresent: boolean | null;
                  failureCode: "browser_launch_failed";
                  sanitizedFailureReason: string;
                };
              }
            ).diagnostics = {
              launchAttempted: true,
              launchSucceeded: false,
              runtime: "serverless_linux",
              executableSource: "sparticuz_chromium",
              executablePresent: null,
              failureCode: "browser_launch_failed",
              sanitizedFailureReason: "browserType.launch: Failed to launch",
            };
            throw error;
          },
        }),
    });

    expect(result.status).toBe("LIMITED_VISIBILITY");
    expect(result.overallScore).toBeNull();
    expect(result.integrationAvailability.pagespeed).toBe("skipped");
    expect(result.integrationAvailability.openai).toBe("skipped");
    expect(result.limitationReasons.some((r) => /PageSpeed skipped/i.test(r))).toBe(
      true,
    );
    expect(result.limitationReasons.some((r) => /OpenAI skipped/i.test(r))).toBe(
      true,
    );
    expect(result.errors.some((e) => e.code === "website_unreachable")).toBe(
      true,
    );
    expect(result.errors.some((e) => e.code === "partial_crawl")).toBe(false);
  });
});
