import { DM_Sans, Inter, Karla } from "next/font/google";
import localFont from "next/font/local";

/**
 * Brand typography roles:
 * - Titles (Satoshi) — hero titles, section titles, badge labels
 * - Headings / body copy (Inter) — supporting text, nav, placeholders
 * - Buttons / FAQ-footer body (Karla) — CTAs and secondary copy
 * - Legal / meta (DM Sans) — copyright bar
 */
export const fontSatoshi = localFont({
  src: [
    {
      path: "../../public/fonts/satoshi/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const fontKarla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

export const fontDmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});
