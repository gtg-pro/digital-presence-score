import { AssessmentCategoryCard } from "@/features/landing/components/AssessmentCategoryCard";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

function formatActionDescription(item: {
  priority: string;
  impact: string;
}): string {
  return `Consider this ${item.priority}-priority step to strengthen your digital presence (${item.impact} impact).`;
}

export function ActionPlanSection({
  report,
}: {
  report: DigitalPresenceReport;
}) {
  if (report.actionPlan.length === 0) return null;

  return (
    <section
      aria-labelledby="next-steps-heading"
      className="w-full space-y-8 md:space-y-12"
    >
      <div className="flex w-full flex-col items-center gap-2 text-center md:gap-3">
        <h2
          id="next-steps-heading"
          className="font-title text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.25rem] lg:leading-[44px]"
        >
          Suggested <span className="text-[#2563EB]">Next Steps</span>
        </h2>
        <p className="font-heading text-sm text-[#9EA5B3] sm:text-base">
          A practical sequence of improvements tailored to this website.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {report.actionPlan.map((item, index) => (
          <AssessmentCategoryCard
            key={item.id}
            index={index}
            showMaxPoints={false}
            className="p-8 md:p-10"
            category={{
              id: item.id,
              title: item.action,
              description: formatActionDescription(item),
            }}
          />
        ))}
      </div>
    </section>
  );
}
