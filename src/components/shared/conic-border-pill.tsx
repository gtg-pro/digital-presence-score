import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ConicBorderPillProps = {
  children: ReactNode;
  className?: string;
  /** Classes for the inner label span. */
  labelClassName?: string;
};

/**
 * Pill with conic-gradient ring (Baqi heading reference).
 * Outer + inner use #0a0a0a so the border reads clearly on dark heroes.
 */
export function ConicBorderPill({
  children,
  className,
  labelClassName,
}: ConicBorderPillProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-[50px] border-none bg-[#0a0a0a] px-[2px] py-[2px]",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[50px] before:p-px before:content-['']",
        "before:[background:conic-gradient(from_180deg_at_50%_50%,rgba(37,99,235,0)_9%,rgba(37,99,235,1)_60%,rgba(37,99,235,0.21)_84%)]",
        "before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]",
        "before:[-webkit-mask-composite:xor] before:[mask-composite:exclude]",
        className,
      )}
    >
      <span
        className={cn(
          "relative z-10 rounded-full bg-[#0a0a0a] px-4 py-2 text-center text-sm leading-[25.2px] font-bold text-white sm:text-base lg:text-lg",
          labelClassName,
        )}
      >
        {children}
      </span>
    </div>
  );
}
