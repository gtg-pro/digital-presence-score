import type { Metadata } from "next";

import { ReportsPage } from "@/features/admin/components/reports/ReportsPage";

export const metadata: Metadata = {
  title: "Admin Reports",
};

export default function AdminReportsRoute() {
  return <ReportsPage />;
}
