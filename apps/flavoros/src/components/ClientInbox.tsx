import { PileRow, type PileDef, type PileTone } from "./PileRow";
import type { InboxItem, InboxPile } from "@/lib/fixtures";

const PILE_DEF: Record<
  InboxPile,
  { label: string; tone: PileTone; subtitle: string }
> = {
  urgent: {
    label: "Urgent",
    tone: "rose",
    subtitle: "Blocks or time-pressured",
  },
  "needs-attention": {
    label: "Needs Attention",
    tone: "amber",
    subtitle: "Approvals & decisions waiting on you",
  },
  updates: {
    label: "Updates",
    tone: "emerald",
    subtitle: "Recent completions & sync",
  },
};

const PILE_ORDER: InboxPile[] = ["urgent", "needs-attention", "updates"];

export function ClientInbox({ items }: { items: InboxItem[] }) {
  const piles: PileDef[] = PILE_ORDER.map((pile) => {
    const def = PILE_DEF[pile];
    return {
      key: pile,
      label: def.label,
      tone: def.tone,
      subtitle: def.subtitle,
      items: items.filter((i) => i.pile === pile),
    };
  });

  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-strong">
          Client Inbox
        </h2>
        <p className="text-xs text-muted">Click a stack to open</p>
      </header>
      <PileRow piles={piles} />
    </section>
  );
}
