import { CheckCircle2 } from "lucide-react";

import type { DigitalPresenceReport } from "@/features/report/types/report.types";

export function StrengthsSection({ report }: { report: DigitalPresenceReport }) {
  if (report.strengths.length === 0) return null;

  return (
    <section aria-labelledby="strengths-heading" className="space-y-5">
      <div>
        <h2
          id="strengths-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Key strengths
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Illustrative, evidence-supported strengths for this demo fixture.
        </p>
      </div>
      <ul className="space-y-4">
        {report.strengths.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-xl border border-border bg-background p-5 shadow-sm"
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" aria-hidden="true" />
            <div>
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.explanation}
              </p>
              {item.evidenceLabel ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Evidence: {item.evidenceLabel}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
