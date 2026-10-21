import { describe, expect, it } from "vitest";

import {
  extractLinksFromHtml,
  prioritizeDiscoveredPages,
  resolveInternalUrl,
  scorePagePriority,
} from "@/lib/audit/crawler/page-discovery";

describe("page discovery", () => {
  it("scores important business pages higher", () => {
    expect(scorePagePriority("/").priority).toBeGreaterThan(
      scorePagePriority("/random").priority,
    );
    expect(scorePagePriority("/services/plumbing").reason).toBe("service");
    expect(scorePagePriority("/contact-us").reason).toBe("contact");
  });

  it("keeps only same-origin links", () => {
    expect(
      resolveInternalUrl(
        "https://evil.example/x",
        "https://example.com/",
        "https://example.com",
      ),
    ).toBeNull();
    expect(
      resolveInternalUrl(
        "/about",
        "https://example.com/",
        "https://example.com",
      ),
    ).toBe("https://example.com/about");
  });

  it("respects crawl page limits when prioritizing", () => {
    const pages = Array.from({ length: 40 }, (_, index) => ({
      url: `https://example.com/p/${index}`,
      depth: 1,
      priority: index,
      reason: "other",
    }));
    const limited = prioritizeDiscoveredPages(pages, 20);
    expect(limited).toHaveLength(20);
    expect(limited[0]?.priority).toBeGreaterThanOrEqual(
      limited[19]?.priority ?? 0,
    );
  });

  it("extracts internal links at the next depth", () => {
    const found = extractLinksFromHtml(
      ["/services", "https://other.com/x", "mailto:a@b.com"],
      "https://example.com/",
      "https://example.com",
      1,
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.url).toBe("https://example.com/services");
    expect(found[0]?.depth).toBe(1);
  });
});
