import type { Metadata } from "next";

import { SubmissionsPage } from "@/features/admin/components/submissions/SubmissionsPage";

export const metadata: Metadata = {
  title: "Admin Submissions",
};

export default function AdminSubmissionsRoute() {
  return <SubmissionsPage />;
}
