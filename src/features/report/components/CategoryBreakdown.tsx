import type { DigitalPresenceReport } from "@/features/report/types/report.types";

import { CategoryScoreCard } from "./CategoryScoreCard";

export function CategoryBreakdown({ report }: { report: DigitalPresenceReport }) {
  return (
    <section aria-labelledby="categories-heading" className="space-y-5">
      <div>
        <h2
          id="categories-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Assessment categories
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {report.outcome === "limited"
            ? "Only applicable observations are shown. Missing categories remain Not Assessed without invented scores."
            : "Five-category framework with scores shown only where evidence was assessed."}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {report.categories.map((category) => (
          <CategoryScoreCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
