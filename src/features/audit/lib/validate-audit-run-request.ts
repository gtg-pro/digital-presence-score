import type { AuditRunRequestBody } from "@/features/audit/types/audit-run.types";
import { validateUrlStructure } from "@/lib/audit/crawler/url-validator";
import { normalizeWebsiteUrl } from "@/lib/website-url";

export type ValidatedAuditRunRequest =
  | {
      ok: true;
      body: AuditRunRequestBody;
      normalizedWebsiteUrl: string;
      allowMissingWebsite: boolean;
    }
  | {
      ok: false;
      code: "invalid_input" | "unsafe_url";
      message: string;
    };

export function validateAuditRunRequest(
  input: unknown,
): ValidatedAuditRunRequest {
  if (!input || typeof input !== "object") {
    return {
      ok: false,
      code: "invalid_input",
      message: "Invalid audit request body.",
    };
  }

  const raw = input as Record<string, unknown>;
  // Minimal / no-website entry is retired — website URL audits only.
  if (raw.entryMode === "minimal") {
    return {
      ok: false,
      code: "invalid_input",
      message:
        "Website URL is required. The business-details-only path is no longer available.",
    };
  }
  const entryMode = "url" as const;
  const websiteUrl =
    typeof raw.websiteUrl === "string" ? raw.websiteUrl.trim() : "";
  const businessName =
    typeof raw.businessName === "string" ? raw.businessName.trim() : "";

  if (!websiteUrl) {
    return {
      ok: false,
      code: "invalid_input",
      message: "Website URL is required.",
    };
  }

  let normalizedWebsiteUrl = "";
  if (websiteUrl) {
    // Reject non-http(s) schemes before https:// normalization can mask them.
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(websiteUrl)) {
      const scheme = websiteUrl.split(":", 1)[0]?.toLowerCase() ?? "";
      if (scheme !== "http" && scheme !== "https") {
        return {
          ok: false,
          code: "unsafe_url",
          message: "Only http and https website URLs are allowed.",
        };
      }
    }

    normalizedWebsiteUrl = normalizeWebsiteUrl(websiteUrl);
    const structure = validateUrlStructure(normalizedWebsiteUrl);
    if (!structure.ok) {
      const code =
        structure.error.code === "ssrf_blocked" ? "unsafe_url" : "invalid_input";
      return {
        ok: false,
        code,
        message: structure.error.message,
      };
    }
    normalizedWebsiteUrl = structure.url.href;
  }

  const hint = raw.businessModelHint;
  const businessModelHint =
    hint === "remote_online" || hint === "local_service" || hint === "unknown"
      ? hint
      : raw.remoteOnly === true
        ? "remote_online"
        : undefined;

  return {
    ok: true,
    allowMissingWebsite: false,
    normalizedWebsiteUrl,
    body: {
      websiteUrl: normalizedWebsiteUrl,
      businessName: businessName || undefined,
      entryMode,
      businessModelHint,
      industry: typeof raw.industry === "string" ? raw.industry : undefined,
      primaryServiceArea:
        typeof raw.primaryServiceArea === "string"
          ? raw.primaryServiceArea
          : undefined,
      remoteOnly: raw.remoteOnly === true,
    },
  };
}
