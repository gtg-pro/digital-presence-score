import { ConicBorderPill } from "@/components/shared/conic-border-pill";
import { Container } from "@/components/ui/container";
import { getRecaptchaSiteKey } from "@/lib/recaptcha/verify-recaptcha";

import { WebsiteUrlInput } from "./WebsiteUrlInput";

const HERO_BACKGROUND_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1792669186/Hero_Section_bkqzlk.svg";

export type HeroSectionProps = {
  badgeText?: string;
  heading?: string;
  description?: string;
  /** When false, hides the website URL + CAPTCHA form. */
  showUrlInput?: boolean;
  /** When false, hides the “No login required” note. */
  showFooterNote?: boolean;
  sectionId?: string;
  headingId?: string;
};

/**
 * Landing / audit hero band. Defaults match the marketing homepage.
 */
export function HeroSection({
  badgeText = "Digital Presence Score",
  heading = "How strong is your business online?",
  description = "Discover how well your online presence helps customers find, trust, and contact your business. Get a clear assessment with actionable recommendations.",
  showUrlInput = true,
  showFooterNote = true,
  sectionId = "home",
  headingId = "hero-heading",
}: HeroSectionProps = {}) {
  const recaptchaSiteKey = showUrlInput ? getRecaptchaSiteKey() : null;

  return (
    <section
      id={sectionId}
      aria-labelledby={headingId}
      className={
        showUrlInput
          ? "relative isolate flex min-h-[38.5rem] items-center overflow-hidden bg-[#0F1114] bg-cover bg-center bg-no-repeat sm:min-h-[40rem] lg:min-h-[38.5rem]"
          : "relative isolate flex items-center overflow-hidden bg-[#0F1114] bg-cover bg-center bg-no-repeat"
      }
      style={{ backgroundImage: `url(${HERO_BACKGROUND_URL})` }}
    >
      <Container
        className={
          showUrlInput
            ? "relative z-10 flex w-full flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-[4.5rem]"
            : "relative z-10 flex w-full flex-col items-center px-4 py-[72px] text-center sm:px-6"
        }
      >
        <div className="flex w-full max-w-[845px] flex-col items-center gap-9">
          <div className="flex w-full flex-col items-center gap-2">
            <ConicBorderPill labelClassName="px-6 py-2.5 font-title text-[15px] font-medium leading-normal lg:text-[15px]">
              {badgeText}
            </ConicBorderPill>

            <h1
              id={headingId}
              className="max-w-[770px] font-title text-[2.25rem] leading-[1.15] font-black tracking-[-0.01em] text-white sm:text-5xl lg:text-[4rem]"
            >
              {heading}
            </h1>

            <p className="mt-0 max-w-[840px] font-heading text-base leading-normal font-medium text-[#9EA5B3]">
              {description}
            </p>
          </div>

          {showUrlInput ? (
            <div className="w-full max-w-[845px]">
              <WebsiteUrlInput
                variant="hero"
                recaptchaSiteKey={recaptchaSiteKey}
              />
            </div>
          ) : null}

          {showFooterNote ? (
            <div className="max-w-[706px] font-heading text-base leading-normal font-medium text-[#9EA5B3]">
              <p>A public digital-presence assessment. No login required.</p>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
