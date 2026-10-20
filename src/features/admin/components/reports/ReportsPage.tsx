import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DemoBanner } from "@/features/admin/components/shared/DemoBanner";
import { StatusBadge } from "@/features/admin/components/shared/StatusBadge";
import { adminReports } from "@/features/admin/data/admin.mock";

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <DemoBanner />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Reports
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage illustrative report records. Only View Report opens a demo
          route. Downloads are disabled placeholders.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Report ID</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Coverage</th>
              <th className="px-4 py-3 font-medium">Generated</th>
              <th className="px-4 py-3 font-medium">Share</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminReports.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                <td className="px-4 py-3 font-medium">{row.businessName}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.reportType} />
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {row.overallScore !== null ? `${row.overallScore}/100` : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {row.evidenceCoveragePercent}%
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.generatedAtLabel}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.shareStatus} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={row.demoReportPath}
                      className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      View report
                    </Link>
                    <Button type="button" variant="secondary" disabled className="h-9">
                      Download PDF
                    </Button>
                    <Button type="button" variant="secondary" disabled className="h-9">
                      Download PNG
                    </Button>
                    <Button type="button" variant="ghost" disabled className="h-9">
                      Manage sharing
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
