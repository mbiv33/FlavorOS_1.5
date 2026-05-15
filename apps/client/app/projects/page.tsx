import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Projects — FlavorOS Client",
};

export default function ProjectsPage() {
  return (
    <SurfacePlaceholder
      title="Projects"
      description="Workstreams, milestones, and artifact-linked execution."
    />
  );
}
