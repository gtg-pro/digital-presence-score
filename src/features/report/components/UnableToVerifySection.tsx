import type { DigitalPresenceReport } from "@/features/report/types/report.types";

/**
 * Customer-facing assessment scope note.
 * Shows at most one concise limitation explanation — never raw diagnostic codes.
 */
export function UnableToVerifySection({
  report,
}: {
  report: DigitalPresenceReport;
}) {
  if (report.unableToVerify.length === 0) return null;

  const item = report.unableToVerify[0];

  return (
    <section aria-labelledby="scope-heading" className="space-y-3">
      <h2
        id="scope-heading"
        className="text-2xl font-semibold tracking-tight text-foreground"
      >
        Assessment scope
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
    </section>
  );
}
