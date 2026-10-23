import type { DigitalPresenceReport } from "@/features/report/types/report.types";

const RING_RADIUS = 48;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({ score, maxScore }: { score: number; maxScore: number }) {
  const progress = Math.min(Math.max(score / maxScore, 0), 1);
  const offset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div
      role="img"
      aria-label={`Digital Presence Score ${score} out of ${maxScore}`}
      className="relative h-[140px] w-[140px] shrink-0 sm:h-[160px] sm:w-[160px] md:h-[180px] md:w-[180px]"
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
        className="absolute inset-0 flex flex-col items-center justify-center font-title"
        aria-hidden="true"
      >
        <span className="text-[28px] leading-none font-bold text-white sm:text-[34px]">
          {score}
        </span>
        <span className="mt-1 text-sm text-gray-400 sm:text-base">
          /{maxScore}
        </span>
      </div>
    </div>
  );
}

export function OverallScore({ report }: { report: DigitalPresenceReport }) {
  const summary = report.executiveSummary?.trim();

  if (report.outcome === "complete" && report.overallScore !== null) {
    return (
      <section
        aria-labelledby="overall-score-heading"
        className="rounded-2xl border border-white/5 bg-black p-6 font-title sm:p-8"
      >
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-sm text-[#9EA5B3]">
              Overall Digital Presence Score
              <span className="align-super text-[10px]">™</span>
            </p>
            <h2
              id="overall-score-heading"
              className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem]"
            >
              {report.overallScore}
              <span className="text-2xl font-semibold text-[#9EA5B3] sm:text-3xl">
                /{report.maxScore}
              </span>
            </h2>
            {report.maturityBand ? (
              <p className="mt-3 text-lg font-semibold text-white sm:text-xl">
                {report.maturityBand}
              </p>
            ) : null}
            {summary ? (
              <p className="mt-3 max-w-xl font-heading text-sm leading-relaxed text-[#9EA5B3] sm:text-base">
                {summary}
              </p>
            ) : null}
          </div>
          <ScoreRing score={report.overallScore} maxScore={report.maxScore} />
        </div>
      </section>
    );
  }

  if (report.outcome === "partial") {
    return (
      <section
        aria-labelledby="overall-score-heading"
        className="rounded-2xl border border-white/5 bg-black p-6 font-title sm:p-8"
      >
        <p className="text-sm text-[#9EA5B3]">Digital presence overview</p>
        <h2
          id="overall-score-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          Supported findings overview
        </h2>
        <p className="mt-3 max-w-2xl font-heading text-sm leading-relaxed text-[#9EA5B3] sm:text-base">
          {summary ??
            "This overview shares the publicly supported observations available for this website. An overall score out of 100 is not shown when available information is incomplete."}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="overall-score-heading"
      className="rounded-2xl border border-white/5 bg-black p-6 font-title sm:p-8"
    >
      <p className="text-sm text-[#9EA5B3]">Digital presence overview</p>
      <h2
        id="overall-score-heading"
        className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
      >
        Limited public information
      </h2>
      <p className="mt-3 max-w-2xl font-heading text-sm leading-relaxed text-[#9EA5B3] sm:text-base">
        {summary ??
          "A complete numerical digital presence score could not be published because public website information was insufficient for this run."}
      </p>
    </section>
  );
}
