import { Greeting } from "@/components/today/Greeting";
import { ReadyForYou } from "@/components/today/ReadyForYou";
import { KhadijahsBrief } from "@/components/today/KhadijahsBrief";
import { BriefingAgendaPreview } from "@/components/today/BriefingAgendaPreview";
import { AgendaStrip } from "@/components/today/AgendaStrip";
import { UpcomingTrips } from "@/components/today/UpcomingTrips";
import { QuietlyHandled } from "@/components/today/QuietlyHandled";

/**
 * Today — the default landing surface. Per PRD 04 §4.1, sections that have
 * nothing to render must not render at all (silence equals working). Each
 * sub-component is responsible for its own empty-collapse.
 */
export default function TodayPage() {
  return (
    <div>
      <Greeting />
      <ReadyForYou />
      <KhadijahsBrief />
      <BriefingAgendaPreview />
      <AgendaStrip />
      <UpcomingTrips />
      <QuietlyHandled />
    </div>
  );
}
