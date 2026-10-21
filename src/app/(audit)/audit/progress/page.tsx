import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditProgressPage } from "@/features/audit/components/AuditProgressPage";
import { loadPendingAudit } from "@/features/audit/lib/pending-audit-session";

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
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
          Preparing assessment…
        </div>
      }
    >
      <AuditProgressLoader />
    </Suspense>
  );
}
