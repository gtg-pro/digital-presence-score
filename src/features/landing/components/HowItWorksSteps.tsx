import { howItWorksSteps } from "@/features/landing/data/how-it-works";

/**
 * Figma Steps node `12354:47601`
 * — 3 × 294px columns, gap 16px
 * — icon + gradient number row (right-aligned, ~16px overlap)
 * — title/description below
 */
export function HowItWorksSteps() {
  return (
    <ol className="mt-8 grid list-none grid-cols-1 justify-items-center gap-10 p-0 md:grid-cols-3 md:justify-items-stretch md:gap-4">
      {howItWorksSteps.map((step) => {
        const Icon = step.icon;

        return (
          <li
            key={step.number}
            className="relative w-full max-w-[294px] pt-0 text-left"
          >
            <div className="relative flex h-24 items-center justify-end px-4">
              <div className="relative flex items-center">
                <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-neutral-900 text-white shadow-lg shadow-black/50">
                  {step.iconSrc ? (
                    <img
                      src={step.iconSrc}
                      alt=""
                      width={24}
                      height={24}
                      aria-hidden="true"
                      className="size-6"
                    />
                  ) : Icon ? (
                    <Icon
                      className="size-6"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  ) : null}
                </span>

                <span
                  aria-hidden="true"
                  className="pointer-events-none relative z-0 -ml-4 select-none whitespace-nowrap bg-[linear-gradient(180deg,#9a9da6_0%,#6b6e77_45%,rgba(40,42,48,0.35)_100%)] bg-clip-text text-[72px] font-bold leading-none tracking-tight text-transparent tabular-nums md:text-[96px]"
                >
                  {step.number}
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-5 px-4">
              <h3 className="font-title text-lg leading-snug font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 font-heading text-sm leading-relaxed text-gray-400">
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
