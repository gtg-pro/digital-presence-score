import type { AssessmentCategory } from "@/features/landing/data/assessment-categories";
import { cn } from "@/lib/cn";

export type AssessmentCategoryCardProps = {
  category: AssessmentCategory;
  className?: string;
};

export function AssessmentCategoryCard({
  category,
  className,
}: AssessmentCategoryCardProps) {
  const Icon = category.icon;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-border bg-background p-6 text-left",
        "transition-colors hover:border-foreground/30",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <p className="text-right">
          <span className="block font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Max
          </span>
          <span className="mt-0.5 block text-sm font-semibold text-foreground">
            {category.maxPoints} pts
          </span>
        </p>
      </div>

      <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
        {category.title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
        {category.description}
      </p>
    </article>
  );
}
