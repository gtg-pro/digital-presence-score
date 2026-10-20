import type { LucideIcon } from "lucide-react";

/** Per-stage visual status — do not rely on color alone. */
export type AuditStageStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "not_assessed"
  | "failed";

/** Overall assessment outcome for the progress screen. */
export type AuditOverallOutcome =
  | "in_progress"
  | "completed"
  | "partial"
  | "failed";

export type AuditProgressStageId =
  | "business-discovery"
  | "website-crawling"
  | "performance-analysis"
  | "public-trust-signals"
  | "scoring-validation"
  | "report-generation";

export type AuditProgressStageDefinition = {
  id: AuditProgressStageId;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type AuditProgressStageState = {
  id: AuditProgressStageId;
  status: AuditStageStatus;
  /** Optional note shown under the stage (e.g. why Not Assessed). */
  detail?: string;
};

/**
 * Progress snapshot shaped for future API integration.
 * Never includes fabricated numerical scores.
 */
export type AuditProgressSnapshot = {
  id: string;
  isDemo: true;
  label: string;
  outcome: AuditOverallOutcome;
  headline: string;
  summary: string;
  stages: AuditProgressStageState[];
};

export type AuditDemoStateKey =
  | "in_progress"
  | "completed"
  | "partial"
  | "failed";
