import type { AssessmentCategory } from "@/features/landing/data/assessment-categories";
import { cn } from "@/lib/cn";

export type AssessmentCategoryCardProps = {
  /** Full landing category, or a title/description pair for reuse (e.g. report next steps). */
  category: Pick<AssessmentCategory, "title" | "description"> &
    Partial<Pick<AssessmentCategory, "id" | "maxPoints">>;
  index?: number;
  className?: string;
  /** When false, hides the Max pts column (report next-step cards). Default true. */
  showMaxPoints?: boolean;
};

export function AssessmentCategoryCard({
  category,
  index = 0,
  className,
  showMaxPoints = true,
}: AssessmentCategoryCardProps) {
  const stepLabel = String(index + 1).padStart(2, "0");
  const maxPoints = category.maxPoints;

  return (
    <article
      className={cn(
        "relative h-full rounded-2xl border border-white/[0.04] bg-[#0F1114] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] md:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-medium text-white shadow-[0_0_10px_rgba(255,255,255,0.1),0_0_20px_rgba(148,163,184,0.12)]"
          >
            {stepLabel}
          </span>
          <h3 className="font-title text-base font-medium tracking-tight text-white md:text-lg">
            {category.title}
          </h3>
        </div>

        {showMaxPoints && maxPoints != null ? (
          <div className="shrink-0 text-right font-heading leading-tight">
            <div className="text-[11px] text-gray-400">Max</div>
            <div className="text-sm font-medium text-gray-300">
              {maxPoints} pts
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-4 font-heading text-[13px] leading-relaxed text-gray-400 md:text-sm">
        {category.description}
      </p>
    </article>
  );
}
