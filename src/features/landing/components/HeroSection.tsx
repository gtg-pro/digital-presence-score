import Link from "next/link";

import { SiteLogo } from "@/components/shared/site-logo";
import { Container } from "@/components/ui/container";

import { WebsiteUrlInput } from "./WebsiteUrlInput";

export function HeroSection() {
  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="border-b border-border bg-background"
    >
      <Container className="flex flex-col items-center py-10 text-center sm:py-12 lg:py-14">
        <SiteLogo
          width={352}
          priority
          className="h-auto w-full max-w-[18rem] sm:max-w-[22rem]"
        />

        <h1
          id="hero-heading"
          className="mt-3 max-w-3xl font-display text-4xl leading-[1.1] font-medium tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          How strong is your business online?
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
          Discover how well your online presence helps customers find, trust,
          and contact your business. Get a clear assessment with actionable
          recommendations.
        </p>

        <div className="mt-6 w-full max-w-2xl sm:mt-8">
          <WebsiteUrlInput />

          <p className="mt-3 text-sm text-muted-foreground">
            A public digital-presence assessment. No login required.
          </p>

          <p className="mt-2 text-sm">
            <Link
              href="/audit"
              className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              Don&apos;t have a website? Start with business details
            </Link>
          </p>
        </div>

        <p className="mt-6 max-w-xl text-xs leading-relaxed text-muted-foreground sm:mt-8 sm:text-sm">
          This assessment evaluates publicly observable digital presence, not
          actual service quality or official search-engine rankings.
        </p>
      </Container>
    </section>
  );
}
