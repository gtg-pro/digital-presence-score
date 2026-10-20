import { recentActivity } from "@/features/admin/data/admin.mock";

export function RecentActivity() {
  return (
    <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Recent activity</h2>
      <p className="mt-1 text-xs text-muted-foreground">Demo events only</p>
      <ul className="mt-4 space-y-4">
        {recentActivity.map((event) => (
          <li key={event.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
            <p className="text-sm font-medium text-foreground">{event.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
            <p className="mt-1 text-xs text-muted-foreground">{event.occurredAtLabel}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
