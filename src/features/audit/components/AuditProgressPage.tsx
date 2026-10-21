"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { SiteLogo } from "@/components/shared/site-logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useAuditRunStream } from "@/features/audit/hooks/useAuditRunStream";
import { auditProgressDemoSnapshots } from "@/features/audit/data/audit-progress.mock";
import type { AuditDemoStateKey } from "@/features/audit/types/audit-progress.types";

import { AuditDemoStateSelector } from "./AuditDemoStateSelector";
import { AuditOverallStatus } from "./AuditOverallStatus";
import { AuditProgressTimeline } from "./AuditProgressTimeline";

export type AuditProgressPageProps = {
  /** Server-checked pending audit cookie presence (no secret values). */
  hasPendingSession: boolean;
};

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
  const clientMounted = diagnostics.clientMounted || streamEnabled;

  const missingSessionSnapshot = useMemo(
    () => ({
      id: "missing-session",
      isDemo: false,
      label: "Live assessment",
      outcome: "failed" as const,
      headline: "Audit session missing",
      summary:
        "No pending audit session was found. Start again from the homepage or audit form. This page will not invent progress or demo results.",
      stages: liveSnapshot.stages.map((stage) => ({
        ...stage,
        status: "failed" as const,
      })),
      errorMessage: "Pending audit session missing or expired.",
      retryable: false,
    }),
    [liveSnapshot.stages],
  );

  const snapshot = useMemo(() => {
    if (demoMode) return auditProgressDemoSnapshots[demoState];
    if (!hasPendingSession) return missingSessionSnapshot;
    return liveSnapshot;
  }, [
    demoMode,
    demoState,
    hasPendingSession,
    liveSnapshot,
    missingSessionSnapshot,
  ]);

  const showDiagnostics =
    process.env.NODE_ENV === "development" && !demoMode;

  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <div
        className="mx-auto max-w-3xl"
        data-audit-progress-root="true"
        data-audit-demo={demoMode ? "1" : "0"}
        data-audit-pending-session={hasPendingSession ? "yes" : "no"}
        data-audit-client-mounted={clientMounted ? "yes" : "no"}
        data-audit-stream-enabled={streamEnabled ? "yes" : "no"}
        data-audit-init-attempted={diagnostics.initAttempted ? "yes" : "no"}
        data-audit-fetch-initiated={diagnostics.fetchInitiated ? "yes" : "no"}
        data-audit-response-status={
          diagnostics.responseStatus == null
            ? ""
            : String(diagnostics.responseStatus)
        }
        data-audit-sse-terminal={
          diagnostics.sseTerminalReceived ? "yes" : "no"
        }
      >
        <SiteLogo width={160} className="max-w-[11rem]" />
        <h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
          Analyzing your digital presence.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Our assessment process reviews available public digital signals to
          identify strengths, weaknesses, and improvement opportunities.
        </p>

        {showDiagnostics ? (
          <aside
            className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 font-mono text-xs text-muted-foreground"
            data-audit-diagnostics="true"
            aria-label="Temporary audit diagnostics"
          >
            <p>Pending session created: {hasPendingSession ? "yes" : "no"}</p>
            <p>Progress client mounted: {clientMounted ? "yes" : "no"}</p>
            <p>
              Audit stream initialization attempted:{" "}
              {diagnostics.initAttempted ? "yes" : "no"}
            </p>
            <p>
              /api/audit/run fetch initiated:{" "}
              {diagnostics.fetchInitiated ? "yes" : "no"}
            </p>
            <p>
              Response status:{" "}
              {diagnostics.responseStatus == null
                ? "n/a"
                : diagnostics.responseStatus}
            </p>
            <p>
              SSE terminal event received:{" "}
              {diagnostics.sseTerminalReceived ? "yes" : "no"}
            </p>
          </aside>
        ) : null}

        <div className="mt-8 space-y-6">
          {demoMode ? (
            <AuditDemoStateSelector value={demoState} onChange={setDemoState} />
          ) : null}
          <AuditOverallStatus snapshot={snapshot} />
        </div>

        <div className="mt-10">
          <AuditProgressTimeline stages={snapshot.stages} />
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
              href="/audit"
              className="inline-flex items-center justify-center rounded-lg border border-foreground bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Back to audit form
            </Link>
          </div>
        ) : null}

        <aside className="mt-8 rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">About unavailable evidence</p>
          <p className="mt-1">
            Unavailable or inaccessible public signals are marked{" "}
            <span className="font-medium text-foreground">Not Assessed</span>.
            They do not automatically reduce a score or fail the assessment. No
            numerical score is shown on this screen.
          </p>
          {demoMode ? (
            <p className="mt-2 text-xs">
              Demo preview mode (`?demo=1`). Live audits use real pipeline
              progress without demo fixtures.
            </p>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}
