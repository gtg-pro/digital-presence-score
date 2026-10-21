import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { extractPageEvidence } from "@/lib/audit/extraction/extract-page";
import { aggregateWebsiteEvidence } from "@/lib/audit/extraction/extract-website";

const fixtureHtml = readFileSync(
  path.join(__dirname, "../test/fixtures/sample-home.html"),
  "utf8",
);

describe("extractPageEvidence", () => {
  it("extracts structured fields from HTML without inventing scores", () => {
    const page = extractPageEvidence({
      originalUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      httpStatus: 200,
      html: fixtureHtml,
      contentType: "text/html",
      allowedOrigin: "https://example.com",
      observedAt: "2026-10-20T12:00:00.000Z",
    });

    expect(page.title).toContain("Acme Plumbing");
    expect(page.metaDescription).toMatch(/Austin/i);
    expect(page.headings.some((h) => h.level === 1)).toBe(true);
    expect(page.hasStructuredData).toBe(true);
    expect(page.structuredDataTypes).toContain("LocalBusiness");
    expect(page.internalLinks).toContain("https://example.com/services");
    expect(page.internalLinks).not.toContain("https://evil.example/phish");
    expect(page.contact.emails.length).toBeGreaterThan(0);
    expect(page.ctas.some((cta) => /quote|book/i.test(cta.text))).toBe(true);
    expect(page.publicationDate).toBe("2026-01-15T10:00:00Z");
    expect(page.mainTextExcerpt.length).toBeGreaterThan(20);
    expect(page.mainTextExcerpt.length).toBeLessThanOrEqual(4000);
  });

  it("does not treat footer copyright years as publication dates", () => {
    const html = `
      <html><head><title>X</title></head>
      <body><main><h1>Hi</h1><p>Hello</p></main>
      <footer>&copy; 2018–2024 Example Co</footer></body></html>
    `;
    const page = extractPageEvidence({
      originalUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      httpStatus: 200,
      html,
      contentType: "text/html",
      allowedOrigin: "https://example.com",
      observedAt: "2026-10-20T12:00:00.000Z",
    });
    expect(page.publicationDate).toBeNull();
  });

  it("handles malicious or odd markup without throwing", () => {
    const html = `
      <html><body>
        <script>window.location = 'http://127.0.0.1';</script>
        <a href="javascript:alert(1)">x</a>
        <img src=x onerror="alert(1)" />
        <p>${"<div>".repeat(100)}nested</p>
      </body></html>
    `;
    expect(() =>
      extractPageEvidence({
        originalUrl: "https://example.com/",
        finalUrl: "https://example.com/",
        httpStatus: 200,
        html,
        contentType: "text/html",
        allowedOrigin: "https://example.com",
        observedAt: "2026-10-20T12:00:00.000Z",
      }),
    ).not.toThrow();
  });
});

describe("aggregateWebsiteEvidence", () => {
  it("summarizes site-level observations from pages", () => {
    const home = extractPageEvidence({
      originalUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      httpStatus: 200,
      html: fixtureHtml,
      contentType: "text/html",
      allowedOrigin: "https://example.com",
      observedAt: "2026-10-20T12:00:00.000Z",
    });
    const services = extractPageEvidence({
      originalUrl: "https://example.com/services",
      finalUrl: "https://example.com/services",
      httpStatus: 200,
      html: `<html><head><title>Services</title></head><body><main><h1>Services</h1><p>Drain cleaning</p></main></body></html>`,
      contentType: "text/html",
      allowedOrigin: "https://example.com",
      observedAt: "2026-10-20T12:00:00.000Z",
    });

    const website = aggregateWebsiteEvidence({
      seedUrl: "example.com",
      normalizedSeedUrl: "https://example.com/",
      homepageUrl: home.finalUrl,
      pages: [home, services],
      pagesSkipped: 1,
      robotsRespected: true,
      observedAt: "2026-10-20T12:01:00.000Z",
    });

    expect(website.pagesCrawled).toBe(2);
    expect(website.discoveredServicePages.length).toBeGreaterThan(0);
    expect(website.publicSocialProfileLinks.some((u) => u.includes("facebook"))).toBe(
      true,
    );
  });
});
