import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  Info,
} from "lucide-react";

import type { ReportSummary } from "@/features/report/types/report";
import { cn } from "@/lib/cn";

export type SampleReportCardProps = {
  report: ReportSummary;
  className?: string;
  /** When false, hides View/Download actions (e.g. on the demo report route). */
  showActions?: boolean;
};

const RING_RADIUS = 48;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({
  score,
  maxScore,
}: {
  score: number;
  maxScore: number;
}) {
  const progress = Math.min(Math.max(score / maxScore, 0), 1);
  const offset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div
      role="img"
      aria-label={`Digital Presence Score ${score} out of ${maxScore}`}
      className="relative h-[120px] w-[120px] shrink-0 sm:h-[150px] sm:w-[150px] md:h-[170px] md:w-[170px] lg:h-[180px] lg:w-[180px]"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="14"
          className="stroke-[#1e2d4a]"
        />
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="14"
          strokeLinecap="butt"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="stroke-[#2b7fff] transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden="true"
      >
        <span className="text-[28px] font-bold leading-none text-white sm:text-[34px]">
          {score}
        </span>
        <span className="mt-1 text-sm text-gray-400 sm:text-base">
          /{maxScore}
        </span>
      </div>
    </div>
  );
}

export function SampleReportCard({
  report,
  className,
  showActions = true,
}: SampleReportCardProps) {
  const hasNumericScore =
    report.overallScore !== null && report.overallScore !== undefined;

  const websiteLabel = report.website?.trim() || null;

  return (
    <article
      className={cn(
        "w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-400/70 bg-[#1c1c1c] font-title text-white shadow-[0_0_48px_rgba(37,99,235,0.18),0_12px_40px_rgba(0,0,0,0.55)]",
        className,
      )}
      aria-label={
        report.isDemo
          ? "Illustrative sample report card preview"
          : "Digital presence report card"
      }
    >
      <header className="flex flex-col gap-4 p-4 sm:p-6 md:p-8">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-lg font-medium tracking-tight text-white sm:text-xl">
            {report.businessName}
          </h3>
          {websiteLabel ? (
            <p className="break-words font-heading text-sm text-gray-400">
              {websiteLabel}
            </p>
          ) : null}
        </div>
      </header>

      <div className="space-y-6 px-4 pb-4 sm:space-y-8 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-neutral-400/70 bg-[#0A0A0A] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-3xl sm:p-6 md:p-8">
          <div className="flex min-w-0 w-full flex-col text-center sm:text-left">
            <p className="text-sm font-medium text-white sm:text-[15px]">
              Digital Presence Score™
            </p>

            {hasNumericScore ? (
              <div className="mt-3 flex items-baseline justify-center sm:justify-start">
                <span className="text-5xl font-bold leading-none tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[80px]">
                  {report.overallScore}
                </span>
                <span className="ml-1 text-2xl font-normal text-gray-400 sm:text-3xl">
                  /{report.maxScore}
                </span>
              </div>
            ) : (
              <p className="mt-3 text-base font-medium text-white sm:text-lg">
                Score unavailable — insufficient public evidence
              </p>
            )}

            {report.maturityBand ? (
              <p className="mt-3 text-base font-bold text-white sm:mt-4 sm:text-lg">
                {report.maturityBand}
              </p>
            ) : null}

            {report.isDemo ? (
              <p className="mt-1 max-w-[430px] text-sm leading-snug text-gray-300 sm:mx-0 sm:text-base">
                Illustrative score for preview only — not a verified result.
              </p>
            ) : null}
          </div>

          {hasNumericScore ? (
            <ScoreRing score={report.overallScore!} maxScore={report.maxScore} />
          ) : (
            <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full border border-dashed border-white/20 text-sm text-gray-400 sm:h-[170px] sm:w-[170px] md:h-[180px] md:w-[180px]">
              N/A
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-medium text-gray-400">
            Performance Breakdown
          </h4>
          <ul className="mt-4 space-y-4 sm:space-y-5">
            {report.categories.map((category) => {
              const percent = Math.round(
                (category.earned / category.maxPoints) * 100,
              );

              return (
                <li key={category.id} className="min-w-0">
                  <div className="mb-2 flex items-baseline justify-between gap-2 sm:gap-3">
                    <span className="min-w-0 truncate text-sm font-medium text-white">
                      {category.title}
                    </span>
                    <span className="shrink-0 text-base leading-none text-gray-400 sm:text-[22px]">
                      {category.earned}/{category.maxPoints}{" "}
                      <span className="font-medium text-[#2563EB]">
                        {percent}%
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-white/10 sm:h-2.5"
                    role="progressbar"
                    aria-valuenow={category.earned}
                    aria-valuemin={0}
                    aria-valuemax={category.maxPoints}
                    aria-label={`${category.title}: ${category.earned} of ${category.maxPoints} points`}
                  >
                    <div
                      className="h-full rounded-full bg-[#2563EB]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="min-w-0">
          <h4 className="font-heading text-sm font-medium text-gray-400">
            Key Finding
          </h4>
          {report.isDemo ? (
            <p className="mt-1 font-heading text-xs text-gray-500">
              Example findings for illustration — not from a real audit.
            </p>
          ) : null}
          <ul className="mt-3 space-y-2.5 font-title">
            {report.findings.map((finding) => (
              <li
                key={`${finding.type}-${finding.text}`}
                className="flex gap-2.5 text-sm leading-relaxed text-gray-300"
              >
                {finding.type === "strength" ? (
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-[#6A6F78]"
                    aria-hidden="true"
                  />
                ) : (
                  <Info
                    className="mt-0.5 size-5 shrink-0 text-gray-400"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 break-words">
                  <span className="font-medium text-white">
                    {finding.type === "strength"
                      ? "Strength: "
                      : "Improvement: "}
                  </span>
                  {finding.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 font-title">
          <h4 className="text-sm font-medium text-gray-400">
            Priority Recommendations
          </h4>
          <ul className="mt-3 space-y-2">
            {report.recommendations.map((item) => (
              <li
                key={item}
                className="flex gap-2.5 text-sm leading-relaxed text-gray-400"
              >
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-[#6A6F78]"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showActions ? (
        <footer className="flex flex-col items-stretch gap-3 px-4 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6 sm:pb-6 md:px-8 md:pb-8">
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-12 w-full select-none items-center justify-center gap-3 rounded-full bg-[#2563EB] px-4 font-button text-sm font-bold tracking-[-0.02em] text-white sm:h-14 sm:w-auto sm:px-5 sm:text-base",
              "pointer-events-none",
            )}
          >
            View Sample Report
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-white sm:size-8">
              <ArrowUpRight
                className="size-3.5 text-[#0F1114] sm:size-4"
                aria-hidden="true"
              />
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-12 w-full select-none items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-4 font-button text-sm font-medium text-white sm:h-14 sm:w-auto sm:px-5 sm:text-base",
              "pointer-events-none",
            )}
          >
            Download PDF
            <Download className="size-4" aria-hidden="true" />
          </span>
        </footer>
      ) : null}
    </article>
  );
}
