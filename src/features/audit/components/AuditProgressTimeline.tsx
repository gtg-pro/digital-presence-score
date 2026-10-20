import type { AuditProgressStageState } from "@/features/audit/types/audit-progress.types";

import { AuditProgressStep } from "./AuditProgressStep";

export type AuditProgressTimelineProps = {
  stages: AuditProgressStageState[];
};

export function AuditProgressTimeline({ stages }: AuditProgressTimelineProps) {
  return (
    <ol className="list-none p-0" aria-label="Assessment progress stages">
      {stages.map((stage, index) => (
        <AuditProgressStep
          key={stage.id}
          stage={stage}
          isLast={index === stages.length - 1}
        />
      ))}
    </ol>
  );
}
