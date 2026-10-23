import { completeAuditDemo } from "@/features/report/data/report.mock";
import type { ReportSummary } from "@/features/report/types/report";

/**
 * Illustrative landing-page preview derived from the complete demo fixture.
 * Not verified assessment results. Do not treat as a real audit.
 */
export const sampleReport: ReportSummary = {
  id: "demo",
  isDemo: true,
  businessName: completeAuditDemo.businessName,
  website: completeAuditDemo.website ?? "",
  serviceArea: "",
  scoringVersion: completeAuditDemo.scoringVersion,
  assessedAtLabel: "Illustrative date",
  statusLabel: completeAuditDemo.statusLabel,
  overallScore: 64,
  maxScore: completeAuditDemo.maxScore,
  maturityBand: completeAuditDemo.maturityBand,
  categories: completeAuditDemo.categories.map((category) => ({
    id: category.id,
    title: category.title,
    earned: category.earned ?? 0,
    maxPoints: category.maxPoints,
  })),
  findings: [
    ...completeAuditDemo.strengths.slice(0, 1).map((item) => ({
      type: "strength" as const,
      text: item.title,
    })),
    ...completeAuditDemo.improvements.slice(0, 2).map((item) => ({
      type: "improvement" as const,
      text: item.title,
    })),
  ],
  recommendations: completeAuditDemo.actionPlan
    .slice(0, 3)
    .map((item) => item.action),
};
