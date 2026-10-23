import { Suspense } from "react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import {
  footerBrand,
  footerLegalLinks,
  footerLinkColumns,
} from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

import { CopyrightYear } from "./copyright-year";

function FooterTextLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className = cn(
    "text-sm font-medium leading-[22px] text-[#9EA5B3] transition-colors hover:text-[#D9DCE1] hover:underline",
    "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115]",
  );

  if (external || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a
        href={href}
        className={className}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function FooterNavColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-lg font-bold tracking-[-0.02em] text-[#D9DCE1]">
        {title}
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <FooterTextLink href={link.href}>{link.label}</FooterTextLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="relative isolate overflow-hidden bg-[#0f1115]"
    >
      <img
        src={footerBrand.decorativeSrc}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-auto w-[min(90%,640px)] max-w-none select-none opacity-60 sm:w-[min(70%,800px)] lg:w-[min(53%,750px)]"
      />

      <Container className="relative z-10 pt-10 pb-0 sm:pt-12 lg:pt-14">
        <div className="mb-8 flex flex-col gap-10 lg:mb-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="flex w-full max-w-[298px] shrink-0 flex-col items-start gap-3">
            <Link
              href={siteConfig.brandUrl}
              className="inline-flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115]"
            >
              <img
                src={footerBrand.logoSrc}
                alt={footerBrand.logoAlt}
                width={170}
                height={96}
                className="h-14 w-auto object-contain sm:h-20 lg:h-24"
              />
            </Link>
            <p className="text-sm leading-relaxed font-medium text-[#9EA5B3]">
              {footerBrand.tagline}
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:gap-6 xl:gap-8">
            {footerLinkColumns.map((column) => (
              <FooterNavColumn
                key={column.title}
                title={column.title}
                links={column.links}
              />
            ))}

            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-[-0.02em] text-[#D9DCE1]">
                Contact
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                <li>
                  <FooterTextLink href={`mailto:${siteConfig.contactEmail}`}>
                    Email
                  </FooterTextLink>
                </li>
                <li>
                  <FooterTextLink href={`tel:${siteConfig.contactPhoneTel}`}>
                    Phone
                  </FooterTextLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-[#9EA5B3]/40 py-5 sm:flex-row sm:gap-6">
          <p className="text-center text-sm tracking-[-0.02em] text-[#9EA5B3] sm:text-left">
            ©{" "}
            <Suspense fallback={<span className="inline-block min-w-[3ch]" />}>
              <CopyrightYear />
            </Suspense>{" "}
            {footerBrand.copyrightName} | All Rights Reserved.
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
            {footerLegalLinks.map((link, index) => (
              <li key={link.href} className="flex items-center gap-3">
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    className="h-[11px] w-px bg-[#E5E7EB]/40"
                  />
                ) : null}
                <FooterTextLink href={link.href}>{link.label}</FooterTextLink>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
