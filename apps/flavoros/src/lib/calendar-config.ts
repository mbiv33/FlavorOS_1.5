import type { PileMeta } from "./mappers";

export type CalendarPile = "today" | "conflicts" | "upcoming";

export const CALENDAR_PILE_ORDER: CalendarPile[] = ["today", "conflicts", "upcoming"];

export const CALENDAR_PILE_META: Record<CalendarPile, PileMeta> = {
  today: {
    label: "Today",
    tone: "violet",
    subtitle: "Events scheduled today",
  },
  conflicts: {
    label: "Conflicts",
    tone: "rose",
    subtitle: "Overlapping commitments needing resolution",
  },
  upcoming: {
    label: "Upcoming",
    tone: "blue",
    subtitle: "Next 7 days",
  },
};

export const CALENDAR_STAT_LABELS = {
  pending: "Scheduling approvals",
  ready: "Events to confirm",
  drafts: "Holds / drafts",
  approved: "Confirmed",
};
