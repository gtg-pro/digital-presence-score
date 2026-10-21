import { describe, expect, it } from "vitest";

import {
  isBlockedHostname,
  isBlockedIpAddress,
  normalizeCrawlUrl,
  validateUrlStructure,
} from "@/lib/audit/crawler/url-validator";

describe("normalizeCrawlUrl", () => {
  it("adds https when protocol is missing", () => {
    expect(normalizeCrawlUrl("example.com/path")).toBe(
      "https://example.com/path",
    );
  });

  it("rejects malformed input", () => {
    expect(normalizeCrawlUrl("not a url")).toBeNull();
    expect(normalizeCrawlUrl("")).toBeNull();
  });
});

describe("validateUrlStructure — SSRF blocks", () => {
  it("accepts a normal public https URL", () => {
    const result = validateUrlStructure("https://example.com/about");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url.hostname).toBe("example.com");
      expect(result.url.protocol).toBe("https:");
    }
  });

  it("rejects localhost and local suffixes", () => {
    expect(validateUrlStructure("http://localhost/admin").ok).toBe(false);
    expect(validateUrlStructure("http://foo.localhost/").ok).toBe(false);
    expect(validateUrlStructure("http://service.local/").ok).toBe(false);
  });

  it("rejects private and metadata IPv4 addresses", () => {
    expect(validateUrlStructure("http://127.0.0.1/").ok).toBe(false);
    expect(validateUrlStructure("http://10.0.0.5/").ok).toBe(false);
    expect(validateUrlStructure("http://192.168.1.10/").ok).toBe(false);
    expect(validateUrlStructure("http://169.254.169.254/latest").ok).toBe(
      false,
    );
    expect(validateUrlStructure("http://172.16.5.1/").ok).toBe(false);
  });

  it("rejects unsupported protocols and ports", () => {
    expect(validateUrlStructure("ftp://example.com/file").ok).toBe(false);
    expect(validateUrlStructure("file:///etc/passwd").ok).toBe(false);
    expect(validateUrlStructure("https://example.com:22/").ok).toBe(false);
  });

  it("rejects embedded credentials", () => {
    expect(validateUrlStructure("https://user:pass@example.com/").ok).toBe(
      false,
    );
  });
});

describe("IP and hostname helpers", () => {
  it("flags loopback and ULA addresses", () => {
    expect(isBlockedIpAddress("::1")).toBe(true);
    expect(isBlockedIpAddress("fc00::1")).toBe(true);
    expect(isBlockedHostname("metadata.google.internal")).toBe(true);
  });
});
