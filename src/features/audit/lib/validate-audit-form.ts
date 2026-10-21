import type {
  AuditFormErrors,
  AuditFormValues,
} from "@/features/audit/types/audit-form.types";
import { isValidWebsiteUrl } from "@/lib/website-url";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidOptionalUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return true;
  return isValidWebsiteUrl(trimmed);
}

export function isValidOptionalEmail(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return true;
  return EMAIL_PATTERN.test(trimmed);
}

function hasAnyPublicProfile(values: AuditFormValues): boolean {
  return Boolean(
    values.googleBusinessProfileUrl.trim() ||
      values.facebookUrl.trim() ||
      values.instagramUrl.trim() ||
      values.linkedinUrl.trim() ||
      values.otherProfileUrl.trim(),
  );
}

function validateOptionalUrlField(
  value: string,
  label: string,
): string | undefined {
  if (!value.trim()) return undefined;
  if (!isValidWebsiteUrl(value)) {
    return `Enter a valid ${label}, or leave this field blank.`;
  }
  return undefined;
}

export function validateAuditForm(values: AuditFormValues): AuditFormErrors {
  const errors: AuditFormErrors = {};

  if (values.entryMode === "url") {
    if (!values.websiteUrl.trim()) {
      errors.websiteUrl = "Website URL is required for the URL-based assessment.";
    } else if (!isValidWebsiteUrl(values.websiteUrl)) {
      errors.websiteUrl =
        "Enter a valid website URL, such as example.com or https://example.com.";
    }
  } else {
    if (!values.businessName.trim()) {
      errors.businessName = "Business name is required for the minimal-info path.";
    }

    if (!values.remoteOnly && !values.primaryServiceArea.trim()) {
      errors.primaryServiceArea =
        "Enter a service area, or mark this business as remote-only.";
    }

    const hasWebsite =
      values.websiteUrl.trim().length > 0 && isValidWebsiteUrl(values.websiteUrl);
    const hasProfile = hasAnyPublicProfile(values);

    if (values.websiteUrl.trim() && !isValidWebsiteUrl(values.websiteUrl)) {
      errors.websiteUrl =
        "Enter a valid website URL, or leave it blank and provide a public profile instead.";
    }

    if (!hasWebsite && !hasProfile) {
      errors.profiles =
        "Provide a website URL or at least one public business-profile URL.";
    }
  }

  const profileFields: Array<[keyof AuditFormValues, string]> = [
    ["googleBusinessProfileUrl", "Google Business Profile URL"],
    ["facebookUrl", "Facebook URL"],
    ["instagramUrl", "Instagram URL"],
    ["linkedinUrl", "LinkedIn URL"],
    ["otherProfileUrl", "public profile URL"],
  ];

  for (const [field, label] of profileFields) {
    const message = validateOptionalUrlField(String(values[field]), label);
    if (message) errors[field] = message;
  }

  if (values.email.trim() && !isValidOptionalEmail(values.email)) {
    errors.email = "Enter a valid email address, or leave this field blank.";
  }

  if (!values.agreeToTerms) {
    errors.agreeToTerms = "You must agree to the assessment terms to continue.";
  }

  return errors;
}
