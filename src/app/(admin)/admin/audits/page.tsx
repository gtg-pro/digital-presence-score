import type { Metadata } from "next";

import { AuditsPage } from "@/features/admin/components/audits/AuditsPage";

export const metadata: Metadata = {
  title: "Admin Audits",
};

export default function AdminAuditsRoute() {
  return <AuditsPage />;
}
