import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const badgeVariants = {
  default: "border-border bg-muted text-foreground",
  outline: "border-foreground/20 bg-background text-foreground",
  demo: "border-foreground/25 bg-foreground text-background",
} as const;

export type BadgeVariant = keyof typeof badgeVariants;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
