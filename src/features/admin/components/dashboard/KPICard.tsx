import type { AdminKpi } from "@/features/admin/types/admin.types";

export function KPICard({ kpi }: { kpi: AdminKpi }) {
  return (
    <article className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {kpi.label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {kpi.value.toLocaleString()}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{kpi.hint}</p>
    </article>
  );
}
