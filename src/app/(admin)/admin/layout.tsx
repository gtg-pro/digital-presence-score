import { Suspense } from "react";

import { AdminShell } from "@/features/admin/components/layout/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center p-8 text-sm text-muted-foreground">
          Loading admin…
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
