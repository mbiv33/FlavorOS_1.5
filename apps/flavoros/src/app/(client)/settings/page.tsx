import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { clientProfile } from "@/lib/fixtures";

export default function SettingsPage() {
  return (
    <>
      <Header
        title="Settings / Profile"
        nextFocus="Profile, contexts, providers, and preferences"
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <Zone title="Profile">
            <Card>
              <CardTitle>{clientProfile.displayName}</CardTitle>
              <CardMeta>Timezone: {clientProfile.timezone}</CardMeta>
            </Card>
          </Zone>
          <Zone title="Contexts">
            <Card>
              <div className="flex flex-wrap gap-2">
                {clientProfile.contextLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border-strong px-2 py-0.5 text-xs"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </Card>
          </Zone>
          <Zone title="Connected accounts">
            <Card>
              <CardTitle>Google Workspace</CardTitle>
              <CardMeta>
                Gmail · Calendar · Docs · Sheets · Slides — connection wiring
                lands in Phase 3.
              </CardMeta>
            </Card>
          </Zone>
          <Zone title="Authority defaults">
            <Card>
              <CardMeta>
                HITL defaults per category (comms, calendar, finance, travel,
                relationships). Editable in Phase 4.
              </CardMeta>
            </Card>
          </Zone>
          <Zone title="Briefing preferences">
            <Card>
              <CardMeta>
                Morning Standup, COB Work Day, and Goodnight times and opt-in
                sections.
              </CardMeta>
            </Card>
          </Zone>
        </div>
      </div>
    </>
  );
}
