"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

export function ActionPlanSection({
  report,
}: {
  report: DigitalPresenceReport;
}) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  if (report.actionPlan.length === 0) return null;

  return (
    <section aria-labelledby="action-plan-heading" className="space-y-5">
      <div>
        <h2
          id="action-plan-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          30-day action plan
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Prioritized checklist for this demo. Checkboxes are local UI only and
          are not saved. Effort and impact are qualitative — not revenue
          forecasts.
        </p>
      </div>

      <ul className="space-y-3">
        {report.actionPlan.map((item) => {
          const checked = Boolean(completed[item.id]);
          const inputId = `action-${item.id}`;

          return (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-background p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={inputId}
                  checked={checked}
                  onChange={(event) =>
                    setCompleted((current) => ({
                      ...current,
                      [item.id]: event.target.checked,
                    }))
                  }
                />
                <div className="min-w-0 flex-1">
                  <Label
                    htmlFor={inputId}
                    className="text-base font-medium leading-snug"
                  >
                    {item.action}
                  </Label>
                  <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <div>
                      <dt className="inline font-medium text-foreground">Priority:</dt>{" "}
                      <dd className="inline capitalize">{item.priority}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-foreground">Effort:</dt>{" "}
                      <dd className="inline capitalize">{item.effort}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-foreground">Impact:</dt>{" "}
                      <dd className="inline capitalize">{item.impact}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
