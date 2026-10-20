import { Button } from "@/components/ui/button";

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
        Ready to turn these insights into action?
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-background/75 sm:text-base">
        Discuss your results and explore practical ways to strengthen your
        business&apos;s digital presence.
      </p>
      <Button
        type="button"
        disabled
        className="mt-6 h-12 border-0 bg-background px-6 text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
        title="Booking destination will be finalized later"
        aria-label="Book a strategy call (placeholder — not connected)"
      >
        Book a Strategy Call
      </Button>
      <p className="mt-3 text-xs text-background/60">
        Booking is not connected in this frontend preview.
      </p>
    </section>
  );
}
