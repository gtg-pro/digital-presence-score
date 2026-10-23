import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditProgressPage } from "@/features/audit/components/AuditProgressPage";
import { loadPendingAudit } from "@/features/audit/lib/pending-audit-session";
import { HeroSection } from "@/features/landing/components/HeroSection";

export const metadata: Metadata = {
  title: "Assessment Progress",
  description:
    "Live digital-presence assessment progress, or demo snapshots via ?demo=1.",
};

async function AuditProgressLoader() {
  // Cookie read opts this route into request-time rendering for live audits.
  const pending = await loadPendingAudit();
  return <AuditProgressPage hasPendingSession={pending !== null} />;
}

export default function AuditProgressRoutePage() {
  return (
    <>
      <HeroSection
        sectionId="audit-progress-hero"
        headingId="audit-progress-hero-heading"
        badgeText="Digital Presence Assessment"
        heading="Let's Discover Your Digital Potential."
        description="Tell us a little about your business to get a clearer picture of your online presence, identify opportunities for improvement, and receive personalized recommendations to strengthen your digital growth."
        showUrlInput={false}
        showFooterNote={false}
      />
      <Suspense
        fallback={
          <div className="bg-black px-4 py-16 text-center text-sm text-[#9EA5B3]">
            Preparing assessment…
          </div>
        }
      >
        <AuditProgressLoader />
      </Suspense>
    </>
  );
}
