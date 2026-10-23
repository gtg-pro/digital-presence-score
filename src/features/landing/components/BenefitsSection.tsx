import { benefits } from "@/features/landing/data/benefits";

export function BenefitsSection() {
  return (
    <section
      id="why-it-matters"
      aria-labelledby="benefits-heading"
      className="relative isolate scroll-mt-28 overflow-hidden py-12"
    >
      <div className="relative z-10">
        <div className="mx-auto max-w-[874px] text-center">
          <h2
            id="benefits-heading"
            className="text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-[3.25rem] lg:leading-[1.15]"
          >
            Stop guessing. Start{" "}
            <span className="bg-gradient-to-r from-[#5182EF] to-[#2563EB] bg-clip-text text-transparent">
              improving.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-[694px] text-base leading-relaxed font-medium text-[#9EA5B3] sm:text-lg">
            Understand how your business appears online, identify opportunities
            for improvement, and focus on the changes that matter.
          </p>
        </div>

        <ul className="mt-14 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 md:gap-5">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <li key={benefit.id} className="min-w-0">
                <article className="flex h-full flex-col items-center rounded-2xl bg-[#0F1114] px-6 py-6 text-center">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 shadow-[0_0_10px_rgba(255,255,255,0.1),0_0_20px_rgba(148,163,184,0.12)]"
                  >
                    <Icon
                      className="h-5 w-5 text-white"
                      strokeWidth={1.75}
                    />
                  </span>

                  <h3 className="mt-4 text-base font-medium tracking-tight text-white md:text-[17px]">
                    {benefit.title}
                  </h3>

                  <p className="mx-auto mt-2 max-w-[17rem] text-sm leading-relaxed text-gray-400">
                    {benefit.description}
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
