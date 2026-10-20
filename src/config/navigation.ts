export type NavItem = {
  label: string;
  href: string;
  /** When true, treated as a landing-page section hash link */
  isSection?: boolean;
};

/**
 * Primary marketing navigation.
 * Section hrefs target landing anchors for smooth scrolling once sections exist.
 */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/", isSection: false },
  { label: "How It Works", href: "/#how-it-works", isSection: true },
  { label: "What We Check", href: "/#what-we-check", isSection: true },
  { label: "Sample Report", href: "/#sample-report", isSection: true },
  { label: "FAQs", href: "/#faqs", isSection: true },
];

export const primaryCta = {
  label: "Get Free Report Card",
  href: "/audit",
} as const;

export const footerQuickLinks: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/#how-it-works", isSection: true },
  { label: "What We Check", href: "/#what-we-check", isSection: true },
  { label: "Sample Report", href: "/#sample-report", isSection: true },
  { label: "Get Free Report Card", href: "/audit" },
];

export const footerResourceLinks: NavItem[] = [
  { label: "FAQs", href: "/#faqs", isSection: true },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Assessment Methodology", href: "/methodology" },
];

export const footerLegalLinks: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export const footerCta = {
  heading: "Ready to understand your digital presence?",
  description: "Discover where your business stands and what you can improve.",
  label: "Get My Free Report",
  href: "/audit",
} as const;
