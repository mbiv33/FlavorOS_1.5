import type { Metadata } from "next";

import { SectionHeader } from "../components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Settings — FlavorOS Client",
};

const settingSections = [
  {
    title: "Profile",
    description: "Your name, timezone, and notification preferences.",
    fields: [
      { label: "Display Name", value: "Marcus Bivines" },
      { label: "Email", value: "marcus@flavoros.app" },
      { label: "Timezone", value: "America/New_York (EDT)" },
    ],
  },
  {
    title: "Connected Accounts",
    description: "Provider integrations managed through Composio.",
    connections: [
      { name: "Google Workspace", status: "connected" },
      { name: "Slack", status: "connected" },
      { name: "Linear", status: "not connected" },
      { name: "Notion", status: "not connected" },
    ],
  },
  {
    title: "Agent Preferences",
    description: "Tune how your agents communicate and act.",
    fields: [
      { label: "Approval Mode", value: "Require for sends & bookings" },
      { label: "Briefing Schedule", value: "8:00 AM & 6:00 PM daily" },
      { label: "Voice Style", value: "Concise & professional" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Profile, integrations, and agent configuration.
        </p>
      </div>

      {settingSections.map((section) => (
        <section key={section.title} className="space-y-4">
          <SectionHeader
            title={section.title}
            description={section.description}
          />

          {"fields" in section && section.fields && (
            <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white shadow-sm dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
              {section.fields.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    {f.label}
                  </span>
                  <span className="text-sm font-medium">{f.value}</span>
                </div>
              ))}
            </div>
          )}

          {"connections" in section && section.connections && (
            <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white shadow-sm dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
              {section.connections.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <span className="text-sm">{c.name}</span>
                  {c.status === "connected" ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Connected
                    </span>
                  ) : (
                    <button className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800">
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
