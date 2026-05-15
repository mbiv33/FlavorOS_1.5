import { ApiStatus } from "./components/ApiStatus";
import { SurfacePlaceholder } from "./components/SurfacePlaceholder";

export default function AdminHome() {
  return (
    <div className="space-y-8">
      <SurfacePlaceholder
        title="Admin overview"
        description="Tenant health, agent throughput, and workflow SLAs will aggregate here. GBrain and Composio stay external subsystems per docs until wired."
      />
      <ApiStatus />
    </div>
  );
}
