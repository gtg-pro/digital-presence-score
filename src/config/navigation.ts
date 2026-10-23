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
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

/** Mid-page Ready to Build CTA band (landing). */
export const readyToBuildCta = {
  heading: "Ready to see how your business performs online?",
  primaryLabel: "Get My Free Report Card",
  primaryHref: "/#home",
  secondaryLabel: "Call Now",
} as const;

const brandHome = "https://goodtogo.pro/";
const brandContact = "https://goodtogo.pro/contact-us/";

/** Baqi Digital footer columns (Figma footer). */
export const footerBrand = {
  logoSrc:
    "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1770303568/Logo_1_gr6aag.svg",
  logoAlt: "Baqi Digital",
  tagline:
    "Modern marketing systems engineered for growth. Serving North American service businesses.",
  copyrightName: "Baqi Digital",
  decorativeSrc:
    "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1792734979/27472512_1332_2_isrbig.svg",
} as const;

export const footerLinkColumns: { title: string; links: NavItem[] }[] = [
  {
    title: "Services",
    links: [
      { label: "Paid Ads Systems", href: brandHome },
      { label: "SEO Systems", href: brandHome },
      { label: "Funnels & Landing Pages", href: brandHome },
      { label: "CRM Systems & Automations", href: brandHome },
      { label: "Analytics & Attribution", href: brandHome },
      { label: "Advisory Services", href: brandHome },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Legal", href: brandHome },
      { label: "Real Estate", href: brandHome },
      { label: "Beauty & Esthetics", href: brandHome },
      { label: "Medical & Wellness", href: brandHome },
      { label: "Home Services & Trades", href: brandHome },
      { label: "Automotive", href: brandHome },
      { label: "E-Commerce", href: brandHome },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: brandHome },
      { label: "Services", href: brandHome },
      { label: "Industries", href: brandHome },
      { label: "Contact", href: brandContact },
    ],
  },
];
