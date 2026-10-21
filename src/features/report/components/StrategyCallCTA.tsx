import Link from "next/link";

/**
 * Honest next-step CTA — no invented booking destinations or strategy-call
 * integrations. Points users back to a real assessment start.
 */
export function StrategyCallCTA() {
  return (
    <section
      aria-labelledby="strategy-call-heading"
      className="rounded-2xl bg-foreground px-6 py-10 text-center text-background sm:px-10"
    >
      <h2
        id="strategy-call-heading"
        className="font-display text-2xl font-medium tracking-tight sm:text-3xl"
      >
        Ready to measure again after you make changes?
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-background/75 sm:text-base">
        Use the prioritized recommendations in this report, then run a fresh
        assessment whenever you want an updated snapshot. Booking and advisory
        scheduling are not offered here.
      </p>
      <Link
        href="/#home"
        className="mt-6 inline-flex h-12 cursor-pointer items-center justify-center rounded-lg bg-background px-6 text-sm font-medium text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
      >
        Start a new assessment
      </Link>
    </section>
  );
}
