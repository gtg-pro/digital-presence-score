import { LoaderCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AuditProgressSnapshot } from "@/features/audit/types/audit-progress.types";
import { cn } from "@/lib/cn";

export type AuditProgressStatusCardProps = {
  snapshot: AuditProgressSnapshot;
};

/**
 * Single-row progress status for the audit progress screen.
 * Stream/stage logic stays in the hook; this is presentation only.
 */
export function AuditProgressStatusCard({
  snapshot,
}: AuditProgressStatusCardProps) {
  const inProgress = snapshot.outcome === "in_progress";
  const failed = snapshot.outcome === "failed";

  const title = inProgress
    ? "Your website audit is in progress..."
    : snapshot.headline;

  const detail = inProgress
    ? "We're analyzing available website information and preparing your Digital Presence Report."
    : snapshot.summary

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 rounded-xl border border-border bg-background px-5 py-5 sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-6",
        failed && "border-foreground/40",
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-audit-outcome={snapshot.outcome}
      data-audit-progress-active={inProgress ? "yes" : "no"}
    >
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background",
          failed && "border-foreground/50",
        )}
        aria-hidden="true"
      >
        {inProgress ? (
          <LoaderCircle className="size-5 animate-spin text-foreground" />
        ) : (
          <span className="size-2.5 rounded-full bg-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {snapshot.isDemo ? <Badge variant="demo">Demo</Badge> : null}
          <Badge variant="outline">
            {failed ? "Failed" : inProgress ? "In progress" : snapshot.label}
          </Badge>
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {detail}
        </p>
        {failed && snapshot.errorMessage ? (
          <p className="mt-2 text-sm text-foreground">{snapshot.errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
