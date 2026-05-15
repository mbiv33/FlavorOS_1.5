import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Logs — FlavorOS Admin",
};

export default function LogsPage() {
  return (
    <SurfacePlaceholder
      title="Logs"
      description="Structured request/job logs with correlation IDs."
    />
  );
}
