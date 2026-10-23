import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { getRecaptchaSiteKey } from "@/lib/recaptcha/verify-recaptcha";

import { WebsiteUrlInput } from "./WebsiteUrlInput";

const HERO_BACKGROUND_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1792669186/Hero_Section_bkqzlk.svg";

export function HeroSection() {
  const recaptchaSiteKey = getRecaptchaSiteKey();

  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[38.5rem] items-center overflow-hidden bg-[#0F1114] bg-cover bg-center bg-no-repeat sm:min-h-[40rem] lg:min-h-[38.5rem]"
      style={{ backgroundImage: `url(${HERO_BACKGROUND_URL})` }}
    >
      <Container className="relative z-10 flex w-full flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-[4.5rem]">
        <div className="flex w-full max-w-[845px] flex-col items-center gap-9">
          <div className="flex w-full flex-col items-center gap-2">
            <div
              className={cn(
                "relative inline-flex items-center justify-center rounded-[50px] border-none bg-[#0a0a0a] px-[2px] py-[2px]",
                "before:pointer-events-none before:absolute before:inset-0 before:rounded-[50px] before:p-px before:content-['']",
                "before:[background:conic-gradient(from_180deg_at_50%_50%,rgba(37,99,235,0)_9%,rgba(37,99,235,1)_60%,rgba(37,99,235,0.21)_84%)]",
                "before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]",
                "before:[-webkit-mask-composite:xor] before:[mask-composite:exclude]",
              )}
            >
              <span className="relative z-10 rounded-full bg-[#0a0a0a] px-6 py-2.5 text-[15px] font-medium text-white">
                Digital Presence Score
              </span>
            </div>

            <h1
              id="hero-heading"
              className="max-w-[770px] text-[2.25rem] leading-[1.15] font-black tracking-[-0.01em] text-white sm:text-5xl lg:text-[4rem]"
            >
              How strong is your business online?
            </h1>

            <p className="mt-0 max-w-[706px] text-base leading-normal font-medium text-[#9EA5B3]">
              Discover how well your online presence helps customers find,
              trust, and contact your business. Get a clear assessment with
              actionable recommendations.
            </p>
          </div>

          <div className="w-full max-w-[845px]">
            <WebsiteUrlInput
              variant="hero"
              recaptchaSiteKey={recaptchaSiteKey}
            />
          </div>

          <div className="max-w-[706px] text-base leading-normal font-medium text-[#9EA5B3]">
            <p>A public digital-presence assessment. No login required.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
