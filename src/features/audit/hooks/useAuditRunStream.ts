"use client";

import { useCallback, useEffect, useState } from "react";

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
  if (status === "LIMITED_VISIBILITY") return "partial";
  return "completed";
}

function freshInProgressSnapshot(): AuditProgressSnapshot {
  return {
    id: "live-run",
    isDemo: false,
    label: "Live assessment",
    outcome: "in_progress",
    headline: "Assessment in Progress",
    summary:
      "We are reviewing available public digital signals for your business.",
    stages: initialStages(),
  };
}

/** Safe, non-secret diagnostics for QA (never includes cookies/tokens/keys). */
export type AuditStreamDiagnostics = {
  clientMounted: boolean;
  initAttempted: boolean;
  fetchInitiated: boolean;
  responseStatus: number | null;
  sseTerminalReceived: boolean;
  lastErrorCode: string | null;
};

const initialDiagnostics: AuditStreamDiagnostics = {
  clientMounted: true,
  initAttempted: false,
  fetchInitiated: false,
  responseStatus: null,
  sseTerminalReceived: false,
  lastErrorCode: null,
};

export type UseAuditRunStreamOptions = {
  /** When false, do not auto-start (demo mode). */
  enabled: boolean;
};

/**
 * Starts POST /api/audit/run once per enabled attempt.
 *
 * Important: do NOT gate on a ref that survives React Strict Mode's
 * effect setup→cleanup→setup cycle. Cleanup aborts the in-flight request;
 * the next setup must be allowed to start a fresh fetch.
 */
export function useAuditRunStream({ enabled }: UseAuditRunStreamOptions) {
  const [snapshot, setSnapshot] = useState<AuditProgressSnapshot>(
    freshInProgressSnapshot,
  );
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [diagnostics, setDiagnostics] =
    useState<AuditStreamDiagnostics>(initialDiagnostics);

  useEffect(() => {
    if (!enabled) return;

    const abort = new AbortController();
    let finished = false;

    const fail = (message: string, retryable = true, code = "failed") => {
      if (abort.signal.aborted || finished) return;
      finished = true;
      setDiagnostics((current) => ({
        ...current,
        lastErrorCode: code,
      }));
      setSnapshot((current) => ({
        ...current,
        outcome: "failed",
        headline: "Assessment could not continue",
        summary: message,
        errorMessage: message,
        retryable,
      }));
    };

    const run = async () => {
      // Yield so React Strict Mode's immediate cleanup can abort before we hit
      // the network — avoids a cancelled duplicate POST in development.
      await Promise.resolve();
      if (abort.signal.aborted) return;

      setDiagnostics((current) => ({
        ...current,
        clientMounted: true,
        initAttempted: true,
        fetchInitiated: true,
        responseStatus: null,
        sseTerminalReceived: false,
        lastErrorCode: null,
      }));
      setSubmitting(true);
      setSnapshot(freshInProgressSnapshot());

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

        if (abort.signal.aborted) return;

        setDiagnostics((current) => ({
          ...current,
          responseStatus: response.status,
        }));

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
            // ignore non-JSON error bodies
          }
          fail(message, retryable, `http_${response.status}`);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sawTerminal = false;

        const handleEvent = async (event: AuditStreamEvent) => {
          if (abort.signal.aborted) return;

          if (event.type === "progress") {
            setSnapshot((current) => ({
              ...current,
              stages: applyProgress(current.stages, event),
              summary: event.message,
            }));
            return;
          }

          if (event.type === "error") {
            sawTerminal = true;
            setDiagnostics((current) => ({
              ...current,
              sseTerminalReceived: true,
              lastErrorCode: event.code ?? "stream_error",
            }));
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
            sawTerminal = true;
            setDiagnostics((current) => ({
              ...current,
              sseTerminalReceived: true,
            }));
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
            if (abort.signal.aborted) return;

            if (!finalized.ok) {
              fail(
                finalized.message,
                finalized.code !== "too_large",
                finalized.code ?? "handoff_failed",
              );
              return;
            }

            if (!finalized.href.startsWith("/report/live-")) {
              fail(
                "Refusing to open a demo or unexpected report link.",
                true,
                "invalid_destination",
              );
              return;
            }

            finished = true;
            // Hard navigation so httpOnly cookies from the Server Action are
            // present on the report request (client soft-nav can race Set-Cookie).
            window.location.assign(finalized.href);
          }
        };

        while (!abort.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            try {
              const parsed = JSON.parse(line.slice(6)) as AuditStreamEvent;
              await handleEvent(parsed);
            } catch {
              // ignore malformed chunk
            }
          }
        }

        if (!abort.signal.aborted && !sawTerminal && !finished) {
          fail(
            "The assessment stream closed before finishing. Please retry.",
            true,
            "stream_incomplete",
          );
        }
      } catch (error) {
        if (abort.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "Assessment failed.";
        fail(message, true, "network_error");
      } finally {
        if (!abort.signal.aborted) {
          setSubmitting(false);
        }
      }
    };

    void run();

    return () => {
      abort.abort();
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => {
    setSubmitting(false);
    setAttempt((value) => value + 1);
  }, []);

  return { snapshot, submitting, retry, diagnostics };
}
