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
          Report methodology
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
            <dt className="font-medium text-foreground">Scoring version</dt>
            <dd className="mt-1 font-mono text-muted-foreground">
              {methodology.scoringVersion}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Assessment scope</dt>
            <dd className="mt-1 text-muted-foreground">{methodology.assessmentScope}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Evidence coverage</dt>
            <dd className="mt-1 text-muted-foreground">
              {methodology.evidenceCoverageNote}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Limitations</dt>
            <dd className="mt-1">
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {methodology.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Sources & observation dates</dt>
            <dd className="mt-1">
              <ul className="space-y-1 text-muted-foreground">
                {methodology.sources.map((source) => (
                  <li key={source.id}>
                    {source.label} — {source.observedAtLabel}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">
              Partial and limited results
            </dt>
            <dd className="mt-1 text-muted-foreground">
              {methodology.partialAndLimitedExplanation}
            </dd>
          </div>
        </dl>
        <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
          {methodology.disclaimer}
        </p>
      </div>
    </section>
  );
}
