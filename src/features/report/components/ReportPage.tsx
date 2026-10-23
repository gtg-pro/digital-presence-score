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
      <div className="bg-black">
        <Container className="py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#0F1114] p-8 text-sm text-[#9EA5B3]">
            Invalid live report payload: demo fixtures cannot be supplied as live
            assessment results.
          </div>
        </Container>
      </div>
    );
  }

  return <ReportResultView report={liveReport} live />;
}
