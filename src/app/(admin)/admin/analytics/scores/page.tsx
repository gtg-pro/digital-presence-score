import type { Metadata } from "next";

import { ScoreAnalyticsPage } from "@/features/admin/components/analytics/ScoreAnalyticsPage";

export const metadata: Metadata = {
  title: "Score Analytics",
};

export default function AdminScoreAnalyticsRoute() {
  return <ScoreAnalyticsPage />;
}
