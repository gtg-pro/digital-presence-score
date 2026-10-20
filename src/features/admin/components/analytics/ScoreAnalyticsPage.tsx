import { DemoBanner } from "@/features/admin/components/shared/DemoBanner";
import { scoreAnalyticsDemo } from "@/features/admin/data/admin.mock";

export function ScoreAnalyticsPage() {
  const data = scoreAnalyticsDemo;
  const maxDist = Math.max(...data.distribution.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <DemoBanner />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Score Analytics
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Demo datasets only. {data.excludedNote}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average score" value={`${data.averageScore}/100`} />
        <StatCard
          label="Eligible reports"
          value={String(data.eligibleReportCount)}
        />
        <StatCard
          label="Avg evidence coverage"
          value={`${data.evidenceCoverageAverage}%`}
        />
        <StatCard label="Scoring version" value={data.scoringVersion} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">
            Score distribution
          </h3>
          <ul className="mt-4 space-y-3">
            {data.distribution.map((item) => (
              <li key={item.band}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.band}</span>
                  <span className="font-mono text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${(item.count / maxDist) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">
            Maturity band distribution
          </h3>
          <ul className="mt-4 space-y-3">
            {data.maturityBands.map((item) => (
              <li key={item.band}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.band}</span>
                  <span className="font-mono text-muted-foreground">
                    {item.percent}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">
          Category-wise average scores
        </h3>
        <ul className="mt-4 space-y-3">
          {data.categoryAverages.map((item) => (
            <li key={item.category}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{item.category}</span>
                <span className="font-mono text-muted-foreground">
                  {item.average}/{item.max}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{ width: `${(item.average / item.max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Demo placeholder</p>
    </article>
  );
}
