import type { DigitalPresenceReport } from "@/features/report/types/report.types";

import { ReportBenefitBullet } from "./ReportBenefitBullet";

const IMPROVEMENT_ICON_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1792757135/Icon_rrpbpp.svg";

export function ImprovementSection({
  report,
}: {
  report: DigitalPresenceReport;
}) {
  if (report.improvements.length === 0) return null;

  const midpoint = Math.ceil(report.improvements.length / 2);
  const leftColumn = report.improvements.slice(0, midpoint);
  const rightColumn = report.improvements.slice(midpoint);

  return (
    <section
      aria-labelledby="improvements-heading"
      className="w-full space-y-8 md:space-y-12"
    >
      <div className="flex w-full flex-col items-center gap-2 text-center md:gap-3">
        <h2
          id="improvements-heading"
          className="font-title text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.25rem] lg:leading-[44px]"
        >
          Improvement <span className="text-[#2563EB]">Opportunities</span>
        </h2>
        <p className="font-heading text-sm text-[#9EA5B3] sm:text-base">
          {report.isDemo
            ? "Prioritized illustrative issues for this sample report."
            : "Prioritized improvement opportunities from this assessment."}
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-10 md:gap-y-6 lg:gap-x-16">
        <div className="flex flex-col gap-3 md:gap-6">
          {leftColumn.map((item) => (
            <ReportBenefitBullet
              key={item.id}
              icon={IMPROVEMENT_ICON_URL}
              label={item.title}
              description={item.description}
            />
          ))}
        </div>
        <div className="flex flex-col gap-3 md:gap-6">
          {rightColumn.map((item) => (
            <ReportBenefitBullet
              key={item.id}
              icon={IMPROVEMENT_ICON_URL}
              label={item.title}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
