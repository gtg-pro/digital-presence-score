import type { Metadata } from "next";

import { PendingPage } from "@/components/shared/pending-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <PendingPage
      title="Privacy Policy"
      description="Details about how we collect, use, and protect information related to Digital Presence Score assessments will appear here."
    />
  );
}
