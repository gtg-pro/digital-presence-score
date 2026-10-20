import type { Metadata } from "next";

import { DashboardOverview } from "@/features/admin/components/dashboard/DashboardOverview";

export const metadata: Metadata = {
  title: "Admin Overview",
};

export default function AdminOverviewPage() {
  return <DashboardOverview />;
}
