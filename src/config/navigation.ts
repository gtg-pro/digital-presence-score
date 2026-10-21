export type NavItem = {
  label: string;
  href: string;
  /** When true, treated as a landing-page section hash link */
  isSection?: boolean;
};

/**
 * Primary marketing navigation.
 * Section hrefs target landing anchors for smooth scrolling.
 */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/", isSection: false },
  { label: "Process", href: "/#how-it-works", isSection: true },
  { label: "Criteria", href: "/#what-we-check", isSection: true },
  { label: "Importance", href: "/#why-it-matters", isSection: true },
  { label: "Sample Report", href: "/#sample-report", isSection: true },
  { label: "FAQs", href: "/#faqs", isSection: true },
];

/** Top-right navbar button (black) — scrolls to footer contact CTA. */
export const primaryCta = {
  label: "Contact",
  href: "/#contact",
} as const;

export const footerQuickLinks: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/#how-it-works", isSection: true },
  { label: "What We Check", href: "/#what-we-check", isSection: true },
  { label: "Why It Matters", href: "/#why-it-matters", isSection: true },
  { label: "Sample Report", href: "/#sample-report", isSection: true },
  { label: "Contact", href: "/#contact", isSection: true },
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
  heading: "Ready to see how your business performs online?",
  description:
    "Get a clear digital-presence assessment with practical findings and recommendations based on available public evidence for your business.",
  label: "Get My Free Report Card",
  href: "/#home",
  secondaryLabel: "See How It Works",
  secondaryHref: "/#how-it-works",
} as const;
