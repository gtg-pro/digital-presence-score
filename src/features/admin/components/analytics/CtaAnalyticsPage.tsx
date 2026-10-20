import { DemoBanner } from "@/features/admin/components/shared/DemoBanner";
import { ctaAnalyticsDemo } from "@/features/admin/data/admin.mock";

export function CtaAnalyticsPage() {
  const data = ctaAnalyticsDemo;
  const maxViews = Math.max(...data.weeklyActivity.map((item) => item.views), 1);

  return (
    <div className="space-y-6">
      <DemoBanner />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          CTA Analytics
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{data.note}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Report views" value={data.reportViews} />
        <Metric label="CTA clicks" value={data.ctaClicks} />
        <Metric label="Booking page visits" value={data.bookingPageVisits} />
        <Metric label="Confirmed bookings" value={data.confirmedBookings} />
        <Metric
          label="Report-to-CTA rate"
          value={`${data.reportToCtaRatePercent}%`}
        />
      </div>

      <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">
          Weekly activity (demo)
        </h3>
        <div className="mt-6 flex items-end gap-3 sm:gap-4">
          {data.weeklyActivity.map((item) => (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <div
                  className="w-3 rounded-t bg-foreground/30 sm:w-4"
                  style={{ height: `${(item.views / maxViews) * 100}%` }}
                  title={`Views ${item.views}`}
                />
                <div
                  className="w-3 rounded-t bg-foreground sm:w-4"
                  style={{
                    height: `${(item.clicks / maxViews) * 100}%`,
                  }}
                  title={`Clicks ${item.clicks}`}
                />
              </div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Light bars = report views · Dark bars = CTA clicks. Demo visualization
          only.
        </p>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </article>
  );
}
