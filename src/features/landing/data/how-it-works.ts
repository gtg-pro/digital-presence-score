import type { LucideIcon } from "lucide-react";
import { FileChartColumn, Globe, ScanSearch } from "lucide-react";

export type HowItWorksStep = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const howItWorksSteps: HowItWorksStep[] = [
  {
    number: "01",
    title: "Enter Your Business Details",
    description:
      "Enter your website URL or provide basic business information to get started.",
    icon: Globe,
  },
  {
    number: "02",
    title: "We Analyze Your Digital Presence",
    description:
      "Our assessment reviews available public digital signals across website experience, search visibility, reputation, content, and conversion readiness.",
    icon: ScanSearch,
  },
  {
    number: "03",
    title: "Get Your Report Card",
    description:
      "View your report with evidence-backed findings, category scores where enough data is available, and prioritized recommendations — then download PDF or PNG. Live reports are temporary browser-session snapshots.",
    icon: FileChartColumn,
  },
];
