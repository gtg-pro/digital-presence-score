import "server-only";

const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export type RecaptchaFailureCode =
  | "missing"
  | "invalid"
  | "expired"
  | "config"
  | "service";

export type RecaptchaVerifyResult =
  | { ok: true; hostname: string }
  | {
      ok: false;
      code: RecaptchaFailureCode;
      message: string;
    };

type GoogleSiteVerifyResponse = {
  success?: boolean;
  hostname?: string;
  challenge_ts?: string;
  "error-codes"?: string[];
};

const USER_MESSAGES = {
  missing: "Please complete the CAPTCHA verification.",
  invalid: "Security verification failed. Please try again.",
  expired: "Verification expired. Please verify again.",
  config: "Security verification is temporarily unavailable. Please try again later.",
  service:
    "Security verification is temporarily unavailable. Please try again later.",
} as const;

function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

/**
 * Hostnames Google may return for a valid challenge in this deployment.
 * Includes localhost for local development and common Vercel URL shapes.
 */
export function allowedRecaptchaHostnames(): Set<string> {
  const hosts = new Set<string>(["localhost"]);

  const add = (raw: string | undefined) => {
    if (!raw?.trim()) return;
    try {
      const withProtocol = raw.includes("://") ? raw : `https://${raw}`;
      const hostname = normalizeHostname(new URL(withProtocol).hostname);
      if (hostname) hosts.add(hostname);
    } catch {
      const cleaned = normalizeHostname(raw.replace(/^https?:\/\//, "").split("/")[0] ?? "");
      if (cleaned) hosts.add(cleaned);
    }
  };

  add(process.env.NEXT_PUBLIC_SITE_URL);
  add(process.env.VERCEL_URL);
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  add(process.env.RECAPTCHA_EXPECTED_HOSTNAME);

  return hosts;
}

function mapGoogleErrorCodes(
  codes: string[] | undefined,
): RecaptchaFailureCode {
  if (!codes?.length) return "invalid";
  if (codes.includes("missing-input-response")) return "missing";
  if (
    codes.includes("timeout-or-duplicate") ||
    codes.includes("browser-error")
  ) {
    return "expired";
  }
  if (
    codes.includes("missing-input-secret") ||
    codes.includes("invalid-input-secret")
  ) {
    return "config";
  }
  return "invalid";
}

/**
 * Verify a reCAPTCHA v2 response token with Google siteverify.
 * Never logs or returns the secret key.
 */
export async function verifyRecaptchaV2(input: {
  token: string | null | undefined;
  remoteip?: string | null;
}): Promise<RecaptchaVerifyResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: false, code: "config", message: USER_MESSAGES.config };
  }

  const token = typeof input.token === "string" ? input.token.trim() : "";
  if (!token) {
    return { ok: false, code: "missing", message: USER_MESSAGES.missing };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (input.remoteip?.trim()) {
    body.set("remoteip", input.remoteip.trim());
  }

  let payload: GoogleSiteVerifyResponse;
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });
    if (!response.ok) {
      return { ok: false, code: "service", message: USER_MESSAGES.service };
    }
    payload = (await response.json()) as GoogleSiteVerifyResponse;
  } catch {
    return { ok: false, code: "service", message: USER_MESSAGES.service };
  }

  if (!payload.success) {
    const code = mapGoogleErrorCodes(payload["error-codes"]);
    return { ok: false, code, message: USER_MESSAGES[code] };
  }

  const hostname = normalizeHostname(payload.hostname ?? "");
  if (!hostname) {
    return { ok: false, code: "invalid", message: USER_MESSAGES.invalid };
  }

  const allowed = allowedRecaptchaHostnames();
  if (!allowed.has(hostname)) {
    return { ok: false, code: "invalid", message: USER_MESSAGES.invalid };
  }

  return { ok: true, hostname };
}

export function getRecaptchaSiteKey(): string | null {
  const key = process.env.RECAPTCHA_SITE_KEY?.trim();
  return key || null;
}

/**
 * Whether controlled Playwright fixture mode may skip CAPTCHA.
 * ALLOW_AUDIT_E2E_FIXTURES must never be set on real production traffic
 * (same rule as OpenAI audit fixture injection).
 */
export function canSkipRecaptchaForE2E(): boolean {
  return process.env.ALLOW_AUDIT_E2E_FIXTURES === "1";
}
