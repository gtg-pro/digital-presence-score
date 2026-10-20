import { SiteChrome } from "@/components/layout/site-chrome";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
