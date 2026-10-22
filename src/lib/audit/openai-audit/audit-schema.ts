import { z } from "zod";

import { SCORING_CONFIG_STRICT_V1 } from "@/lib/audit/scoring/scoring-config";

const criterionIds = SCORING_CONFIG_STRICT_V1.criteria.map((c) => c.id) as [
  string,
  ...string[],
];

const categoryIds = [
  "website_experience",
  "local_seo_presence",
  "reputation_trust",
  "content_authority",
  "conversion_readiness",
] as const;

export const openAIWebAuditZodSchema = z.object({
  websiteUrl: z.string().min(1).max(2048),
  businessName: z.string().max(200).nullable(),
  retrievalSucceeded: z.boolean(),
  retrievalNotes: z.string().max(2000),
  sourceReferences: z
    .array(
      z.object({
        url: z.string().max(2048),
        title: z.string().max(300),
      }),
    )
    .max(20),
  assessmentStatus: z.enum(["COMPLETE", "PARTIAL", "LIMITED_VISIBILITY"]),
  executiveSummary: z.string().min(1).max(4000),
  categories: z
    .array(
      z.object({
        categoryId: z.enum(categoryIds),
        summary: z.string().min(1).max(1500),
        observations: z
          .array(
            z.object({
              title: z.string().min(1).max(200),
              detail: z.string().min(1).max(1000),
              kind: z.enum(["strength", "improvement", "neutral"]),
            }),
          )
          .max(8),
        criteria: z
          .array(
            z.object({
              criterionId: z.enum(criterionIds),
              assessment: z.enum(["PASS", "PARTIAL", "FAIL", "NOT_ASSESSED"]),
              rationale: z.string().min(1).max(800),
            }),
          )
          .min(1)
          .max(10),
      }),
    )
    .length(5),
  strengths: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(1000),
        categoryId: z.enum(categoryIds),
      }),
    )
    .max(12),
  improvements: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(1000),
        recommendedAction: z.string().min(1).max(1000),
        categoryId: z.enum(categoryIds),
        severity: z.enum(["high", "medium", "low"]),
      }),
    )
    .max(12),
  recommendations: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(1000),
        priority: z.enum(["high", "medium", "low"]),
        categoryId: z.enum(categoryIds),
      }),
    )
    .max(12),
  nextSteps: z.array(z.string().min(1).max(500)).max(8),
  limitationSummary: z.string().max(2000).nullable(),
});

export type OpenAIWebAuditZod = z.infer<typeof openAIWebAuditZodSchema>;

/** JSON Schema for OpenAI Responses structured outputs. */
export const openAIWebAuditJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "websiteUrl",
    "businessName",
    "retrievalSucceeded",
    "retrievalNotes",
    "sourceReferences",
    "assessmentStatus",
    "executiveSummary",
    "categories",
    "strengths",
    "improvements",
    "recommendations",
    "nextSteps",
    "limitationSummary",
  ],
  properties: {
    websiteUrl: { type: "string" },
    businessName: { type: ["string", "null"] },
    retrievalSucceeded: { type: "boolean" },
    retrievalNotes: { type: "string" },
    sourceReferences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["url", "title"],
        properties: {
          url: { type: "string" },
          title: { type: "string" },
        },
      },
    },
    assessmentStatus: {
      type: "string",
      enum: ["COMPLETE", "PARTIAL", "LIMITED_VISIBILITY"],
    },
    executiveSummary: { type: "string" },
    categories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["categoryId", "summary", "observations", "criteria"],
        properties: {
          categoryId: {
            type: "string",
            enum: [...categoryIds],
          },
          summary: { type: "string" },
          observations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "detail", "kind"],
              properties: {
                title: { type: "string" },
                detail: { type: "string" },
                kind: {
                  type: "string",
                  enum: ["strength", "improvement", "neutral"],
                },
              },
            },
          },
          criteria: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["criterionId", "assessment", "rationale"],
              properties: {
                criterionId: { type: "string", enum: [...criterionIds] },
                assessment: {
                  type: "string",
                  enum: ["PASS", "PARTIAL", "FAIL", "NOT_ASSESSED"],
                },
                rationale: { type: "string" },
              },
            },
          },
        },
      },
    },
    strengths: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "categoryId"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          categoryId: { type: "string", enum: [...categoryIds] },
        },
      },
    },
    improvements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "description",
          "recommendedAction",
          "categoryId",
          "severity",
        ],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          recommendedAction: { type: "string" },
          categoryId: { type: "string", enum: [...categoryIds] },
          severity: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "priority", "categoryId"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          categoryId: { type: "string", enum: [...categoryIds] },
        },
      },
    },
    nextSteps: { type: "array", items: { type: "string" } },
    limitationSummary: { type: ["string", "null"] },
  },
} as const;

export function validateOpenAIWebAuditPayload(raw: unknown) {
  return openAIWebAuditZodSchema.safeParse(raw);
}
