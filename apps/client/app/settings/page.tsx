import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Settings — FlavorOS Client",
};

export default function SettingsPage() {
  return (
    <SurfacePlaceholder
      title="Settings"
      description="Tenant preferences, integrations, and notification posture."
    />
  );
}
