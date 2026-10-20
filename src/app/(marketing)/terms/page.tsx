import type { Metadata } from "next";

import { PendingPage } from "@/components/shared/pending-page";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <PendingPage
      title="Terms of Service"
      description="Terms governing use of Digital Presence Score will be published here before the product goes live."
    />
  );
}
