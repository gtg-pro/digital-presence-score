import { Button } from "@/components/ui/button";
import { DemoBanner } from "@/features/admin/components/shared/DemoBanner";
import { StatusBadge } from "@/features/admin/components/shared/StatusBadge";
import { adminEmails, emailKpis } from "@/features/admin/data/admin.mock";

export function EmailsPage() {
  return (
    <div className="space-y-6">
      <DemoBanner />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Email Activity
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Delivery monitoring UI with demo-only records. No email provider is
          connected.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {emailKpis.map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-border bg-background p-5 shadow-sm"
          >
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {item.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-foreground">
              {item.value}
            </p>
          </article>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Email ID</th>
              <th className="px-4 py-3 font-medium">Recipient</th>
              <th className="px-4 py-3 font-medium">Related report</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {adminEmails.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.recipient}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {row.relatedReportId}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.dateLabel}</td>
                <td className="px-4 py-3">
                  <Button type="button" variant="ghost" disabled className="h-9">
                    View details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
