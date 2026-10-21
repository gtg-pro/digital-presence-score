import { Container } from "@/components/ui/container";
import { faqs } from "@/features/landing/data/faqs";

import { FAQAccordion } from "./FAQAccordion";

export function FAQSection() {
  return (
    <section
      id="faqs"
      aria-labelledby="faqs-heading"
      className="border-b border-border bg-background"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl lg:pt-2">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase sm:text-sm">
              Frequently Asked Questions
            </p>

            <h2
              id="faqs-heading"
              className="mt-4 font-display text-3xl leading-tight font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
            >
              Everything you need to know.
            </h2>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Learn how the assessment works, what we evaluate, and what to
              expect from your Digital Presence Score.
            </p>

            <p className="mt-6 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Answers reflect the current product: live assessments, on-screen
              reports, and PDF/PNG downloads. Email delivery and public sharing
              are not available.
            </p>
          </div>

          <FAQAccordion items={faqs} defaultOpenId={faqs[0]?.id} />
        </div>
      </Container>
    </section>
  );
}
