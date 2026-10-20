"use client";

import { reportDemoOptions } from "@/features/report/data/report.mock";
import type { ReportDemoKey } from "@/features/report/types/report.types";
import { cn } from "@/lib/cn";

export type ReportDemoStateSelectorProps = {
  value: ReportDemoKey;
  onChange: (value: ReportDemoKey) => void;
};

/** Development preview control — not a live audit action. */
export function ReportDemoStateSelector({
  value,
  onChange,
}: ReportDemoStateSelectorProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-4">
      <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        Demo preview control
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Switch illustrative report outcomes for frontend review. This does not
        run an assessment or load real business data.
      </p>
      <div
        className="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label="Demo report outcome"
      >
        {reportDemoOptions.map((option) => {
          const selected = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.key)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/30",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
