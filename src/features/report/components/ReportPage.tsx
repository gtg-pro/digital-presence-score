"use client";

import { useMemo, useState } from "react";

import { Container } from "@/components/ui/container";
import { reportDemoFixtures } from "@/features/report/data/report.mock";
import type {
  DigitalPresenceReport,
  ReportDemoKey,
} from "@/features/report/types/report.types";

import { ReportDemoStateSelector } from "./ReportDemoStateSelector";
import { ReportResultView } from "./ReportResultView";

export type ReportPageProps = {
  /** Initial demo fixture derived from the route id or query. */
  initialDemoKey?: ReportDemoKey;
  /**
   * Live mapped AssessmentResult report. When provided, demo fixtures and
   * demo selectors are never used.
   */
  liveReport?: DigitalPresenceReport;
};

export function ReportPage({
  initialDemoKey = "complete",
  liveReport,
}: ReportPageProps) {
  const [demoKey, setDemoKey] = useState<ReportDemoKey>(initialDemoKey);
  const [prevInitialKey, setPrevInitialKey] =
    useState<ReportDemoKey>(initialDemoKey);

  if (initialDemoKey !== prevInitialKey) {
    setPrevInitialKey(initialDemoKey);
    setDemoKey(initialDemoKey);
  }

  const demoReport = useMemo(() => reportDemoFixtures[demoKey], [demoKey]);

  if (liveReport) {
    if (liveReport.isDemo) {
      return (
        <Container className="py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-2xl rounded-xl border border-border p-8 text-sm text-muted-foreground">
            Invalid live report payload: demo fixtures cannot be supplied as
            live assessment results.
          </div>
        </Container>
      );
    }
    return <ReportResultView report={liveReport} live />;
  }

  return (
    <>
      <Container className="pt-10 sm:pt-14 lg:pt-16">
        <div className="mx-auto max-w-5xl">
          <ReportDemoStateSelector value={demoKey} onChange={setDemoKey} />
        </div>
      </Container>
      <ReportResultView report={demoReport} live={false} />
    </>
  );
}
