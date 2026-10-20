import { Container } from "@/components/ui/container";
import { sampleReport } from "@/features/report/data/sample-report";

import { SampleReportCard } from "./SampleReportCard";

export function SampleReportSection() {
  return (
    <section
      id="sample-report"
      aria-labelledby="sample-report-heading"
      className="border-b border-border bg-background"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl lg:pt-4">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase sm:text-sm">
              Your Results, Simplified
            </p>

            <h2
              id="sample-report-heading"
              className="mt-4 font-display text-3xl leading-tight font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
            >
              Know where you stand. See what to improve.
            </h2>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Get a clear picture of your business&apos;s digital presence with
              category-level assessments, evidence-backed findings, and
              practical recommendations.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-muted-foreground sm:text-[0.9375rem]">
              <li className="flex gap-2.5">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground"
                  aria-hidden="true"
                />
                Category scores shown when enough public evidence is available.
              </li>
              <li className="flex gap-2.5">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground"
                  aria-hidden="true"
                />
                Findings tied to observable signals — not service quality
                ratings.
              </li>
              <li className="flex gap-2.5">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground"
                  aria-hidden="true"
                />
                Prioritized next steps you can act on without guessing.
              </li>
            </ul>

            <p className="mt-8 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              The report card on the right is a{" "}
              <span className="font-medium text-foreground">demo preview</span>{" "}
              with illustrative scores and findings. It is not a verified
              assessment of a real business.
            </p>
          </div>

          <SampleReportCard report={sampleReport} />
        </div>
      </Container>
    </section>
  );
}
