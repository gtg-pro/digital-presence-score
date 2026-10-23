import {
  assessmentCategories,
  assessmentFrameworkTotalPoints,
} from "@/features/landing/data/assessment-categories";

import { AssessmentCategoryCard } from "./AssessmentCategoryCard";

export function AssessmentCategoriesSection() {
  return (
    <section
      id="what-we-check"
      aria-labelledby="what-we-check-heading"
      className="relative isolate scroll-mt-28 py-12"
    >
      <div className="relative z-10">
        <div className="mx-auto max-w-[874px] text-center">
          <h2
            id="what-we-check-heading"
            className="text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-[3.25rem] lg:leading-[1.15]"
          >
            Five key areas. One{" "}
            <span className="bg-gradient-to-r from-[#5182EF] to-[#2563EB] bg-clip-text text-transparent">
              clearer picture.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-[694px] text-base leading-relaxed font-medium text-[#9EA5B3] sm:text-lg">
            We assess five essential areas of your public digital presence to
            help you understand what&apos;s working, what needs attention, and
            where to focus next.
          </p>
        </div>

        <ul className="mt-14 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 md:gap-5">
          {assessmentCategories.map((category, index) => (
            <li key={category.id} className="min-w-0">
              <AssessmentCategoryCard category={category} index={index} />
            </li>
          ))}

          <li className="min-w-0">
            <article className="relative h-full rounded-2xl border border-white/[0.04] bg-[#0F1114] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] md:p-6">
              <h3 className="text-base font-medium tracking-tight text-white md:text-lg">
                {assessmentFrameworkTotalPoints}-Point Assessment Framework
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-gray-400 md:text-sm">
                Public digital presence signals only — not a measure of service
                quality or official search rankings.
              </p>
            </article>
          </li>
        </ul>
      </div>
    </section>
  );
}
