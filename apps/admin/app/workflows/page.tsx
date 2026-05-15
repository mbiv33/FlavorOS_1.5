import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Workflow monitor — FlavorOS Admin",
};

export default function WorkflowsPage() {
  return (
    <SurfacePlaceholder
      title="Workflow monitor"
      description="DAG runs, retries, dead-letter queues, and SLA breaches."
    />
  );
}
