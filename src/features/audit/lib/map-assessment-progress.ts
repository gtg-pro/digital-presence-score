import type { AuditProgressStageId } from "@/features/audit/types/audit-progress.types";
import type { AssessmentProgressEvent } from "@/lib/audit/orchestration/assessment.types";

const STAGE_MAP: Record<
  AssessmentProgressEvent["stage"],
  AuditProgressStageId
> = {
  validating: "business-discovery",
  retrieving: "website-crawling",
  analyzing: "public-trust-signals",
  scoring: "scoring-validation",
  preparing_report: "report-generation",
};

export function mapAssessmentProgressToUi(
  event: AssessmentProgressEvent,
): {
  stageId: AuditProgressStageId;
  stageStatus:
    | "pending"
    | "in_progress"
    | "completed"
    | "not_assessed"
    | "failed";
  message: string;
} {
  const stageId = STAGE_MAP[event.stage];
  let stageStatus:
    | "pending"
    | "in_progress"
    | "completed"
    | "not_assessed"
    | "failed";
  switch (event.status) {
    case "started":
      stageStatus = "in_progress";
      break;
    case "completed":
      stageStatus = "completed";
      break;
    case "skipped":
      stageStatus = "not_assessed";
      break;
    case "failed":
      stageStatus = "failed";
      break;
    default:
      stageStatus = "pending";
  }
  return { stageId, stageStatus, message: event.message };
}
