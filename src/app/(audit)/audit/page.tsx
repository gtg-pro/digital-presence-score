import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteLogo } from "@/components/shared/site-logo";
import { Container } from "@/components/ui/container";
import { AuditForm } from "@/features/audit/components/AuditForm";

export const metadata: Metadata = {
  title: "Start Your Assessment",
  description:
    "Provide a few business details to prepare your digital-presence assessment.",
};

function firstString(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

async function AuditFormFromSearchParams({
  searchParams,
}: {
  searchParams: Promise<{ url?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialWebsiteUrl = firstString(params.url) ?? "";

  return <AuditForm initialWebsiteUrl={initialWebsiteUrl} />;
}

function AuditFormFallback() {
  return (
    <div className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
      Loading assessment form…
    </div>
  );
}

export default function AuditPage({ searchParams }: PageProps<"/audit">) {
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <SiteLogo width={160} className="max-w-[11rem]" />
        <h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
          Tell us about your business.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Provide a few details to help us understand your business and prepare
          your digital-presence assessment.
        </p>

        <div className="mt-10">
          <Suspense fallback={<AuditFormFallback />}>
            <AuditFormFromSearchParams searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </Container>
  );
}
