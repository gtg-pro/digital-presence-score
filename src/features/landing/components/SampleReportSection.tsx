import { Info } from "lucide-react";

import { sampleReport } from "@/features/report/data/sample-report";

import { SampleReportCard } from "./SampleReportCard";

export function SampleReportSection() {
  return (
    <section
      id="sample-report"
      aria-labelledby="sample-report-heading"
      className="relative isolate scroll-mt-28 py-12"
    >
      <div className="relative z-10">
        <div className="mx-auto max-w-[874px] text-center">
          <h2
            id="sample-report-heading"
            className="text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-[3.25rem] lg:leading-[1.15]"
          >
            Know where you stand. See what{" "}
            <span className="bg-gradient-to-r from-[#5182EF] to-[#2563EB] bg-clip-text text-transparent">
              to improve.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-[694px] text-base leading-relaxed font-medium text-[#9EA5B3] sm:text-lg">
            Get a clear picture of your business&apos;s digital presence with
            category-level assessments, evidence-backed findings, and practical
            recommendations.
          </p>
        </div>

        <div className="mx-auto mt-12 flex w-full max-w-[914px] gap-3 rounded-2xl border border-white/[0.06] bg-[#0F1114] px-4 py-5 text-left shadow-[0_8px_40px_rgba(0,0,0,0.45)] sm:gap-4 sm:px-6 sm:py-8 md:px-8">
          <Info
            className="mt-0.5 size-6 shrink-0 text-white sm:size-8"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-base font-medium text-white">Sample Report</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              The report card below is an intentional illustrative example with
              example scores and findings. It is not a verified assessment of a
              real business and is separate from live audit results.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-8 w-full min-w-0 max-w-[914px]">
          <SampleReportCard report={sampleReport} />
        </div>
      </div>
    </section>
  );
}
