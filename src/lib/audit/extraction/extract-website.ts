import type {
  AssessmentAvailability,
  CtaEvidence,
  PageEvidence,
  WebsiteEvidence,
} from "@/features/audit/types/evidence.types";
import { scorePagePriority } from "@/lib/audit/crawler/page-discovery";

const SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "tiktok.com",
  "yelp.com",
  "maps.google.com",
  "goo.gl",
];

function availabilityFromUrl(url: string | null): AssessmentAvailability {
  return url ? "available" : "unavailable";
}

function findByReason(pages: PageEvidence[], reason: string): string | null {
  for (const page of pages) {
    const scored = scorePagePriority(new URL(page.finalUrl).pathname);
    if (scored.reason === reason) return page.finalUrl;
  }
  return null;
}

function collectSocialLinks(pages: PageEvidence[]): string[] {
  const found = new Set<string>();

  for (const page of pages) {
    for (const cta of page.ctas) {
      if (!cta.href) continue;
      try {
        const host = new URL(cta.href).hostname.replace(/^www\./, "");
        if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith(`.${s}`))) {
          found.add(cta.href);
        }
      } catch {
        /* ignore */
      }
    }
  }

  // Also inspect raw excerpts for common profile URL patterns
  const urlRe = /https?:\/\/[^\s"'<>]+/gi;
  for (const page of pages) {
    const matches = page.mainTextExcerpt.match(urlRe) ?? [];
    for (const match of matches) {
      try {
        const cleaned = match.replace(/[.,);]+$/, "");
        const host = new URL(cleaned).hostname.replace(/^www\./, "");
        if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith(`.${s}`))) {
          found.add(cleaned);
        }
      } catch {
        /* ignore */
      }
    }
  }

  return [...found].slice(0, 20);
}

function collectServiceAreaSignals(pages: PageEvidence[]): string[] {
  const signals: string[] = [];
  const areaRe =
    /\b(serving|service area|areas we serve|we serve|locations? in)\b[^.]{0,120}/gi;

  for (const page of pages) {
    const text = `${page.title ?? ""} ${page.mainTextExcerpt}`;
    let match: RegExpExecArray | null;
    while ((match = areaRe.exec(text)) !== null) {
      signals.push(match[0].replace(/\s+/g, " ").trim());
      if (signals.length >= 10) break;
    }
    if (signals.length >= 10) break;
  }
  return signals;
}

function collectPrimaryPathways(pages: PageEvidence[]): CtaEvidence[] {
  const seen = new Set<string>();
  const pathways: CtaEvidence[] = [];
  for (const page of pages) {
    for (const cta of page.ctas) {
      const key = `${cta.text}|${cta.href ?? ""}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      pathways.push(cta);
      if (pathways.length >= 15) return pathways;
    }
  }
  return pathways;
}

export type WebsiteAggregateInput = {
  seedUrl: string;
  normalizedSeedUrl: string;
  homepageUrl: string | null;
  pages: PageEvidence[];
  pagesSkipped: number;
  robotsRespected: boolean;
  observedAt: string;
};

export function aggregateWebsiteEvidence(
  input: WebsiteAggregateInput,
): WebsiteEvidence {
  const servicePages = input.pages
    .filter((page) => scorePagePriority(new URL(page.finalUrl).pathname).reason === "service")
    .map((page) => page.finalUrl);

  const aboutPageUrl = findByReason(input.pages, "about");
  const contactPageUrl = findByReason(input.pages, "contact");
  const faqOrResourcePages = input.pages
    .filter((page) => {
      const reason = scorePagePriority(new URL(page.finalUrl).pathname).reason;
      return reason === "faq" || reason === "resource";
    })
    .map((page) => page.finalUrl);

  return {
    source: {
      url: input.normalizedSeedUrl,
      observedAt: input.observedAt,
      extractionMethod: "cheerio_html",
      availability: input.pages.length > 0 ? "available" : "unavailable",
      confidence: input.pages.length > 0 ? 0.75 : 0.2,
    },
    seedUrl: input.seedUrl,
    normalizedSeedUrl: input.normalizedSeedUrl,
    homepageUrl: input.homepageUrl,
    discoveredServicePages: [...new Set(servicePages)].slice(0, 20),
    contactPageAvailable: availabilityFromUrl(contactPageUrl),
    contactPageUrl,
    aboutPageAvailable: availabilityFromUrl(aboutPageUrl),
    aboutPageUrl,
    serviceAreaSignals: collectServiceAreaSignals(input.pages),
    publicSocialProfileLinks: collectSocialLinks(input.pages),
    faqOrResourcePages: [...new Set(faqOrResourcePages)].slice(0, 20),
    primaryConversionPathways: collectPrimaryPathways(input.pages),
    pagesCrawled: input.pages.length,
    pagesSkipped: input.pagesSkipped,
    robotsRespected: input.robotsRespected,
  };
}
