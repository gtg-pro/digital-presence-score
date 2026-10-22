import { afterEach, describe, expect, it, vi } from "vitest";

import {
  allowedRecaptchaHostnames,
  canSkipRecaptchaForE2E,
  verifyRecaptchaV2,
} from "@/lib/recaptcha/verify-recaptcha";

describe("verifyRecaptchaV2", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects missing configuration", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    const result = await verifyRecaptchaV2({ token: "token" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("config");
    }
  });

  it("rejects missing tokens", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
    const result = await verifyRecaptchaV2({ token: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("missing");
      expect(result.message).toBe("Please complete the CAPTCHA verification.");
    }
  });

  it("rejects expired or reused tokens", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: false,
          "error-codes": ["timeout-or-duplicate"],
        }),
      ),
    );

    const result = await verifyRecaptchaV2({ token: "used-token" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("expired");
      expect(result.message).toBe("Verification expired. Please verify again.");
    }
  });

  it("accepts a successful Google response for an allowed hostname", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
    vi.stubEnv("RECAPTCHA_EXPECTED_HOSTNAME", "example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          hostname: "example.com",
        }),
      ),
    );

    const result = await verifyRecaptchaV2({ token: "good-token" });
    expect(result).toEqual({ ok: true, hostname: "example.com" });
  });

  it("rejects success responses for unexpected hostnames", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
    vi.stubEnv("RECAPTCHA_EXPECTED_HOSTNAME", "goodtogo.pro");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          hostname: "evil.example",
        }),
      ),
    );

    const result = await verifyRecaptchaV2({ token: "good-token" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid");
      expect(result.message).toBe(
        "Security verification failed. Please try again.",
      );
    }
  });

  it("includes localhost among allowed hostnames", () => {
    expect(allowedRecaptchaHostnames().has("localhost")).toBe(true);
  });

  it("skips captcha only when ALLOW_AUDIT_E2E_FIXTURES is enabled", () => {
    vi.stubEnv("ALLOW_AUDIT_E2E_FIXTURES", "");
    expect(canSkipRecaptchaForE2E()).toBe(false);
    vi.stubEnv("ALLOW_AUDIT_E2E_FIXTURES", "1");
    expect(canSkipRecaptchaForE2E()).toBe(true);
  });
});
