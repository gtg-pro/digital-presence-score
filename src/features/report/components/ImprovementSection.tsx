import { CircleAlert } from "lucide-react";

import type {
  DigitalPresenceReport,
  IssueSeverity,
} from "@/features/report/types/report.types";
import { cn } from "@/lib/cn";

const severityLabel: Record<IssueSeverity, string> = {
  high: "High severity",
  medium: "Medium severity",
  low: "Low severity",
};

export function ImprovementSection({
  report,
}: {
  report: DigitalPresenceReport;
}) {
  if (report.improvements.length === 0) return null;

  return (
    <section aria-labelledby="improvements-heading" className="space-y-5">
      <div>
        <h2
          id="improvements-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Improvement opportunities
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Prioritized illustrative issues for this demo fixture.
        </p>
      </div>
      <ul className="space-y-4">
        {report.improvements.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-background p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <CircleAlert
                  className="mt-0.5 size-5 shrink-0 text-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-base font-semibold text-foreground">
                  {item.title}
                </h3>
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-md border border-border px-2 py-1 text-xs font-medium tracking-wide text-foreground",
                )}
              >
                {severityLabel[item.severity]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
            <p className="mt-2 text-sm text-foreground">
              <span className="font-medium">Why it matters:</span>{" "}
              <span className="text-muted-foreground">{item.whyItMatters}</span>
            </p>
            {item.evidenceLabel ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Evidence: {item.evidenceLabel}
              </p>
            ) : null}
            <p className="mt-3 text-sm font-medium text-foreground">
              Next action:{" "}
              <span className="font-normal text-muted-foreground">
                {item.recommendedAction}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
