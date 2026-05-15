import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Tenant monitor — FlavorOS Admin",
};

export default function TenantsPage() {
  return (
    <SurfacePlaceholder
      title="Tenant monitor"
      description="Isolation posture, quotas, and tenant-level incidents."
    />
  );
}
