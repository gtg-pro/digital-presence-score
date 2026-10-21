import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditProgressPage } from "@/features/audit/components/AuditProgressPage";

export const metadata: Metadata = {
  title: "Assessment Progress",
  description:
    "Live digital-presence assessment progress, or demo snapshots via ?demo=1.",
};

export default function AuditProgressRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
          Preparing assessment…
        </div>
      }
    >
      <AuditProgressPage />
    </Suspense>
  );
}
