import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";

export type PendingPageProps = {
  title: string;
  description: string;
};

/** Minimal placeholder for future legal / methodology pages. */
export function PendingPage({ title, description }: PendingPageProps) {
  return (
    <Container className="py-16 sm:py-20 lg:py-24">
      <Badge variant="outline">Pending content</Badge>
      <h1 className="mt-4 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        {description}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        This page is a placeholder. Full content will be added in a later
        release.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
      >
        Back to home
      </Link>
    </Container>
  );
}
