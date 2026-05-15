import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Meetings — FlavorOS Client",
};

export default function MeetingsPage() {
  return (
    <SurfacePlaceholder
      title="Meetings"
      description="Agenda preparation, live notes, and follow-ups across calendars."
    />
  );
}
