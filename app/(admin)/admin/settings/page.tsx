import React from "react";
import { getClubSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getClubSettings();
  return <SettingsForm initialSettings={settings} />;
}
