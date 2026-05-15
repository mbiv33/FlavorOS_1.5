import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Provider sync — FlavorOS Admin",
};

export default function ProvidersPage() {
  return (
    <SurfacePlaceholder
      title="Provider sync status"
      description="OAuth renewals, webhook health, and integration-specific backpressure."
    />
  );
}
