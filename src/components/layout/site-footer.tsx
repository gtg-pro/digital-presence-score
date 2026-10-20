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
    <footer className="border-t border-border bg-background">
      <Container className="py-14 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-4">
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

          <div className="lg:col-span-2">
            <FooterNavColumn title="Quick Links" links={footerQuickLinks} />
          </div>

          <div className="lg:col-span-2">
            <FooterNavColumn title="Resources" links={footerResourceLinks} />
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Get Started
            </h2>
            <p className="mt-2 text-base font-medium tracking-tight text-foreground sm:text-lg">
              {footerCta.heading}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {footerCta.description}
            </p>
            <Link
              href={footerCta.href}
              className={cn(
                "mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground",
                "transition-colors hover:bg-primary/90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              {footerCta.label}
            </Link>
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
