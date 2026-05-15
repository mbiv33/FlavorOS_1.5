import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Reports & Artifacts — FlavorOS Client",
};

export default function ReportsPage() {
  return (
    <SurfacePlaceholder
      title="Reports & Artifacts"
      description="Generated outputs, audit trails, and exports."
    />
  );
}
