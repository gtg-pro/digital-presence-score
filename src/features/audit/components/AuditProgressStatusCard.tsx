import { LoaderCircle } from "lucide-react";

import { ConicBorderPill } from "@/components/shared/conic-border-pill";
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
    : snapshot.summary;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-[#0F1114] p-10 font-title sm:flex-row sm:items-center sm:gap-5",
        failed && "border-white/25",
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-audit-outcome={snapshot.outcome}
      data-audit-progress-active={inProgress ? "yes" : "no"}
    >
      <div className="flex w-full items-start gap-4 sm:items-center sm:gap-5">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full"
          aria-hidden="true"
        >
          {inProgress ? (
            <LoaderCircle className="size-5 animate-spin text-white" />
          ) : (
            <span className="size-2.5 rounded-full bg-white" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {snapshot.isDemo ? (
              <Badge
                variant="outline"
                className="rounded-full border-white/70 bg-transparent px-3 py-1 text-xs text-white"
              >
                Demo
              </Badge>
            ) : null}
            {inProgress || failed ? (
              <ConicBorderPill labelClassName="px-3 py-1 font-title text-xs font-medium leading-normal sm:text-xs lg:text-xs">
                {failed ? "Failed" : "In Progress"}
              </ConicBorderPill>
            ) : (
              <Badge
                variant="outline"
                className="rounded-full border-white/70 bg-transparent px-3 py-1 text-xs font-medium text-white"
              >
                {snapshot.label}
              </Badge>
            )}
          </div>

          <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            {title}
          </h2>
          <p className="mt-1.5 font-heading text-sm leading-relaxed text-[#9EA5B3]">
            {detail}
          </p>
          {failed && snapshot.errorMessage ? (
            <p className="mt-2 font-title text-sm text-white">
              {snapshot.errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
