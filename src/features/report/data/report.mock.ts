import {
  scoringFrameworkSummary,
  scoringTotalPoints,
} from "@/config/scoring";
import type {
  DigitalPresenceReport,
  ReportDemoKey,
  ReportMethodology,
} from "@/features/report/types/report.types";

const sharedMethodology = (
  coverageNote: string,
  sources: ReportMethodology["sources"],
): ReportMethodology => ({
  frameworkSummary: scoringFrameworkSummary,
  scoringVersion: "strict-v1.0",
  assessmentScope:
    "Publicly observable website and business signals only. Not a measure of service quality or official search rankings.",
  evidenceCoverageNote: coverageNote,
  limitations: [
    "Restricted social or directory profiles may be unavailable.",
    "Performance measurements depend on accessible third-party tools.",
    "A complete numerical score is shown only when sufficient evidence exists.",
  ],
  sources,
  partialAndLimitedExplanation:
    "Partial audits omit an overall /100 score when evidence is incomplete. Limited Visibility Snapshots apply when a website cannot be confidently verified — they present available observations without inventing scores.",
  disclaimer:
    "This report evaluates publicly observable digital presence, not actual service quality or official search-engine rankings.",
});

export const completeAuditDemo: DigitalPresenceReport = {
  id: "demo-complete",
  isDemo: true,
  outcome: "complete",
  businessName: "Example Service Company",
  website: "example-service.com",
  serviceArea: "Austin, TX metro",
  serviceAreaSource: "verified",
  auditDateLabel: "Illustrative date — demo only",
  reportId: "DPRC-DEMO-COMPLETE-001",
  scoringVersion: "strict-v1.0",
  statusLabel: "Complete Audit (Demo)",
  evidenceCoveragePercent: 92,
  overallScore: 62,
  maxScore: scoringTotalPoints,
  maturityBand: "Optimization Opportunity",
  categories: [
    {
      id: "website-experience",
      title: "Website Experience",
      maxPoints: 25,
      earned: 18,
      status: "assessed",
      summary:
        "Core pages are readable and navigable; mobile performance and clarity still have room to improve.",
      findings: [
        {
          id: "we-1",
          title: "Primary services are easy to find",
          detail: "Homepage and navigation clearly list core offerings.",
          evidenceId: "ev-home",
        },
        {
          id: "we-2",
          title: "Mobile layout gaps",
          detail: "Some content blocks require horizontal scrolling on narrow viewports.",
          evidenceId: "ev-mobile",
        },
      ],
    },
    {
      id: "local-seo-presence",
      title: "Local SEO Presence",
      maxPoints: 25,
      earned: 14,
      status: "assessed",
      summary:
        "Service pages exist, but depth and local discovery signals could be stronger.",
      findings: [
        {
          id: "seo-1",
          title: "Service pages present",
          detail: "Dedicated URLs exist for major services.",
          evidenceId: "ev-services",
        },
      ],
    },
    {
      id: "reputation-trust",
      title: "Reputation & Trust",
      maxPoints: 20,
      earned: 12,
      status: "assessed",
      summary:
        "Some public trust signals are visible; credentials and testimonials could be more prominent.",
      findings: [
        {
          id: "rep-1",
          title: "Testimonials visible",
          detail: "Customer quotes appear on a dedicated page.",
          evidenceId: "ev-trust",
        },
      ],
    },
    {
      id: "content-authority",
      title: "Content Authority",
      maxPoints: 15,
      earned: 8,
      status: "assessed",
      summary:
        "Service content is useful but thin in places that would help customers compare options.",
      findings: [
        {
          id: "ca-1",
          title: "FAQ coverage incomplete",
          detail: "Only a short FAQ is available for one service line.",
          evidenceId: "ev-faq",
        },
      ],
    },
    {
      id: "conversion-readiness",
      title: "Conversion Readiness",
      maxPoints: 15,
      earned: 10,
      status: "assessed",
      summary:
        "Contact paths exist, though primary CTAs are easy to miss on key pages.",
      findings: [
        {
          id: "cr-1",
          title: "Contact form available",
          detail: "A form is linked from the header.",
          evidenceId: "ev-cta",
        },
      ],
    },
  ],
  strengths: [
    {
      id: "s1",
      title: "Primary services are clearly presented",
      explanation:
        "Visitors can identify what the business offers without digging through unrelated pages.",
      evidenceLabel: "Homepage service list (illustrative)",
    },
    {
      id: "s2",
      title: "Dedicated service pages exist",
      explanation:
        "Major offerings have their own URLs, which supports clearer customer journeys.",
      evidenceLabel: "Service URL inventory (illustrative)",
    },
    {
      id: "s3",
      title: "A contact pathway is available",
      explanation:
        "Customers can start an inquiry without leaving the site.",
      evidenceLabel: "Header contact link (illustrative)",
    },
  ],
  improvements: [
    {
      id: "i1",
      title: "Service pages need deeper, more useful content",
      severity: "high",
      description:
        "Several service pages lack detail customers typically need before requesting a quote.",
      whyItMatters:
        "Thin pages make it harder for visitors to trust relevance and take the next step.",
      evidenceLabel: "Service page word depth sample (illustrative)",
      recommendedAction: "Expand each priority service page with clear scope, process, and FAQs.",
    },
    {
      id: "i2",
      title: "Primary CTAs are easy to miss",
      severity: "medium",
      description:
        "The main inquiry action competes with secondary links on key landing pages.",
      whyItMatters:
        "Lower CTA visibility can reduce completed inquiries even when intent is high.",
      evidenceLabel: "Above-the-fold CTA placement (illustrative)",
      recommendedAction: "Make the primary contact CTA more prominent on homepage and service pages.",
    },
    {
      id: "i3",
      title: "Mobile performance needs attention",
      severity: "medium",
      description:
        "Measured performance indicators suggest mobile users may wait longer than necessary.",
      whyItMatters:
        "Slower mobile experiences can interrupt trust before content is fully reviewed.",
      evidenceLabel: "Available performance measurement (illustrative)",
      recommendedAction: "Review mobile performance and usability on priority templates.",
    },
    {
      id: "i4",
      title: "Trust signals could be stronger",
      severity: "low",
      description:
        "Credentials and reviews are present but not consistently surfaced near conversion points.",
      whyItMatters:
        "Customers often look for reassurance immediately before contacting a service business.",
      evidenceLabel: "Trust block placement (illustrative)",
      recommendedAction: "Strengthen relevant trust signals near primary CTAs.",
    },
  ],
  actionPlan: [
    {
      id: "a1",
      action: "Improve dedicated service-page content.",
      priority: "high",
      effort: "medium",
      impact: "high",
    },
    {
      id: "a2",
      action: "Review mobile performance.",
      priority: "high",
      effort: "medium",
      impact: "medium",
    },
    {
      id: "a3",
      action: "Improve visibility of primary CTAs.",
      priority: "high",
      effort: "low",
      impact: "high",
    },
    {
      id: "a4",
      action: "Strengthen relevant trust signals.",
      priority: "medium",
      effort: "low",
      impact: "medium",
    },
    {
      id: "a5",
      action: "Improve customer inquiry pathways.",
      priority: "medium",
      effort: "medium",
      impact: "high",
    },
  ],
  unableToVerify: [
    {
      id: "u1",
      title: "Restricted Instagram profile visibility",
      detail:
        "Public profile details were limited at observation time and were marked Not Assessed.",
    },
  ],
  methodology: sharedMethodology("Approximately 92% of planned public checks had usable evidence in this demo fixture.", [
    { id: "demo-src-home", label: "example-service.com homepage", observedAtLabel: "Demo observation" },
    { id: "demo-src-services", label: "Service page sample set", observedAtLabel: "Demo observation" },
  ]),
};

export const partialAuditDemo: DigitalPresenceReport = {
  id: "demo-partial",
  isDemo: true,
  outcome: "partial",
  businessName: "Example Service Company",
  website: "example-service.com",
  serviceArea: "Austin, TX metro (user-supplied)",
  serviceAreaSource: "user_supplied",
  auditDateLabel: "Illustrative date — demo only",
  reportId: "DPRC-DEMO-PARTIAL-002",
  scoringVersion: "strict-v1.0",
  statusLabel: "Partial Audit (Demo)",
  evidenceCoveragePercent: 58,
  overallScore: null,
  maxScore: scoringTotalPoints,
  maturityBand: null,
  categories: [
    {
      id: "website-experience",
      title: "Website Experience",
      maxPoints: 25,
      earned: 16,
      status: "partially_assessed",
      summary:
        "Accessible pages were reviewed; some templates could not be fully observed.",
      findings: [
        {
          id: "p-we-1",
          title: "Navigation is clear on reviewed pages",
          detail: "Primary menu labels match listed services.",
          evidenceId: "ev-nav",
        },
      ],
    },
    {
      id: "local-seo-presence",
      title: "Local SEO Presence",
      maxPoints: 25,
      earned: null,
      status: "not_assessed",
      summary:
        "Insufficient crawlable service-page coverage to score this category.",
      findings: [],
    },
    {
      id: "reputation-trust",
      title: "Reputation & Trust",
      maxPoints: 20,
      earned: 10,
      status: "assessed",
      summary: "A limited set of public trust signals was available.",
      findings: [
        {
          id: "p-rep-1",
          title: "Public testimonials observed",
          detail: "A short testimonials block was present on the about page.",
        },
      ],
    },
    {
      id: "content-authority",
      title: "Content Authority",
      maxPoints: 15,
      earned: null,
      status: "not_assessed",
      summary: "Key content URLs were inaccessible during the demo observation window.",
      findings: [],
    },
    {
      id: "conversion-readiness",
      title: "Conversion Readiness",
      maxPoints: 15,
      earned: 9,
      status: "assessed",
      summary: "Contact options were available on reviewed pages.",
      findings: [
        {
          id: "p-cr-1",
          title: "Phone number is visible",
          detail: "A clickable phone number appears in the site header.",
        },
      ],
    },
  ],
  strengths: [
    {
      id: "ps1",
      title: "Contact information is easy to find",
      explanation: "Reviewed pages surface a clear phone contact option.",
      evidenceLabel: "Header phone link (illustrative)",
    },
    {
      id: "ps2",
      title: "Navigation labels match services",
      explanation: "Where pages were accessible, menu structure was coherent.",
      evidenceLabel: "Navigation sample (illustrative)",
    },
  ],
  improvements: [
    {
      id: "pi1",
      title: "Improve access to service and content pages",
      severity: "high",
      description:
        "Several important URLs could not be reviewed, limiting category coverage.",
      whyItMatters:
        "Incomplete crawlability reduces what customers — and assessments — can verify.",
      evidenceLabel: "Inaccessible URL sample (illustrative)",
      recommendedAction: "Ensure priority service and content pages remain publicly reachable.",
    },
    {
      id: "pi2",
      title: "Strengthen trust placement near contact points",
      severity: "medium",
      description: "Available trust signals are limited in proximity to inquiry CTAs.",
      whyItMatters: "Customers often seek reassurance before calling.",
      recommendedAction: "Surface verifiable trust signals closer to contact actions.",
    },
    {
      id: "pi3",
      title: "Clarify remote vs on-site service messaging",
      severity: "low",
      description: "Service-area wording is inconsistent across reviewed pages.",
      whyItMatters: "Ambiguity can cause mismatched inquiries.",
      recommendedAction: "Align service-area language across key pages.",
    },
  ],
  actionPlan: [
    {
      id: "pa1",
      action: "Restore access to priority service pages.",
      priority: "high",
      effort: "medium",
      impact: "high",
    },
    {
      id: "pa2",
      action: "Improve visibility of primary CTAs.",
      priority: "medium",
      effort: "low",
      impact: "medium",
    },
    {
      id: "pa3",
      action: "Strengthen relevant trust signals.",
      priority: "medium",
      effort: "low",
      impact: "medium",
    },
  ],
  unableToVerify: [
    {
      id: "pu1",
      title: "Local SEO Presence category",
      detail: "Insufficient accessible service-page coverage — marked Not Assessed.",
    },
    {
      id: "pu2",
      title: "Content Authority category",
      detail: "Key content URLs unavailable — marked Not Assessed.",
    },
    {
      id: "pu3",
      title: "Performance measurement",
      detail: "Third-party performance data was unavailable and not treated as a failure.",
    },
  ],
  methodology: sharedMethodology(
    "Approximately 58% of planned public checks had usable evidence in this demo fixture.",
    [
      { id: "demo-src-partial-home", label: "Accessible homepage sample", observedAtLabel: "Demo observation" },
      { id: "demo-src-partial-services", label: "Partial service URL set", observedAtLabel: "Demo observation" },
    ],
  ),
};

export const limitedSnapshotDemo: DigitalPresenceReport = {
  id: "demo-limited",
  isDemo: true,
  outcome: "limited",
  businessName: "Example Service Company",
  website: null,
  serviceArea: "Remote / online (user-supplied)",
  serviceAreaSource: "user_supplied",
  auditDateLabel: "Illustrative date — demo only",
  reportId: "DPRC-DEMO-LIMITED-003",
  scoringVersion: "strict-v1.0",
  statusLabel: "Limited Visibility Snapshot (Demo)",
  evidenceCoveragePercent: 22,
  overallScore: null,
  maxScore: scoringTotalPoints,
  maturityBand: null,
  categories: [
    {
      id: "website-experience",
      title: "Website Experience",
      maxPoints: 25,
      earned: null,
      status: "not_assessed",
      summary: "No confidently verified website was available for this snapshot.",
      findings: [],
    },
    {
      id: "local-seo-presence",
      title: "Local SEO Presence",
      maxPoints: 25,
      earned: null,
      status: "not_assessed",
      summary: "Website-dependent local signals could not be assessed.",
      findings: [],
    },
    {
      id: "reputation-trust",
      title: "Reputation & Trust",
      maxPoints: 20,
      earned: null,
      status: "partially_assessed",
      summary:
        "Only limited public profile information was observable; no category score is assigned.",
      findings: [
        {
          id: "l-rep-1",
          title: "Public business name matches submission",
          detail: "The supplied business name appears consistently on an available public profile.",
        },
      ],
    },
    {
      id: "content-authority",
      title: "Content Authority",
      maxPoints: 15,
      earned: null,
      status: "not_assessed",
      summary: "No website content corpus was available.",
      findings: [],
    },
    {
      id: "conversion-readiness",
      title: "Conversion Readiness",
      maxPoints: 15,
      earned: null,
      status: "not_assessed",
      summary: "Website conversion paths could not be reviewed.",
      findings: [],
    },
  ],
  strengths: [
    {
      id: "ls1",
      title: "Business identity is consistently named",
      explanation:
        "Where a public profile was available, the business name matched the submitted details.",
      evidenceLabel: "Public profile name match (illustrative)",
    },
  ],
  improvements: [
    {
      id: "li1",
      title: "Establish or clarify a primary website",
      severity: "high",
      description:
        "Without a confidently identified website, most website-based checks remain Not Assessed.",
      whyItMatters:
        "Customers often start with a website to confirm services, trust, and contact options.",
      recommendedAction:
        "Publish or confirm a primary website URL so a fuller assessment can be completed later.",
    },
    {
      id: "li2",
      title: "Increase publicly accessible profile information",
      severity: "medium",
      description:
        "Restricted profile visibility limited what could be observed in this snapshot.",
      whyItMatters:
        "Public profiles are often secondary discovery paths when a website is unclear.",
      recommendedAction: "Ensure key public profiles show accurate, accessible business basics.",
    },
  ],
  actionPlan: [
    {
      id: "la1",
      action: "Confirm or launch a primary business website.",
      priority: "high",
      effort: "high",
      impact: "high",
    },
    {
      id: "la2",
      action: "Make public business profiles accurately accessible.",
      priority: "medium",
      effort: "low",
      impact: "medium",
    },
    {
      id: "la3",
      action: "Document a clear primary contact pathway.",
      priority: "medium",
      effort: "low",
      impact: "high",
    },
  ],
  unableToVerify: [
    {
      id: "lu1",
      title: "Website identity",
      detail: "No website could be confidently verified — website categories remain Not Assessed.",
    },
    {
      id: "lu2",
      title: "Unavailable public business-profile information",
      detail: "Some directory or social details were restricted or missing.",
    },
    {
      id: "lu3",
      title: "Performance measurement unavailable",
      detail: "No website was available to measure performance against.",
    },
  ],
  methodology: sharedMethodology(
    "Approximately 22% of planned public checks had usable evidence in this demo fixture.",
    [{ id: "demo-src-limited", label: "Limited public profile observation", observedAtLabel: "Demo observation" }],
  ),
};

export const reportDemoFixtures: Record<ReportDemoKey, DigitalPresenceReport> = {
  complete: completeAuditDemo,
  partial: partialAuditDemo,
  limited: limitedSnapshotDemo,
};

export const reportDemoOptions: Array<{ key: ReportDemoKey; label: string }> = [
  { key: "complete", label: "Complete audit" },
  { key: "partial", label: "Partial audit" },
  { key: "limited", label: "Limited snapshot" },
];

export function getReportDemoById(id: string): DigitalPresenceReport | null {
  if (id === "demo" || id === completeAuditDemo.id) return completeAuditDemo;
  if (id === partialAuditDemo.id) return partialAuditDemo;
  if (id === limitedSnapshotDemo.id) return limitedSnapshotDemo;
  return null;
}
