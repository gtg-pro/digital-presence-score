import type { LucideIcon } from "lucide-react";
import {
  FileText,
  MapPin,
  MonitorSmartphone,
  MousePointerClick,
  ShieldCheck,
} from "lucide-react";

import {
  scoringCategories,
  scoringTotalPoints,
} from "@/config/scoring";

export type AssessmentCategory = {
  id: string;
  title: string;
  maxPoints: number;
  description: string;
  icon: LucideIcon;
};

const categoryMeta: Record<
  (typeof scoringCategories)[number]["id"],
  { description: string; icon: LucideIcon }
> = {
  "website-experience": {
    description:
      "Reviewing mobile usability, navigation, measured performance, readability, and how clearly your website presents your business.",
    icon: MonitorSmartphone,
  },
  "local-seo-presence": {
    description:
      "Evaluating search-relevant website signals, service-page coverage, crawlability, and applicable business discovery information.",
    icon: MapPin,
  },
  "reputation-trust": {
    description:
      "Assessing available, verifiable reviews, trust signals, credentials, testimonials, and relevant public business activity.",
    icon: ShieldCheck,
  },
  "content-authority": {
    description:
      "Reviewing the usefulness, depth, relevance, and upkeep of your service pages, FAQs, guides, and other applicable content.",
    icon: FileText,
  },
  "conversion-readiness": {
    description:
      "Checking how easily potential customers can contact your business, request a quote, book a service, or take the next step.",
    icon: MousePointerClick,
  },
};

/**
 * Public digital-presence assessment categories and weights.
 * Weights are sourced from `@/config/scoring` (25 + 25 + 20 + 15 + 15 = 100).
 */
export const assessmentCategories: AssessmentCategory[] = scoringCategories.map(
  (category) => ({
    id: category.id,
    title: category.title,
    maxPoints: category.maxPoints,
    description: categoryMeta[category.id].description,
    icon: categoryMeta[category.id].icon,
  }),
);

export const assessmentFrameworkTotalPoints = scoringTotalPoints;
