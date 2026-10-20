"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import type { ReportCategoryResult } from "@/features/report/types/report.types";
import { cn } from "@/lib/cn";

const statusLabel = {
  assessed: "Assessed",
  partially_assessed: "Partially assessed",
  not_assessed: "Not assessed",
} as const;

export function CategoryScoreCard({
  category,
}: {
  category: ReportCategoryResult;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const hasScore = category.earned !== null;
  const percent = hasScore
    ? Math.round((category.earned! / category.maxPoints) * 100)
    : 0;

  return (
    <article className="rounded-xl border border-border bg-background p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {category.title}
          </h3>
          <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Status: {statusLabel[category.status]}
          </p>
        </div>
        <p className="font-mono text-sm font-semibold text-foreground">
          {hasScore ? `${category.earned}/${category.maxPoints}` : `—/${category.maxPoints}`}
        </p>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
        role={hasScore ? "progressbar" : undefined}
        aria-valuenow={hasScore ? category.earned! : undefined}
        aria-valuemin={0}
        aria-valuemax={category.maxPoints}
        aria-label={
          hasScore
            ? `${category.title}: ${category.earned} of ${category.maxPoints}`
            : `${category.title}: not assessed`
        }
      >
        <div
          className={cn(
            "h-full rounded-full bg-foreground",
            !hasScore && "w-0 bg-transparent",
          )}
          style={hasScore ? { width: `${percent}%` } : undefined}
        />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {category.summary}
      </p>

      {category.findings.length > 0 ? (
        <div className="mt-4">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "inline-flex items-center gap-2 text-sm font-medium text-foreground",
              "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            Supporting findings
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </button>
          <div id={panelId} hidden={!open} className="mt-3 space-y-3">
            {category.findings.map((finding) => (
              <div key={finding.id} className="rounded-lg border border-border px-3 py-3">
                <p className="text-sm font-medium text-foreground">{finding.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{finding.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
