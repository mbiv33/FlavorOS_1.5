import type {
  AgendaEvent,
  MasterBrief,
  QuietlyHandled,
  TodayStatus,
  UpcomingBriefing,
  UpcomingTrip,
} from "@/lib/types/today";

export const MOCK_TODAY_STATUS: TodayStatus = {
  wellness: "steady",
  overnight: "Sinclair handled 14 things overnight",
  brief: "Khadijah's brief is ready",
};

export const MOCK_BRIEF: MasterBrief = {
  attribution: "Synthesized from Maxine, Sinclair, Kyle, Scooter",
  paragraphs: [
    "Top of the day: NTC budget review hits Friday — Maxine has the FY27 draft ready for your read; she flagged two line items that may need your call.",
    "FlourishED Q2 pipeline is healthy — 3 active engagements, one Acme invoice ready for you above. Career: Kyle says the gala follow-ups he sent Tuesday have started landing meetings.",
    "Paris trip is refining well; Scooter's narrowed to 5 hotels under your $300 ceiling. Final tee-up expected around May 19.",
  ],
  drillInto: [
    { label: "NTC budget brief", href: "/work/ntc-budget" },
    { label: "FlourishED Q2", href: "/work/flourished-q2" },
    { label: "Paris trip", href: "/work/paris-2026" },
    { label: "Career pipeline", href: "/work/career-pipeline" },
  ],
  updatedAt: "6:42 AM",
};

export const MOCK_UPCOMING_BRIEFING: UpcomingBriefing = {
  kind: "morning",
  label: "Morning briefing",
  scheduledLabel: "scheduled 7:30 AM",
  durationLabel: "14 min est.",
  hosts: ["khadijah", "sinclair"],
  items: [
    { id: "ag-1", text: "WBEZ podcast invite — accept or decline?" },
    {
      id: "ag-2",
      text: "Tuesday 4pm meeting — decline or counter for Wednesday?",
    },
    { id: "ag-3", text: "FY27 line items 14 & 22 — your call on the carryover" },
    { id: "ag-4", text: "Q2 LinkedIn cadence — confirm weekly schedule" },
  ],
};

export const MOCK_AGENDA: AgendaEvent[] = [
  {
    id: "ev-1",
    time: "10:00 AM",
    title: "NTC standup",
    meta: "W2 Work · 30 min",
    kind: "meeting",
  },
  {
    id: "ev-2",
    time: "1:30 PM",
    title: "Acme advisory call",
    meta: "FlourishED · 60 min",
    kind: "meeting",
  },
  {
    id: "ev-3",
    time: "3:00 – 4:30 PM",
    title: "Focus block",
    meta: "held by Sinclair",
    kind: "focus-block",
  },
  {
    id: "ev-4",
    time: "7:00 PM",
    title: "Family dinner",
    meta: "Personal",
    kind: "personal",
  },
];

export const MOCK_UPCOMING_TRIPS: UpcomingTrip[] = [
  {
    id: "paris-2026",
    destination: "Paris",
    dateRange: "June 14 – 22 · 8 nights",
    daysUntil: 37,
    phase: "planning",
    phaseStatus: "refining round 3",
  },
  {
    id: "nyc-2026",
    destination: "New York",
    dateRange: "July 9 – 11 · NTC offsite",
    daysUntil: 62,
    phase: "planning",
    phaseStatus: "gathering options",
  },
];

export const MOCK_QUIETLY_HANDLED: QuietlyHandled = {
  count: 14,
  items: [
    "Newsletter from McKinsey filed to Library",
    "Calendar invite for Friday brunch auto-accepted",
    "Receipt from Lyft (yesterday) categorized → Personal travel",
    "12 more — open to review",
  ],
};
