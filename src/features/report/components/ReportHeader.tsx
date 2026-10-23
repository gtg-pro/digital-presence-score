import { ConicBorderPill } from "@/components/shared/conic-border-pill";
import { Badge } from "@/components/ui/badge";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

/** Strip a trailing clock time if present (e.g. "Oct 22, 2026, 12:34 PM"). */
function toAuditDateOnly(label: string): string {
  return label
    .replace(/,?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\b/i, "")
    .replace(/\s+at\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\b/i, "")
    .trim();
}

export function ReportHeader({
  report,
  showDemoBadge,
}: {
  report: DigitalPresenceReport;
  /** Defaults to report.isDemo — live reports must not show demo badges. */
  showDemoBadge?: boolean;
}) {
  const demo = showDemoBadge ?? report.isDemo;
  const serviceArea =
    report.serviceArea.trim() &&
    report.serviceArea.trim().toLowerCase() !== "not specified"
      ? report.serviceArea.trim()
      : "";
  const locationLine = [serviceArea, report.website]
    .filter(Boolean)
    .join(" | ");
  const auditDate = toAuditDateOnly(report.auditDateLabel);

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="font-title text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
          {report.businessName}
        </h1>
        {locationLine ? (
          <p className="mt-2 font-heading text-sm text-[#9EA5B3] sm:text-base">
            {locationLine}
          </p>
        ) : null}
        <dl className="mt-5 font-heading">
          <div>
            <dt className="text-[11px] font-medium tracking-[0.12em] text-[#9EA5B3] uppercase">
              Assessment date
            </dt>
            <dd className="mt-1 text-sm text-[#C4C9D4]">{auditDate}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {demo ? (
          <Badge
            variant="outline"
            className="rounded-full border-white/70 bg-transparent px-3 py-1 text-xs text-white"
          >
            Sample Report
          </Badge>
        ) : null}
        <ConicBorderPill labelClassName="px-4 py-1.5 font-title text-xs font-medium leading-normal sm:text-xs lg:text-xs">
          Digital Presence Report
        </ConicBorderPill>
      </div>
    </header>
  );
}
