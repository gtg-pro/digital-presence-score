/** PDF-only visual theme matching audit_header_footer_template.pdf */

export const PDF_THEME = {
  black: "#000000",
  sky: "#38BDF8",
  skyBright: "#0EA5E9",
  white: "#FFFFFF",
  darkGray: "#111827",
  mutedGray: "#6B7280",
  headerMuted: "#D4D4D8",
  bodyText: "#111827",
  softBorder: "#E5E7EB",
  cardBg: "#FFFFFF",
  contactUrl: "https://goodtogo.pro/contact-us/",
} as const;

/**
 * Side margins are 0 so footer chrome can span the full page width.
 * Top margin stays 0 in Playwright so page 1 can sit flush; pages 2+ get
 * top spacing via CSS `@page` (see report-renderer).
 * Bottom margin reserves space for the repeating footer.
 */
export const PDF_MARGIN = {
  top: "0",
  right: "0",
  bottom: "22mm",
  left: "0",
} as const;

/** Top spacing for pages after the first (CSS `@page`, not Playwright margin). */
export const PDF_CONTINUATION_PAGE_TOP_MARGIN = "14mm";

/** Horizontal inset for PDF body content (matches prior ~12mm side margins). */
export const PDF_BODY_SIDE_PADDING = "28px";
