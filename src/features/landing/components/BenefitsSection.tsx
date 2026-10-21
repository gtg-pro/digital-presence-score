import { Container } from "@/components/ui/container";
import { benefits } from "@/features/landing/data/benefits";

export function BenefitsSection() {
  return (
    <section
      id="why-it-matters"
      aria-labelledby="benefits-heading"
      className="border-b border-border bg-background"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl lg:pt-2">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase sm:text-sm">
              Why It Matters
            </p>

            <h2
              id="benefits-heading"
              className="mt-4 font-display text-3xl leading-tight font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
            >
              Stop guessing. Start improving.
            </h2>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Understand how your business appears online, identify
              opportunities for improvement, and focus on the changes that
              matter.
            </p>
          </div>

          <ul className="grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 sm:border-t sm:border-l sm:border-border">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <li
                  key={benefit.id}
                  className="border-b border-border py-6 sm:border-r sm:p-6"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground sm:text-lg">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
