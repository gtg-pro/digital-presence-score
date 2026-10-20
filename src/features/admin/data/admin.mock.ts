import { scoringCategories } from "@/config/scoring";
import type {
  AdminActivityEvent,
  AdminAudit,
  AdminEmailRecord,
  AdminKpi,
  AdminReport,
  AdminReviewItem,
  AdminSubmission,
  CtaAnalyticsDemo,
  ScoreAnalyticsDemo,
} from "@/features/admin/types/admin.types";

export const adminDemoBanner =
  "Demo Environment — illustrative data only. Routes are not authenticated.";

export const overviewKpis: AdminKpi[] = [
  {
    id: "submissions",
    label: "Total Submissions",
    value: 248,
    hint: "Demo placeholder",
  },
  {
    id: "completed",
    label: "Completed Audits",
    value: 182,
    hint: "Demo placeholder",
  },
  {
    id: "partial",
    label: "Partial Audits",
    value: 41,
    hint: "Demo placeholder",
  },
  {
    id: "failed",
    label: "Failed Audits",
    value: 25,
    hint: "Demo placeholder",
  },
  {
    id: "reports",
    label: "Reports Generated",
    value: 223,
    hint: "Demo placeholder",
  },
  {
    id: "cta",
    label: "CTA Clicks",
    value: 67,
    hint: "Demo placeholder",
  },
];

export const auditActivityOverview = [
  { label: "Completed", value: 182 },
  { label: "In Progress", value: 14 },
  { label: "Partial", value: 41 },
  { label: "Failed", value: 25 },
] as const;

export const recentActivity: AdminActivityEvent[] = [
  {
    id: "act-1",
    title: "New submission received",
    detail: "Demo Plumbing Co submitted an assessment request.",
    occurredAtLabel: "2 hours ago",
  },
  {
    id: "act-2",
    title: "Audit completed",
    detail: "Complete audit finished for Demo HVAC Services.",
    occurredAtLabel: "5 hours ago",
  },
  {
    id: "act-3",
    title: "Partial audit generated",
    detail: "Limited evidence produced a Partial Audit for Demo Roofing LLC.",
    occurredAtLabel: "Yesterday",
  },
  {
    id: "act-4",
    title: "Report email delivered",
    detail: "Demo delivery event recorded for report DPRC-DEMO-COMPLETE-001.",
    occurredAtLabel: "Yesterday",
  },
  {
    id: "act-5",
    title: "Strategy Call CTA clicked",
    detail: "CTA click recorded from a demo report view (not a booking).",
    occurredAtLabel: "2 days ago",
  },
];

export const adminSubmissions: AdminSubmission[] = [
  {
    id: "SUB-1001",
    businessName: "Demo Plumbing Co",
    website: "demo-plumbing.example",
    industry: "Plumbing",
    email: "owner.demo@example.com",
    serviceArea: "Austin, TX",
    submittedAtLabel: "Mar 12, 2026",
    auditStatus: "completed",
    reportStatus: "Complete report ready",
    publicProfiles: ["https://maps.example/demo-plumbing"],
    consents: { terms: true, emailReport: true, marketing: false },
  },
  {
    id: "SUB-1002",
    businessName: "Demo HVAC Services",
    website: "demo-hvac.example",
    industry: "HVAC",
    email: "ops.demo@example.com",
    serviceArea: "Dallas, TX",
    submittedAtLabel: "Mar 11, 2026",
    auditStatus: "in_progress",
    reportStatus: "Pending generation",
    publicProfiles: [],
    consents: { terms: true, emailReport: false, marketing: false },
  },
  {
    id: "SUB-1003",
    businessName: "Demo Roofing LLC",
    website: "demo-roofing.example",
    industry: "Roofing",
    email: "hello.demo@example.com",
    serviceArea: "Houston, TX",
    submittedAtLabel: "Mar 10, 2026",
    auditStatus: "partial",
    reportStatus: "Partial report ready",
    publicProfiles: ["https://facebook.example/demo-roofing"],
    consents: { terms: true, emailReport: true, marketing: true },
  },
  {
    id: "SUB-1004",
    businessName: "Demo Legal Partners",
    website: null,
    industry: "Legal Services",
    email: "intake.demo@example.com",
    serviceArea: "Remote / online",
    submittedAtLabel: "Mar 9, 2026",
    auditStatus: "failed",
    reportStatus: "Limited snapshot only",
    publicProfiles: ["https://linkedin.example/demo-legal"],
    consents: { terms: true, emailReport: false, marketing: false },
  },
  {
    id: "SUB-1005",
    businessName: "Demo Cleaning Pros",
    website: "demo-cleaning.example",
    industry: "Cleaning",
    email: "team.demo@example.com",
    serviceArea: "San Antonio, TX",
    submittedAtLabel: "Mar 8, 2026",
    auditStatus: "pending",
    reportStatus: "Queued",
    publicProfiles: [],
    consents: { terms: true, emailReport: true, marketing: false },
  },
];

export const adminAudits: AdminAudit[] = [
  {
    id: "AUD-2001",
    businessName: "Demo Plumbing Co",
    createdAtLabel: "Mar 12, 2026",
    currentStage: "Report Generation",
    status: "completed",
    evidenceCoveragePercent: 92,
    scoringVersion: "strict-v1.0",
    stages: [
      { name: "Business Discovery", status: "completed" },
      { name: "Website Crawling", status: "completed" },
      { name: "Performance Analysis", status: "completed" },
      { name: "Public Trust Signals", status: "completed" },
      { name: "Scoring & Validation", status: "completed" },
      { name: "Report Generation", status: "completed" },
    ],
    evidenceSummary: "Homepage, service pages, and public trust signals reviewed.",
    unavailableChecks: ["Restricted Instagram profile"],
  },
  {
    id: "AUD-2002",
    businessName: "Demo HVAC Services",
    createdAtLabel: "Mar 11, 2026",
    currentStage: "Performance Analysis",
    status: "in_progress",
    evidenceCoveragePercent: 48,
    scoringVersion: "strict-v1.0",
    stages: [
      { name: "Business Discovery", status: "completed" },
      { name: "Website Crawling", status: "completed" },
      { name: "Performance Analysis", status: "in_progress" },
      { name: "Public Trust Signals", status: "pending" },
      { name: "Scoring & Validation", status: "pending" },
      { name: "Report Generation", status: "pending" },
    ],
    evidenceSummary: "Crawl complete; performance measurements in progress.",
    unavailableChecks: [],
  },
  {
    id: "AUD-2003",
    businessName: "Demo Roofing LLC",
    createdAtLabel: "Mar 10, 2026",
    currentStage: "Report Generation",
    status: "partial",
    evidenceCoveragePercent: 58,
    scoringVersion: "strict-v1.0",
    stages: [
      { name: "Business Discovery", status: "completed" },
      { name: "Website Crawling", status: "not_assessed" },
      { name: "Performance Analysis", status: "not_assessed" },
      { name: "Public Trust Signals", status: "completed" },
      { name: "Scoring & Validation", status: "completed" },
      { name: "Report Generation", status: "completed" },
    ],
    evidenceSummary: "Partial crawl; unavailable checks marked Not Assessed.",
    unavailableChecks: ["Full service-page crawl", "Performance measurement"],
  },
  {
    id: "AUD-2004",
    businessName: "Demo Legal Partners",
    createdAtLabel: "Mar 9, 2026",
    currentStage: "Website Crawling",
    status: "failed",
    evidenceCoveragePercent: 18,
    scoringVersion: "strict-v1.0",
    stages: [
      { name: "Business Discovery", status: "completed" },
      { name: "Website Crawling", status: "failed" },
      { name: "Performance Analysis", status: "pending" },
      { name: "Public Trust Signals", status: "pending" },
      { name: "Scoring & Validation", status: "pending" },
      { name: "Report Generation", status: "pending" },
    ],
    evidenceSummary: "Processing interrupted before crawl completed.",
    unavailableChecks: ["Website crawl"],
    errorDetail: "Demo failure: processing interrupted during website review.",
  },
];

export const adminReports: AdminReport[] = [
  {
    id: "DPRC-DEMO-COMPLETE-001",
    businessName: "Example Service Company",
    reportType: "complete",
    overallScore: 62,
    evidenceCoveragePercent: 92,
    generatedAtLabel: "Mar 12, 2026",
    shareStatus: "private",
    demoReportPath: "/report/demo-complete",
  },
  {
    id: "DPRC-DEMO-PARTIAL-002",
    businessName: "Example Service Company",
    reportType: "partial",
    overallScore: null,
    evidenceCoveragePercent: 58,
    generatedAtLabel: "Mar 10, 2026",
    shareStatus: "private",
    demoReportPath: "/report/demo-partial",
  },
  {
    id: "DPRC-DEMO-LIMITED-003",
    businessName: "Example Service Company",
    reportType: "limited",
    overallScore: null,
    evidenceCoveragePercent: 22,
    generatedAtLabel: "Mar 9, 2026",
    shareStatus: "revoked",
    demoReportPath: "/report/demo-limited",
  },
  {
    id: "DPRC-DEMO-COMPLETE-004",
    businessName: "Demo Plumbing Co",
    reportType: "complete",
    overallScore: 62,
    evidenceCoveragePercent: 92,
    generatedAtLabel: "Mar 8, 2026",
    shareStatus: "shared",
    demoReportPath: "/report/demo",
  },
];

export const scoreAnalyticsDemo: ScoreAnalyticsDemo = {
  averageScore: 62,
  eligibleReportCount: 2,
  excludedNote:
    "Partial audits and limited snapshots without an eligible overall score are excluded from averages.",
  distribution: [
    { band: "85–100", count: 0 },
    { band: "70–84", count: 0 },
    { band: "50–69", count: 2 },
    { band: "Below 50", count: 0 },
  ],
  categoryAverages: [
    { category: "Website Experience", average: 18, max: 25 },
    { category: "Local SEO Presence", average: 14, max: 25 },
    { category: "Reputation & Trust", average: 12, max: 20 },
    { category: "Content Authority", average: 8, max: 15 },
    { category: "Conversion Readiness", average: 10, max: 15 },
  ],
  maturityBands: [
    { band: "Digital Leader", percent: 0 },
    { band: "Growing Digital Presence", percent: 0 },
    { band: "Optimization Opportunity", percent: 100 },
    { band: "Foundation Opportunity", percent: 0 },
  ],
  evidenceCoverageAverage: 66,
  scoringVersion: "strict-v1.0",
};

export const emailKpis = [
  { label: "Total Emails", value: 140 },
  { label: "Queued", value: 8 },
  { label: "Sent", value: 22 },
  { label: "Delivered", value: 101 },
  { label: "Failed / Bounced", value: 9 },
] as const;

export const adminEmails: AdminEmailRecord[] = [
  {
    id: "EM-3001",
    recipient: "owner.demo@example.com",
    relatedReportId: "DPRC-DEMO-COMPLETE-001",
    status: "delivered",
    dateLabel: "Mar 12, 2026",
  },
  {
    id: "EM-3002",
    recipient: "hello.demo@example.com",
    relatedReportId: "DPRC-DEMO-PARTIAL-002",
    status: "sent",
    dateLabel: "Mar 10, 2026",
  },
  {
    id: "EM-3003",
    recipient: "ops.demo@example.com",
    relatedReportId: "DPRC-DEMO-COMPLETE-004",
    status: "queued",
    dateLabel: "Mar 11, 2026",
  },
  {
    id: "EM-3004",
    recipient: "team.demo@example.com",
    relatedReportId: "DPRC-DEMO-COMPLETE-004",
    status: "bounced",
    dateLabel: "Mar 7, 2026",
  },
];

export const ctaAnalyticsDemo: CtaAnalyticsDemo = {
  reportViews: 412,
  ctaClicks: 67,
  bookingPageVisits: 29,
  confirmedBookings: 0,
  reportToCtaRatePercent: 16,
  note: "CTA clicks are not confirmed bookings. Booking attribution is a future integration.",
  weeklyActivity: [
    { label: "Week 1", views: 90, clicks: 12 },
    { label: "Week 2", views: 110, clicks: 18 },
    { label: "Week 3", views: 98, clicks: 15 },
    { label: "Week 4", views: 114, clicks: 22 },
  ],
};

export const adminReviews: AdminReviewItem[] = [
  {
    id: "REV-4001",
    businessName: "Demo Roofing LLC",
    reportId: "DPRC-DEMO-PARTIAL-002",
    reason: "Requester believes a service page was missed during crawl.",
    evidenceReference: "Submitted URL list (demo)",
    originalResult: "Local SEO Presence — Not Assessed",
    proposedResult: "Local SEO Presence — Partially assessed (demo proposal)",
    status: "open",
  },
  {
    id: "REV-4002",
    businessName: "Demo Plumbing Co",
    reportId: "DPRC-DEMO-COMPLETE-001",
    reason: "Disputed mobile performance note.",
    evidenceReference: "Performance observation (demo)",
    originalResult: "Website Experience 18/25",
    proposedResult: "Website Experience 20/25 (demo proposal)",
    status: "in_review",
  },
];

export const adminSettingsDemo = {
  applicationName: "Digital Presence Score",
  brandingNote: "Using /images/logo.png across the application.",
  reportCtaText: "Book a Strategy Call",
  bookingDestination: "Booking URL placeholder — not connected",
  scoringVersion: "strict-v1.0",
  categoryWeights: scoringCategories.map((category) => ({
    category: category.title,
    max: category.maxPoints,
  })),
  senderName: "Digital Presence Score",
  senderEmail: "reports@example.com",
  adminProfile: {
    name: "Demo Administrator",
    role: "Super Admin (demo)",
    email: "admin.demo@example.com",
  },
};
