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
  { label: "Assessment Methodology", href: "/methodology" },
];

export const footerLegalLinks: NavItem[] = [
  {
    label: "Terms of Services",
    href: "https://baqidigital.com/terms-of-service/",
  },
  {
    label: "Policies",
    href: "https://baqidigital.com/privacy-policy/",
  },
];

/** Mid-page Ready to Build CTA band (landing). */
export const readyToBuildCta = {
  heading: "Ready to see how your business performs online?",
  primaryLabel: "Get My Free Report Card",
  primaryHref: "/#home",
  secondaryLabel: "Call Now",
} as const;

/** Baqi Digital footer columns (Figma footer). */
export const footerBrand = {
  logoSrc:
    "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1770303568/Logo_1_gr6aag.svg",
  logoAlt: "Baqi Digital",
  logoHref: "https://baqidigital.com/",
  tagline:
    "Modern marketing systems engineered for growth. Serving North American service businesses.",
  copyrightName: "Baqi Digital",
  decorativeSrc:
    "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1792734979/27472512_1332_2_isrbig.svg",
  contactEmailHref: "mailto:info@baqidigital.com",
  contactPhoneHref: "tel:+16479437069",
} as const;

export const footerLinkColumns: { title: string; links: NavItem[] }[] = [
  {
    title: "Services",
    links: [
      {
        label: "Paid Ads Systems",
        href: "https://baqidigital.com/services/paid-ads-systems/",
      },
      {
        label: "SEO Systems",
        href: "https://baqidigital.com/services/seo-systems/",
      },
      {
        label: "Funnels & Landing Pages",
        href: "https://baqidigital.com/services/funnels-and-landing-pages/",
      },
      {
        label: "CRM Systems & Automations",
        href: "https://baqidigital.com/services/crm-systems-automations/",
      },
      {
        label: "Analytics & Attribution",
        href: "https://baqidigital.com/services/analytics-attribution/",
      },
      {
        label: "Advisory Services",
        href: "https://baqidigital.com/services/advisory-services/",
      },
    ],
  },
  {
    title: "Industries",
    links: [
      {
        label: "Legal",
        href: "https://baqidigital.com/industries/legal/",
      },
      {
        label: "Real Estate",
        href: "https://baqidigital.com/industries/real-estate/",
      },
      {
        label: "Beauty & Esthetics",
        href: "https://baqidigital.com/industries/beauty-esthetics/",
      },
      {
        label: "Medical & Wellness",
        href: "https://baqidigital.com/industries/medical-wellness/",
      },
      {
        label: "Home Services & Trades",
        href: "https://baqidigital.com/industries/home-services-trades/",
      },
      {
        label: "Automotive",
        href: "https://baqidigital.com/industries/automotive/",
      },
      {
        label: "E-Commerce",
        href: "https://baqidigital.com/industries/e-commerce/",
      },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "https://baqidigital.com/about/" },
      { label: "Services", href: "https://baqidigital.com/services/" },
      { label: "Industries", href: "https://baqidigital.com/industries/" },
      { label: "Contact", href: "https://baqidigital.com/contact-us/" },
    ],
  },
];
