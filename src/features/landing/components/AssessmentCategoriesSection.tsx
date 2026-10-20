import { Container } from "@/components/ui/container";
import {
  assessmentCategories,
  assessmentFrameworkTotalPoints,
} from "@/features/landing/data/assessment-categories";
import { cn } from "@/lib/cn";

import { AssessmentCategoryCard } from "./AssessmentCategoryCard";

export function AssessmentCategoriesSection() {
  return (
    <section
      id="what-we-check"
      aria-labelledby="what-we-check-heading"
      className="border-b border-border bg-background"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase sm:text-sm">
            A Complete Digital Assessment
          </p>

          <h2
            id="what-we-check-heading"
            className="mt-4 font-display text-3xl leading-tight font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
          >
            Five key areas. One clearer picture.
          </h2>

          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            We assess five essential areas of your public digital presence to
            help you understand what&apos;s working, what needs attention, and
            where to focus next.
          </p>
        </div>

        <ul className="mt-14 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8">
          {assessmentCategories.map((category, index) => (
            <li
              key={category.id}
              className={cn(
                "min-w-0",
                "lg:col-span-2",
                index === 3 && "lg:col-start-2",
              )}
            >
              <AssessmentCategoryCard category={category} />
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-sm text-muted-foreground sm:mt-12">
          <span className="font-medium text-foreground">
            {assessmentFrameworkTotalPoints}-Point Assessment Framework
          </span>
          <span className="mt-1 block sm:mt-0 sm:ml-2 sm:inline">
            Public digital presence signals only — not a measure of service
            quality or official search rankings.
          </span>
        </p>
      </Container>
    </section>
  );
}
