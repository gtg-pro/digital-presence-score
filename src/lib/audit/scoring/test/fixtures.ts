import type { CrawlResult, PageEvidence } from "@/features/audit/types/evidence.types";
import { emptyCrawlDiagnostics } from "@/lib/audit/crawler/crawl-diagnostics";
import type { AIAnalysisResult } from "@/lib/audit/integrations/openai/analysis.types";
import type {
  PerformanceEvidence,
  PerformanceResult,
} from "@/lib/audit/integrations/pagespeed/pagespeed.types";

const OBSERVED = "2026-10-21T06:00:00.000Z";

function metric(
  name: PerformanceEvidence["metrics"]["lighthousePerformanceScore"]["name"],
  value: number | null,
  availability: "available" | "not_assessed" | "not_measured" | "error" = "available",
) {
  return {
    name,
    value,
    unit: value === null ? null : name.includes("score") ? "score" : "millisecond",
    classification: "lab" as const,
    availability,
  };
}

function fullMetrics(lighthouse: number): PerformanceEvidence["metrics"] {
  return {
    lighthousePerformanceScore: metric("lighthouse_performance_score", lighthouse),
    largestContentfulPaint: metric("largest_contentful_paint", 2000),
    interactionToNextPaint: {
      name: "interaction_to_next_paint",
      value: null,
      unit: null,
      classification: "field",
      availability: "not_measured",
      notes: "INP is field-only; lab TBT is reported separately.",
    },
    cumulativeLayoutShift: metric("cumulative_layout_shift", 0.05),
    firstContentfulPaint: metric("first_contentful_paint", 1200),
    totalBlockingTime: metric("total_blocking_time", 150),
    speedIndex: metric("speed_index", 2500),
    totalByteWeight: metric("total_byte_weight", 1_200_000),
    renderBlockingResources: metric("render_blocking_resources", 2),
  };
}

export function makePage(partial: Partial<PageEvidence> & { finalUrl: string }): PageEvidence {
  const finalUrl = partial.finalUrl;
  return {
    source: {
      url: finalUrl,
      observedAt: OBSERVED,
      extractionMethod: "cheerio_html",
      availability: "available",
    },
    originalUrl: finalUrl,
    httpStatus: 200,
    title: "Page",
    metaDescription: null,
    headings: [{ level: 1, text: "Heading" }],
    canonicalUrl: null,
    internalLinks: [],
    mainTextExcerpt: "Content",
    hasStructuredData: false,
    structuredDataTypes: [],
    ctas: [],
    contact: { emails: [], phones: [], addresses: [] },
    publicationDate: null,
    contentType: "text/html",
    ...partial,
    finalUrl,
  };
}

export function makeCrawl(options: {
  pages: PageEvidence[];
  websiteOverrides?: Partial<NonNullable<CrawlResult["website"]>>;
  ok?: boolean;
  partial?: boolean;
}): CrawlResult {
  const homepage = options.pages[0]?.finalUrl ?? "https://example.com/";
  return {
    ok: options.ok ?? true,
    partial: options.partial ?? false,
    startedAt: OBSERVED,
    finishedAt: OBSERVED,
    errors: [],
    request: {
      url: "example.com",
      normalizedUrl: "https://example.com/",
      maxPages: 20,
      maxDepth: 2,
      navigationTimeoutMs: 15000,
      maxResponseBytes: 1_500_000,
      userAgent: "test",
    },
    website: {
      source: {
        url: homepage,
        observedAt: OBSERVED,
        extractionMethod: "cheerio_html",
        availability: "available",
      },
      seedUrl: "example.com",
      normalizedSeedUrl: "https://example.com/",
      homepageUrl: homepage,
      discoveredServicePages: [],
      contactPageAvailable: "unavailable",
      contactPageUrl: null,
      aboutPageAvailable: "unavailable",
      aboutPageUrl: null,
      serviceAreaSignals: [],
      publicSocialProfileLinks: [],
      faqOrResourcePages: [],
      primaryConversionPathways: [],
      pagesCrawled: options.pages.length,
      pagesSkipped: 0,
      robotsRespected: true,
      ...options.websiteOverrides,
    },
    pages: options.pages,
    diagnostics: emptyCrawlDiagnostics({
      browserLaunchAttempted: true,
      browserLaunchSucceeded: true,
      browserRuntime: "local",
      browserExecutableSource: "playwright_bundled",
      browserExecutablePresent: true,
      navigationAttempted: options.pages.length,
      pagesExtracted: options.pages.length,
      finalStatus: options.partial ? "partial" : options.ok === false ? "failed" : "ok",
    }),
  };
}

export function makePerformance(lighthouseMobile: number | null): PerformanceResult | null {
  if (lighthouseMobile === null) {
    return {
      ok: false,
      partial: true,
      startedAt: OBSERVED,
      finishedAt: OBSERVED,
      request: {
        url: "https://example.com",
        normalizedUrl: "https://example.com/",
        strategies: ["mobile"],
        servicePageUrls: [],
      },
      evidence: [],
      errors: [
        {
          code: "provider_error",
          message: "PageSpeed unavailable",
        },
      ],
    };
  }

  const evidence: PerformanceEvidence = {
    testedUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    deviceStrategy: "mobile",
    provider: "google_pagespeed_insights",
    measuredAt: OBSERVED,
    availability: "available",
    metrics: fullMetrics(lighthouseMobile),
    providerMetadata: {
      lighthouseVersion: "12.0.0",
      fetchTime: OBSERVED,
      analysisUTCTimestamp: OBSERVED,
      overallCategory: null,
    },
  };

  return {
    ok: true,
    partial: false,
    startedAt: OBSERVED,
    finishedAt: OBSERVED,
    request: {
      url: "https://example.com",
      normalizedUrl: "https://example.com/",
      strategies: ["mobile"],
      servicePageUrls: [],
    },
    evidence: [evidence],
    errors: [],
  };
}

export function makeAnalysis(
  findings: AIAnalysisResult["findings"],
  rejectedExtras?: Partial<AIAnalysisResult>,
): AIAnalysisResult {
  return {
    ok: true,
    status: "available",
    analyzedAt: OBSERVED,
    model: "gpt-4o-mini",
    industryContext: "Service business",
    businessContext: "Test fixture",
    categoryObservations: [],
    findings,
    recommendations: [],
    areasRequiringVerification: [],
    unavailableObservations: [],
    overallConfidence: "high",
    unsupportedClaimsDropped: 0,
    preparedEvidenceIds: ["website-1", "page-1", "page-2"],
    errors: [],
    startedAt: OBSERVED,
    finishedAt: OBSERVED,
    ...rejectedExtras,
  };
}

/** Strong local service business — high completeness. */
export function strongLocalServiceFixture() {
  const home = makePage({
    finalUrl: "https://example.com/",
    title: "Acme Plumbing — Austin Drain Cleaning & Emergency Service",
    metaDescription:
      "Licensed plumbers serving Austin. Drain cleaning, water heaters, and emergency plumbing.",
    headings: [
      { level: 1, text: "Trusted plumbing for Austin homes" },
      { level: 2, text: "Our services" },
    ],
    internalLinks: [
      "https://example.com/services",
      "https://example.com/services/drain-cleaning",
      "https://example.com/contact",
      "https://example.com/faq",
      "https://example.com/about",
    ],
    mainTextExcerpt:
      "We provide drain cleaning, water heater repair, and emergency plumbing. Serving Austin and nearby service areas. Licensed and insured. Call us or Request a Quote. Years of experience helping local homeowners. Testimonials from clients available.",
    hasStructuredData: true,
    structuredDataTypes: ["LocalBusiness"],
    ctas: [
      { text: "Request a Quote", href: "/contact" },
      { text: "Call Now", href: "tel:5125550100" },
    ],
    contact: {
      emails: ["hello@acme.example"],
      phones: ["512-555-0100"],
      addresses: ["Austin, TX"],
    },
    publicationDate: "2026-01-15T00:00:00Z",
  });

  const services = makePage({
    finalUrl: "https://example.com/services",
    title: "Plumbing Services in Austin",
    metaDescription: "Full list of residential plumbing services in Austin.",
    headings: [
      { level: 1, text: "Our plumbing services" },
      { level: 2, text: "Drain cleaning" },
      { level: 2, text: "Water heaters" },
    ],
    internalLinks: ["https://example.com/contact", "https://example.com/faq"],
    mainTextExcerpt:
      "Detailed service descriptions for drain cleaning, leak repair, water heater installation, and emergency response. Book online for a quote. Frequently asked questions about pricing and scheduling. Portfolio of recent projects included for homeowners across Austin.",
    ctas: [{ text: "Book Online", href: "/contact" }],
    contact: { emails: ["hello@acme.example"], phones: ["512-555-0100"], addresses: [] },
    publicationDate: "2026-02-01T00:00:00Z",
  });

  const faq = makePage({
    finalUrl: "https://example.com/faq",
    title: "Plumbing FAQ",
    headings: [{ level: 1, text: "Frequently asked questions" }],
    mainTextExcerpt:
      "Helpful guides answering common plumbing questions for Austin homeowners including maintenance tips and what to expect during a service visit.",
    ctas: [{ text: "Contact us", href: "/contact" }],
    publicationDate: "2026-03-01T00:00:00Z",
  });

  const crawl = makeCrawl({
    pages: [home, services, faq],
    websiteOverrides: {
      discoveredServicePages: [
        "https://example.com/services",
        "https://example.com/services/drain-cleaning",
      ],
      contactPageAvailable: "available",
      contactPageUrl: "https://example.com/contact",
      serviceAreaSignals: ["Serving Austin"],
      publicSocialProfileLinks: [
        "https://facebook.com/acmeplumbing",
        "https://instagram.com/acmeplumbing",
      ],
      faqOrResourcePages: ["https://example.com/faq"],
      primaryConversionPathways: [{ text: "Request a Quote", href: "/contact" }],
    },
  });

  const analysis = makeAnalysis([
    {
      id: "f1",
      category: "website_experience",
      kind: "strength",
      title: "Clear navigation",
      description: "Homepage navigation and mobile CTAs are clear.",
      evidenceIds: ["page-1"],
      reasoningSummary: "Supported by links and CTAs.",
      suggestedImprovement: null,
      confidence: "high",
    },
    {
      id: "f2",
      category: "content_authority",
      kind: "strength",
      title: "Service depth",
      description: "Service pages include detailed helpful content.",
      evidenceIds: ["page-2"],
      reasoningSummary: "Supported by services excerpt.",
      suggestedImprovement: null,
      confidence: "high",
    },
    {
      id: "f3",
      category: "reputation_trust",
      kind: "strength",
      title: "Testimonials present",
      description: "Website references client testimonials.",
      evidenceIds: ["page-1"],
      reasoningSummary: "Excerpt mentions testimonials.",
      suggestedImprovement: null,
      confidence: "medium",
    },
    {
      id: "bad",
      category: "website_experience",
      kind: "strength",
      title: "Invented",
      description: "Should be rejected",
      evidenceIds: ["invented-99"],
      reasoningSummary: "Fake",
      suggestedImprovement: null,
      confidence: "high",
    },
  ]);

  return {
    crawl,
    performance: makePerformance(92),
    analysis,
  };
}

/** Basic brochure site. */
export function brochureFixture() {
  const home = makePage({
    finalUrl: "https://brochure.example/",
    title: "Smith Co",
    metaDescription: null,
    headings: [{ level: 1, text: "Welcome" }],
    internalLinks: ["https://brochure.example/about"],
    mainTextExcerpt: "Welcome to our company. We do things.",
    ctas: [],
    contact: { emails: [], phones: [], addresses: [] },
  });

  return {
    crawl: makeCrawl({
      pages: [home],
      websiteOverrides: {
        homepageUrl: "https://brochure.example/",
        normalizedSeedUrl: "https://brochure.example/",
      },
    }),
    performance: makePerformance(55),
    analysis: makeAnalysis([]),
  };
}

/** Remote consultancy — discovery profiles N/A. */
export function remoteConsultancyFixture() {
  const home = makePage({
    finalUrl: "https://remote.example/",
    title: "Northstar Strategy — Remote Digital Consultancy",
    metaDescription:
      "Online-only strategy consultancy helping nationwide B2B teams. Book a virtual consult.",
    headings: [
      { level: 1, text: "Remote strategy consulting" },
      { level: 2, text: "Engagements" },
    ],
    internalLinks: [
      "https://remote.example/services",
      "https://remote.example/contact",
      "https://remote.example/resources",
      "https://remote.example/about",
    ],
    mainTextExcerpt:
      "We are a remote online consultancy serving clients worldwide. Book a virtual consultation. Case studies and guides available. Email hello@remote.example.",
    ctas: [
      { text: "Book a consult", href: "/contact" },
      { text: "Email us", href: "mailto:hello@remote.example" },
    ],
    contact: {
      emails: ["hello@remote.example"],
      phones: [],
      addresses: [],
    },
    publicationDate: "2026-04-01T00:00:00Z",
  });

  const services = makePage({
    finalUrl: "https://remote.example/services",
    title: "Consulting services",
    headings: [
      { level: 1, text: "Services" },
      { level: 2, text: "Workshops" },
    ],
    mainTextExcerpt:
      "Detailed offer pages covering research sprints, executive workshops, and retained advisory. Next step: schedule a discovery call online.",
    ctas: [{ text: "Schedule discovery", href: "/contact" }],
    publicationDate: "2026-04-10T00:00:00Z",
  });

  return {
    crawl: makeCrawl({
      pages: [home, services],
      websiteOverrides: {
        homepageUrl: "https://remote.example/",
        normalizedSeedUrl: "https://remote.example/",
        discoveredServicePages: ["https://remote.example/services"],
        contactPageAvailable: "available",
        contactPageUrl: "https://remote.example/contact",
        faqOrResourcePages: ["https://remote.example/resources"],
        publicSocialProfileLinks: ["https://linkedin.com/company/northstar"],
        primaryConversionPathways: [{ text: "Book a consult", href: "/contact" }],
      },
    }),
    performance: makePerformance(88),
    analysis: makeAnalysis([
      {
        id: "r1",
        category: "website_experience",
        kind: "strength",
        title: "Clear remote offering",
        description: "Business information is clear for an online consultancy.",
        evidenceIds: ["page-1"],
        reasoningSummary: "Title and excerpt.",
        suggestedImprovement: null,
        confidence: "high",
      },
    ]),
    businessModelHint: "remote_online" as const,
  };
}

/** Incomplete / blocked crawl. */
export function blockedWebsiteFixture(): {
  crawl: CrawlResult;
  performance: PerformanceResult | null;
  analysis: AIAnalysisResult | null;
} {
  return {
    crawl: {
      ok: false,
      partial: true,
      startedAt: OBSERVED,
      finishedAt: OBSERVED,
      errors: [{ code: "ssrf_blocked", message: "Blocked" }],
      request: {
        url: "localhost",
        normalizedUrl: "http://localhost/",
        maxPages: 20,
        maxDepth: 2,
        navigationTimeoutMs: 15000,
        maxResponseBytes: 1_500_000,
        userAgent: "test",
      },
      website: null,
      pages: [],
      diagnostics: emptyCrawlDiagnostics({
        finalStatus: "failed",
        providerSkipReasons: {
          pagespeed: "PageSpeed skipped: Blocked",
          openai: "OpenAI skipped: Blocked",
        },
      }),
    },
    performance: null,
    analysis: null,
  };
}
