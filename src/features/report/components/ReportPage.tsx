"use client";

import { useMemo, useState } from "react";

import { Container } from "@/components/ui/container";
import { reportDemoFixtures } from "@/features/report/data/report.mock";
import type { ReportDemoKey } from "@/features/report/types/report.types";

import { ActionPlanSection } from "./ActionPlanSection";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { ImprovementSection } from "./ImprovementSection";
import { MethodologySection } from "./MethodologySection";
import { OverallScore } from "./OverallScore";
import { ReportActions } from "./ReportActions";
import { ReportDemoStateSelector } from "./ReportDemoStateSelector";
import { ReportHeader } from "./ReportHeader";
import { StrategyCallCTA } from "./StrategyCallCTA";
import { StrengthsSection } from "./StrengthsSection";
import { UnableToVerifySection } from "./UnableToVerifySection";

export type ReportPageProps = {
  /** Initial demo fixture derived from the route id or query. */
  initialDemoKey?: ReportDemoKey;
};

export function ReportPage({ initialDemoKey = "complete" }: ReportPageProps) {
  const [demoKey, setDemoKey] = useState<ReportDemoKey>(initialDemoKey);
  const [prevInitialKey, setPrevInitialKey] =
    useState<ReportDemoKey>(initialDemoKey);

  if (initialDemoKey !== prevInitialKey) {
    setPrevInitialKey(initialDemoKey);
    setDemoKey(initialDemoKey);
  }

  const report = useMemo(() => reportDemoFixtures[demoKey], [demoKey]);

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <ReportDemoStateSelector value={demoKey} onChange={setDemoKey} />
        <ReportHeader report={report} />
        <OverallScore report={report} />
        <CategoryBreakdown report={report} />
        <StrengthsSection report={report} />
        <ImprovementSection report={report} />
        <ActionPlanSection report={report} />
        <UnableToVerifySection report={report} />
        <MethodologySection report={report} />
        <ReportActions />
        <StrategyCallCTA />
      </div>
    </Container>
  );
}
