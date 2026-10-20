import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ReportPage } from "@/features/report/components/ReportPage";
import { getReportDemoById } from "@/features/report/data/report.mock";
import type { ReportDemoKey } from "@/features/report/types/report.types";

export const metadata: Metadata = {
  title: "Digital Presence Score",
  description:
    "Illustrative digital-presence report card preview (demo fixtures only).",
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
          Loading demo report…
        </div>
      }
    >
      <ReportPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
