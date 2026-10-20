import Link from "next/link";

import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

export function PrimaryCTASection() {
  return (
    <section
      id="get-started"
      aria-labelledby="get-started-heading"
      className="border-b border-border bg-background"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="rounded-2xl bg-foreground px-6 py-12 text-center text-background sm:px-10 sm:py-14 lg:px-16 lg:py-16">
          <h2
            id="get-started-heading"
            className="mx-auto max-w-2xl font-display text-3xl leading-tight font-medium tracking-tight sm:text-4xl lg:text-[2.5rem]"
          >
            Ready to see how your business performs online?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-background/75 sm:text-lg">
            Get a clear digital-presence assessment with practical findings and
            recommendations tailored to your business.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/audit"
              className={cn(
                "inline-flex h-12 w-full items-center justify-center rounded-lg bg-background px-6 text-sm font-medium text-foreground sm:w-auto",
                "transition-opacity hover:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground",
              )}
            >
              Get My Free Report Card
            </Link>

            <Link
              href="/#how-it-works"
              className={cn(
                "text-sm font-medium text-background underline decoration-background/40 underline-offset-4",
                "transition-colors hover:decoration-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground rounded-sm",
              )}
            >
              See How It Works
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
