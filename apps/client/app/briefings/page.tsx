import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Briefings — FlavorOS Client",
};

export default function BriefingsPage() {
  return (
    <SurfacePlaceholder
      title="Briefings"
      description="Morning/evening summaries and contextual brief packs."
    />
  );
}
