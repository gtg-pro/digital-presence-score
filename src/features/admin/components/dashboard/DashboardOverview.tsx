import Link from "next/link";

import {
  adminSubmissions,
  auditActivityOverview,
  overviewKpis,
} from "@/features/admin/data/admin.mock";
import { StatusBadge } from "@/features/admin/components/shared/StatusBadge";
import { DemoBanner } from "@/features/admin/components/shared/DemoBanner";

import { KPICard } from "./KPICard";
import { RecentActivity } from "./RecentActivity";

export function DashboardOverview() {
  const maxActivity = Math.max(...auditActivityOverview.map((item) => item.value));

  return (
    <div className="space-y-6">
      <DemoBanner />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard Overview
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Monitor digital assessments, generated reports, and application
          activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {overviewKpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-xl border border-border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Recent submissions
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Demo table data</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-2 py-3 font-medium">Business</th>
                  <th className="px-2 py-3 font-medium">Website</th>
                  <th className="px-2 py-3 font-medium">Submitted</th>
                  <th className="px-2 py-3 font-medium">Audit</th>
                  <th className="px-2 py-3 font-medium">Report</th>
                  <th className="px-2 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {adminSubmissions.slice(0, 4).map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-2 py-3 font-medium text-foreground">
                      {row.businessName}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {row.website ?? "—"}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {row.submittedAtLabel}
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge status={row.auditStatus} />
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {row.reportStatus}
                    </td>
                    <td className="px-2 py-3">
                      <Link
                        href="/admin/submissions"
                        className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">
              Audit activity overview
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Demo distribution</p>
            <ul className="mt-4 space-y-3">
              {auditActivityOverview.map((item) => (
                <li key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-foreground">{item.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${(item.value / maxActivity) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
