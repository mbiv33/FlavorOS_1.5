import { ApiStatus } from "./components/ApiStatus";
import { SurfacePlaceholder } from "./components/SurfacePlaceholder";

export default function Home() {
  return (
    <div className="space-y-8">
      <SurfacePlaceholder
        title="Command Center"
        description="Your day-at-a-glance will land here — briefings, meetings, open loops. For now this shell proves routing, layout, and API connectivity."
      />
      <ApiStatus />
    </div>
  );
}
