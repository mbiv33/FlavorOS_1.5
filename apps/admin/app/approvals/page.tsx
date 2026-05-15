import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Approval queue — FlavorOS Admin",
};

export default function ApprovalsPage() {
  return (
    <SurfacePlaceholder
      title="Approval queue"
      description="Human-in-the-loop checkpoints mapped from governance rules."
    />
  );
}
