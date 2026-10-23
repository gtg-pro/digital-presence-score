import Link from "next/link";
import { Phone } from "lucide-react";

import { Container } from "@/components/ui/container";
import { readyToBuildCta } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

const CTA_RIGHT_VISUAL_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1792734947/27472512_1332_3_pkvjnk.svg";
const CTA_LEFT_VISUAL_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1792735018/Layer_1_d0ddgi.svg";
const CTA_ARROW_URL =
  "https://res.cloudinary.com/dxxwzp4qs/image/upload/v1792670199/Vector_431_Stroke_sy2hqa.svg";

/**
 * Landing CTA band — decorative SVGs behind centered heading + dual actions.
 */
export function ReadyToBuildSection() {
  return (
    <section
      id="ready-to-build"
      aria-labelledby="ready-to-build-heading"
      className="bg-black py-12"
    >
      <Container>
        <div className="relative isolate overflow-hidden rounded-[40px] bg-[#0f1115] py-12 sm:py-14 md:py-16">
          <img
            src={CTA_RIGHT_VISUAL_URL}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 z-0 h-auto w-[min(55%,420px)] max-w-none select-none opacity-70 sm:w-[min(48%,480px)]"
          />
          <img
            src={CTA_LEFT_VISUAL_URL}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 z-0 h-full w-[min(48%,460px)] max-w-none object-cover object-right select-none opacity-55 sm:w-[min(42%,520px)] sm:opacity-65"
          />

          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 pr-[min(28%,9rem)] text-center sm:gap-9 sm:px-10 sm:pr-[min(32%,11rem)]">
            <h2
              id="ready-to-build-heading"
              className="max-w-2xl font-title text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-[2.5rem]"
            >
              {readyToBuildCta.heading}
            </h2>

            <div className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row sm:gap-6 md:gap-9">
              <Link
                href={readyToBuildCta.primaryHref}
                className={cn(
                  "group inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#2563EB] px-5 font-button text-base font-medium tracking-[-0.02em] text-white sm:w-auto",
                  "shadow-[0_0_24px_rgba(37,99,235,0.35)] transition-colors duration-300 ease-out hover:bg-[#1d4ed8]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1C1C]",
                )}
              >
                <span className="transition-transform duration-300 ease-out group-hover:translate-x-[-2px]">
                  {readyToBuildCta.primaryLabel}
                </span>
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white p-2.5 transition-transform duration-300 ease-out group-hover:translate-x-[2px]">
                  <img
                    src={CTA_ARROW_URL}
                    alt=""
                    width={14}
                    height={14}
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-300 ease-out group-hover:rotate-45"
                  />
                </span>
              </Link>

              <a
                href={`tel:${siteConfig.contactPhoneTel}`}
                className={cn(
                  "group inline-flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-[#9ea5b3] px-5 font-button text-base font-medium tracking-[-0.02em] text-white sm:w-auto",
                  "transition-all duration-300 ease-in-out hover:border-[#2563eb] hover:bg-[#2563eb]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1C1C]",
                )}
              >
                <span className="transition-transform duration-300 group-hover:translate-x-[-2px]">
                  {readyToBuildCta.secondaryLabel}
                </span>
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white transition-all duration-300 group-hover:translate-x-[2px] group-hover:border-white group-hover:bg-white">
                  <Phone
                    className="size-4 text-white transition-colors duration-300 group-hover:text-black"
                    aria-hidden="true"
                  />
                </span>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
