import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

export type SiteLogoProps = {
  className?: string;
  /**
   * Logo asset is dark artwork.
   * Use `onLight` (default) as-is on white backgrounds.
   * Use `onDark` to invert on black/inverted surfaces.
   */
  surface?: "onLight" | "onDark";
  /**
   * Intrinsic height for Next/Image aspect ratio (not a CSS override).
   * Prefer Tailwind classes in `className` for on-screen size.
   */
  height?: number;
  /**
   * Intrinsic width for Next/Image aspect ratio (not a CSS override).
   * Prefer Tailwind classes in `className` for on-screen size.
   */
  width?: number;
  priority?: boolean;
};

const SOURCE_WIDTH = 507;
const SOURCE_HEIGHT = 202;

export function SiteLogo({
  className,
  surface = "onLight",
  height,
  width,
  priority = false,
}: SiteLogoProps) {
  const resolvedWidth =
    width ??
    Math.round(((height ?? 32) * SOURCE_WIDTH) / SOURCE_HEIGHT);
  const resolvedHeight =
    height ??
    Math.round((resolvedWidth * SOURCE_HEIGHT) / SOURCE_WIDTH);

  return (
    <Image
      src={siteConfig.logoSrc}
      alt={siteConfig.name}
      width={resolvedWidth}
      height={resolvedHeight}
      priority={priority}
      sizes="(max-width: 640px) 70vw, 352px"
      className={cn(
        // Display size must come from CSS so Tailwind wins in every environment.
        // Do not set width/height/maxHeight inline — inline styles override
        // utility classes and caused Netlify logos to ignore h-* / max-w-*.
        "h-auto w-auto max-w-full object-contain",
        surface === "onDark" && "invert",
        className,
      )}
    />
  );
}
