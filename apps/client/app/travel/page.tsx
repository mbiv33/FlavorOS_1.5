import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Travel / Logistics — FlavorOS Client",
};

export default function TravelPage() {
  return (
    <SurfacePlaceholder
      title="Travel / Logistics"
      description="Itineraries, logistics coordination, and travel-specific workflows."
    />
  );
}
