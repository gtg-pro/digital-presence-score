import { Container } from "@/components/ui/container";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { ReadyToBuildSection } from "@/features/landing/components/ReadyToBuildSection";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

import { ActionPlanSection } from "./ActionPlanSection";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { ImprovementSection } from "./ImprovementSection";
import { OverallScore } from "./OverallScore";
import { ReportActions } from "./ReportActions";
import { ReportHeader } from "./ReportHeader";
import { StrengthsSection } from "./StrengthsSection";

export type ReportResultViewProps = {
  report: DigitalPresenceReport;
  /** When true, never show demo selectors or demo badges. */
  live?: boolean;
};

/**
 * Presentational report card for demo or live mapped AssessmentResult data.
 * Does not fetch, score, or fall back to fixtures.
 */
export function ReportResultView({
  report,
  live = !report.isDemo,
}: ReportResultViewProps) {
  return (
    <>
      <HeroSection
        sectionId="report-hero"
        headingId="report-hero-heading"
        badgeText="Digital Presence Assessment"
        heading="Your Digital Assessment Results Are In"
        description="Your assessment is complete. Explore your digital performance, discover key strengths, and identify opportunities to strengthen your online presence and drive business growth."
        showUrlInput={false}
        showFooterNote={false}
      />

      <div className="bg-black">
        <Container className="py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-5xl space-y-14 sm:space-y-16 lg:space-y-20">
            <section className="rounded-2xl border border-white/10 bg-[#0F1114] p-6 sm:p-8 lg:p-10">
              <ReportHeader
                report={report}
                showDemoBadge={!live && report.isDemo}
              />
              <div className="mt-8">
                <OverallScore report={report} />
              </div>
            </section>

            {report.outcome !== "limited" ? (
              <CategoryBreakdown report={report} />
            ) : null}
            {report.outcome !== "limited" ? (
              <StrengthsSection report={report} />
            ) : null}
            {report.outcome !== "limited" ? (
              <ImprovementSection report={report} />
            ) : null}
            {report.outcome !== "limited" ? (
              <ActionPlanSection report={report} />
            ) : null}
            <ReportActions report={report} />
          </div>
        </Container>

        <ReadyToBuildSection />
      </div>
    </>
  );
}

export function ReportUnavailableState({
  title = "Report unavailable",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="bg-black">
      <Container className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#0F1114] p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#9EA5B3]">
            {message}
          </p>
          <p className="mt-4 text-sm text-[#9EA5B3]">
            Live reports are short-lived session snapshots and are never replaced
            with demo fixture data.
          </p>
        </div>
      </Container>
    </div>
  );
}
