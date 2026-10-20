/**
 * Canonical public digital-presence scoring framework.
 * Keep in sync with PRD weights: 25 + 25 + 20 + 15 + 15 = 100.
 */
export const scoringCategories = [
  {
    id: "website-experience",
    title: "Website Experience",
    maxPoints: 25,
  },
  {
    id: "local-seo-presence",
    title: "Local SEO Presence",
    maxPoints: 25,
  },
  {
    id: "reputation-trust",
    title: "Reputation & Trust",
    maxPoints: 20,
  },
  {
    id: "content-authority",
    title: "Content Authority",
    maxPoints: 15,
  },
  {
    id: "conversion-readiness",
    title: "Conversion Readiness",
    maxPoints: 15,
  },
] as const;

export type ScoringCategoryId = (typeof scoringCategories)[number]["id"];

export const scoringTotalPoints = scoringCategories.reduce(
  (sum, category) => sum + category.maxPoints,
  0,
);

export const scoringFrameworkSummary = `Five-category public digital-presence framework: ${scoringCategories
  .map((category) => `${category.title} (${category.maxPoints})`)
  .join(", ")}.`;
