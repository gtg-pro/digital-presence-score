import "server-only";

import type { Browser, Page } from "playwright";

import type {
  CrawlDiagnostics,
  CrawlError,
  CrawlErrorCode,
  CrawlRequest,
  CrawlResult,
  PageEvidence,
} from "@/features/audit/types/evidence.types";
import {
  emptyCrawlDiagnostics,
  isBrowserLaunchErrorCode,
} from "@/lib/audit/crawler/crawl-diagnostics";
import {
  collectAnchorHrefs,
  extractPageEvidence,
} from "@/lib/audit/extraction/extract-page";
import { aggregateWebsiteEvidence } from "@/lib/audit/extraction/extract-website";
import {
  extractLinksFromHtml,
  parseSitemapLocs,
  prioritizeDiscoveredPages,
  resolveInternalUrl,
  scorePagePriority,
  type DiscoveredPage,
} from "@/lib/audit/crawler/page-discovery";
import {
  createBlockedRobotsRules,
  createOpenRobotsRules,
  createRobotsRulesFromBody,
  type RobotsRules,
} from "@/lib/audit/crawler/robots";
import {
  validateNavigationTarget,
  validatePublicCrawlUrl,
  validateUrlStructure,
} from "@/lib/audit/crawler/url-validator";
import {
  launchAuditBrowser,
  sanitizeBrowserErrorMessage,
  type BrowserLaunchDiagnostics,
} from "@/lib/browser/launch-chromium";

export const DEFAULT_CRAWL_LIMITS = {
  maxPages: 20,
  maxDepth: 2,
  navigationTimeoutMs: 15_000,
  maxResponseBytes: 1_500_000,
  userAgent:
    "DigitalPresenceScoreBot/1.0 (+https://digitalpresencescore.local; research-audit)",
  maxRedirects: 5,
} as const;

function utcNow(): string {
  return new Date().toISOString();
}

function mergeDefaults(request: CrawlRequest) {
  const maxPages = Math.min(
    Math.max(request.maxPages ?? DEFAULT_CRAWL_LIMITS.maxPages, 1),
    20,
  );
  return {
    url: request.url,
    maxPages,
    maxDepth: Math.min(
      Math.max(request.maxDepth ?? DEFAULT_CRAWL_LIMITS.maxDepth, 0),
      4,
    ),
    navigationTimeoutMs:
      request.navigationTimeoutMs ?? DEFAULT_CRAWL_LIMITS.navigationTimeoutMs,
    maxResponseBytes:
      request.maxResponseBytes ?? DEFAULT_CRAWL_LIMITS.maxResponseBytes,
    userAgent: request.userAgent ?? DEFAULT_CRAWL_LIMITS.userAgent,
  };
}

async function fetchTextWithSsrf(options: {
  url: string;
  allowedOrigin: string;
  userAgent: string;
  timeoutMs: number;
  maxBytes: number;
}): Promise<{ ok: true; url: string; body: string; status: number } | { ok: false; error: CrawlError }> {
  let current = options.url;

  for (let hop = 0; hop <= DEFAULT_CRAWL_LIMITS.maxRedirects; hop += 1) {
    const validated = await validateNavigationTarget(current, options.allowedOrigin);
    if (!validated.ok) {
      return { ok: false, error: validated.error };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await fetch(validated.url.href, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": options.userAgent,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          return {
            ok: false,
            error: {
              code: "redirect_error",
              message: "Redirect response missing Location header.",
              url: validated.url.href,
            },
          };
        }
        const next = resolveInternalUrl(
          location,
          validated.url.href,
          options.allowedOrigin,
        );
        if (!next) {
          return {
            ok: false,
            error: {
              code: "ssrf_blocked",
              message: "Redirect target left the allowed origin or was unsafe.",
              url: location,
            },
          };
        }
        current = next;
        continue;
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength && Number(contentLength) > options.maxBytes) {
        return {
          ok: false,
          error: {
            code: "response_too_large",
            message: "Response exceeds maximum allowed size.",
            url: validated.url.href,
          },
        };
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > options.maxBytes) {
        return {
          ok: false,
          error: {
            code: "response_too_large",
            message: "Downloaded body exceeds maximum allowed size.",
            url: validated.url.href,
          },
        };
      }

      return {
        ok: true,
        url: validated.url.href,
        body: buffer.toString("utf8"),
        status: response.status,
      };
    } catch (error) {
      const aborted =
        error instanceof Error && error.name === "AbortError";
      return {
        ok: false,
        error: {
          code: aborted ? "timeout" : "network_error",
          message: aborted
            ? "Request timed out."
            : "Network request failed.",
          url: current,
          details: error instanceof Error ? error.message : String(error),
        },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    ok: false,
    error: {
      code: "redirect_error",
      message: "Too many redirects.",
      url: options.url,
    },
  };
}

async function loadRobots(
  origin: string,
  userAgent: string,
  timeoutMs: number,
  maxBytes: number,
): Promise<RobotsRules> {
  const robotsUrl = `${origin}/robots.txt`;
  const result = await fetchTextWithSsrf({
    url: robotsUrl,
    allowedOrigin: origin,
    userAgent,
    timeoutMs,
    maxBytes: Math.min(maxBytes, 200_000),
  });

  if (!result.ok) {
    // Missing robots is common — treat as open for crawl eligibility,
    // but record that robots were not fetched.
    if (
      result.error.code === "network_error" ||
      result.error.code === "timeout" ||
      result.error.code === "dns_failure"
    ) {
      return createOpenRobotsRules();
    }
    // SSRF / blocked — fail closed
    if (result.error.code === "ssrf_blocked") {
      return createBlockedRobotsRules();
    }
    return createOpenRobotsRules();
  }

  if (result.status === 404) return createOpenRobotsRules();
  if (result.status >= 400) return createOpenRobotsRules();

  return createRobotsRulesFromBody(result.body, userAgent);
}

async function discoverFromSitemap(
  sitemapUrl: string,
  origin: string,
  userAgent: string,
  timeoutMs: number,
  maxBytes: number,
  depth: number,
): Promise<DiscoveredPage[]> {
  const result = await fetchTextWithSsrf({
    url: sitemapUrl,
    allowedOrigin: origin,
    userAgent,
    timeoutMs,
    maxBytes: Math.min(maxBytes, 500_000),
  });
  if (!result.ok || result.status >= 400) return [];

  const locs = parseSitemapLocs(result.body);
  const pages: DiscoveredPage[] = [];
  for (const loc of locs) {
    const absolute = resolveInternalUrl(loc, origin, origin);
    if (!absolute) continue;
    const { priority, reason } = scorePagePriority(new URL(absolute).pathname);
    pages.push({ url: absolute, depth, priority, reason });
  }
  return pages;
}

async function attachRequestGuards(
  page: Page,
  allowedOrigin: string,
  maxResponseBytes: number,
): Promise<void> {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = request.url();

    if (url.startsWith("data:") || url.startsWith("blob:")) {
      await route.abort();
      return;
    }

    const validated = await validatePublicCrawlUrl(url);
    if (!validated.ok) {
      await route.abort();
      return;
    }

    if (validated.url.origin !== allowedOrigin) {
      // Block third-party subresources during audit crawl
      await route.abort();
      return;
    }

    // Prefer document/script/xhr; still allow same-origin stylesheet/image but capped
    const resourceType = request.resourceType();
    if (
      resourceType === "media" ||
      resourceType === "font" ||
      resourceType === "websocket" ||
      resourceType === "manifest"
    ) {
      await route.abort();
      return;
    }

    await route.continue();
  });

  page.on("response", (response) => {
    const length = response.headers()["content-length"];
    if (length && Number(length) > maxResponseBytes) {
      // Cannot cancel easily mid-flight here; navigation timeout covers stalls.
      void length;
    }
  });
}

async function crawlPageWithPlaywright(options: {
  browser: Browser;
  url: string;
  allowedOrigin: string;
  userAgent: string;
  timeoutMs: number;
  maxResponseBytes: number;
}): Promise<
  | { ok: true; evidence: PageEvidence; hrefs: string[] }
  | { ok: false; error: CrawlError }
> {
  const context = await options.browser.newContext({
    userAgent: options.userAgent,
    javaScriptEnabled: true,
    ignoreHTTPSErrors: false,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(options.timeoutMs);
  page.setDefaultTimeout(options.timeoutMs);

  try {
    await attachRequestGuards(
      page,
      options.allowedOrigin,
      options.maxResponseBytes,
    );

    const precheck = await validateNavigationTarget(
      options.url,
      options.allowedOrigin,
    );
    if (!precheck.ok) {
      return { ok: false, error: precheck.error };
    }

    const response = await page.goto(precheck.url.href, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs,
    });

    const finalUrl = page.url();
    const finalCheck = await validateNavigationTarget(
      finalUrl,
      options.allowedOrigin,
    );
    if (!finalCheck.ok) {
      return { ok: false, error: finalCheck.error };
    }

    const httpStatus = response?.status() ?? null;
    if (httpStatus === 403) {
      return {
        ok: false,
        error: {
          code: "http_forbidden",
          message: "Page returned HTTP 403 Forbidden.",
          url: finalUrl,
          details: "403",
        },
      };
    }
    if (httpStatus === 429) {
      return {
        ok: false,
        error: {
          code: "http_rate_limited",
          message: "Page returned HTTP 429 Too Many Requests.",
          url: finalUrl,
          details: "429",
        },
      };
    }
    if (httpStatus != null && httpStatus >= 400) {
      return {
        ok: false,
        error: {
          code: "network_error",
          message: `Page returned HTTP ${httpStatus}.`,
          url: finalUrl,
          details: String(httpStatus),
        },
      };
    }

    const contentType = response?.headers()["content-type"] ?? null;
    if (
      contentType &&
      !/text\/html|application\/xhtml\+xml/i.test(contentType)
    ) {
      return {
        ok: false,
        error: {
          code: "unsupported_content_type",
          message: "Only HTML pages are extracted.",
          url: finalUrl,
          details: contentType,
        },
      };
    }

    const html = await page.content();
    if (Buffer.byteLength(html, "utf8") > options.maxResponseBytes) {
      return {
        ok: false,
        error: {
          code: "response_too_large",
          message: "Page HTML exceeds maximum allowed size.",
          url: finalUrl,
        },
      };
    }

    const observedAt = utcNow();
    const evidence = extractPageEvidence({
      originalUrl: options.url,
      finalUrl,
      httpStatus,
      html,
      contentType,
      allowedOrigin: options.allowedOrigin,
      observedAt,
    });
    evidence.source.extractionMethod = "playwright_dom";

    return {
      ok: true,
      evidence,
      hrefs: collectAnchorHrefs(html),
    };
  } catch (error) {
    const message = sanitizeBrowserErrorMessage(error);
    const isTimeout = /timeout/i.test(message);
    return {
      ok: false,
      error: {
        code: isTimeout ? "timeout" : "browser_failure",
        message: isTimeout
          ? "Browser navigation timed out."
          : "Browser failed to load the page.",
        url: options.url,
        details: message,
      },
    };
  } finally {
    await context.close();
  }
}

function applyLaunchDiagnostics(
  diagnostics: CrawlDiagnostics,
  launch: BrowserLaunchDiagnostics,
): void {
  diagnostics.browserLaunchAttempted = launch.launchAttempted;
  diagnostics.browserLaunchSucceeded = launch.launchSucceeded;
  diagnostics.browserRuntime = launch.runtime;
  diagnostics.browserExecutableSource = launch.executableSource;
  diagnostics.browserExecutablePresent = launch.executablePresent;
  if (launch.failureCode) {
    diagnostics.browserLaunchFailureCode = launch.failureCode;
  }
  diagnostics.sanitizedBrowserLaunchFailure = launch.sanitizedFailureReason;
}

/**
 * Secure, bounded website crawl returning structured evidence only.
 * Server-only — do not import from Client Components.
 */
export async function crawlWebsite(request: CrawlRequest): Promise<CrawlResult> {
  const startedAt = utcNow();
  const defaults = mergeDefaults(request);
  const errors: CrawlError[] = [];
  const diagnostics = emptyCrawlDiagnostics();

  const structural = validateUrlStructure(defaults.url);
  if (!structural.ok) {
    return {
      ok: false,
      request: { ...defaults, normalizedUrl: defaults.url },
      website: null,
      pages: [],
      errors: [structural.error],
      startedAt,
      finishedAt: utcNow(),
      partial: false,
      diagnostics: emptyCrawlDiagnostics({
        finalStatus: "failed",
        providerSkipReasons: {
          pagespeed: "PageSpeed skipped: URL failed structural validation.",
          openai: "OpenAI skipped: URL failed structural validation.",
        },
      }),
    };
  }

  const seed = await validatePublicCrawlUrl(structural.url.href);
  if (!seed.ok) {
    return {
      ok: false,
      request: { ...defaults, normalizedUrl: structural.url.href },
      website: null,
      pages: [],
      errors: [seed.error],
      startedAt,
      finishedAt: utcNow(),
      partial: false,
      diagnostics: emptyCrawlDiagnostics({
        finalStatus: "failed",
        providerSkipReasons: {
          pagespeed: `PageSpeed skipped: ${seed.error.message}`,
          openai: `OpenAI skipped: ${seed.error.message}`,
        },
      }),
    };
  }

  const allowedOrigin = seed.url.origin;
  const normalizedUrl = seed.url.href;

  const robots = await loadRobots(
    allowedOrigin,
    defaults.userAgent,
    defaults.navigationTimeoutMs,
    defaults.maxResponseBytes,
  );

  if (robots.available === "blocked") {
    diagnostics.robotsDecision = "blocked";
    errors.push({
      code: "robots_blocked",
      message:
        "Crawl aborted because robots.txt could not be evaluated safely.",
      url: `${allowedOrigin}/robots.txt`,
    });
    return {
      ok: false,
      request: { ...defaults, normalizedUrl },
      website: null,
      pages: [],
      errors,
      startedAt,
      finishedAt: utcNow(),
      partial: false,
      diagnostics: {
        ...diagnostics,
        finalStatus: "failed",
        providerSkipReasons: {
          pagespeed: "PageSpeed skipped: robots.txt could not be evaluated safely.",
          openai: "OpenAI skipped: robots.txt could not be evaluated safely.",
        },
      },
    };
  }

  const homepagePath = new URL(normalizedUrl).pathname || "/";
  if (!robots.isAllowed(homepagePath)) {
    diagnostics.robotsDecision = "blocked";
    errors.push({
      code: "robots_blocked",
      message: "Homepage is disallowed by robots.txt.",
      url: normalizedUrl,
    });
    return {
      ok: false,
      request: { ...defaults, normalizedUrl },
      website: null,
      pages: [],
      errors,
      startedAt,
      finishedAt: utcNow(),
      partial: false,
      diagnostics: {
        ...diagnostics,
        finalStatus: "failed",
        providerSkipReasons: {
          pagespeed: "PageSpeed skipped: homepage disallowed by robots.txt.",
          openai: "OpenAI skipped: homepage disallowed by robots.txt.",
        },
      },
    };
  }

  diagnostics.robotsDecision =
    robots.available === "unavailable" ? "unavailable" : "allowed";

  const candidates: DiscoveredPage[] = [
    {
      url: normalizedUrl,
      depth: 0,
      priority: 100,
      reason: "homepage",
    },
  ];

  // Default sitemap + robots-declared sitemaps
  const sitemapCandidates = [
    `${allowedOrigin}/sitemap.xml`,
    ...robots.sitemapUrls,
  ];
  for (const sitemapUrl of sitemapCandidates.slice(0, 3)) {
    const absolute = resolveInternalUrl(sitemapUrl, allowedOrigin, allowedOrigin);
    if (!absolute) continue;
    const discovered = await discoverFromSitemap(
      absolute,
      allowedOrigin,
      defaults.userAgent,
      defaults.navigationTimeoutMs,
      defaults.maxResponseBytes,
      1,
    );
    candidates.push(...discovered);
  }

  let browser: Browser | null = null;
  const pages: PageEvidence[] = [];
  const visited = new Set<string>();
  let pagesSkipped = 0;
  let partial = false;
  let launchFailed = false;

  try {
    const launcher = request.launchBrowser ?? launchAuditBrowser;
    const launched = await launcher({
      timeoutMs: defaults.navigationTimeoutMs,
    });
    browser = launched.browser;
    applyLaunchDiagnostics(diagnostics, launched.diagnostics);

    const queue = prioritizeDiscoveredPages(candidates, defaults.maxPages * 3);

    while (queue.length > 0 && pages.length < defaults.maxPages) {
      const next = queue.shift();
      if (!next) break;
      if (visited.has(next.url)) continue;
      visited.add(next.url);

      if (next.depth > defaults.maxDepth) {
        pagesSkipped += 1;
        diagnostics.pagesRejected += 1;
        continue;
      }

      const path = new URL(next.url).pathname || "/";
      if (!robots.isAllowed(path)) {
        pagesSkipped += 1;
        diagnostics.pagesRejected += 1;
        errors.push({
          code: "robots_blocked",
          message: "Skipped page disallowed by robots.txt.",
          url: next.url,
        });
        continue;
      }

      const hopCheck = await validateNavigationTarget(next.url, allowedOrigin);
      if (!hopCheck.ok) {
        pagesSkipped += 1;
        diagnostics.pagesRejected += 1;
        errors.push(hopCheck.error);
        continue;
      }

      diagnostics.navigationAttempted += 1;
      const crawled = await crawlPageWithPlaywright({
        browser,
        url: hopCheck.url.href,
        allowedOrigin,
        userAgent: defaults.userAgent,
        timeoutMs: defaults.navigationTimeoutMs,
        maxResponseBytes: defaults.maxResponseBytes,
      });

      if (!crawled.ok) {
        pagesSkipped += 1;
        diagnostics.pagesRejected += 1;
        errors.push(crawled.error);
        partial = true;
        continue;
      }

      pages.push(crawled.evidence);
      diagnostics.pagesExtracted += 1;

      if (next.depth < defaults.maxDepth) {
        const childLinks = extractLinksFromHtml(
          crawled.hrefs,
          crawled.evidence.finalUrl,
          allowedOrigin,
          next.depth + 1,
        );
        const prioritized = prioritizeDiscoveredPages(
          [...queue, ...childLinks],
          defaults.maxPages * 3,
        );
        queue.length = 0;
        queue.push(...prioritized.filter((item) => !visited.has(item.url)));
      }
    }

    if (visited.size > pages.length) {
      partial = true;
    }
  } catch (error) {
    const launchDiag = (
      error as Error & { diagnostics?: BrowserLaunchDiagnostics }
    ).diagnostics;
    if (launchDiag) {
      applyLaunchDiagnostics(diagnostics, launchDiag);
    } else {
      diagnostics.browserLaunchAttempted = true;
      diagnostics.browserLaunchSucceeded = false;
      diagnostics.sanitizedBrowserLaunchFailure =
        sanitizeBrowserErrorMessage(error);
    }

    const code: CrawlErrorCode =
      diagnostics.browserLaunchFailureCode &&
      isBrowserLaunchErrorCode(diagnostics.browserLaunchFailureCode)
        ? diagnostics.browserLaunchFailureCode
        : "browser_launch_failed";

    diagnostics.browserLaunchFailureCode = code;
    launchFailed = true;
    errors.push({
      code,
      message:
        code === "browser_executable_missing"
          ? "Chromium executable was not available in the runtime."
          : "Crawl failed to start or complete the browser session.",
      details:
        diagnostics.sanitizedBrowserLaunchFailure ??
        sanitizeBrowserErrorMessage(error),
    });
    // Launch failures are total failures, not partial crawls.
    partial = pages.length > 0;
  } finally {
    await browser?.close().catch(() => undefined);
  }

  if (pages.length === 0) {
    const primary = errors[0];
    const skipReason = launchFailed
      ? `Browser launch failed (${primary?.code ?? "browser_launch_failed"}).`
      : primary
        ? primary.message
        : "No pages could be crawled.";
    return {
      ok: false,
      request: { ...defaults, normalizedUrl },
      website: null,
      pages: [],
      errors: errors.length
        ? errors
        : [
            {
              code: "unknown",
              message: "No pages could be crawled.",
              url: normalizedUrl,
            },
          ],
      startedAt,
      finishedAt: utcNow(),
      // Preserve true partial only when navigation ran; launch miss is not partial.
      partial: launchFailed ? false : true,
      diagnostics: {
        ...diagnostics,
        finalStatus: launchFailed ? "failed" : "partial",
        providerSkipReasons: {
          pagespeed: `PageSpeed skipped: ${skipReason}`,
          openai: `OpenAI skipped: ${skipReason}`,
        },
      },
    };
  }

  if (pages.length >= defaults.maxPages) {
    errors.push({
      code: "crawl_limit_reached",
      message: `Stopped after reaching the configured page limit (${defaults.maxPages}). Undiscovered pages may still exist.`,
      url: normalizedUrl,
    });
    partial = true;
  }

  const finishedAt = utcNow();
  const website = aggregateWebsiteEvidence({
    seedUrl: request.url,
    normalizedSeedUrl: normalizedUrl,
    homepageUrl: pages[0]?.finalUrl ?? normalizedUrl,
    pages,
    pagesSkipped,
    robotsRespected: robots.rawFetched || robots.available === "unavailable",
    observedAt: finishedAt,
  });

  return {
    ok: true,
    request: { ...defaults, normalizedUrl },
    website,
    pages,
    errors,
    startedAt,
    finishedAt,
    partial,
    diagnostics: {
      ...diagnostics,
      finalStatus: partial ? "partial" : "ok",
      providerSkipReasons: {
        pagespeed: null,
        openai: null,
      },
    },
  };
}

/** Test helper: extract evidence from HTML without launching a browser. */
export function extractEvidenceFromHtmlFixture(options: {
  originalUrl: string;
  finalUrl?: string;
  html: string;
  httpStatus?: number;
}): PageEvidence {
  const finalUrl = options.finalUrl ?? options.originalUrl;
  const allowedOrigin = new URL(finalUrl).origin;
  return extractPageEvidence({
    originalUrl: options.originalUrl,
    finalUrl,
    httpStatus: options.httpStatus ?? 200,
    html: options.html,
    contentType: "text/html",
    allowedOrigin,
    observedAt: utcNow(),
  });
}
