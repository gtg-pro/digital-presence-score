import type { AdminNavItem } from "@/features/admin/types/admin.types";

export const adminNavItems: AdminNavItem[] = [
  { label: "Overview", href: "/admin", icon: "overview" },
  {
    label: "Businesses & Submissions",
    href: "/admin/submissions",
    icon: "submissions",
  },
  { label: "Audit Management", href: "/admin/audits", icon: "audits" },
  { label: "Reports", href: "/admin/reports", icon: "reports" },
  { label: "Score Analytics", href: "/admin/analytics/scores", icon: "scores" },
  { label: "Email Activity", href: "/admin/emails", icon: "emails" },
  { label: "CTA Analytics", href: "/admin/analytics/cta", icon: "cta" },
  {
    label: "Review & Corrections",
    href: "/admin/reviews",
    icon: "reviews",
  },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];
