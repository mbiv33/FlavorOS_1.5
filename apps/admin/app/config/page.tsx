import type { Metadata } from "next";

import { SurfacePlaceholder } from "../components/SurfacePlaceholder";

export const metadata: Metadata = {
  title: "Config editor — FlavorOS Admin",
};

export default function ConfigPage() {
  return (
    <SurfacePlaceholder
      title="Config editor"
      description="SAFE drafts for YAML configs — mirrors configs/*.yaml intent from docs/services_and_configs.md."
    />
  );
}
