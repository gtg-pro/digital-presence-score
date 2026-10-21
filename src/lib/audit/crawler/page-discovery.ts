export type DiscoveredPage = {
  url: string;
  depth: number;
  priority: number;
  reason: string;
};

const PRIORITY_PATTERNS: Array<{ pattern: RegExp; priority: number; reason: string }> = [
  { pattern: /^\/?$/, priority: 100, reason: "homepage" },
  { pattern: /service|services|offering|solutions/i, priority: 90, reason: "service" },
  { pattern: /about|our-story|who-we-are|company/i, priority: 80, reason: "about" },
  { pattern: /contact|get-in-touch|reach-us/i, priority: 80, reason: "contact" },
  {
    pattern: /location|locations|service-area|areas-we-serve|coverage/i,
    priority: 70,
    reason: "location",
  },
  { pattern: /faq|faqs|help|support/i, priority: 60, reason: "faq" },
  { pattern: /resource|resources|blog|news|guide|guides/i, priority: 50, reason: "resource" },
];

export function scorePagePriority(pathname: string): { priority: number; reason: string } {
  const path = pathname || "/";
  for (const entry of PRIORITY_PATTERNS) {
    if (entry.pattern.test(path)) {
      return { priority: entry.priority, reason: entry.reason };
    }
  }
  return { priority: 10, reason: "other" };
}

export function resolveInternalUrl(
  href: string,
  baseUrl: string,
  allowedOrigin: string,
): string | null {
  try {
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return null;
    }
    if (/^(javascript|data|blob):/i.test(href)) return null;

    const resolved = new URL(href, baseUrl);
    if (resolved.origin !== allowedOrigin) return null;
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;

    resolved.hash = "";
    // Normalize trailing slash differences lightly
    return resolved.href;
  } catch {
    return null;
  }
}

/**
 * Merge candidate URLs, preferring higher priority / lower depth, capped at maxPages.
 */
export function prioritizeDiscoveredPages(
  candidates: DiscoveredPage[],
  maxPages: number,
): DiscoveredPage[] {
  const byUrl = new Map<string, DiscoveredPage>();

  for (const candidate of candidates) {
    const existing = byUrl.get(candidate.url);
    if (!existing) {
      byUrl.set(candidate.url, candidate);
      continue;
    }
    const betterPriority = candidate.priority > existing.priority;
    const betterDepth =
      candidate.priority === existing.priority && candidate.depth < existing.depth;
    if (betterPriority || betterDepth) {
      byUrl.set(candidate.url, candidate);
    }
  }

  return [...byUrl.values()]
    .sort((a, b) => b.priority - a.priority || a.depth - b.depth || a.url.localeCompare(b.url))
    .slice(0, maxPages);
}

export function extractLinksFromHtml(
  hrefs: string[],
  baseUrl: string,
  allowedOrigin: string,
  depth: number,
): DiscoveredPage[] {
  const pages: DiscoveredPage[] = [];

  for (const href of hrefs) {
    const absolute = resolveInternalUrl(href, baseUrl, allowedOrigin);
    if (!absolute) continue;
    const pathname = new URL(absolute).pathname;
    const { priority, reason } = scorePagePriority(pathname);
    pages.push({ url: absolute, depth, priority, reason });
  }

  return pages;
}

export function parseSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const regex = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    if (match[1]) locs.push(match[1].trim());
  }
  return locs;
}
