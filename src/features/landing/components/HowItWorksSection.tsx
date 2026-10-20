import { Container } from "@/components/ui/container";
import { howItWorksSteps } from "@/features/landing/data/how-it-works";
import { cn } from "@/lib/cn";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="border-b border-border bg-background"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase sm:text-sm">
            Simple. Clear. Actionable.
          </p>

          <h2
            id="how-it-works-heading"
            className="mt-4 font-display text-3xl leading-tight font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
          >
            Understand your digital presence in 3 simple steps.
          </h2>

          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            From your website URL to a clear action plan, discover where your
            business stands and what needs improvement.
          </p>
        </div>

        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-14 right-[16%] left-[16%] hidden h-px bg-border md:block"
          />

          <ol className="grid list-none gap-6 p-0 md:grid-cols-3 md:gap-8">
            {howItWorksSteps.map((step) => {
              const Icon = step.icon;

              return (
                <li
                  key={step.number}
                  className={cn(
                    "relative flex flex-col rounded-xl border border-border bg-background p-6 text-left",
                    "transition-colors hover:border-foreground/30",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs font-medium tracking-wider text-muted-foreground">
                      {step.number}
                    </span>
                    <span className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}
