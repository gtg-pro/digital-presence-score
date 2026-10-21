import { z } from "zod";

const categorySchema = z.enum([
  "website_experience",
  "local_seo_presence",
  "reputation_trust",
  "content_authority",
  "conversion_readiness",
]);

const availabilitySchema = z.enum([
  "available",
  "partial",
  "insufficient_evidence",
  "not_assessed",
  "error",
]);

const confidenceSchema = z.enum(["high", "medium", "low"]);

const findingSchema = z.object({
  id: z.string().min(1).max(64),
  category: categorySchema,
  kind: z.enum(["strength", "weakness", "observation"]),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  evidenceIds: z.array(z.string().min(1)).min(1).max(20),
  reasoningSummary: z.string().min(1).max(1000),
  suggestedImprovement: z.string().max(1000).nullable(),
  confidence: confidenceSchema,
});

const recommendationSchema = z.object({
  id: z.string().min(1).max(64),
  category: categorySchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  evidenceIds: z.array(z.string().min(1)).min(1).max(20),
  priority: z.enum(["high", "medium", "low"]),
  confidence: confidenceSchema,
});

const categoryObservationSchema = z.object({
  category: categorySchema,
  availability: availabilitySchema,
  summary: z.string().min(1).max(2000),
  findingIds: z.array(z.string()).max(50),
});

/**
 * Zod schema for runtime validation of model output.
 */
export const aiAnalysisModelOutputSchema = z.object({
  status: availabilitySchema,
  industryContext: z.string().max(500).nullable(),
  businessContext: z.string().max(1000).nullable(),
  categoryObservations: z.array(categoryObservationSchema).min(1).max(5),
  findings: z.array(findingSchema).max(40),
  recommendations: z.array(recommendationSchema).max(20),
  areasRequiringVerification: z.array(z.string().max(500)).max(30),
  unavailableObservations: z.array(z.string().max(500)).max(30),
  overallConfidence: confidenceSchema,
});

export type ParsedAIAnalysisModelOutput = z.infer<
  typeof aiAnalysisModelOutputSchema
>;

/**
 * JSON Schema for OpenAI Structured Outputs (`response_format.json_schema`).
 * Keep in sync with `aiAnalysisModelOutputSchema`.
 */
export const aiAnalysisJsonSchema = {
  name: "digital_presence_qualitative_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "status",
      "industryContext",
      "businessContext",
      "categoryObservations",
      "findings",
      "recommendations",
      "areasRequiringVerification",
      "unavailableObservations",
      "overallConfidence",
    ],
    properties: {
      status: {
        type: "string",
        enum: [
          "available",
          "partial",
          "insufficient_evidence",
          "not_assessed",
          "error",
        ],
      },
      industryContext: { type: ["string", "null"] },
      businessContext: { type: ["string", "null"] },
      categoryObservations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["category", "availability", "summary", "findingIds"],
          properties: {
            category: {
              type: "string",
              enum: [
                "website_experience",
                "local_seo_presence",
                "reputation_trust",
                "content_authority",
                "conversion_readiness",
              ],
            },
            availability: {
              type: "string",
              enum: [
                "available",
                "partial",
                "insufficient_evidence",
                "not_assessed",
                "error",
              ],
            },
            summary: { type: "string" },
            findingIds: { type: "array", items: { type: "string" } },
          },
        },
      },
      findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "category",
            "kind",
            "title",
            "description",
            "evidenceIds",
            "reasoningSummary",
            "suggestedImprovement",
            "confidence",
          ],
          properties: {
            id: { type: "string" },
            category: {
              type: "string",
              enum: [
                "website_experience",
                "local_seo_presence",
                "reputation_trust",
                "content_authority",
                "conversion_readiness",
              ],
            },
            kind: {
              type: "string",
              enum: ["strength", "weakness", "observation"],
            },
            title: { type: "string" },
            description: { type: "string" },
            evidenceIds: { type: "array", items: { type: "string" } },
            reasoningSummary: { type: "string" },
            suggestedImprovement: { type: ["string", "null"] },
            confidence: {
              type: "string",
              enum: ["high", "medium", "low"],
            },
          },
        },
      },
      recommendations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "category",
            "title",
            "description",
            "evidenceIds",
            "priority",
            "confidence",
          ],
          properties: {
            id: { type: "string" },
            category: {
              type: "string",
              enum: [
                "website_experience",
                "local_seo_presence",
                "reputation_trust",
                "content_authority",
                "conversion_readiness",
              ],
            },
            title: { type: "string" },
            description: { type: "string" },
            evidenceIds: { type: "array", items: { type: "string" } },
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
            },
            confidence: {
              type: "string",
              enum: ["high", "medium", "low"],
            },
          },
        },
      },
      areasRequiringVerification: {
        type: "array",
        items: { type: "string" },
      },
      unavailableObservations: {
        type: "array",
        items: { type: "string" },
      },
      overallConfidence: {
        type: "string",
        enum: ["high", "medium", "low"],
      },
    },
  },
} as const;

export function validateModelOutput(payload: unknown):
  | { ok: true; data: ParsedAIAnalysisModelOutput }
  | { ok: false; message: string } {
  const parsed = aiAnalysisModelOutputSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    };
  }
  return { ok: true, data: parsed.data };
}
