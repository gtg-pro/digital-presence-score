import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleAlert, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { ReportSummary } from "@/features/report/types/report";
import { cn } from "@/lib/cn";

export type SampleReportCardProps = {
  report: ReportSummary;
  className?: string;
  /** When false, hides View/Download actions (e.g. on the demo report route). */
  showActions?: boolean;
};

function ScoreRing({
  score,
  maxScore,
}: {
  score: number;
  maxScore: number;
}) {
  const size = 112;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score / maxScore, 0), 1);
  const offset = circumference * (1 - progress);

  return (
    <div
      className="relative inline-flex size-28 items-center justify-center"
      aria-hidden="true"
    >
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-foreground"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/{maxScore}</span>
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

  return (
    <Card
      className={cn("overflow-hidden", className)}
      aria-label={
        report.isDemo
          ? "Illustrative sample report card preview"
          : "Digital presence report card"
      }
    >
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {report.businessName}
            </h3>
            {report.isDemo ? (
              <Badge variant="demo">Sample Report</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{report.website}</p>
          <p className="text-xs text-muted-foreground">
            {report.assessedAtLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            Scoring version:{" "}
            <span className="font-mono text-foreground">{report.scoringVersion}</span>
          </p>
        </div>
        <Badge variant="outline">{report.statusLabel}</Badge>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/40 px-4 py-6 text-center sm:flex-row sm:text-left">
          {hasNumericScore ? (
            <ScoreRing score={report.overallScore!} maxScore={report.maxScore} />
          ) : (
            <div className="flex size-28 items-center justify-center rounded-full border border-dashed border-border text-sm text-muted-foreground">
              N/A
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Overall score
            </p>
            {hasNumericScore ? (
              <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {report.overallScore}
                <span className="text-lg font-medium text-muted-foreground">
                  /{report.maxScore}
                </span>
              </p>
            ) : (
              <p className="text-lg font-medium text-foreground">
                Score unavailable — insufficient public evidence
              </p>
            )}
            {report.maturityBand ? (
              <p className="text-sm font-medium text-foreground">
                {report.maturityBand}
              </p>
            ) : null}
            {report.isDemo ? (
              <p className="text-xs text-muted-foreground">
                Illustrative score for preview only — not a verified result.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            Category breakdown
          </h4>
          <ul className="mt-4 space-y-4">
            {report.categories.map((category) => {
              const percent = Math.round(
                (category.earned / category.maxPoints) * 100,
              );

              return (
                <li key={category.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {category.title}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {category.earned}/{category.maxPoints}
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={category.earned}
                    aria-valuemin={0}
                    aria-valuemax={category.maxPoints}
                    aria-label={`${category.title}: ${category.earned} of ${category.maxPoints} points`}
                  >
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            Key findings
          </h4>
          {report.isDemo ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Example findings for illustration — not from a real audit.
            </p>
          ) : null}
          <ul className="mt-3 space-y-2.5">
            {report.findings.map((finding) => (
              <li
                key={`${finding.type}-${finding.text}`}
                className="flex gap-2.5 text-sm leading-relaxed text-foreground"
              >
                {finding.type === "strength" ? (
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <CircleAlert
                    className="mt-0.5 size-4 shrink-0 text-foreground"
                    aria-hidden="true"
                  />
                )}
                <span>
                  <span className="font-medium">
                    {finding.type === "strength" ? "Strength: " : "Improvement: "}
                  </span>
                  {finding.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            Priority recommendations
          </h4>
          <ul className="mt-3 space-y-2">
            {report.recommendations.map((item) => (
              <li
                key={item}
                className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
              >
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      {showActions ? (
        <CardFooter>
          <Link
            href={`/report/${report.id}`}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground",
              "transition-colors hover:bg-primary/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            View Sample Report
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
          <a
            href={`/api/report/${encodeURIComponent(report.id)}/pdf`}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground",
              "transition-colors hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label="Download sample PDF"
          >
            <Download className="size-4" aria-hidden="true" />
            Download PDF
          </a>
        </CardFooter>
      ) : null}
    </Card>
  );
}
