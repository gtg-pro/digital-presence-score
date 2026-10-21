"use client";

import { Container } from "@/components/ui/container";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

import { ReportResultView } from "./ReportResultView";

export type ReportPageProps = {
  /**
   * Live mapped AssessmentResult report. Demo fixture routes are retired.
   */
  liveReport: DigitalPresenceReport;
};

export function ReportPage({ liveReport }: ReportPageProps) {
  if (liveReport.isDemo) {
    return (
      <Container className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl rounded-xl border border-border p-8 text-sm text-muted-foreground">
          Invalid live report payload: demo fixtures cannot be supplied as live
          assessment results.
        </div>
      </Container>
    );
  }

  return <ReportResultView report={liveReport} live />;
}
