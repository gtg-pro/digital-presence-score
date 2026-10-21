import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ReportPage } from "@/features/report/components/ReportPage";
import {
  ReportUnavailableState,
} from "@/features/report/components/ReportResultView";
import { getReportDemoById } from "@/features/report/data/report.mock";
import {
  isLiveReportId,
  loadLiveReport,
} from "@/features/report/session/ephemeral-report-session";
import type { ReportDemoKey } from "@/features/report/types/report.types";
import { validateReportResult } from "@/lib/audit/validation/report-result-validator";

export const metadata: Metadata = {
  title: "Digital Presence Score",
  description:
    "Digital presence report card — demo fixtures or short-lived live assessment results.",
};

function demoKeyFromReportId(id: string): ReportDemoKey | null {
  const report = getReportDemoById(id);
  if (!report) return null;
  return report.outcome === "complete"
    ? "complete"
    : report.outcome === "partial"
      ? "partial"
      : "limited";
}

function demoKeyFromQuery(
  value: string | string[] | undefined,
): ReportDemoKey | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "complete" || raw === "partial" || raw === "limited") return raw;
  return null;
}

async function ReportPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ outcome?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  // Live ephemeral reports — never fall back to demo fixtures.
  if (isLiveReportId(id)) {
    const liveReport = await loadLiveReport(id);
    if (!liveReport) {
      return (
        <ReportUnavailableState
          title="Live report unavailable"
          message="This live report session is missing, expired, or could not be verified. Re-run the assessment to generate a new short-lived report. Demo fixture data is intentionally not shown."
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

  const fromQuery = demoKeyFromQuery(query.outcome);
  const fromId = demoKeyFromReportId(id);

  if (!fromId && !fromQuery) {
    notFound();
  }

  const demoKey = fromQuery ?? fromId ?? "complete";

  return <ReportPage key={demoKey} initialDemoKey={demoKey} />;
}

export default function ReportRoutePage({
  params,
  searchParams,
}: PageProps<"/report/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted-foreground">
          Loading report…
        </div>
      }
    >
      <ReportPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
