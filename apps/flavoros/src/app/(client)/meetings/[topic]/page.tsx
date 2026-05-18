import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { ApprovalCard } from "@/components/ApprovalCard";
import { meetings, inboxItems } from "@/lib/fixtures";

const SECTIONS: Record<string, string[]> = {
  "comms-calendar": [
    "Triage summary",
    "Drafts to approve",
    "Calendar conflicts",
    "Outbox status",
  ],
  travel: [
    "Trip status",
    "Options to compare",
    "Approvals (holds / bookings)",
    "Travel brief",
    "External links",
  ],
  projects: [
    "Status by project",
    "Open decisions",
    "Artifacts",
    "Approvals",
    "Blockers",
  ],
  "reports-artifacts": [
    "Recent artifacts",
    "Pending review",
    "Filed reports",
    "Source links",
  ],
  general: [
    "Today's operating picture",
    "Open approvals",
    "Recent completions",
    "Open notes",
  ],
};

export default async function MeetingScreen({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  if (!(topic in meetings)) notFound();
  const m = meetings[topic as keyof typeof meetings];
  const sections = SECTIONS[topic] ?? [];
  return (
    <>
      <Header
        title={`Meeting · ${m.title}`}
        nextFocus={m.preparedSummary}
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-xl border border-border bg-surface p-3">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-strong">
              Agenda
            </p>
            <ul className="space-y-0.5">
              {sections.map((s, i) => (
                <li
                  key={s}
                  className={`rounded-md px-2 py-1.5 text-sm ${
                    i === 0
                      ? "bg-surface-muted font-medium"
                      : "text-muted-strong"
                  }`}
                >
                  {i + 1}. {s}
                </li>
              ))}
            </ul>
          </aside>
          <div className="space-y-4">
            <Card>
              <div className="space-y-1">
                <CardTitle>{sections[0] ?? "Section"}</CardTitle>
                <CardMeta>
                  Prepared state from the {m.title} channel will appear here.
                </CardMeta>
              </div>
            </Card>
            {inboxItems
              .filter((i) => i.pile === "urgent" || i.pile === "needs-attention")
              .slice(0, 1)
              .map((a) => (
                <ApprovalCard
                  key={a.id}
                  title={a.title}
                  detail={a.detail}
                  status={a.status}
                  agent={a.agent}
                />
              ))}
            <Card>
              <div className="space-y-2">
                <CardTitle>Notes &amp; questions</CardTitle>
                <textarea
                  placeholder="Capture a note or a question for the agent. Not a live chat."
                  className="h-24 w-full resize-none rounded-md border border-border-strong bg-surface-muted p-2 text-sm outline-none focus:border-ring"
                />
              </div>
            </Card>
            <div className="flex gap-2">
              <button className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                Continue
              </button>
              <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium">
                Save &amp; resume later
              </button>
              <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium">
                Finish
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
