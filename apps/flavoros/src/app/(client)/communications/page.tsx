import Link from "next/link";
import { SurfaceFrame, SurfaceSection } from "@/components/SurfaceFrame";
import { StatStrip } from "@/components/StatStrip";
import { PileRow, type PileDef } from "@/components/PileRow";
import { Card } from "@/components/Card";
import {
  commsPileItems,
  commsStats,
  contactsByContext,
  type CommsPile,
} from "@/lib/fixtures";

const PILE_DEF: Record<
  CommsPile,
  { label: string; tone: "violet" | "blue" | "emerald"; subtitle: string }
> = {
  emails: {
    label: "Emails",
    tone: "violet",
    subtitle: "Inbound and drafts via Gmail",
  },
  "sms-voice": {
    label: "SMS & Voice",
    tone: "blue",
    subtitle: "Text and voice channels",
  },
  social: {
    label: "Social",
    tone: "emerald",
    subtitle: "Selected DMs across social channels",
  },
};

const PILE_ORDER: CommsPile[] = ["emails", "sms-voice", "social"];

export default function CommunicationsPage() {
  const piles: PileDef[] = PILE_ORDER.map((key) => {
    const def = PILE_DEF[key];
    return {
      key,
      label: def.label,
      tone: def.tone,
      subtitle: def.subtitle,
      items: commsPileItems
        .filter((i) => i.pile === key)
        .map((c) => ({
          id: c.id,
          kind: c.kind,
          title: c.title,
          status: c.status,
          agent: c.agent,
          detail: `${c.context} · ${c.detail}`,
          when: c.when,
          canDefer: c.canDefer,
          sourceLinkLabel: c.sourceLinkLabel,
        })),
    };
  });

  return (
    <SurfaceFrame
      title="Communications"
      description="A calm inbox over your messages, drafts, and contacts."
      action={
        <Link
          href="/meetings/communications"
          className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          Open meeting
        </Link>
      }
    >
      <SurfaceSection title="Stats">
        <StatStrip stats={commsStats} />
      </SurfaceSection>

      <SurfaceSection title="Inbox · Outbox">
        <PileRow piles={piles} />
      </SurfaceSection>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <SurfaceSection title="Contacts">
          <Card>
            <ul className="space-y-4">
              {contactsByContext.map((group) => (
                <li key={group.context}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-strong">
                    {group.context}
                  </p>
                  <ul className="space-y-2">
                    {group.contacts.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-md border border-border px-3 py-2 hover:bg-surface-muted"
                      >
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted">{c.meta}</p>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Card>
        </SurfaceSection>

        <SurfaceSection title="Composer">
          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>To:</span>
                <input
                  type="text"
                  placeholder="Pick a contact"
                  className="flex-1 rounded-md border border-border-strong bg-surface-muted px-3 py-1.5 text-sm outline-none focus:border-ring"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Subject:</span>
                <input
                  type="text"
                  placeholder="What's this about?"
                  className="flex-1 rounded-md border border-border-strong bg-surface-muted px-3 py-1.5 text-sm outline-none focus:border-ring"
                />
              </div>
              <textarea
                placeholder="Write a draft. Sinclair will prepare it for your approval — nothing sends without you."
                className="h-40 w-full resize-none rounded-md border border-border-strong bg-surface-muted p-3 text-sm outline-none focus:border-ring"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">
                  Submitting creates a draft &rarr; approval, never a direct
                  send.
                </p>
                <button className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90">
                  Prepare draft
                </button>
              </div>
            </div>
          </Card>
        </SurfaceSection>
      </div>
    </SurfaceFrame>
  );
}
