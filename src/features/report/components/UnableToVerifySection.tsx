import { CircleDashed } from "lucide-react";

import type { DigitalPresenceReport } from "@/features/report/types/report.types";

export function UnableToVerifySection({
  report,
}: {
  report: DigitalPresenceReport;
}) {
  if (report.unableToVerify.length === 0) return null;

  return (
    <section aria-labelledby="unable-heading" className="space-y-5">
      <div>
        <h2
          id="unable-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Unable to verify
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Not Assessed does not automatically mean the business failed the check.
        </p>
      </div>
      <ul className="space-y-3">
        {report.unableToVerify.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-xl border border-dashed border-border bg-background p-5"
          >
            <CircleDashed
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
