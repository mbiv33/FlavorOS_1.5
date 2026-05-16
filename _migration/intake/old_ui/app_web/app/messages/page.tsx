import { TriageSummary } from "@/components/messages/TriageSummary";
import { Outbox } from "@/components/messages/Outbox";
import { ChannelTabs } from "@/components/messages/ChannelTabs";
import { ReadyForYou } from "@/components/today/ReadyForYou";
import { Section } from "@/components/primitives/Section";

/**
 * Messages — Sinclair's read of every inbox across all contexts.
 * PRD 04 §4.4. Composition top-to-bottom: Triage summary → Outbox →
 * Ready for you → Channel drilldown.
 */
export default function MessagesPage() {
  return (
    <div>
      <div className="px-1 pt-4 pb-1.5">
        <h1 className="m-0 mb-1 text-[28px] font-bold tracking-tight">
          Messages
        </h1>
        <div className="text-[13.5px] text-ink-2">
          Sinclair's read of your inboxes — across all configured contexts.
        </div>
      </div>

      <div className="mt-3.5">
        <TriageSummary />
        <Outbox />
        <ReadyForYou />
        <Section title="Channels">
          <ChannelTabs />
        </Section>
      </div>
    </div>
  );
}
