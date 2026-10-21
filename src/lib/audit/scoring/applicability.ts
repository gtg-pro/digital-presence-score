import type { CrawlResult } from "@/features/audit/types/evidence.types";
import type {
  ApplicabilityState,
  BusinessModelHint,
  CriterionDefinition,
  CriterionId,
  ScoringCategoryId,
} from "@/lib/audit/scoring/scoring.types";

export type ApplicabilityDecision = {
  criterionId: CriterionId;
  applicability: ApplicabilityState;
  reason: string;
};

export type WeightMap = Record<CriterionId, number>;

/**
 * Deterministic rounding to 2 decimal places (half-up).
 */
export function roundPoints(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Infer industry-agnostic business model from crawl signals + optional hint.
 */
export function inferBusinessModel(
  crawl: CrawlResult,
  hint?: BusinessModelHint,
): BusinessModelHint {
  if (hint && hint !== "unknown") return hint;

  const website = crawl.website;
  if (!website) return "unknown";

  const hasLocalSignals =
    website.serviceAreaSignals.length > 0 ||
    crawl.pages.some(
      (page) =>
        page.structuredDataTypes.some((type) =>
          /LocalBusiness|HomeAndConstructionBusiness/i.test(type),
        ) ||
        page.contact.addresses.length > 0 ||
        /\b(serving|near you|local|city|county)\b/i.test(
          `${page.title ?? ""} ${page.metaDescription ?? ""} ${page.mainTextExcerpt}`,
        ),
    );

  const hasRemoteSignals = crawl.pages.some((page) =>
    /\b(remote|online only|virtual|nationwide|worldwide|digital agency)\b/i.test(
      `${page.title ?? ""} ${page.metaDescription ?? ""} ${page.mainTextExcerpt}`,
    ),
  );

  if (hasLocalSignals && hasRemoteSignals) return "hybrid";
  if (hasLocalSignals) return "local_service";
  if (hasRemoteSignals) return "remote_online";
  return "unknown";
}

function hasLocalDiscoveryContext(
  crawl: CrawlResult,
  model: BusinessModelHint,
): boolean | null {
  if (model === "remote_online") return false;
  if (model === "local_service" || model === "at_premises" || model === "hybrid") {
    return true;
  }
  // unknown: only mark applicable when positive local signals exist; otherwise uncertain → APPLICABLE (not N/A)
  const website = crawl.website;
  if (!website) return null;
  if (website.serviceAreaSignals.length > 0) return true;
  if (
    crawl.pages.some((page) =>
      page.structuredDataTypes.some((type) => /LocalBusiness/i.test(type)),
    )
  ) {
    return true;
  }
  return null;
}

/**
 * Documented eligibility evaluation. Uncertain cases stay APPLICABLE (never silent N/A).
 */
export function evaluateApplicability(
  criteria: CriterionDefinition[],
  crawl: CrawlResult,
  businessModel: BusinessModelHint,
): ApplicabilityDecision[] {
  const localDiscovery = hasLocalDiscoveryContext(crawl, businessModel);

  return criteria.map((criterion) => {
    if (criterion.eligibilityRuleId === "eligibility.local_discovery_profiles.v1") {
      if (localDiscovery === false) {
        return {
          criterionId: criterion.id,
          applicability: "NOT_APPLICABLE",
          reason:
            "Remote/online business without local service-area context; local discovery profiles (e.g. GBP) are not required.",
        };
      }
      // true or null → APPLICABLE (null = cannot confidently mark N/A)
      return {
        criterionId: criterion.id,
        applicability: "APPLICABLE",
        reason:
          localDiscovery === true
            ? "Local/hybrid context detected; discovery profiles remain applicable."
            : "Local discovery applicability uncertain; remaining applicable pending clearer signals.",
      };
    }

    if (criterion.eligibilityRuleId === "eligibility.geo_metadata.v1") {
      if (businessModel === "remote_online") {
        // Geography-specific metadata not required; search-intent titles still assessed with reduced geo expectation via rule anchors.
        return {
          criterionId: criterion.id,
          applicability: "APPLICABLE",
          reason:
            "Remote businesses remain applicable for search-intent metadata; geography anchors are relaxed in the scoring rule.",
        };
      }
    }

    if (criterion.eligibilityRuleId === "eligibility.public_profiles.v1") {
      // Always applicable when a website exists; absence of social is FAIL/PARTIAL, not N/A.
      return {
        criterionId: criterion.id,
        applicability: "APPLICABLE",
        reason: "Public activity/profile presence remains applicable for website businesses.",
      };
    }

    return {
      criterionId: criterion.id,
      applicability: "APPLICABLE",
      reason: "No eligibility exclusion matched.",
    };
  });
}

/**
 * Redistribute NOT_APPLICABLE base weights proportionally within the same category.
 * Preserves category maximum via deterministic remainder allocation.
 */
export function redistributeCategoryWeights(
  categoryId: ScoringCategoryId,
  categoryMax: number,
  criteria: CriterionDefinition[],
  applicability: Map<CriterionId, ApplicabilityState>,
): { effective: WeightMap; methodologyReviewRequired: boolean } {
  const inCategory = criteria.filter((c) => c.categoryId === categoryId);
  const applicable = inCategory.filter(
    (c) => applicability.get(c.id) !== "NOT_APPLICABLE",
  );
  const notApplicable = inCategory.filter(
    (c) => applicability.get(c.id) === "NOT_APPLICABLE",
  );

  const effective: WeightMap = {} as WeightMap;
  for (const criterion of inCategory) {
    effective[criterion.id] = 0;
  }

  if (applicable.length === 0) {
    return { effective, methodologyReviewRequired: true };
  }

  const naWeight = notApplicable.reduce((sum, c) => sum + c.baseMaxPoints, 0);
  const applicableBase = applicable.reduce((sum, c) => sum + c.baseMaxPoints, 0);

  if (naWeight === 0) {
    for (const criterion of applicable) {
      effective[criterion.id] = criterion.baseMaxPoints;
    }
    return { effective, methodologyReviewRequired: false };
  }

  const raw: Array<{ id: CriterionId; value: number }> = applicable.map(
    (criterion) => ({
      id: criterion.id,
      value:
        criterion.baseMaxPoints +
        (criterion.baseMaxPoints / applicableBase) * naWeight,
    }),
  );

  // Round down to 2 decimals, then allocate remainder cents to largest fractional parts.
  const floored = raw.map((item) => {
    const flooredValue = Math.floor(item.value * 100) / 100;
    return {
      id: item.id,
      floored: flooredValue,
      fraction: item.value - flooredValue,
    };
  });

  let allocated = floored.reduce((sum, item) => sum + item.floored, 0);
  let remainingCents = Math.round((categoryMax - allocated) * 100);

  floored
    .slice()
    .sort((a, b) => b.fraction - a.fraction || a.id.localeCompare(b.id))
    .forEach((item) => {
      if (remainingCents <= 0) return;
      item.floored = roundPoints(item.floored + 0.01);
      remainingCents -= 1;
    });

  // Safety: if still short/long due to float, adjust lexicographically first id.
  allocated = floored.reduce((sum, item) => sum + item.floored, 0);
  const delta = roundPoints(categoryMax - allocated);
  if (delta !== 0 && floored[0]) {
    floored.sort((a, b) => a.id.localeCompare(b.id));
    floored[0]!.floored = roundPoints(floored[0]!.floored + delta);
  }

  for (const item of floored) {
    effective[item.id] = item.floored;
  }

  return { effective, methodologyReviewRequired: false };
}
