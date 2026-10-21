/**
 * Shared print/export presentation marker.
 * Actual export HTML is built server-side by `renderReportExportHtml`
 * from the same DigitalPresenceReport snapshot shown in ReportResultView.
 *
 * This component documents the contract; Playwright does not mount React.
 */
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

export type ReportExportViewProps = {
  report: DigitalPresenceReport;
};

export function ReportExportView({ report }: ReportExportViewProps) {
  return (
    <div data-report-export="true" data-report-id={report.reportId}>
      <p>
        Export rendering is performed server-side from the validated report
        snapshot (PDF/PNG). This marker is not used for client capture.
      </p>
    </div>
  );
}
