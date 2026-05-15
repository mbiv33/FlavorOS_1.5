import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "GBrain status — FlavorOS Admin",
};

export default function GbrainPage() {
  return (
    <SurfacePlaceholder
      title="GBrain status"
      description="Not wired in-repo yet — continue using machine-local GBrain CLI/MCP per docs/gbrain_integration.md."
    />
  );
}
