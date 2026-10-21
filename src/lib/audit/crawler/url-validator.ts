import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import type { CrawlError } from "@/features/audit/types/evidence.types";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);

/** Hostnames that must never be crawled. */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.google",
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".corp",
  ".lan",
];

/** Well-known cloud metadata endpoints. */
const METADATA_HOSTS = new Set([
  "169.254.169.254",
  "metadata.google.internal",
  "metadata",
]);

export type ValidatedPublicUrl = {
  href: string;
  origin: string;
  hostname: string;
  port: number;
  protocol: "http:" | "https:";
  resolvedAddresses: string[];
};

export type UrlValidationFailure = {
  ok: false;
  error: CrawlError;
};

export type UrlValidationSuccess = {
  ok: true;
  url: ValidatedPublicUrl;
};

export type UrlValidationResult = UrlValidationFailure | UrlValidationSuccess;

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (
    ((parts[0]! << 24) >>> 0) +
    ((parts[1]! << 16) >>> 0) +
    ((parts[2]! << 8) >>> 0) +
    (parts[3]! >>> 0)
  );
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);

  const ranges: Array<[number, number]> = [
    [ipv4ToInt("0.0.0.0"), ipv4ToInt("0.255.255.255")],
    [ipv4ToInt("10.0.0.0"), ipv4ToInt("10.255.255.255")],
    [ipv4ToInt("100.64.0.0"), ipv4ToInt("100.127.255.255")],
    [ipv4ToInt("127.0.0.0"), ipv4ToInt("127.255.255.255")],
    [ipv4ToInt("169.254.0.0"), ipv4ToInt("169.254.255.255")],
    [ipv4ToInt("172.16.0.0"), ipv4ToInt("172.31.255.255")],
    [ipv4ToInt("192.0.0.0"), ipv4ToInt("192.0.0.255")],
    [ipv4ToInt("192.0.2.0"), ipv4ToInt("192.0.2.255")],
    [ipv4ToInt("192.168.0.0"), ipv4ToInt("192.168.255.255")],
    [ipv4ToInt("198.18.0.0"), ipv4ToInt("198.19.255.255")],
    [ipv4ToInt("198.51.100.0"), ipv4ToInt("198.51.100.255")],
    [ipv4ToInt("203.0.113.0"), ipv4ToInt("203.0.113.255")],
    [ipv4ToInt("224.0.0.0"), ipv4ToInt("239.255.255.255")],
    [ipv4ToInt("240.0.0.0"), ipv4ToInt("255.255.255.255")],
  ];

  return ranges.some(([start, end]) => n >= start && n <= end);
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (normalized.startsWith("fe80")) return true; // link-local
  if (normalized.startsWith("ff")) return true; // multicast
  // IPv4-mapped
  if (normalized.includes(".")) {
    const mapped = normalized.split(":").pop();
    if (mapped && isIP(mapped) === 4) return isPrivateOrReservedIpv4(mapped);
  }
  return false;
}

export function isBlockedIpAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateOrReservedIpv4(address);
  if (version === 6) return isPrivateOrReservedIpv6(address);
  return true;
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (METADATA_HOSTS.has(host)) return true;
  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return true;
  }
  if (host === "0.0.0.0") return true;
  return false;
}

function defaultPort(protocol: string, port: string): number {
  if (port) return Number(port);
  return protocol === "https:" ? 443 : 80;
}

/**
 * Normalize user input to an absolute http(s) URL string, or null.
 * Does not perform DNS or SSRF checks.
 */
export function normalizeCrawlUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  // Reject non-http(s) schemes early (do not coerce ftp/file/etc.)
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function failure(
  code: CrawlError["code"],
  message: string,
  url?: string,
  details?: string,
): UrlValidationFailure {
  return { ok: false, error: { code, message, url, details } };
}

/**
 * Structural URL checks (no DNS). Safe to use in unit tests without network.
 */
export function validateUrlStructure(input: string): UrlValidationResult {
  const normalized = normalizeCrawlUrl(input);
  if (!normalized) {
    return failure("invalid_url", "URL is malformed or empty.", input);
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return failure("invalid_url", "URL could not be parsed.", input);
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return failure(
      "ssrf_blocked",
      "Only http and https URLs are allowed.",
      normalized,
    );
  }

  if (parsed.username || parsed.password) {
    return failure(
      "ssrf_blocked",
      "URLs with embedded credentials are not allowed.",
      normalized,
    );
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (isBlockedHostname(hostname)) {
    return failure(
      "ssrf_blocked",
      "Hostname is blocked for security reasons.",
      normalized,
      hostname,
    );
  }

  const port = defaultPort(parsed.protocol, parsed.port);
  if (!ALLOWED_PORTS.has(port)) {
    return failure(
      "ssrf_blocked",
      `Port ${port} is not allowed.`,
      normalized,
    );
  }

  // Literal IP host
  if (isIP(hostname)) {
    if (isBlockedIpAddress(hostname)) {
      return failure(
        "ssrf_blocked",
        "Private or reserved IP addresses are not allowed.",
        normalized,
        hostname,
      );
    }
  }

  return {
    ok: true,
    url: {
      href: parsed.href,
      origin: parsed.origin,
      hostname,
      port,
      protocol: parsed.protocol as "http:" | "https:",
      resolvedAddresses: isIP(hostname) ? [hostname] : [],
    },
  };
}

/**
 * Full validation including DNS resolution and IP checks (SSRF defense).
 */
export async function validatePublicCrawlUrl(
  input: string,
): Promise<UrlValidationResult> {
  const structural = validateUrlStructure(input);
  if (!structural.ok) return structural;

  const { url } = structural;

  if (url.resolvedAddresses.length > 0) {
    return structural;
  }

  try {
    const records = await lookup(url.hostname, { all: true, verbatim: true });
    if (!records.length) {
      return failure(
        "dns_failure",
        "DNS resolution returned no addresses.",
        url.href,
      );
    }

    const addresses = records.map((record) => record.address);
    for (const address of addresses) {
      if (isBlockedIpAddress(address)) {
        return failure(
          "ssrf_blocked",
          "Resolved address is private, reserved, or otherwise blocked.",
          url.href,
          address,
        );
      }
    }

    return {
      ok: true,
      url: { ...url, resolvedAddresses: addresses },
    };
  } catch (error) {
    return failure(
      "dns_failure",
      "DNS resolution failed.",
      url.href,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Re-validate a redirect or navigation target before requesting it.
 */
export async function validateNavigationTarget(
  target: string,
  allowedOrigin: string,
): Promise<UrlValidationResult> {
  const validated = await validatePublicCrawlUrl(target);
  if (!validated.ok) return validated;

  const targetOrigin = new URL(validated.url.href).origin;
  if (targetOrigin !== allowedOrigin) {
    return failure(
      "ssrf_blocked",
      "Cross-origin navigation is not allowed during the crawl.",
      validated.url.href,
      `expected ${allowedOrigin}`,
    );
  }

  return validated;
}

export function isSameRegistrableOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}
