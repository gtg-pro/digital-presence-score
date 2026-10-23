import { HowItWorksSteps } from "./HowItWorksSteps";

/**
 * How It Works content column.
 * Wave artwork lives on LandingSectionsShell behind this content.
 */
export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="relative isolate scroll-mt-28 py-12"
    >
      <div className="relative z-10">
        <h2
          id="how-it-works-heading"
          className="text-center text-4xl leading-tight font-semibold text-white md:text-5xl"
        >
          Understand Your Digital Presence In{" "}
          <span className="text-blue-500">3 Simple Steps.</span>
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-center text-base text-gray-400">
          From your website URL to a clear action plan, discover where your
          business stands and what needs improvement.
        </p>

        <HowItWorksSteps />
      </div>
    </section>
  );
}
