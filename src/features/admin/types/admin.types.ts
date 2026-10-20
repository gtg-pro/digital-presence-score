export type AuditStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "partial"
  | "failed";

export type ReportShareStatus = "private" | "shared" | "revoked";

export type ReportType = "complete" | "partial" | "limited";

export type EmailDeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "bounced";

export type ReviewStatus = "open" | "in_review" | "approved" | "rejected";

export type AdminNavItem = {
  label: string;
  href: string;
  icon:
    | "overview"
    | "submissions"
    | "audits"
    | "reports"
    | "scores"
    | "emails"
    | "cta"
    | "reviews"
    | "settings";
};

export type AdminKpi = {
  id: string;
  label: string;
  value: number;
  hint: string;
};

export type AdminActivityEvent = {
  id: string;
  title: string;
  detail: string;
  occurredAtLabel: string;
};

export type AdminSubmission = {
  id: string;
  businessName: string;
  website: string | null;
  industry: string;
  email: string;
  serviceArea: string;
  submittedAtLabel: string;
  auditStatus: AuditStatus;
  reportStatus: string;
  publicProfiles: string[];
  consents: {
    terms: boolean;
    emailReport: boolean;
    marketing: boolean;
  };
};

export type AdminAudit = {
  id: string;
  businessName: string;
  createdAtLabel: string;
  currentStage: string;
  status: AuditStatus;
  evidenceCoveragePercent: number;
  scoringVersion: string;
  stages: Array<{
    name: string;
    status: "pending" | "in_progress" | "completed" | "not_assessed" | "failed";
  }>;
  evidenceSummary: string;
  unavailableChecks: string[];
  errorDetail?: string;
};

export type AdminReport = {
  id: string;
  businessName: string;
  reportType: ReportType;
  overallScore: number | null;
  evidenceCoveragePercent: number;
  generatedAtLabel: string;
  shareStatus: ReportShareStatus;
  demoReportPath: string;
};

export type AdminEmailRecord = {
  id: string;
  recipient: string;
  relatedReportId: string;
  status: EmailDeliveryStatus;
  dateLabel: string;
};

export type AdminReviewItem = {
  id: string;
  businessName: string;
  reportId: string;
  reason: string;
  evidenceReference: string;
  originalResult: string;
  proposedResult: string;
  status: ReviewStatus;
};

export type ScoreAnalyticsDemo = {
  averageScore: number;
  eligibleReportCount: number;
  excludedNote: string;
  distribution: Array<{ band: string; count: number }>;
  categoryAverages: Array<{ category: string; average: number; max: number }>;
  maturityBands: Array<{ band: string; percent: number }>;
  evidenceCoverageAverage: number;
  scoringVersion: string;
};

export type CtaAnalyticsDemo = {
  reportViews: number;
  ctaClicks: number;
  bookingPageVisits: number;
  confirmedBookings: number;
  reportToCtaRatePercent: number;
  note: string;
  weeklyActivity: Array<{ label: string; views: number; clicks: number }>;
};
