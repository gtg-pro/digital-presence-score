import type { Metadata } from "next";

import { PendingPage } from "@/components/shared/pending-page";

export const metadata: Metadata = {
  title: "Assessment Methodology",
};

export default function MethodologyPage() {
  return (
    <PendingPage
      title="Assessment Methodology"
      description="An overview of the 100-point public digital-presence framework, category weights, and evidence rules will be documented on this page."
    />
  );
}
