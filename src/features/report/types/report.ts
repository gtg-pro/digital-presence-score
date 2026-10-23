export type ReportFindingType = "strength" | "improvement";

export type ReportCategoryScore = {
  id: string;
  title: string;
  earned: number;
  maxPoints: number;
};

export type ReportFinding = {
  type: ReportFindingType;
  text: string;
};

/**
 * Report summary shaped for future API integration.
 * `overallScore` is null when evidence is insufficient for a numerical score.
 */
export type ReportSummary = {
  id: string;
  isDemo: boolean;
  businessName: string;
  website: string;
  /** Optional service-area label shown under the business name on preview cards. */
  serviceArea?: string;
  statusLabel: string;
  scoringVersion: string;
  assessedAtLabel: string;
  overallScore: number | null;
  maxScore: number;
  maturityBand: string | null;
  categories: ReportCategoryScore[];
  findings: ReportFinding[];
  recommendations: string[];
};
