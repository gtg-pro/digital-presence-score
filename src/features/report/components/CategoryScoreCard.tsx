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

  return (
    <article className="border-b border-white/10 py-6 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-title text-base font-semibold tracking-tight text-white sm:text-lg">
          {category.title}
        </h3>
        <p className="font-heading text-sm font-medium tabular-nums sm:text-base">
          {hasScore ? (
            <>
              <span className="text-white">
                {category.earned}/{category.maxPoints}
              </span>{" "}
              <span className="text-[#2563EB]">{percent}%</span>
            </>
          ) : (
            <span className="text-[#9EA5B3]">
              —/{category.maxPoints} Limited information
            </span>
          )}
        </p>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
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
            "h-full rounded-full bg-[#2563EB]",
            !hasScore && "w-0 bg-transparent",
          )}
          style={hasScore ? { width: `${percent}%` } : undefined}
        />
      </div>

      <p className="mt-3 font-heading text-sm leading-relaxed text-[#9EA5B3]">
        {category.summary}
      </p>
    </article>
  );
}
