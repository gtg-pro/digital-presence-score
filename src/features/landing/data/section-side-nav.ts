export type SectionSideNavItem = {
  id: string;
  label: string;
  href: string;
};

/** Left sticky section nav (How It Works → FAQs). */
export const sectionSideNavItems: SectionSideNavItem[] = [
  { id: "how-it-works", label: "How It Works", href: "#how-it-works" },
  { id: "what-we-check", label: "What We Check", href: "#what-we-check" },
  { id: "sample-report", label: "Sample Report", href: "#sample-report" },
  { id: "why-it-matters", label: "Why It Matters", href: "#why-it-matters" },
  { id: "faqs", label: "FAQs", href: "#faqs" },
];
