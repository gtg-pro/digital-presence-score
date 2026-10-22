import type { DigitalPresenceReport } from "@/features/report/types/report.types";

export function ActionPlanSection({
  report,
}: {
  report: DigitalPresenceReport;
}) {
  if (report.actionPlan.length === 0) return null;

  return (
    <section aria-labelledby="next-steps-heading" className="space-y-5">
      <div>
        <h2
          id="next-steps-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Suggested next steps
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A practical sequence of improvements tailored to this website.
        </p>
      </div>
      <ol className="space-y-3">
        {report.actionPlan.map((item, index) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-background p-5"
          >
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Step {index + 1}
            </p>
            <p className="mt-1 text-base font-medium text-foreground">
              {item.action}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
