import type { LucideIcon } from "lucide-react";
import {
  ChartNoAxesCombined,
  ListChecks,
  SearchCheck,
  Target,
} from "lucide-react";

export type BenefitItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const benefits: BenefitItem[] = [
  {
    id: "understand-presence",
    title: "Understand Your Digital Presence",
    description:
      "See how your website and available public digital signals perform across five important assessment areas.",
    icon: ChartNoAxesCombined,
  },
  {
    id: "identify-gaps",
    title: "Identify What's Holding You Back",
    description:
      "Discover evidence-backed issues affecting your website experience, content, trust signals, and conversion readiness.",
    icon: SearchCheck,
  },
  {
    id: "actionable-recommendations",
    title: "Get Actionable Recommendations",
    description:
      "Receive practical suggestions and a prioritized improvement checklist instead of confusing technical jargon.",
    icon: ListChecks,
  },
  {
    id: "better-decisions",
    title: "Make Better Decisions",
    description:
      "Understand where to focus your next digital improvement efforts based on the findings available.",
    icon: Target,
  },
];
