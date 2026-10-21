"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { finalizeAuditHandoff } from "@/features/audit/actions/finalize-audit-handoff";
import { auditProgressStageDefinitions } from "@/features/audit/data/audit-progress.mock";
import type {
  AuditOverallOutcome,
  AuditProgressSnapshot,
  AuditProgressStageState,
} from "@/features/audit/types/audit-progress.types";
import type { AuditStreamEvent } from "@/features/audit/types/audit-run.types";

function initialStages(): AuditProgressStageState[] {
  return auditProgressStageDefinitions.map((definition) => ({
    id: definition.id,
    status: "pending" as const,
  }));
}

function applyProgress(
  stages: AuditProgressStageState[],
  event: Extract<AuditStreamEvent, { type: "progress" }>,
): AuditProgressStageState[] {
  const order = auditProgressStageDefinitions.map((d) => d.id);
  const targetIndex = order.indexOf(event.stageId);

  return stages.map((stage, index) => {
    if (stage.id === event.stageId) {
      return {
        ...stage,
        status: event.stageStatus,
        detail: event.message,
      };
    }
    // Mark earlier stages completed if still pending when a later stage starts
    if (
      event.stageStatus === "in_progress" &&
      index < targetIndex &&
      stage.status === "pending"
    ) {
      return { ...stage, status: "completed" };
    }
    return stage;
  });
}

function outcomeFromStatus(
  status: string,
): Exclude<AuditOverallOutcome, "in_progress" | "failed"> {
  if (status === "PARTIAL") return "partial";
  return "completed";
}

export type UseAuditRunStreamOptions = {
  /** When false, do not auto-start (demo mode). */
  enabled: boolean;
};

export function useAuditRunStream({ enabled }: UseAuditRunStreamOptions) {
  const [snapshot, setSnapshot] = useState<AuditProgressSnapshot>(() => ({
    id: "live-run",
    isDemo: false,
    label: "Live assessment",
    outcome: "in_progress",
    headline: "Assessment in Progress",
    summary:
      "We are reviewing available public digital signals for your business.",
    stages: initialStages(),
  }));
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setSnapshot({
      id: "live-run",
      isDemo: false,
      label: "Live assessment",
      outcome: "in_progress",
      headline: "Assessment in Progress",
      summary:
        "We are reviewing available public digital signals for your business.",
      stages: initialStages(),
    });

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const response = await fetch("/api/audit/run", {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        signal: abort.signal,
        cache: "no-store",
      });

      if (!response.ok || !response.body) {
        let message = "Unable to start the assessment.";
        let retryable = true;
        try {
          const json = (await response.json()) as AuditStreamEvent;
          if (json.type === "error") {
            message = json.message;
            retryable = json.retryable;
          }
        } catch {
          // ignore
        }
        setSnapshot((current) => ({
          ...current,
          outcome: "failed",
          headline: "Assessment could not start",
          summary: message,
          errorMessage: message,
          retryable,
        }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleEvent = async (event: AuditStreamEvent) => {
        if (event.type === "progress") {
          setSnapshot((current) => ({
            ...current,
            stages: applyProgress(current.stages, event),
            summary: event.message,
          }));
          return;
        }

        if (event.type === "error") {
          setSnapshot((current) => ({
            ...current,
            outcome: "failed",
            headline: "Assessment failed",
            summary: event.message,
            errorMessage: event.message,
            retryable: event.retryable,
          }));
          return;
        }

        if (event.type === "complete") {
          setSnapshot((current) => ({
            ...current,
            outcome: outcomeFromStatus(event.status),
            headline:
              event.status === "COMPLETE"
                ? "Assessment complete"
                : event.status === "PARTIAL"
                  ? "Partial assessment ready"
                  : "Limited visibility report ready",
            summary: "Preparing your report session…",
            stages: current.stages.map((stage) =>
              stage.status === "pending" || stage.status === "in_progress"
                ? { ...stage, status: "completed" as const }
                : stage,
            ),
          }));

          const finalized = await finalizeAuditHandoff(event.sealedHandoff);
          if (!finalized.ok) {
            setSnapshot((current) => ({
              ...current,
              outcome: "failed",
              headline: "Report session could not be created",
              summary: finalized.message,
              errorMessage: finalized.message,
              retryable: finalized.code !== "too_large",
            }));
            return;
          }

          if (!finalized.href.startsWith("/report/live-")) {
            setSnapshot((current) => ({
              ...current,
              outcome: "failed",
              headline: "Invalid report destination",
              summary: "Refusing to open a demo or unexpected report link.",
              errorMessage: "Invalid report destination.",
              retryable: true,
            }));
            return;
          }

          // Hard navigation so httpOnly cookies from the Server Action are
          // present on the report request (client soft-nav can race Set-Cookie).
          window.location.assign(finalized.href);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            const parsed = JSON.parse(line.slice(6)) as AuditStreamEvent;
            await handleEvent(parsed);
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch (error) {
      if (abort.signal.aborted) return;
      const message =
        error instanceof Error ? error.message : "Assessment failed.";
      setSnapshot((current) => ({
        ...current,
        outcome: "failed",
        headline: "Assessment failed",
        summary: message,
        errorMessage: message,
        retryable: true,
      }));
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
      abortRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;
    void run();
    return () => {
      abortRef.current?.abort();
    };
    // Intentionally start once when enabled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const retry = useCallback(() => {
    abortRef.current?.abort();
    inFlightRef.current = false;
    void run();
  }, [run]);

  return { snapshot, submitting, retry, run };
}
