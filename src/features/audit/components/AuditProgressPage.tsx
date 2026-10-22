"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useAuditRunStream } from "@/features/audit/hooks/useAuditRunStream";
import {
  auditProgressDemoSnapshots,
  auditProgressStageDefinitions,
} from "@/features/audit/data/audit-progress.mock";
import type {
  AuditDemoStateKey,
  AuditProgressSnapshot,
} from "@/features/audit/types/audit-progress.types";

import { AuditDemoStateSelector } from "./AuditDemoStateSelector";
import { AuditProgressStatusCard } from "./AuditProgressStatusCard";

export type AuditProgressPageProps = {
  /** Server-checked pending audit cookie presence (no secret values). */
  hasPendingSession: boolean;
};

/**
 * Prefer the live stream snapshot once a run has started — even if the pending
 * cookie is cleared on complete (Server Action refresh would otherwise stamp
 * every stage as Failed while leaving real progress details intact).
 */
export function resolveAuditProgressSnapshot(options: {
  demoMode: boolean;
  demoState: AuditDemoStateKey;
  hasPendingSession: boolean;
  liveSnapshot: AuditProgressSnapshot;
  streamStarted: boolean;
}): AuditProgressSnapshot {
  const {
    demoMode,
    demoState,
    hasPendingSession,
    liveSnapshot,
    streamStarted,
  } = options;

  if (demoMode) return auditProgressDemoSnapshots[demoState];

  if (!hasPendingSession && !streamStarted) {
    return {
      id: "missing-session",
      isDemo: false,
      label: "Live assessment",
      outcome: "failed",
      headline: "Audit session missing",
      summary:
        "No pending audit session was found. Start again from the homepage or audit form. This page will not invent progress or demo results.",
      stages: auditProgressStageDefinitions.map((definition) => ({
        id: definition.id,
        status: "failed" as const,
      })),
      errorMessage: "Pending audit session missing or expired.",
      retryable: false,
    };
  }

  return liveSnapshot;
}

export function AuditProgressPage({
  hasPendingSession,
}: AuditProgressPageProps) {
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("demo") === "1";
  const streamEnabled = !demoMode && hasPendingSession;

  const [demoState, setDemoState] = useState<AuditDemoStateKey>("in_progress");
  const { snapshot: liveSnapshot, retry, submitting, diagnostics } =
    useAuditRunStream({
      enabled: streamEnabled,
    });
  const streamStarted =
    diagnostics.initAttempted || diagnostics.fetchInitiated;

  const snapshot = useMemo(
    () =>
      resolveAuditProgressSnapshot({
        demoMode,
        demoState,
        hasPendingSession,
        liveSnapshot,
        streamStarted,
      }),
    [demoMode, demoState, hasPendingSession, liveSnapshot, streamStarted],
  );

  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <div
        className="mx-auto max-w-3xl"
        data-audit-progress-root="true"
        data-audit-pending-session={hasPendingSession ? "yes" : "no"}
        data-audit-fetch-initiated={
          diagnostics.fetchInitiated ? "yes" : "no"
        }
      >
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
          Analyzing your digital presence.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Our assessment process reviews available public digital signals to
          identify strengths, weaknesses, and improvement opportunities.
        </p>

        <div className="mt-8 space-y-6">
          {demoMode ? (
            <AuditDemoStateSelector value={demoState} onChange={setDemoState} />
          ) : null}
          <AuditProgressStatusCard snapshot={snapshot} />
        </div>

        {!demoMode && snapshot.outcome === "failed" ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {snapshot.retryable !== false && hasPendingSession ? (
              <Button
                type="button"
                onClick={() => retry()}
                disabled={submitting}
              >
                Retry Audit
              </Button>
            ) : null}
            <Link
              href="/#home"
              className="inline-flex items-center justify-center rounded-lg border border-foreground bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Back to audit form
            </Link>
          </div>
        ) : null}
      </div>
    </Container>
  );
}
