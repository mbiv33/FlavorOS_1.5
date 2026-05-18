import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { ApprovalCard } from "@/components/ApprovalCard";
import { briefings, inboxItems } from "@/lib/fixtures";

const SECTIONS: Record<string, string[]> = {
  "morning-standup": [
    "Greeting",
    "Wellness check-in",
    "Today's priorities",
    "Calendar and schedule risks",
    "Communications needing review",
    "Client approvals",
    "Projects and dependencies",
    "Reports / artifacts ready",
    "Announcements and reminders",
    "Action items and next steps",
  ],
  "cob-work-day": [
    "Quick check-in / wins",
    "Key outcomes from today",
    "Pending approvals",
    "Updates and responses",
    "Open requests / research",
    "Evening schedule and reminders",
    "Obstacles and support needed",
    "Wellness / recreation note",
    "Action items and next steps",
  ],
  goodnight: [
    "Day review",
    "Wellness meter",
    "Goals / milestones / priorities update",
    "Client journal protocol",
    "Worries / concerns",
    "Announcements and reminders",
    "Early-morning schedule and tasks",
  ],
};

export default async function BriefingScreen({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!(type in briefings)) notFound();
  const b = briefings[type as keyof typeof briefings];
  const sections = SECTIONS[type] ?? [];
  return (
    <>
      <Header
        title={b.title}
        nextFocus={`${b.direction} · ${b.scheduledFor}`}
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[220px_1fr]">
          {/* Agenda rail */}
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

          {/* Active section */}
          <div className="space-y-4">
            <Card>
              <div className="space-y-1">
                <CardTitle>{sections[0] ?? "Section"}</CardTitle>
                <CardMeta>
                  Prepared context for this section is wired in Phase 2 (durable
                  state).
                </CardMeta>
              </div>
            </Card>
            {inboxItems
              .filter((i) => i.pile === "urgent" || i.pile === "needs-attention")
              .slice(0, 2)
              .map((a) => (
                <ApprovalCard
                  key={a.id}
                  title={a.title}
                  detail={a.detail}
                  status={a.status}
                  agent={a.agent}
                />
              ))}
            <div className="flex gap-2">
              <button className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                Continue
              </button>
              <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium">
                Defer
              </button>
              <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium">
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
