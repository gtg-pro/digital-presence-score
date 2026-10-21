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

export function AuditProgressPage() {
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("demo") === "1";

  const [demoState, setDemoState] = useState<AuditDemoStateKey>("in_progress");
  const { snapshot: liveSnapshot, retry, submitting } = useAuditRunStream({
    enabled: !demoMode,
  });

  const snapshot = useMemo(
    () => (demoMode ? auditProgressDemoSnapshots[demoState] : liveSnapshot),
    [demoMode, demoState, liveSnapshot],
  );

  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <SiteLogo width={160} className="max-w-[11rem]" />
        <h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
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
          <AuditOverallStatus snapshot={snapshot} />
        </div>

        <div className="mt-10">
          <AuditProgressTimeline stages={snapshot.stages} />
        </div>

        {!demoMode && snapshot.outcome === "failed" ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {snapshot.retryable !== false ? (
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
