import type { DigitalPresenceReport } from "@/features/report/types/report.types";

import { CategoryScoreCard } from "./CategoryScoreCard";

export function CategoryBreakdown({
  report,
}: {
  report: DigitalPresenceReport;
}) {
  return (
    <section aria-labelledby="categories-heading" className="w-full space-y-8">
      <div className="w-full text-center">
        <h2
          id="categories-heading"
          className="font-title text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.25rem]"
        >
          Assessment <span className="text-[#2563EB]">Categories</span>
        </h2>
        <p className="mt-3 font-heading text-sm text-[#9EA5B3] sm:text-base">
          {report.outcome === "limited"
            ? "Only applicable observations are shown. Missing categories remain Not Assessed without invented scores."
            : "Five-category framework with scores shown only where evidence was assessed."}
        </p>
      </div>

      <div className="w-full">
        {report.categories.map((category) => (
          <CategoryScoreCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
