import {
  AlertTriangle,
  Check,
  Circle,
  CircleDashed,
  LoaderCircle,
  Minus,
} from "lucide-react";

import { auditProgressStageDefinitions } from "@/features/audit/data/audit-progress.mock";
import type {
  AuditProgressStageState,
  AuditStageStatus,
} from "@/features/audit/types/audit-progress.types";
import { cn } from "@/lib/cn";

const statusPresentation: Record<
  AuditStageStatus,
  {
    label: string;
    StatusIcon: typeof Check;
    iconClassName: string;
    rowClassName: string;
  }
> = {
  pending: {
    label: "Pending",
    StatusIcon: Circle,
    iconClassName: "text-muted-foreground",
    rowClassName: "border-border opacity-80",
  },
  in_progress: {
    label: "In progress",
    StatusIcon: LoaderCircle,
    iconClassName: "animate-spin text-foreground",
    rowClassName: "border-foreground",
  },
  completed: {
    label: "Completed",
    StatusIcon: Check,
    iconClassName: "text-foreground",
    rowClassName: "border-border",
  },
  not_assessed: {
    label: "Not assessed",
    StatusIcon: Minus,
    iconClassName: "text-muted-foreground",
    rowClassName: "border-dashed border-border",
  },
  failed: {
    label: "Failed",
    StatusIcon: AlertTriangle,
    iconClassName: "text-foreground",
    rowClassName: "border-foreground/60",
  },
};

export type AuditProgressStepProps = {
  stage: AuditProgressStageState;
  isLast?: boolean;
};

export function AuditProgressStep({ stage, isLast }: AuditProgressStepProps) {
  const definition = auditProgressStageDefinitions.find(
    (item) => item.id === stage.id,
  );

  if (!definition) return null;

  const presentation = statusPresentation[stage.status];
  const StageIcon = definition.icon;
  const StatusIcon = presentation.StatusIcon;

  return (
    <li
      className="relative flex gap-4 pb-8 last:pb-0"
      data-stage-id={stage.id}
      data-stage-status={stage.status}
    >
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute top-12 bottom-0 left-5 w-px bg-border"
        />
      ) : null}

      <div
        className={cn(
          "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border bg-background",
          presentation.rowClassName,
        )}
      >
        {stage.status === "pending" ? (
          <CircleDashed className="size-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <StageIcon className="size-4 text-foreground" aria-hidden="true" />
        )}
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 rounded-xl border bg-background px-4 py-4 sm:px-5",
          presentation.rowClassName,
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {definition.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {definition.description}
            </p>
          </div>

          <p
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium tracking-wide text-foreground",
            )}
          >
            <StatusIcon
              className={cn("size-3.5", presentation.iconClassName)}
              aria-hidden="true"
            />
            <span>{presentation.label}</span>
          </p>
        </div>

        {stage.detail ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {stage.detail}
          </p>
        ) : null}

        <span className="sr-only">
          {definition.title}: {presentation.label}
          {stage.detail ? `. ${stage.detail}` : ""}
        </span>
      </div>
    </li>
  );
}
