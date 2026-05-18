import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { LaunchCard } from "@/components/LaunchCard";
import { meetings } from "@/lib/fixtures";

const CHANNEL_HREF: Record<keyof typeof meetings, string | null> = {
  "comms-calendar": "/comms-calendar",
  travel: "/travel",
  projects: "/projects",
  "reports-artifacts": "/reports",
  general: null,
};

export default function MeetingsLauncher() {
  return (
    <>
      <Header
        title="Meetings"
        nextFocus="Open a focused session over a channel"
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl">
          <Zone title="Pick a topic">
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
          </Zone>
        </div>
      </div>
    </>
  );
}
