import { Container } from "@/components/ui/container";
import type { DigitalPresenceReport } from "@/features/report/types/report.types";

import { ActionPlanSection } from "./ActionPlanSection";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { ImprovementSection } from "./ImprovementSection";
import { OverallScore } from "./OverallScore";
import { ReportActions } from "./ReportActions";
import { ReportHeader } from "./ReportHeader";
import { StrategyCallCTA } from "./StrategyCallCTA";
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
    <Container className="py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <ReportHeader report={report} showDemoBadge={!live && report.isDemo} />
        <OverallScore report={report} />
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
        <ReportActions reportId={report.id} isDemo={report.isDemo} />
        <StrategyCallCTA />
      </div>
    </Container>
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
    <Container className="py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background p-8 shadow-sm">
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Live reports are short-lived session snapshots and are never replaced
          with demo fixture data.
        </p>
      </div>
    </Container>
  );
}
