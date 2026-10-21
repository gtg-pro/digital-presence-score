import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ReportPage } from "@/features/report/components/ReportPage";
import { ReportUnavailableState } from "@/features/report/components/ReportResultView";
import {
  isLiveReportId,
  loadLiveReport,
} from "@/features/report/session/ephemeral-report-session";
import { validateReportResult } from "@/lib/audit/validation/report-result-validator";

export const metadata: Metadata = {
  title: "Digital Presence Score",
  description:
    "Short-lived live digital presence report card from your latest assessment.",
};

async function ReportPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Demo fixture report routes are retired — live sessions only.
  if (!isLiveReportId(id)) {
    notFound();
  }

  const liveReport = await loadLiveReport(id);
  if (!liveReport) {
    return (
      <ReportUnavailableState
        title="Live report unavailable"
        message="This live report session is missing, expired, or could not be verified. Re-run the assessment to generate a new short-lived report."
      />
    );
  }

  const validation = validateReportResult(liveReport, { expectLive: true });
  if (!validation.ok) {
    return (
      <ReportUnavailableState
        title="Invalid live report"
        message={validation.issues.map((issue) => issue.message).join(" ")}
      />
    );
  }

  return <ReportPage liveReport={liveReport} />;
}

export default function ReportRoutePage({
  params,
}: PageProps<"/report/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted-foreground">
          Loading report…
        </div>
      }
    >
      <ReportPageContent params={params} />
    </Suspense>
  );
}
