import {
  ChartNoAxesCombined,
  FileText,
  Gauge,
  Globe,
  Search,
  ShieldCheck,
} from "lucide-react";

import type {
  AuditDemoStateKey,
  AuditProgressSnapshot,
  AuditProgressStageDefinition,
  AuditProgressStageState,
  AuditStageStatus,
} from "@/features/audit/types/audit-progress.types";

export const auditProgressStageDefinitions: AuditProgressStageDefinition[] = [
  {
    id: "business-discovery",
    title: "Business Discovery",
    description: "Confirming your business identity and website information.",
    icon: Search,
  },
  {
    id: "website-crawling",
    title: "Website Crawling",
    description: "Reviewing accessible website pages, structure, and content.",
    icon: Globe,
  },
  {
    id: "performance-analysis",
    title: "Performance Analysis",
    description: "Checking available website performance measurements.",
    icon: Gauge,
  },
  {
    id: "public-trust-signals",
    title: "Public Trust Signals",
    description: "Reviewing available reputation and public business information.",
    icon: ShieldCheck,
  },
  {
    id: "scoring-validation",
    title: "Scoring & Validation",
    description: "Evaluating collected evidence against the assessment framework.",
    icon: ChartNoAxesCombined,
  },
  {
    id: "report-generation",
    title: "Report Generation",
    description: "Preparing your Digital Presence Score.",
    icon: FileText,
  },
];

function stages(
  statuses: Array<{
    status: AuditStageStatus;
    detail?: string;
  }>,
): AuditProgressStageState[] {
  return auditProgressStageDefinitions.map((definition, index) => ({
    id: definition.id,
    status: statuses[index]?.status ?? "pending",
    detail: statuses[index]?.detail,
  }));
}

export const auditProgressDemoSnapshots: Record<
  AuditDemoStateKey,
  AuditProgressSnapshot
> = {
  in_progress: {
    id: "demo-in-progress",
    isDemo: true,
    label: "Demo — Assessment in Progress",
    outcome: "in_progress",
    headline: "Assessment in Progress",
    summary:
      "Illustrative preview of an assessment underway. Stages do not advance automatically in this frontend demo.",
    stages: stages([
      { status: "completed" },
      { status: "completed" },
      { status: "in_progress" },
      { status: "pending" },
      { status: "pending" },
      { status: "pending" },
    ]),
  },
  completed: {
    id: "demo-completed",
    isDemo: true,
    label: "Demo — Assessment Completed",
    outcome: "completed",
    headline: "Assessment Completed",
    summary:
      "Illustrative preview of a finished processing run. No numerical score is shown here — scores appear only on a report when evidence requirements are met.",
    stages: stages([
      { status: "completed" },
      { status: "completed" },
      { status: "completed" },
      { status: "completed" },
      { status: "completed" },
      { status: "completed" },
    ]),
  },
  partial: {
    id: "demo-partial",
    isDemo: true,
    label: "Demo — Partial Audit",
    outcome: "partial",
    headline: "Partial Audit",
    summary:
      "Illustrative preview when some public signals cannot be verified. Unavailable evidence is Not Assessed — not an automatic failure or score penalty.",
    stages: stages([
      { status: "completed" },
      {
        status: "not_assessed",
        detail: "Website pages were not fully accessible for review.",
      },
      {
        status: "not_assessed",
        detail: "Performance measurements were unavailable.",
      },
      { status: "completed" },
      {
        status: "completed",
        detail: "Scoring limited to categories with sufficient evidence.",
      },
      { status: "completed" },
    ]),
  },
  failed: {
    id: "demo-failed",
    isDemo: true,
    label: "Demo — Assessment Failed",
    outcome: "failed",
    headline: "Assessment Failed",
    summary:
      "Illustrative preview of a processing failure. This is distinct from Not Assessed — a missing third-party signal alone should not fail the entire assessment.",
    stages: stages([
      { status: "completed" },
      { status: "failed", detail: "Processing interrupted during website review." },
      { status: "pending" },
      { status: "pending" },
      { status: "pending" },
      { status: "pending" },
    ]),
  },
};

export const auditDemoStateOptions: Array<{
  key: AuditDemoStateKey;
  label: string;
}> = [
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "partial", label: "Partial audit" },
  { key: "failed", label: "Failed" },
];
