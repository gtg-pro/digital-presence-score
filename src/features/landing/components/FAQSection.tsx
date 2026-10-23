import { faqs } from "@/features/landing/data/faqs";

import { FAQAccordion } from "./FAQAccordion";

export function FAQSection() {
  return (
    <section
      id="faqs"
      aria-labelledby="faqs-heading"
      className="relative isolate scroll-mt-28 overflow-hidden py-12"
    >
      <div className="relative z-10">
        <div className="mx-auto max-w-[756px] text-center">
          <h2
            id="faqs-heading"
            className="font-title text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-[3.25rem] lg:leading-[1.15]"
          >
            Everything you{" "}
            <span className="bg-gradient-to-r from-[#5182EF] to-[#2563EB] bg-clip-text text-transparent">
              need to know.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-[574px] font-button text-base leading-relaxed font-medium text-[#9EA5B3] sm:text-lg">
            Learn how the assessment works, what we evaluate, and what to expect
            from your Digital Presence Score.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-[914px]">
          <FAQAccordion items={faqs} defaultOpenId={faqs[0]?.id} />
        </div>
      </div>
    </section>
  );
}
