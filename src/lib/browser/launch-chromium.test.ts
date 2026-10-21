import { describe, expect, it } from "vitest";

import {
  classifyBrowserLaunchFailure,
  isServerlessLinuxRuntime,
  sanitizeBrowserErrorMessage,
} from "@/lib/browser/launch-chromium";

describe("isServerlessLinuxRuntime", () => {
  it("detects Netlify Linux", () => {
    expect(
      isServerlessLinuxRuntime({ NETLIFY: "true" }, "linux"),
    ).toBe(true);
  });

  it("detects AWS Lambda", () => {
    expect(
      isServerlessLinuxRuntime(
        { AWS_LAMBDA_FUNCTION_NAME: "audit-run" },
        "linux",
      ),
    ).toBe(true);
  });

  it("never uses serverless Chromium on Windows/macOS", () => {
    expect(
      isServerlessLinuxRuntime({ NETLIFY: "true" }, "win32"),
    ).toBe(false);
    expect(
      isServerlessLinuxRuntime({ NETLIFY: "true" }, "darwin"),
    ).toBe(false);
  });

  it("respects FORCE_LOCAL_CHROMIUM", () => {
    expect(
      isServerlessLinuxRuntime(
        { NETLIFY: "true", FORCE_LOCAL_CHROMIUM: "1" },
        "linux",
      ),
    ).toBe(false);
  });
});

describe("classifyBrowserLaunchFailure", () => {
  it("classifies missing executable", () => {
    expect(
      classifyBrowserLaunchFailure(
        new Error(
          "browserType.launch: Failed to launch chromium because executable doesn't exist at /var/task/chrome",
        ),
      ),
    ).toBe("browser_executable_missing");
  });

  it("classifies generic launch failures", () => {
    expect(
      classifyBrowserLaunchFailure(
        new Error("browserType.launch: Target closed"),
      ),
    ).toBe("browser_launch_failed");
  });
});

describe("sanitizeBrowserErrorMessage", () => {
  it("redacts absolute paths and URLs", () => {
    const sanitized = sanitizeBrowserErrorMessage(
      new Error(
        "Failed to launch chromium because executable doesn't exist at /var/task/node_modules/.cache/chrome see https://example.com/docs",
      ),
    );
    expect(sanitized).not.toMatch(/\/var\/task/);
    expect(sanitized).not.toMatch(/https:\/\//);
    expect(sanitized).toContain("[path]");
    expect(sanitized).toContain("[url]");
  });
});
