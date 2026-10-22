"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import type { DigitalPresenceReport } from "@/features/report/types/report.types";
import { cn } from "@/lib/cn";

export function MethodologySection({
  report,
}: {
  report: DigitalPresenceReport;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { methodology } = report;

  return (
    <section aria-labelledby="methodology-heading" className="space-y-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-background px-5 py-4 text-left shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <h2
          id="methodology-heading"
          className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          How this report was prepared
        </h2>
        <ChevronDown
          className={cn("size-5 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="rounded-xl border border-border bg-background p-5 shadow-sm sm:p-6"
      >
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-medium text-foreground">Framework</dt>
            <dd className="mt-1 text-muted-foreground">{methodology.frameworkSummary}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Assessment scope</dt>
            <dd className="mt-1 text-muted-foreground">{methodology.assessmentScope}</dd>
          </div>
          {methodology.limitations.length > 0 ? (
            <div>
              <dt className="font-medium text-foreground">Notes</dt>
              <dd className="mt-1 text-muted-foreground">
                {methodology.limitations[0]}
              </dd>
            </div>
          ) : null}
          {methodology.sources.length > 0 ? (
            <div>
              <dt className="font-medium text-foreground">Sources reviewed</dt>
              <dd className="mt-1">
                <ul className="space-y-1 text-muted-foreground">
                  {methodology.sources.map((source) => (
                    <li key={source.id}>{source.label}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
          {methodology.disclaimer}
        </p>
      </div>
    </section>
  );
}
