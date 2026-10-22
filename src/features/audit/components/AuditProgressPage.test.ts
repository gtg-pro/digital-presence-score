import { describe, expect, it } from "vitest";

import { auditProgressStageDefinitions } from "@/features/audit/data/audit-progress.mock";
import type { AuditProgressSnapshot } from "@/features/audit/types/audit-progress.types";

import { resolveAuditProgressSnapshot } from "./AuditProgressPage";

function liveSnapshotWithProgress(): AuditProgressSnapshot {
  return {
    id: "live-run",
    isDemo: false,
    label: "Live assessment",
    outcome: "completed",
    headline: "Assessment complete",
    summary: "Preparing your report session…",
    stages: auditProgressStageDefinitions.map((definition, index) => ({
      id: definition.id,
      status:
        index === 2
          ? ("not_assessed" as const)
          : ("completed" as const),
      detail: index === 2 ? "Limited public information for this step." : "Stage finished.",
    })),
  };
}

describe("resolveAuditProgressSnapshot", () => {
  it("keeps real stage statuses after the pending cookie is cleared mid-run", () => {
    const live = liveSnapshotWithProgress();
    const resolved = resolveAuditProgressSnapshot({
      demoMode: false,
      demoState: "in_progress",
      hasPendingSession: false,
      liveSnapshot: live,
      streamStarted: true,
    });

    expect(resolved).toBe(live);
    expect(resolved.stages.every((stage) => stage.status !== "failed")).toBe(
      true,
    );
    expect(resolved.stages[2]?.status).toBe("not_assessed");
  });

  it("shows the missing-session failure only before a stream starts", () => {
    const resolved = resolveAuditProgressSnapshot({
      demoMode: false,
      demoState: "in_progress",
      hasPendingSession: false,
      liveSnapshot: liveSnapshotWithProgress(),
      streamStarted: false,
    });

    expect(resolved.id).toBe("missing-session");
    expect(resolved.outcome).toBe("failed");
    expect(resolved.stages.every((stage) => stage.status === "failed")).toBe(
      true,
    );
    expect(resolved.stages.every((stage) => stage.detail == null)).toBe(true);
  });
});
