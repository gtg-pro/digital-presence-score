import "server-only";

import { chromium, type Browser, type LaunchOptions } from "playwright";

export type BrowserExecutableSource =
  | "playwright_bundled"
  | "sparticuz_chromium"
  | "env_override";

export type BrowserLaunchFailureCode =
  | "browser_executable_missing"
  | "browser_launch_failed"
  | "browser_failure";

export type BrowserLaunchDiagnostics = {
  launchAttempted: boolean;
  launchSucceeded: boolean;
  runtime: "local" | "serverless_linux";
  executableSource: BrowserExecutableSource;
  executablePresent: boolean | null;
  failureCode: BrowserLaunchFailureCode | null;
  /** Sanitized — no absolute paths, secrets, or large payloads. */
  sanitizedFailureReason: string | null;
};

export type LaunchBrowserResult = {
  browser: Browser;
  diagnostics: BrowserLaunchDiagnostics;
};

export type LaunchBrowserFn = (
  options?: LaunchAuditBrowserOptions,
) => Promise<LaunchBrowserResult>;

export type LaunchAuditBrowserOptions = {
  timeoutMs?: number;
};

/**
 * Netlify / AWS Lambda Linux runtimes do not ship Playwright's downloaded
 * Chromium. Detect those hosts so we can use @sparticuz/chromium instead.
 */
export function isServerlessLinuxRuntime(
  env: Record<string, string | undefined> = process.env,
  platform: NodeJS.Platform = process.platform,
): boolean {
  if (env.FORCE_LOCAL_CHROMIUM === "1") return false;
  if (env.FORCE_SERVERLESS_CHROMIUM === "1") return platform === "linux";
  if (platform !== "linux") return false;
  return Boolean(
    env.AWS_LAMBDA_FUNCTION_NAME ||
      env.LAMBDA_TASK_ROOT ||
      env.NETLIFY === "true",
  );
}

export function sanitizeBrowserErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/https?:\/\/[^\s'"]+/gi, "[url]")
    .replace(/([A-Za-z]:)?[\\/][^\s'"`]+/g, "[path]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

export function classifyBrowserLaunchFailure(
  error: unknown,
): BrowserLaunchFailureCode {
  const message = error instanceof Error ? error.message : String(error);
  if (
    /executable doesn't exist|ENOENT|no such file|Failed to find browser/i.test(
      message,
    )
  ) {
    return "browser_executable_missing";
  }
  if (/Failed to launch|browserType\.launch/i.test(message)) {
    return "browser_launch_failed";
  }
  return "browser_failure";
}

function baseDiagnostics(
  runtime: BrowserLaunchDiagnostics["runtime"],
  executableSource: BrowserExecutableSource,
): BrowserLaunchDiagnostics {
  return {
    launchAttempted: true,
    launchSucceeded: false,
    runtime,
    executableSource,
    executablePresent: null,
    failureCode: null,
    sanitizedFailureReason: null,
  };
}

/**
 * Launch Chromium for crawl / export.
 * Local: Playwright-managed browser. Serverless Linux: @sparticuz/chromium.
 */
export async function launchAuditBrowser(
  options: LaunchAuditBrowserOptions = {},
): Promise<LaunchBrowserResult> {
  const envPath = process.env.PLAYWRIGHT_EXECUTABLE_PATH?.trim();
  const serverless = isServerlessLinuxRuntime();
  const diagnostics = baseDiagnostics(
    serverless ? "serverless_linux" : "local",
    envPath ? "env_override" : serverless ? "sparticuz_chromium" : "playwright_bundled",
  );

  try {
    if (envPath) {
      diagnostics.executablePresent = true;
      const browser = await chromium.launch({
        headless: true,
        executablePath: envPath,
        args: ["--disable-dev-shm-usage", "--no-sandbox"],
        timeout: options.timeoutMs,
      });
      diagnostics.launchSucceeded = true;
      return { browser, diagnostics };
    }

    if (serverless) {
      const sparticuz = await import("@sparticuz/chromium");
      const executablePath = await sparticuz.default.executablePath();
      diagnostics.executablePresent = Boolean(executablePath);
      if (!executablePath) {
        const missing = new Error(
          "Serverless Chromium executable path resolved empty.",
        );
        diagnostics.failureCode = "browser_executable_missing";
        diagnostics.sanitizedFailureReason = sanitizeBrowserErrorMessage(missing);
        throw missing;
      }

      const launchOptions: LaunchOptions = {
        headless: true,
        executablePath,
        args: [...sparticuz.default.args, "--disable-dev-shm-usage"],
        timeout: options.timeoutMs,
      };
      const browser = await chromium.launch(launchOptions);
      diagnostics.launchSucceeded = true;
      return { browser, diagnostics };
    }

    diagnostics.executablePresent = true;
    const browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
      timeout: options.timeoutMs,
    });
    diagnostics.launchSucceeded = true;
    return { browser, diagnostics };
  } catch (error) {
    diagnostics.launchSucceeded = false;
    diagnostics.failureCode = classifyBrowserLaunchFailure(error);
    diagnostics.sanitizedFailureReason = sanitizeBrowserErrorMessage(error);
    if (
      diagnostics.failureCode === "browser_executable_missing" &&
      diagnostics.executablePresent == null
    ) {
      diagnostics.executablePresent = false;
    }
    const wrapped = new Error(diagnostics.sanitizedFailureReason ?? "Browser launch failed.");
    (wrapped as Error & { diagnostics: BrowserLaunchDiagnostics }).diagnostics =
      diagnostics;
    throw wrapped;
  }
}
