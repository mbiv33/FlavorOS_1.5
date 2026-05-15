import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Agent monitor — FlavorOS Admin",
};

export default function AgentsPage() {
  return (
    <SurfacePlaceholder
      title="Agent monitor"
      description="Live agent sessions, tool latencies, and failure taxonomy."
    />
  );
}
