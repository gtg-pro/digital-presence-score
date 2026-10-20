import type { Metadata } from "next";

import { EmailsPage } from "@/features/admin/components/emails/EmailsPage";

export const metadata: Metadata = {
  title: "Email Activity",
};

export default function AdminEmailsRoute() {
  return <EmailsPage />;
}
