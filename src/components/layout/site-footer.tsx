import { Suspense } from "react";
import Link from "next/link";

import { SiteLogo } from "@/components/shared/site-logo";
import { Container } from "@/components/ui/container";
import {
  footerCta,
  footerLegalLinks,
  footerQuickLinks,
  footerResourceLinks,
} from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

import { CopyrightYear } from "./copyright-year";

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm text-muted-foreground transition-colors hover:text-foreground",
        "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
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
    <div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.href}-${link.label}`}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-border bg-background">
      <Container className="py-14 sm:py-16 lg:py-20">
        <div className="rounded-2xl bg-foreground px-6 py-12 text-center text-background sm:px-10 sm:py-14 lg:px-16 lg:py-16">
          <h2
            id="contact-heading"
            className="mx-auto max-w-2xl font-display text-3xl leading-tight font-medium tracking-tight sm:text-4xl lg:text-[2.5rem]"
          >
            {footerCta.heading}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-background/75 sm:text-lg">
            {footerCta.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href={footerCta.href}
              className={cn(
                "inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-background px-6 text-sm font-medium text-foreground sm:w-auto",
                "transition-opacity hover:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground",
              )}
            >
              {footerCta.label}
            </Link>
            <Link
              href={footerCta.secondaryHref}
              className={cn(
                "text-sm font-medium text-background underline decoration-background/40 underline-offset-4",
                "transition-colors hover:decoration-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground rounded-sm",
              )}
            >
              {footerCta.secondaryLabel}
            </Link>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-5">
            <Link
              href="/"
              className={cn(
                "inline-flex max-w-[14rem] items-center",
                "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <SiteLogo width={160} />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {siteConfig.footerDescription}
            </p>
          </div>

          <div className="lg:col-span-3">
            <FooterNavColumn title="Quick Links" links={footerQuickLinks} />
          </div>

          <div className="lg:col-span-4">
            <FooterNavColumn title="Resources" links={footerResourceLinks} />
          </div>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col gap-4 py-6 sm:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              ©{" "}
              <Suspense fallback={<span className="inline-block min-w-[3ch]" />}>
                <CopyrightYear />
              </Suspense>{" "}
              {siteConfig.name}
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {footerLegalLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {siteConfig.disclaimer}
          </p>
        </Container>
      </div>
    </footer>
  );
}
