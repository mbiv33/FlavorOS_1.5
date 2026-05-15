import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Comms & Calendar — FlavorOS Client",
};

export default function CommsPage() {
  return (
    <SurfacePlaceholder
      title="Comms & Calendar"
      description="Unified threads, inbox triage, and schedule-aware orchestration."
    />
  );
}
