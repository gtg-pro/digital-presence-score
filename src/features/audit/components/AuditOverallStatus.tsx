import { Badge } from "@/components/ui/badge";
import type {
  AuditOverallOutcome,
  AuditProgressSnapshot,
} from "@/features/audit/types/audit-progress.types";
import { cn } from "@/lib/cn";

const outcomeMeta: Record<AuditOverallOutcome, { label: string }> = {
  in_progress: { label: "In progress" },
  completed: { label: "Completed" },
  partial: { label: "Partial audit" },
  failed: { label: "Failed" },
};

export type AuditOverallStatusProps = {
  snapshot: AuditProgressSnapshot;
};

export function AuditOverallStatus({ snapshot }: AuditOverallStatusProps) {
  const meta = outcomeMeta[snapshot.outcome];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background px-5 py-5 sm:px-6",
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-wrap items-center gap-2">
        {snapshot.isDemo ? <Badge variant="demo">Demo</Badge> : null}
        <Badge variant="outline">{snapshot.label}</Badge>
      </div>
      <p className="mt-4 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        Overall status
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {snapshot.headline}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">{meta.label}.</span>{" "}
        {snapshot.summary}
      </p>
    </div>
  );
}
