import { WeekView } from "@/components/calendar/WeekView";

/**
 * Calendar — full surface. Default view is the week starting Monday
 * (PRD 04 §4.5). Day/month views land later if needed; the week is the
 * agenda surface client actually lives in.
 */
export default function CalendarPage() {
  return (
    <div>
      <div className="px-1 pt-4 pb-3.5">
        <h1 className="m-0 mb-1 text-[28px] font-bold tracking-tight">
          Calendar
        </h1>
        <div className="text-[13.5px] text-ink-2">
          This week. Briefings, meetings, focus blocks, personal — everything in
          one view.
        </div>
      </div>
      <WeekView />
    </div>
  );
}
