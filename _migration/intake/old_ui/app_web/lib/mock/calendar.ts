import type { CalEvent } from "@/lib/types/calendar";

/**
 * Mock week of events. Generated relative to today so the week view always
 * shows something. Times are local; ISO strings carry no zone offset for
 * simplicity in this mock layer.
 */

function isoOnDay(daysFromMonday: number, hours: number, mins = 0): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, …
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const target = new Date(monday);
  target.setDate(monday.getDate() + daysFromMonday);
  target.setHours(hours, mins, 0, 0);
  return target.toISOString();
}

export const MOCK_WEEK: CalEvent[] = [
  {
    id: "ev-mon-brief",
    title: "Morning briefing",
    start: isoOnDay(0, 7, 30),
    end: isoOnDay(0, 7, 44),
    kind: "briefing",
    hosts: ["khadijah", "sinclair"],
  },
  {
    id: "ev-mon-1",
    title: "NTC standup",
    start: isoOnDay(0, 10),
    end: isoOnDay(0, 10, 30),
    contextId: "w2-ntc",
    projectId: "ntc-budget",
    kind: "meeting",
  },
  {
    id: "ev-mon-2",
    title: "Acme advisory call",
    start: isoOnDay(0, 13, 30),
    end: isoOnDay(0, 14, 30),
    contextId: "llc-flourished",
    projectId: "flourished-q2",
    kind: "meeting",
  },
  {
    id: "ev-mon-3",
    title: "Focus block",
    start: isoOnDay(0, 15),
    end: isoOnDay(0, 16, 30),
    kind: "focus-block",
    held: true,
  },
  {
    id: "ev-mon-4",
    title: "Family dinner",
    start: isoOnDay(0, 19),
    end: isoOnDay(0, 20, 30),
    contextId: "personal",
    kind: "personal",
  },
  {
    id: "ev-tue-1",
    title: "FlourishED ops sync",
    start: isoOnDay(1, 9),
    end: isoOnDay(1, 9, 45),
    contextId: "llc-flourished",
    projectId: "flourished-q2",
    kind: "meeting",
  },
  {
    id: "ev-tue-2",
    title: "Focus block",
    start: isoOnDay(1, 14),
    end: isoOnDay(1, 16),
    kind: "focus-block",
    held: true,
  },
  {
    id: "ev-wed-1",
    title: "NTC parent committee call",
    start: isoOnDay(2, 11),
    end: isoOnDay(2, 12),
    contextId: "w2-ntc",
    kind: "meeting",
  },
  {
    id: "ev-thu-1",
    title: "Career: WBEZ pre-call",
    start: isoOnDay(3, 10),
    end: isoOnDay(3, 10, 30),
    contextId: "career",
    kind: "meeting",
  },
  {
    id: "ev-fri-1",
    title: "NTC board readout",
    start: isoOnDay(4, 14),
    end: isoOnDay(4, 16),
    contextId: "w2-ntc",
    projectId: "ntc-budget",
    kind: "meeting",
  },
];
