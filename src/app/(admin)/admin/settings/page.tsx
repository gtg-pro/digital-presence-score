import type { Metadata } from "next";

import { SettingsPage } from "@/features/admin/components/settings/SettingsPage";

export const metadata: Metadata = {
  title: "Admin Settings",
};

export default function AdminSettingsRoute() {
  return <SettingsPage />;
}
