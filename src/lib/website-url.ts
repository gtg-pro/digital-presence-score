/**
 * Client-safe website URL helpers for the landing form.
 * No network calls — validation and normalization only.
 */

const DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function isValidWebsiteUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  // Reject whitespace mid-string and obvious non-URLs
  if (/\s/.test(trimmed)) return false;

  let parsed: URL;
  try {
    parsed = new URL(normalizeWebsiteUrl(trimmed));
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostname === "localhost") return true;

  return DOMAIN_PATTERN.test(hostname);
}

export function getWebsiteUrlValidationMessage(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return "Enter a website URL to continue.";
  }
  if (!isValidWebsiteUrl(trimmed)) {
    return "Enter a valid website URL, such as example.com or https://example.com.";
  }
  return null;
}
