import type { CrawlDiagnostics, CrawlErrorCode } from "@/features/audit/types/evidence.types";

export function emptyCrawlDiagnostics(
  overrides?: Partial<CrawlDiagnostics>,
): CrawlDiagnostics {
  return {
    browserLaunchAttempted: false,
    browserLaunchSucceeded: false,
    browserRuntime: "not_started",
    browserExecutableSource: "none",
    browserExecutablePresent: null,
    browserLaunchFailureCode: null,
    sanitizedBrowserLaunchFailure: null,
    navigationAttempted: 0,
    pagesExtracted: 0,
    pagesRejected: 0,
    robotsDecision: "not_evaluated",
    finalStatus: "failed",
    providerSkipReasons: {
      pagespeed: null,
      openai: null,
    },
    ...overrides,
  };
}

export function isBrowserLaunchErrorCode(
  code: CrawlErrorCode | undefined,
): boolean {
  return (
    code === "browser_executable_missing" ||
    code === "browser_launch_failed" ||
    code === "browser_failure"
  );
}

export function describeProviderSkipForFailedCrawl(
  diagnostics: CrawlDiagnostics,
): { pagespeed: string; openai: string } {
  const reason =
    diagnostics.sanitizedBrowserLaunchFailure ??
    (diagnostics.browserLaunchFailureCode
      ? `Crawl ended with ${diagnostics.browserLaunchFailureCode}.`
      : diagnostics.robotsDecision === "blocked"
        ? "Crawl blocked by robots.txt; providers were not requested."
        : diagnostics.pagesExtracted === 0
          ? "No verified website pages were collected; providers were not requested."
          : "Crawl did not produce usable website evidence; providers were not requested.");

  return {
    pagespeed: `PageSpeed skipped: ${reason}`,
    openai: `OpenAI skipped: ${reason}`,
  };
}
