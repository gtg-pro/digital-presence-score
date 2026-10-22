import { SiteLogo } from "@/components/shared/site-logo";
import { Badge } from "@/components/ui/badge";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

export function ReportHeader({
  report,
  showDemoBadge,
}: {
  report: DigitalPresenceReport;
  /** Defaults to report.isDemo — live reports must not show demo badges. */
  showDemoBadge?: boolean;
}) {
  const demo = showDemoBadge ?? report.isDemo;
  return (
    <header className="rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SiteLogo width={160} className="max-w-[10rem] sm:max-w-[12rem]" />
        <div className="flex flex-wrap items-center gap-2">
          {demo ? <Badge variant="demo">Sample Report</Badge> : null}
          <Badge variant="outline">{report.statusLabel}</Badge>
        </div>
      </div>

      <p className="mt-6 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        Digital Presence Audit Report
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        {report.businessName}
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        {report.website ?? "Website URL submitted for assessment"}
      </p>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetaItem label="Assessment date" value={report.auditDateLabel} />
      </dl>
    </header>
  );
}

function MetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
