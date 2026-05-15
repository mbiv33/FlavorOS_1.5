import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Artifact queue — FlavorOS Admin",
};

export default function ArtifactsPage() {
  return (
    <SurfacePlaceholder
      title="Artifact queue"
      description="Pending renders, checksum validation, and publishing gates."
    />
  );
}
