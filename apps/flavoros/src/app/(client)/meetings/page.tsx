import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { LaunchCard } from "@/components/LaunchCard";
import { meetings } from "@/lib/fixtures";

const CHANNEL_HREF: Record<keyof typeof meetings, string | null> = {
  communications: "/communications",
  calendar: "/calendar",
  travel: "/travel",
  projects: "/projects",
  "reports-artifacts": "/reports",
  general: null,
};

export default function MeetingsLauncher() {
  return (
    <SurfaceFrame
      title="Meetings"
      description="Open a focused, topic-scoped session with FlavorOS over a channel surface."
    >
      <SurfaceSection title="Pick a topic">
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(meetings) as Array<keyof typeof meetings>).map(
            (topic) => {
              const m = meetings[topic];
              const channelHref = CHANNEL_HREF[topic];
              return (
                <LaunchCard
                  key={topic}
                  title={m.title}
                  meta={m.preparedSummary}
                  statusLine={`${m.openApprovals} open approvals · ${m.artifactCount} artifacts · ${m.lastUpdate}`}
                  primaryHref={`/meetings/${topic}`}
                  primaryLabel="Open meeting"
                  secondaryHref={channelHref ?? undefined}
                  secondaryLabel={
                    channelHref ? "Open channel surface" : undefined
                  }
                />
              );
            },
          )}
        </div>
      </SurfaceSection>
    </SurfaceFrame>
  );
}
