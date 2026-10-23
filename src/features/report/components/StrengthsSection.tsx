import type { DigitalPresenceReport } from "@/features/report/types/report.types";

import { ReportBenefitBullet } from "./ReportBenefitBullet";

const STRENGTH_ICON_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1792757133/Icon_1_ywcyec.svg";

export function StrengthsSection({ report }: { report: DigitalPresenceReport }) {
  if (report.strengths.length === 0) return null;

  const midpoint = Math.ceil(report.strengths.length / 2);
  const leftColumn = report.strengths.slice(0, midpoint);
  const rightColumn = report.strengths.slice(midpoint);

  return (
    <section
      aria-labelledby="strengths-heading"
      className="w-full space-y-8 md:space-y-12"
    >
      <div className="flex w-full flex-col items-center gap-2 text-center md:gap-3">
        <h2
          id="strengths-heading"
          className="font-title text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.25rem] lg:leading-[44px]"
        >
          Key <span className="text-[#2563EB]">Strengths</span>
        </h2>
        <p className="font-heading text-sm text-[#9EA5B3] sm:text-base">
          {report.isDemo
            ? "Illustrative, evidence-supported strengths for this sample report."
            : "Evidence-supported strengths from this assessment."}
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-10 md:gap-y-6 lg:gap-x-16">
        <div className="flex flex-col gap-3 md:gap-6">
          {leftColumn.map((item) => (
            <ReportBenefitBullet
              key={item.id}
              icon={STRENGTH_ICON_URL}
              label={item.title}
              description={item.explanation}
            />
          ))}
        </div>
        <div className="flex flex-col gap-3 md:gap-6">
          {rightColumn.map((item) => (
            <ReportBenefitBullet
              key={item.id}
              icon={STRENGTH_ICON_URL}
              label={item.title}
              description={item.explanation}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
