import { describe, expect, it } from "vitest";

import {
  createRobotsRulesFromBody,
  isPathAllowedByRules,
  matchesRobotsPattern,
  parseRobotsTxt,
} from "@/lib/audit/crawler/robots";

describe("robots matching", () => {
  it("matches prefix and wildcard patterns", () => {
    expect(matchesRobotsPattern("/admin", "/admin/settings")).toBe(true);
    expect(matchesRobotsPattern("/private/*", "/private/secret")).toBe(true);
    expect(matchesRobotsPattern("/blog", "/about")).toBe(false);
  });

  it("prefers longer allow over shorter disallow", () => {
    expect(
      isPathAllowedByRules("/blog/post", ["/blog/post"], ["/blog"]),
    ).toBe(true);
    expect(isPathAllowedByRules("/blog", [], ["/blog"])).toBe(false);
  });
});

describe("parseRobotsTxt", () => {
  it("parses sitemaps and agent groups", () => {
    const body = `
User-agent: *
Disallow: /private
Allow: /private/public-page
Sitemap: https://example.com/sitemap.xml

User-agent: BadBot
Disallow: /
`;
    const parsed = parseRobotsTxt(body, "DigitalPresenceScoreBot/1.0");
    expect(parsed.sitemapUrls).toContain("https://example.com/sitemap.xml");
    expect(parsed.isAllowed("/about")).toBe(true);
    expect(parsed.isAllowed("/private")).toBe(false);
    expect(parsed.isAllowed("/private/public-page")).toBe(true);
  });

  it("builds rules object from body", () => {
    const rules = createRobotsRulesFromBody(
      "User-agent: *\nDisallow: /secret\n",
      "bot",
    );
    expect(rules.rawFetched).toBe(true);
    expect(rules.isAllowed("/secret")).toBe(false);
    expect(rules.isAllowed("/")).toBe(true);
  });
});
