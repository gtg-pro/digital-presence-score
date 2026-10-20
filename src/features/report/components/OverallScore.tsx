import type { DigitalPresenceReport } from "@/features/report/types/report.types";

function ScoreRing({ score, maxScore }: { score: number; maxScore: number }) {
  const size = 132;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score / maxScore, 0), 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex size-32 items-center justify-center" aria-hidden="true">
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
        <span className="text-3xl font-semibold tracking-tight text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/{maxScore}</span>
      </div>
    </div>
  );
}

export function OverallScore({ report }: { report: DigitalPresenceReport }) {
  if (report.outcome === "complete" && report.overallScore !== null) {
    return (
      <section
        aria-labelledby="overall-score-heading"
        className="rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <ScoreRing score={report.overallScore} maxScore={report.maxScore} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Overall digital presence score
            </p>
            <h2
              id="overall-score-heading"
              className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              {report.overallScore}
              <span className="text-lg font-medium text-muted-foreground">
                /{report.maxScore}
              </span>
            </h2>
            {report.maturityBand ? (
              <p className="mt-2 text-base font-medium text-foreground">
                {report.maturityBand}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-muted-foreground">
              Illustrative demo score only — not a verified assessment result.
              Maturity bands are shown for UI presentation and are not computed
              live in this frontend.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (report.outcome === "partial") {
    return (
      <section
        aria-labelledby="overall-score-heading"
        className="rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8"
      >
        <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Overall result
        </p>
        <h2
          id="overall-score-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Partial Audit
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Some checks could not be completed. Unverified areas are shown as Not
          Assessed rather than counted as failures. No overall /100 score or
          maturity band is displayed for this outcome.
        </p>
        <p className="mt-3 text-sm font-medium text-foreground">
          Evidence coverage: {report.evidenceCoveragePercent}%
        </p>
      </section>
    );
  }

  if (report.outcome === "limited") {
    return (
      <section
        aria-labelledby="overall-score-heading"
        className="rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8"
      >
        <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Overall result
        </p>
        <h2
          id="overall-score-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Limited Visibility Snapshot
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          We couldn&apos;t confidently verify a business website. This snapshot
          contains only the limited public information available. No numerical
          score is displayed.
        </p>
        <p className="mt-3 text-sm font-medium text-foreground">
          Evidence coverage: {report.evidenceCoveragePercent}%
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="overall-score-heading"
      className="rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8"
    >
      <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        Overall result
      </p>
      <h2
        id="overall-score-heading"
        className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        Score unavailable
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        This complete-audit demo is missing an overall score. No fabricated
        /100 value is shown.
      </p>
      <p className="mt-3 text-sm font-medium text-foreground">
        Evidence coverage: {report.evidenceCoveragePercent}%
      </p>
    </section>
  );
}
