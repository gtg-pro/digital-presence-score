import { SiteLogo } from "@/components/shared/site-logo";
import { Badge } from "@/components/ui/badge";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

export function ReportHeader({ report }: { report: DigitalPresenceReport }) {
  return (
    <header className="rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SiteLogo width={160} className="max-w-[10rem] sm:max-w-[12rem]" />
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="demo">Demo Report</Badge>
          <Badge variant="outline">{report.statusLabel}</Badge>
        </div>
      </div>

      <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        {report.businessName}
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        {report.website ?? "Website not confidently verified"}
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetaItem
          label="Service area"
          value={`${report.serviceArea} (${report.serviceAreaSource === "verified" ? "verified" : "user-supplied"})`}
        />
        <MetaItem label="Audit date" value={report.auditDateLabel} />
        <MetaItem label="Report ID" value={report.reportId} mono />
        <MetaItem label="Scoring version" value={report.scoringVersion} mono />
        <MetaItem label="Report status" value={report.statusLabel} />
        <MetaItem
          label="Evidence coverage"
          value={`${report.evidenceCoveragePercent}%`}
        />
      </dl>
    </header>
  );
}

function MetaItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-1 font-mono text-sm text-foreground"
            : "mt-1 text-sm font-medium text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}
