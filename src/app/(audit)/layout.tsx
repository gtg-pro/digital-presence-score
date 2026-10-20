import { SiteChrome } from "@/components/layout/site-chrome";

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
