import type { Metadata } from "next";

import { AuditProgressPage } from "@/features/audit/components/AuditProgressPage";

export const metadata: Metadata = {
  title: "Assessment Progress",
  description:
    "Preview the digital-presence assessment progress experience (demo snapshots only).",
};

export default function AuditProgressRoutePage() {
  return <AuditProgressPage />;
}
