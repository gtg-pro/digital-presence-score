import type { AssessmentAvailability } from "@/features/audit/types/evidence.types";

export type RobotsRules = {
  available: AssessmentAvailability;
  sitemapUrls: string[];
  /** Returns true when the path is allowed for the given user-agent. */
  isAllowed: (path: string) => boolean;
  rawFetched: boolean;
};

type ParsedGroup = {
  agents: string[];
  allow: string[];
  disallow: string[];
};

function normalizePath(pathname: string): string {
  if (!pathname.startsWith("/")) return `/${pathname}`;
  return pathname;
}

/**
 * Match robots.txt path patterns (prefix match; * wildcard supported simply).
 */
export function matchesRobotsPattern(pattern: string, path: string): boolean {
  if (pattern === "") return false;
  const normalizedPattern = normalizePath(pattern);
  const normalizedPath = normalizePath(path);

  if (normalizedPattern === "/") {
    return true;
  }

  // Escape regex specials except *
  const escaped = normalizedPattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  const regex = new RegExp(`^${escaped}`);
  return regex.test(normalizedPath);
}

function selectGroup(groups: ParsedGroup[], userAgent: string): ParsedGroup | null {
  const ua = userAgent.toLowerCase();
  let star: ParsedGroup | null = null;

  for (const group of groups) {
    for (const agent of group.agents) {
      const a = agent.toLowerCase();
      if (a === "*") star = group;
      if (ua.includes(a) || a.includes("digital-presence")) return group;
    }
  }
  return star;
}

/**
 * Determine allow/disallow using longest matching rule (common crawler practice).
 */
export function isPathAllowedByRules(
  path: string,
  allow: string[],
  disallow: string[],
): boolean {
  let bestAllow = -1;
  let bestDisallow = -1;

  for (const rule of allow) {
    if (matchesRobotsPattern(rule, path)) {
      bestAllow = Math.max(bestAllow, rule.length);
    }
  }
  for (const rule of disallow) {
    if (matchesRobotsPattern(rule, path)) {
      bestDisallow = Math.max(bestDisallow, rule.length);
    }
  }

  if (bestDisallow < 0 && bestAllow < 0) return true;
  if (bestAllow > bestDisallow) return true;
  if (bestDisallow > bestAllow) return false;
  // Equal length: allow wins when tied (conservative for empty disallow="")
  return bestAllow >= bestDisallow;
}

export function parseRobotsTxt(
  body: string,
  userAgent: string,
): Omit<RobotsRules, "available" | "rawFetched"> {
  const lines = body.split(/\r?\n/);
  const groups: ParsedGroup[] = [];
  const sitemapUrls: string[] = [];
  let current: ParsedGroup | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;

    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === "user-agent") {
      if (!current || current.allow.length || current.disallow.length) {
        current = { agents: [value], allow: [], disallow: [] };
        groups.push(current);
      } else {
        current.agents.push(value);
      }
      continue;
    }

    if (!current) {
      current = { agents: ["*"], allow: [], disallow: [] };
      groups.push(current);
    }

    if (key === "allow") current.allow.push(value);
    if (key === "disallow") current.disallow.push(value);
    if (key === "sitemap") sitemapUrls.push(value);
  }

  const group = selectGroup(groups, userAgent) ?? {
    agents: ["*"],
    allow: [],
    disallow: [],
  };

  return {
    sitemapUrls,
    isAllowed: (path: string) =>
      isPathAllowedByRules(path, group.allow, group.disallow),
  };
}

export function createOpenRobotsRules(): RobotsRules {
  return {
    available: "unavailable",
    sitemapUrls: [],
    rawFetched: false,
    isAllowed: () => true,
  };
}

export function createRobotsRulesFromBody(
  body: string,
  userAgent: string,
): RobotsRules {
  const parsed = parseRobotsTxt(body, userAgent);
  return {
    available: "available",
    rawFetched: true,
    sitemapUrls: parsed.sitemapUrls,
    isAllowed: parsed.isAllowed,
  };
}

/**
 * When robots.txt is present but cannot be fetched safely, fail closed for unknown paths.
 */
export function createBlockedRobotsRules(): RobotsRules {
  return {
    available: "blocked",
    sitemapUrls: [],
    rawFetched: false,
    isAllowed: () => false,
  };
}
