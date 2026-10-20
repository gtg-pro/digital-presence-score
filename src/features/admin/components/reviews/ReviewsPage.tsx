import { Button } from "@/components/ui/button";
import { DemoBanner } from "@/features/admin/components/shared/DemoBanner";
import { StatusBadge } from "@/features/admin/components/shared/StatusBadge";
import { adminReviews } from "@/features/admin/data/admin.mock";

export function ReviewsPage() {
  return (
    <div className="space-y-6">
      <DemoBanner />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Review & Corrections
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Correction actions are visual placeholders and do not modify demo
          data. Future implementations must preserve original assessments.
        </p>
      </div>

      <div className="space-y-4">
        {adminReviews.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-border bg-background p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{item.id}</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {item.businessName}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Report {item.reportId}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Reason
                </dt>
                <dd className="mt-1 text-foreground">{item.reason}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Evidence reference
                </dt>
                <dd className="mt-1 text-foreground">{item.evidenceReference}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Original result
                </dt>
                <dd className="mt-1 text-foreground">{item.originalResult}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Proposed corrected result
                </dt>
                <dd className="mt-1 text-foreground">{item.proposedResult}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled>
                View evidence
              </Button>
              <Button type="button" variant="secondary" disabled>
                Add review note
              </Button>
              <Button type="button" variant="outline" disabled>
                Approve correction
              </Button>
              <Button type="button" variant="ghost" disabled>
                Reject correction
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
