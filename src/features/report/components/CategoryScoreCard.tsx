import type { ReportCategoryResult } from "@/features/report/types/report.types";
import { cn } from "@/lib/cn";

export function CategoryScoreCard({
  category,
}: {
  category: ReportCategoryResult;
}) {
  const hasScore = category.earned !== null;
  const percent = hasScore
    ? Math.round((category.earned! / category.maxPoints) * 100)
    : 0;
  const statusLabel =
    category.statusLabel ??
    (category.status === "assessed"
      ? "Reviewed"
      : category.status === "partially_assessed"
        ? "Partially reviewed"
        : "Limited information");

  return (
    <article className="rounded-xl border border-border bg-background p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {category.title}
          </h3>
          <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {statusLabel}
          </p>
        </div>
        <p className="font-mono text-sm font-semibold text-foreground">
          {hasScore ? `${category.earned}/${category.maxPoints}` : `—/${category.maxPoints}`}
        </p>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
        role={hasScore ? "progressbar" : undefined}
        aria-valuenow={hasScore ? category.earned! : undefined}
        aria-valuemin={0}
        aria-valuemax={category.maxPoints}
        aria-label={
          hasScore
            ? `${category.title}: ${category.earned} of ${category.maxPoints}`
            : `${category.title}: limited information`
        }
      >
        <div
          className={cn(
            "h-full rounded-full bg-foreground",
            !hasScore && "w-0 bg-transparent",
          )}
          style={hasScore ? { width: `${percent}%` } : undefined}
        />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {category.summary}
      </p>
    </article>
  );
}
