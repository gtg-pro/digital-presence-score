import type {
  OpenAIWebAuditCallResult,
  OpenAIWebAuditPayload,
} from "@/lib/audit/openai-audit/openai-audit.types";
import { SCORING_CONFIG_STRICT_V1 } from "@/lib/audit/scoring/scoring-config";

function criteriaFor(
  categoryId: string,
  assessments: Array<"PASS" | "PARTIAL" | "FAIL" | "NOT_ASSESSED">,
) {
  const criteria = SCORING_CONFIG_STRICT_V1.criteria.filter(
    (c) => c.categoryId === categoryId,
  );
  return criteria.map((criterion, index) => ({
    criterionId: criterion.id,
    assessment: assessments[index] ?? ("NOT_ASSESSED" as const),
    rationale: `Fixture rationale for ${criterion.id}.`,
  }));
}

export function completeOpenAIAuditPayload(
  websiteUrl = "https://example-plumbing.example/",
): OpenAIWebAuditPayload {
  return {
    websiteUrl,
    businessName: "Example Plumbing Co",
    retrievalSucceeded: true,
    retrievalNotes: "Homepage and service pages retrieved via web search.",
    sourceReferences: [
      { url: websiteUrl, title: "Example Plumbing Co" },
      {
        url: `${websiteUrl.replace(/\/$/, "")}/services`,
        title: "Services",
      },
    ],
    assessmentStatus: "COMPLETE",
    executiveSummary:
      "Example Plumbing Co presents a clear service-business website with identifiable contact paths, service descriptions, and local relevance signals. The digital presence is solid with opportunities to deepen trust content and conversion clarity.",
    categories: [
      {
        categoryId: "website_experience",
        summary:
          "The site is readable and organized, with clear service information for visitors.",
        observations: [
          {
            title: "Clear navigation",
            detail: "Primary pages are easy to locate from the homepage.",
            kind: "strength",
          },
        ],
        criteria: criteriaFor("website_experience", [
          "PASS",
          "NOT_ASSESSED",
          "PASS",
          "PASS",
          "PASS",
        ]),
      },
      {
        categoryId: "local_seo_presence",
        summary:
          "Service and location language supports local discovery without verified ranking claims.",
        observations: [
          {
            title: "Service-area language",
            detail: "Pages mention core services and service geography.",
            kind: "strength",
          },
        ],
        criteria: criteriaFor("local_seo_presence", [
          "PASS",
          "PASS",
          "PARTIAL",
          "PARTIAL",
          "PASS",
        ]),
      },
      {
        categoryId: "reputation_trust",
        summary:
          "On-site testimonials are present; independent third-party reviews were not confirmed.",
        observations: [
          {
            title: "On-site testimonials",
            detail: "Customer quotes appear on the homepage.",
            kind: "strength",
          },
        ],
        criteria: criteriaFor("reputation_trust", [
          "NOT_ASSESSED",
          "PARTIAL",
          "PASS",
          "PARTIAL",
        ]),
      },
      {
        categoryId: "content_authority",
        summary:
          "Service pages cover core offerings; educational content is limited.",
        observations: [
          {
            title: "Service depth",
            detail: "Core services are described with useful detail.",
            kind: "strength",
          },
        ],
        criteria: criteriaFor("content_authority", [
          "PASS",
          "PARTIAL",
          "PARTIAL",
          "PARTIAL",
        ]),
      },
      {
        categoryId: "conversion_readiness",
        summary:
          "Contact and request paths are visible, with room to sharpen primary calls to action.",
        observations: [
          {
            title: "Contact options",
            detail: "Phone and form options are available.",
            kind: "strength",
          },
        ],
        criteria: criteriaFor("conversion_readiness", [
          "PASS",
          "PASS",
          "PARTIAL",
          "PARTIAL",
          "PASS",
        ]),
      },
    ],
    strengths: [
      {
        title: "Clear service presentation",
        description:
          "Visitors can quickly understand the core services offered.",
        categoryId: "website_experience",
      },
      {
        title: "Visible contact path",
        description: "Phone and inquiry options are easy to find.",
        categoryId: "conversion_readiness",
      },
    ],
    improvements: [
      {
        title: "Expand helpful resources",
        description:
          "Adding practical guides would strengthen topical authority.",
        recommendedAction:
          "Publish two short service-related guides answering common customer questions.",
        categoryId: "content_authority",
        severity: "medium",
      },
    ],
    recommendations: [
      {
        title: "Strengthen the primary call to action",
        description:
          "Make the main request path more prominent on service pages.",
        priority: "high",
        categoryId: "conversion_readiness",
      },
      {
        title: "Add verified trust signals",
        description:
          "Where available, link to independent review profiles customers already use.",
        priority: "medium",
        categoryId: "reputation_trust",
      },
    ],
    nextSteps: [
      "Publish two practical service guides answering frequent customer questions.",
      "Make the primary booking or inquiry call to action more prominent on every service page.",
      "Add links to any verified third-party review profiles you already maintain.",
    ],
    limitationSummary: null,
  };
}

export function partialOpenAIAuditPayload(
  websiteUrl = "https://brochure.example/",
): OpenAIWebAuditPayload {
  const complete = completeOpenAIAuditPayload(websiteUrl);
  return {
    ...complete,
    businessName: "Brochure Studio",
    assessmentStatus: "PARTIAL",
    retrievalSucceeded: true,
    executiveSummary:
      "Public information supports a useful digital presence overview for Brochure Studio, though several areas could not be assessed fully from available sources.",
    categories: complete.categories.map((category) => ({
      ...category,
      criteria: category.criteria.map((criterion, index) =>
        index === 0
          ? criterion
          : {
              ...criterion,
              assessment: "NOT_ASSESSED" as const,
              rationale: "Insufficient public information for this criterion.",
            },
      ),
    })),
    limitationSummary:
      "Some aspects of the website could not be assessed using the available public information.",
  };
}

export function limitedOpenAIAuditPayload(
  websiteUrl = "https://unreachable.example/",
): OpenAIWebAuditPayload {
  return {
    websiteUrl,
    businessName: null,
    retrievalSucceeded: false,
    retrievalNotes: "No reliable public pages were retrieved.",
    sourceReferences: [],
    assessmentStatus: "LIMITED_VISIBILITY",
    executiveSummary:
      "A complete digital presence assessment could not be completed because public website information was insufficient for this run.",
    categories: SCORING_CONFIG_STRICT_V1.categories.map((category) => ({
      categoryId: category.id,
      summary:
        "This category could not be assessed from available public information.",
      observations: [],
      criteria: SCORING_CONFIG_STRICT_V1.criteria
        .filter((c) => c.categoryId === category.id)
        .map((criterion) => ({
          criterionId: criterion.id,
          assessment: "NOT_ASSESSED" as const,
          rationale: "No retrieved evidence available.",
        })),
    })),
    strengths: [],
    improvements: [],
    recommendations: [],
    nextSteps: [
      "Confirm the website is publicly reachable and try the audit again.",
    ],
    limitationSummary:
      "Some aspects of the website could not be assessed using the available public information.",
  };
}

export function mockOpenAIAuditSuccess(
  payload: OpenAIWebAuditPayload,
): OpenAIWebAuditCallResult {
  return {
    ok: true,
    payload,
    model: "gpt-4o-mini",
    webSearchUsed: payload.retrievalSucceeded,
    citedUrls: payload.sourceReferences.map((ref) => ref.url),
  };
}

export function mockOpenAIAuditFailure(
  code: Extract<OpenAIWebAuditCallResult, { ok: false }>["code"] = "provider_error",
  message = "OpenAI analysis failed. Please retry.",
): OpenAIWebAuditCallResult {
  return {
    ok: false,
    code,
    message,
    retryable: code !== "missing_api_key" && code !== "quota_exceeded",
  };
}
