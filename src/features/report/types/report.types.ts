export type ReportOutcome = "complete" | "partial" | "limited";

export type CategoryAssessmentStatus =
  | "assessed"
  | "partially_assessed"
  | "not_assessed";

export type IssueSeverity = "high" | "medium" | "low";

export type ActionPriority = "high" | "medium" | "low";

export type EffortLevel = "low" | "medium" | "high";

export type ImpactLevel = "low" | "medium" | "high";

export type MaturityBand =
  | "Digital Leader"
  | "Growing Digital Presence"
  | "Optimization Opportunity"
  | "Foundation Opportunity";

export type ReportEvidenceItem = {
  id: string;
  label: string;
  observedAtLabel: string;
};

export type ReportCategoryFinding = {
  id: string;
  title: string;
  detail: string;
  evidenceId?: string;
};

export type ReportCategoryResult = {
  id: string;
  title: string;
  maxPoints: number;
  /** null when Not Assessed — never invent a zero score */
  earned: number | null;
  status: CategoryAssessmentStatus;
  summary: string;
  findings: ReportCategoryFinding[];
};

export type ReportStrength = {
  id: string;
  title: string;
  explanation: string;
  evidenceLabel?: string;
};

export type ReportImprovement = {
  id: string;
  title: string;
  severity: IssueSeverity;
  description: string;
  whyItMatters: string;
  evidenceLabel?: string;
  recommendedAction: string;
};

export type ReportActionItem = {
  id: string;
  action: string;
  priority: ActionPriority;
  effort: EffortLevel;
  impact: ImpactLevel;
};

export type UnableToVerifyItem = {
  id: string;
  title: string;
  detail: string;
};

export type ReportMethodology = {
  frameworkSummary: string;
  scoringVersion: string;
  assessmentScope: string;
  evidenceCoverageNote: string;
  limitations: string[];
  sources: Array<{ label: string; observedAtLabel: string }>;
  partialAndLimitedExplanation: string;
  disclaimer: string;
};

/**
 * Full report card model for future API integration.
 * `overallScore` / `maturityBand` are null unless outcome is complete.
 */
export type DigitalPresenceReport = {
  id: string;
  isDemo: true;
  outcome: ReportOutcome;
  businessName: string;
  website: string | null;
  serviceArea: string;
  serviceAreaSource: "verified" | "user_supplied";
  auditDateLabel: string;
  reportId: string;
  scoringVersion: string;
  statusLabel: string;
  evidenceCoveragePercent: number;
  overallScore: number | null;
  maxScore: number;
  maturityBand: MaturityBand | null;
  categories: ReportCategoryResult[];
  strengths: ReportStrength[];
  improvements: ReportImprovement[];
  actionPlan: ReportActionItem[];
  unableToVerify: UnableToVerifyItem[];
  methodology: ReportMethodology;
};

export type ReportDemoKey = "complete" | "partial" | "limited";

/** Presentation-only maturity band thresholds from the PRD (not live scoring). */
export const maturityBandThresholds = [
  { min: 85, max: 100, band: "Digital Leader" as const },
  { min: 70, max: 84, band: "Growing Digital Presence" as const },
  { min: 50, max: 69, band: "Optimization Opportunity" as const },
  { min: 0, max: 49, band: "Foundation Opportunity" as const },
];
