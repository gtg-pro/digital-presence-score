import type { Metadata } from "next";

import { CtaAnalyticsPage } from "@/features/admin/components/analytics/CtaAnalyticsPage";

export const metadata: Metadata = {
  title: "CTA Analytics",
};

export default function AdminCtaAnalyticsRoute() {
  return <CtaAnalyticsPage />;
}
