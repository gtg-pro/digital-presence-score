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
  /** Visual height in pixels; width scales from the source aspect ratio. */
  height?: number;
  /** Visual width in pixels; height scales when height is omitted. */
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
      sizes={`${resolvedWidth}px`}
      style={{
        width: resolvedWidth,
        height: "auto",
        maxHeight: resolvedHeight,
      }}
      className={cn(
        "object-contain",
        surface === "onDark" && "invert",
        className,
      )}
    />
  );
}
