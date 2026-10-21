import type { PageEvidence } from "@/features/audit/types/evidence.types";
import type { MappedEvidenceBundle } from "@/lib/audit/scoring/evidence-mapper";
import {
  findingsForCategory,
  hasAiWeakness,
  hasStrongAiSupport,
  textBlob,
} from "@/lib/audit/scoring/evidence-mapper";
import { roundPoints } from "@/lib/audit/scoring/applicability";
import type {
  AssessmentState,
  BusinessModelHint,
  CriterionId,
  ScoringRuleId,
} from "@/lib/audit/scoring/scoring.types";

export type RuleEvaluation = {
  criterionId: CriterionId;
  ruleId: ScoringRuleId;
  assessment: AssessmentState;
  /** 0–1 fraction of effective max when assessed; ignored for NOT_ASSESSED */
  scoreFraction: number;
  evidenceIds: string[];
  sourceUrls: string[];
  observationTimestamps: string[];
  rationale: string;
  observationFingerprint: string | null;
};

function pageEvidenceId(
  bundle: MappedEvidenceBundle,
  page: PageEvidence,
): string | null {
  for (const [id, candidate] of bundle.pageByEvidenceId.entries()) {
    if (candidate.finalUrl === page.finalUrl) return id;
  }
  return null;
}

function refsForPages(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
): Pick<
  RuleEvaluation,
  "evidenceIds" | "sourceUrls" | "observationTimestamps"
> {
  const evidenceIds: string[] = [];
  const sourceUrls: string[] = [];
  const observationTimestamps: string[] = [];
  for (const page of pages) {
    const id = pageEvidenceId(bundle, page);
    if (id) evidenceIds.push(id);
    sourceUrls.push(page.finalUrl);
    observationTimestamps.push(page.source.observedAt);
  }
  if (bundle.verifiedPages.length && evidenceIds.length === 0) {
    // Fallback: include website-1 when pages exist
    if (bundle.allowedEvidenceIds.has("website-1")) {
      evidenceIds.push("website-1");
    }
  }
  return { evidenceIds, sourceUrls, observationTimestamps };
}

function award(
  criterionId: CriterionId,
  ruleId: ScoringRuleId,
  assessment: AssessmentState,
  scoreFraction: number,
  refs: Pick<
    RuleEvaluation,
    "evidenceIds" | "sourceUrls" | "observationTimestamps"
  >,
  rationale: string,
  fingerprint: string | null,
): RuleEvaluation {
  return {
    criterionId,
    ruleId,
    assessment,
    scoreFraction: assessment === "NOT_ASSESSED" ? 0 : scoreFraction,
    ...refs,
    rationale,
    observationFingerprint: fingerprint,
  };
}

/**
 * Scoring anchors (strict-v1.0):
 * FAIL = 0, PARTIAL ≈ 0.5, PASS = 1.0 of effective max.
 */
export function evaluateAllRules(
  bundle: MappedEvidenceBundle,
  crawlWebsite: NonNullable<
    import("@/features/audit/types/evidence.types").CrawlResult["website"]
  > | null,
): RuleEvaluation[] {
  const pages = bundle.verifiedPages;
  const home =
    pages.find((page) => {
      try {
        const path = new URL(page.finalUrl).pathname;
        return path === "/" || path === "";
      } catch {
        return false;
      }
    }) ?? pages[0] ?? null;

  const servicePages = pages.filter((page) =>
    /service|offer|solution|pricing/i.test(page.finalUrl),
  );
  const blob = textBlob(pages);
  const model = bundle.businessModel;
  const weFindings = findingsForCategory(bundle.groundedFindings, "website_experience");
  const repFindings = findingsForCategory(bundle.groundedFindings, "reputation_trust");
  const caFindings = findingsForCategory(bundle.groundedFindings, "content_authority");
  const crFindings = findingsForCategory(bundle.groundedFindings, "conversion_readiness");

  const evaluations: RuleEvaluation[] = [];

  // --- WE.mobile_usability (6) ---
  evaluations.push(evalMobileUsability(bundle, home, weFindings));

  // --- WE.measured_performance (7) ---
  evaluations.push(evalMeasuredPerformance(bundle));

  // --- WE.design_readability (4) ---
  evaluations.push(evalDesignReadability(bundle, home, weFindings));

  // --- WE.structural_clarity (4) ---
  evaluations.push(evalStructuralClarity(bundle, home, crawlWebsite, weFindings));

  // --- WE.business_service_info (4) ---
  evaluations.push(evalBusinessServiceInfo(bundle, home, crawlWebsite, model));

  // --- SEO ---
  evaluations.push(evalSearchIntentGeo(bundle, home, model));
  evaluations.push(
    evalServiceMarketCoverage(bundle, pages, servicePages, crawlWebsite),
  );
  evaluations.push(evalCrawlabilitySchema(bundle, pages, crawlWebsite));
  evaluations.push(evalDiscoveryProfiles(bundle, crawlWebsite, model));
  evaluations.push(evalConsistentSignals(bundle, pages, crawlWebsite, model));

  // --- REP ---
  evaluations.push(evalThirdPartyReviews(bundle));
  evaluations.push(evalCredentials(bundle, pages, blob, repFindings));
  evaluations.push(evalTestimonials(bundle, pages, blob, repFindings));
  evaluations.push(evalPublicActivity(crawlWebsite));

  // --- CA ---
  evaluations.push(evalServicePageDepth(bundle, pages, servicePages, caFindings));
  evaluations.push(evalEducationResources(bundle, pages, crawlWebsite, caFindings));
  evaluations.push(evalContentUpkeep(bundle, pages));
  evaluations.push(evalTopicalBreadth(bundle, pages, servicePages, caFindings));

  // --- CR ---
  evaluations.push(evalPrimaryCta(bundle, pages, home, crawlWebsite, crFindings));
  evaluations.push(evalInquiryPath(bundle, pages, crawlWebsite));
  evaluations.push(evalServiceNextSteps(bundle, pages, servicePages));
  evaluations.push(evalTrustAlongsideCta(bundle, pages, blob));
  evaluations.push(evalMobileCompletion(bundle, pages, home, crFindings));

  return evaluations;
}

function evalMobileUsability(
  bundle: MappedEvidenceBundle,
  home: PageEvidence | null,
  weFindings: ReturnType<typeof findingsForCategory>,
): RuleEvaluation {
  const ruleId = "rule.WE.mobile_usability.v1";
  const criterionId = "WE.mobile_usability";
  if (!home) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No verified page available for mobile usability assessment.", null);
  }
  const refs = refsForPages(bundle, [home]);
  const hasNavLinks = home.internalLinks.length >= 3;
  const hasCta = home.ctas.length > 0;
  const aiGood = hasStrongAiSupport(weFindings, (f) =>
    /navigat|mobile|usab|menu/i.test(`${f.title} ${f.description}`),
  );
  const aiBad = hasAiWeakness(weFindings, (f) =>
    /navigat|mobile|usab|menu|confus/i.test(`${f.title} ${f.description}`),
  );

  if (hasNavLinks && hasCta && !aiBad) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Homepage exposes multiple internal navigation links and at least one CTA; no corroborated mobile/navigation weakness.", "we.mobile.strong");
  }
  if ((hasNavLinks || hasCta || aiGood) && !aiBad) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Partial mobile/navigation signals (links or CTA) without strong failure indicators.", "we.mobile.partial");
  }
  if (aiBad && !hasNavLinks) {
    return award(criterionId, ruleId, "FAIL", 0, refs, "AI and crawl evidence indicate weak navigation/usability without compensating link structure.", "we.mobile.fail");
  }
  if (!hasNavLinks && !hasCta) {
    return award(criterionId, ruleId, "FAIL", 0, refs, "Homepage lacks navigation links and CTAs.", "we.mobile.fail");
  }
  return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Mixed mobile usability signals.", "we.mobile.partial");
}

function evalMeasuredPerformance(bundle: MappedEvidenceBundle): RuleEvaluation {
  const ruleId = "rule.WE.measured_performance.v1";
  const criterionId = "WE.measured_performance";
  const perf = bundle.mobilePerformance ?? bundle.desktopPerformance;
  if (!perf || !bundle.performanceAvailable) {
    return award(
      criterionId,
      ruleId,
      "NOT_ASSESSED",
      0,
      { evidenceIds: [], sourceUrls: [], observationTimestamps: [] },
      "PageSpeed evidence unavailable; measured performance is NOT_ASSESSED (not FAIL).",
      "we.perf.missing",
    );
  }

  const refs = {
    evidenceIds: ["pagespeed-mobile-1"],
    sourceUrls: [perf.finalUrl ?? perf.testedUrl],
    observationTimestamps: [perf.measuredAt],
  };
  // Synthetic evidence id for performance — track via source URL; not a crawl ID.
  const score = perf.metrics.lighthousePerformanceScore;
  if (score.availability !== "available" || score.value === null) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, refs, "Lighthouse performance score not measured.", "we.perf.missing");
  }

  const value = score.value;
  // Anchors: PASS >= 90, PARTIAL 50–89, FAIL < 50 (lab score 0–100).
  if (value >= 90) {
    return award(criterionId, ruleId, "PASS", 1, refs, `Lighthouse performance score ${value} indicates strong measured performance.`, "we.perf.pass");
  }
  if (value >= 50) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, `Lighthouse performance score ${value} indicates partial measured performance.`, "we.perf.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, `Lighthouse performance score ${value} indicates poor measured performance.`, "we.perf.fail");
}

function evalDesignReadability(
  bundle: MappedEvidenceBundle,
  home: PageEvidence | null,
  weFindings: ReturnType<typeof findingsForCategory>,
): RuleEvaluation {
  const ruleId = "rule.WE.design_readability.v1";
  const criterionId = "WE.design_readability";
  if (!home) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No page available for readability assessment.", null);
  }
  const refs = refsForPages(bundle, [home]);
  const hasH1 = home.headings.some((h) => h.level === 1);
  const excerptLen = home.mainTextExcerpt.trim().length;
  const aiGood = hasStrongAiSupport(weFindings, (f) =>
    /readab|clear|design|accessib/i.test(`${f.title} ${f.description}`),
  );
  const aiBad = hasAiWeakness(weFindings, (f) =>
    /readab|clutter|accessib|confus/i.test(`${f.title} ${f.description}`),
  );

  if (hasH1 && excerptLen >= 120 && !aiBad) {
    return award(criterionId, ruleId, "PASS", aiGood ? 1 : 0.9, refs, "Clear H1 and substantial body text without corroborated readability weaknesses.", "we.design.pass");
  }
  if (hasH1 || excerptLen >= 60) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Partial readability signals (heading or body text present).", "we.design.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "Missing clear headings and readable body content.", "we.design.fail");
}

function evalStructuralClarity(
  bundle: MappedEvidenceBundle,
  home: PageEvidence | null,
  website: import("@/features/audit/types/evidence.types").WebsiteEvidence | null,
  weFindings: ReturnType<typeof findingsForCategory>,
): RuleEvaluation {
  const ruleId = "rule.WE.structural_clarity.v1";
  const criterionId = "WE.structural_clarity";
  if (!home) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No page for structural clarity.", null);
  }
  const refs = refsForPages(bundle, [home]);
  const linkCount = home.internalLinks.length;
  const hasServiceDiscovery = (website?.discoveredServicePages.length ?? 0) > 0;
  const aiBad = hasAiWeakness(weFindings, (f) =>
    /structure|navigat|ia\b|information architecture/i.test(`${f.title} ${f.description}`),
  );

  if (linkCount >= 4 && hasServiceDiscovery && !aiBad) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Multiple internal links and discovered service pages indicate structural clarity.", "we.structure.pass");
  }
  if (linkCount >= 2 || hasServiceDiscovery) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Some structural navigation signals present.", "we.structure.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "Insufficient internal structure/navigation signals.", "we.structure.fail");
}

function evalBusinessServiceInfo(
  bundle: MappedEvidenceBundle,
  home: PageEvidence | null,
  website: import("@/features/audit/types/evidence.types").WebsiteEvidence | null,
  model: BusinessModelHint,
): RuleEvaluation {
  const ruleId = "rule.WE.business_service_info.v1";
  const criterionId = "WE.business_service_info";
  if (!home) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No page for business info.", null);
  }
  const refs = refsForPages(bundle, [home]);
  const hasServices =
    (website?.discoveredServicePages.length ?? 0) > 0 ||
    /service|offer|we (provide|offer|help)/i.test(home.mainTextExcerpt);
  const hasContact =
    home.contact.emails.length > 0 ||
    home.contact.phones.length > 0 ||
    website?.contactPageAvailable === "available";
  const hasArea =
    (website?.serviceAreaSignals.length ?? 0) > 0 ||
    model === "remote_online" ||
    model === "unknown";

  if (hasServices && hasContact && hasArea) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Service offering and contact pathway are transparent; service-area or remote context acknowledged.", "we.bizinfo.pass");
  }
  if (hasServices || hasContact) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Partial business/service information observed.", "we.bizinfo.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "Business/service information not clearly present.", "we.bizinfo.fail");
}

function evalSearchIntentGeo(
  bundle: MappedEvidenceBundle,
  home: PageEvidence | null,
  model: BusinessModelHint,
): RuleEvaluation {
  const ruleId = "rule.SEO.search_intent_geo.v1";
  const criterionId = "SEO.search_intent_geo";
  if (!home) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No page for metadata assessment.", null);
  }
  const refs = refsForPages(bundle, [home]);
  const hasTitle = Boolean(home.title && home.title.trim().length >= 8);
  const hasMeta = Boolean(home.metaDescription && home.metaDescription.trim().length >= 20);
  const hasH1 = home.headings.some((h) => h.level === 1);
  const geo =
    model === "remote_online" ||
    /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/.test(`${home.title} ${home.metaDescription}`) ||
    /serving|near|local|area/i.test(`${home.title} ${home.metaDescription} ${home.mainTextExcerpt}`);

  if (hasTitle && hasMeta && hasH1 && geo) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Title, meta description, and H1 present with relevant intent/geography (or remote-appropriate) signals.", "seo.intent.pass");
  }
  if (hasTitle && (hasMeta || hasH1)) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Partial title/heading/metadata quality.", "seo.intent.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "Missing core title/heading/metadata signals.", "seo.intent.fail");
}

function evalServiceMarketCoverage(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  servicePages: PageEvidence[],
  website: import("@/features/audit/types/evidence.types").WebsiteEvidence | null,
): RuleEvaluation {
  const ruleId = "rule.SEO.service_market_coverage.v1";
  const criterionId = "SEO.service_market_coverage";
  if (pages.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for service coverage.", null);
  }
  const targets = servicePages.length ? servicePages : pages.slice(0, 1);
  const refs = refsForPages(bundle, targets);
  const discovered = website?.discoveredServicePages.length ?? 0;
  const deep = targets.some((page) => page.mainTextExcerpt.length >= 200);

  if (discovered >= 2 && deep) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Multiple service/offer pages with substantial content.", "seo.coverage.pass");
  }
  if (discovered >= 1 || deep) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Some service/offer coverage observed.", "seo.coverage.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "No substantial service/offer coverage observed.", "seo.coverage.fail");
}

function evalCrawlabilitySchema(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  website: import("@/features/audit/types/evidence.types").WebsiteEvidence | null,
): RuleEvaluation {
  const ruleId = "rule.SEO.crawlability_schema.v1";
  const criterionId = "SEO.crawlability_schema";
  if (pages.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for crawlability.", null);
  }
  const refs = refsForPages(bundle, pages.slice(0, 2));
  const robotsOk = website?.robotsRespected !== false;
  const hasSchema = pages.some((page) => page.hasStructuredData);
  const indexable = pages.some((page) => page.httpStatus === 200);

  if (robotsOk && indexable && hasSchema) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Pages reachable with structured data present and robots respected.", "seo.crawl.pass");
  }
  if (robotsOk && indexable) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Crawlable pages without confirmed schema.", "seo.crawl.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "Crawlability/indexability signals weak or blocked.", "seo.crawl.fail");
}

function evalDiscoveryProfiles(
  bundle: MappedEvidenceBundle,
  website: import("@/features/audit/types/evidence.types").WebsiteEvidence | null,
  model: BusinessModelHint,
): RuleEvaluation {
  const ruleId = "rule.SEO.discovery_profiles.v1";
  const criterionId = "SEO.discovery_profiles";
  // Applicability handled outside; if remote N/A this won't be scored.
  // Without a GBP/reputation provider, local discovery profiles cannot be verified.
  if (model === "remote_online") {
    // Still return NOT_ASSESSED here only if applicable; engine marks N/A separately.
  }
  return award(
    criterionId,
    ruleId,
    "NOT_ASSESSED",
    0,
    {
      evidenceIds: website ? ["website-1"] : [],
      sourceUrls: website?.homepageUrl ? [website.homepageUrl] : [],
      observationTimestamps: website ? [website.source.observedAt] : [],
    },
    "Appropriate discovery profiles (e.g. Google Business Profile) are not independently verified in this scoring version; criterion remains NOT_ASSESSED.",
    "seo.discovery.unverified",
  );
}

function evalConsistentSignals(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  website: import("@/features/audit/types/evidence.types").WebsiteEvidence | null,
  model: BusinessModelHint,
): RuleEvaluation {
  const ruleId = "rule.SEO.consistent_signals.v1";
  const criterionId = "SEO.consistent_signals";
  if (pages.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for NAP/contact consistency.", null);
  }
  const refs = refsForPages(bundle, pages.slice(0, 2));
  const phones = new Set(
    pages.flatMap((page) => page.contact.phones.map((p) => p.replace(/\D/g, ""))),
  );
  const emails = new Set(pages.flatMap((page) => page.contact.emails));
  const hasContact =
    phones.size > 0 ||
    emails.size > 0 ||
    website?.contactPageAvailable === "available";
  const areaOk =
    model === "remote_online" ||
    (website?.serviceAreaSignals.length ?? 0) > 0 ||
    pages.some((page) => page.contact.addresses.length > 0);

  if (hasContact && areaOk && phones.size <= 1) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Consistent contact signals observed without conflicting phone variants.", "seo.nap.pass");
  }
  if (hasContact || areaOk) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Partial contact/service-area consistency signals.", "seo.nap.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "Contact/service-area signals missing.", "seo.nap.fail");
}

function evalThirdPartyReviews(bundle: MappedEvidenceBundle): RuleEvaluation {
  const ruleId = "rule.REP.third_party_reviews.v1";
  const criterionId = "REP.third_party_reviews";
  if (!bundle.reputationProviderAvailable) {
    return award(
      criterionId,
      ruleId,
      "NOT_ASSESSED",
      0,
      { evidenceIds: [], sourceUrls: [], observationTimestamps: [] },
      "No reputation provider integration available; verifiable third-party reviews remain NOT_ASSESSED.",
      "rep.reviews.provider_missing",
    );
  }
  // Future provider path would assess here.
  return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "Reputation provider returned no usable data.", null);
}

function evalCredentials(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  blob: string,
  repFindings: ReturnType<typeof findingsForCategory>,
): RuleEvaluation {
  const ruleId = "rule.REP.credentials_guarantees.v1";
  const criterionId = "REP.credentials_guarantees";
  if (pages.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for credentials.", null);
  }
  const refs = refsForPages(bundle, pages.slice(0, 2));
  const mentioned =
    /\b(licensed|certified|insured|bonded|accredited|guarantee|warranty)\b/i.test(blob);
  const aiMentions = hasStrongAiSupport(repFindings, (f) =>
    /credential|license|certified|guarantee|insured/i.test(`${f.title} ${f.description}`),
  );

  if (mentioned && aiMentions) {
    // Visible but not independently verified → PARTIAL max (PRD: only if substantiated)
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Credentials/guarantees are visible on-site but not independently verified; capped at PARTIAL.", "rep.cred.unverified_visible");
  }
  if (mentioned) {
    return award(criterionId, ruleId, "PARTIAL", 0.4, refs, "Credential/guarantee language observed on-site without third-party substantiation.", "rep.cred.unverified_visible");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "No visible credentials/guarantees observed.", "rep.cred.none");
}

function evalTestimonials(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  blob: string,
  repFindings: ReturnType<typeof findingsForCategory>,
): RuleEvaluation {
  const ruleId = "rule.REP.testimonials_portfolio.v1";
  const criterionId = "REP.testimonials_portfolio";
  if (pages.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for testimonials.", null);
  }
  const refs = refsForPages(bundle, pages.slice(0, 2));
  const mentioned =
    /\b(testimonial|reviews? from|what our clients|case study|portfolio|our work)\b/i.test(
      blob,
    );
  const aiGood = hasStrongAiSupport(repFindings, (f) =>
    /testimonial|portfolio|case stud|review/i.test(`${f.title} ${f.description}`),
  );

  if (mentioned && aiGood) {
    return award(criterionId, ruleId, "PASS", 0.85, refs, "Testimonials/portfolio/case proof visible and corroborated by grounded AI observations (still website-sourced).", "rep.test.pass");
  }
  if (mentioned || aiGood) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Some testimonial/portfolio signals observed.", "rep.test.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "No testimonial/portfolio/case proof observed.", "rep.test.none");
}

function evalPublicActivity(
  website: import("@/features/audit/types/evidence.types").WebsiteEvidence | null,
): RuleEvaluation {
  const ruleId = "rule.REP.public_activity.v1";
  const criterionId = "REP.public_activity";
  const links = website?.publicSocialProfileLinks ?? [];
  const refs = {
    evidenceIds: website ? ["website-1"] : [],
    sourceUrls: links.slice(0, 3),
    observationTimestamps: website ? [website.source.observedAt] : [],
  };
  if (links.length >= 2) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Multiple public profile links observed on the website.", "rep.public.pass");
  }
  if (links.length === 1) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Single public profile link observed.", "rep.public.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "No public profile/activity links observed.", "rep.public.none");
}

function evalServicePageDepth(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  servicePages: PageEvidence[],
  caFindings: ReturnType<typeof findingsForCategory>,
): RuleEvaluation {
  const ruleId = "rule.CA.service_page_depth.v1";
  const criterionId = "CA.service_page_depth";
  const targets = servicePages.length ? servicePages : pages;
  if (targets.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for content depth.", null);
  }
  const refs = refsForPages(bundle, targets.slice(0, 2));
  const longest = Math.max(...targets.map((page) => page.mainTextExcerpt.length));
  const headings = Math.max(...targets.map((page) => page.headings.length));
  const aiGood = hasStrongAiSupport(caFindings, (f) =>
    /depth|detailed|service page|substantive/i.test(`${f.title} ${f.description}`),
  );

  if (longest >= 400 && headings >= 2) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Service/offer pages show substantial depth and structure.", "ca.depth.pass");
  }
  if (longest >= 180 || aiGood) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Moderate service/offer content depth.", "ca.depth.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "Service/offer content is thin.", "ca.depth.fail");
}

function evalEducationResources(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  website: import("@/features/audit/types/evidence.types").WebsiteEvidence | null,
  caFindings: ReturnType<typeof findingsForCategory>,
): RuleEvaluation {
  const ruleId = "rule.CA.education_resources.v1";
  const criterionId = "CA.education_resources";
  if (pages.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for education resources.", null);
  }
  const faq = website?.faqOrResourcePages ?? [];
  const refs = refsForPages(bundle, pages.slice(0, 2));
  const onPageFaq = pages.some((page) =>
    /faq|frequently asked|guide|resources|case stud|portfolio/i.test(
      `${page.title} ${page.mainTextExcerpt} ${page.finalUrl}`,
    ),
  );
  if (faq.length > 0 || onPageFaq) {
    return award(criterionId, ruleId, "PASS", 1, refs, "FAQ/guide/resource/portfolio content discovered.", "ca.edu.pass");
  }
  if (hasStrongAiSupport(caFindings, (f) => /faq|guide|resource|education/i.test(`${f.title} ${f.description}`))) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "AI indicates educational content with limited crawl corroboration.", "ca.edu.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "No educational/FAQ/resource content observed.", "ca.edu.none");
}

function evalContentUpkeep(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
): RuleEvaluation {
  const ruleId = "rule.CA.content_upkeep.v1";
  const criterionId = "CA.content_upkeep";
  if (pages.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for content freshness.", null);
  }
  const dated = pages.filter((page) => page.publicationDate);
  const refs = refsForPages(bundle, dated.length ? dated : pages.slice(0, 1));
  if (dated.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, refs, "No attributable publication dates available; content upkeep NOT_ASSESSED.", "ca.upkeep.no_dates");
  }
  const newest = dated
    .map((page) => Date.parse(page.publicationDate!))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => b - a)[0];
  if (newest === undefined) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, refs, "Publication dates could not be parsed.", "ca.upkeep.no_dates");
  }
  const ageDays = (Date.now() - newest) / (1000 * 60 * 60 * 24);
  if (ageDays <= 365) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Attributable content dated within the last year.", "ca.upkeep.pass");
  }
  if (ageDays <= 365 * 2) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Attributable content dated within two years.", "ca.upkeep.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "Attributable content appears stale (>2 years).", "ca.upkeep.stale");
}

function evalTopicalBreadth(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  servicePages: PageEvidence[],
  caFindings: ReturnType<typeof findingsForCategory>,
): RuleEvaluation {
  const ruleId = "rule.CA.topical_breadth.v1";
  const criterionId = "CA.topical_breadth";
  if (pages.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for topical breadth.", null);
  }
  const refs = refsForPages(bundle, pages.slice(0, 3));
  const pageCount = pages.length;
  const serviceCount = Math.max(servicePages.length, 0);
  if (pageCount >= 3 && serviceCount >= 1) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Multiple pages including service/offer content show topical breadth.", "ca.breadth.pass");
  }
  if (pageCount >= 2 || hasStrongAiSupport(caFindings, (f) => /topical|breadth|topics/i.test(`${f.title} ${f.description}`))) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Limited topical breadth observed.", "ca.breadth.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "Insufficient topical breadth.", "ca.breadth.fail");
}

function evalPrimaryCta(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  home: PageEvidence | null,
  website: import("@/features/audit/types/evidence.types").WebsiteEvidence | null,
  crFindings: ReturnType<typeof findingsForCategory>,
): RuleEvaluation {
  const ruleId = "rule.CR.primary_cta.v1";
  const criterionId = "CR.primary_cta";
  if (!home) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No homepage for CTA assessment.", null);
  }
  const refs = refsForPages(bundle, [home]);
  const ctas = home.ctas.length > 0 || (website?.primaryConversionPathways.length ?? 0) > 0;
  const aiBad = hasAiWeakness(crFindings, (f) => /cta|call to action|conversion/i.test(`${f.title} ${f.description}`));

  if (ctas && !aiBad) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Primary CTA/conversion pathway visible on homepage.", "cr.cta.pass");
  }
  if (ctas) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "CTA present with corroborated friction concerns.", "cr.cta.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "No primary CTA observed.", "cr.cta.none");
}

function evalInquiryPath(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  website: import("@/features/audit/types/evidence.types").WebsiteEvidence | null,
): RuleEvaluation {
  const ruleId = "rule.CR.inquiry_path.v1";
  const criterionId = "CR.inquiry_path";
  if (pages.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for inquiry path.", null);
  }
  const refs = refsForPages(bundle, pages.slice(0, 2));
  const contactPage = website?.contactPageAvailable === "available";
  const contactInfo = pages.some(
    (page) => page.contact.emails.length > 0 || page.contact.phones.length > 0,
  );
  const bookingCta = pages.some((page) =>
    /book|quote|contact|schedule|get started|inquire/i.test(
      page.ctas.map((c) => c.text).join(" "),
    ),
  );

  if ((contactPage || contactInfo) && bookingCta) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Inquiry/booking/quote pathway supported by contact details and CTA.", "cr.inquiry.pass");
  }
  if (contactPage || contactInfo || bookingCta) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Partial inquiry pathway signals.", "cr.inquiry.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "No clear inquiry/booking pathway observed.", "cr.inquiry.none");
}

function evalServiceNextSteps(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  servicePages: PageEvidence[],
): RuleEvaluation {
  const ruleId = "rule.CR.service_next_steps.v1";
  const criterionId = "CR.service_next_steps";
  const targets = servicePages.length ? servicePages : pages;
  if (targets.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for next-step CTAs.", null);
  }
  const refs = refsForPages(bundle, targets.slice(0, 2));
  const withCta = targets.filter((page) => page.ctas.length > 0);
  if (servicePages.length > 0 && withCta.length === servicePages.length) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Service pages include next-step CTAs.", "cr.next.pass");
  }
  if (withCta.length > 0) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Some pages include next-step CTAs.", "cr.next.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "Service-specific next steps not observed.", "cr.next.none");
}

function evalTrustAlongsideCta(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  blob: string,
): RuleEvaluation {
  const ruleId = "rule.CR.trust_alongside_cta.v1";
  const criterionId = "CR.trust_alongside_cta";
  if (pages.length === 0) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No pages for trust-near-CTA.", null);
  }
  const refs = refsForPages(bundle, pages.slice(0, 2));
  const trust =
    /\b(licensed|insured|testimonial|guaranteed|trusted|years of experience)\b/i.test(
      blob,
    );
  const hasCta = pages.some((page) => page.ctas.length > 0);
  if (trust && hasCta) {
    return award(criterionId, ruleId, "PASS", 1, refs, "Trust/context language present alongside CTAs.", "cr.trust.pass");
  }
  if (trust || hasCta) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Partial trust-near-CTA signals.", "cr.trust.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "No trust context alongside CTAs.", "cr.trust.none");
}

function evalMobileCompletion(
  bundle: MappedEvidenceBundle,
  pages: PageEvidence[],
  home: PageEvidence | null,
  crFindings: ReturnType<typeof findingsForCategory>,
): RuleEvaluation {
  const ruleId = "rule.CR.mobile_completion.v1";
  const criterionId = "CR.mobile_completion";
  if (!home) {
    return award(criterionId, ruleId, "NOT_ASSESSED", 0, { evidenceIds: [], sourceUrls: [], observationTimestamps: [] }, "No page for mobile completion.", null);
  }
  const refs = refsForPages(bundle, [home]);
  // Without a live form interaction test, infer from simple contact pathways (tel:/mailto:/short CTAs).
  const easyPath = home.ctas.some((cta) =>
    /tel:|mailto:|call|text|book|quote/i.test(`${cta.text} ${cta.href ?? ""}`),
  );
  const phone = home.contact.phones.length > 0;
  const aiBad = hasAiWeakness(crFindings, (f) =>
    /friction|form|mobile completion|hard to contact/i.test(`${f.title} ${f.description}`),
  );

  if ((easyPath || phone) && !aiBad) {
    return award(criterionId, ruleId, "PASS", 0.9, refs, "Low-friction contact pathways (phone/mailto/simple CTA) observed; no corroborated mobile friction.", "cr.mobile.pass");
  }
  if (easyPath || phone) {
    return award(criterionId, ruleId, "PARTIAL", 0.5, refs, "Contact pathway present with possible friction signals.", "cr.mobile.partial");
  }
  return award(criterionId, ruleId, "FAIL", 0, refs, "No low-friction mobile completion pathway observed.", "cr.mobile.none");
}

/** Apply earned points from fraction and effective max. */
export function pointsFromFraction(
  fraction: number,
  effectiveMax: number,
): number {
  return roundPoints(Math.max(0, Math.min(1, fraction)) * effectiveMax);
}
