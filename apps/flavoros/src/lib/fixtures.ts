// Placeholder fixtures used by the surface scaffolding.
// These intentionally do not call InstantDB; each surface will be wired
// to durable storage as Phase 2 lands.
//
// Keep this file plain-data only.

export type CardStatus =
  | "Needs review"
  | "Ready to approve"
  | "Waiting on you"
  | "Blocked"
  | "In progress"
  | "Draft ready"
  | "Ready for briefing"
  | "Completed"
  | "Sent"
  | "Queued"
  | "Failed"
  | "Pulled back";

export type AgentName = "Khadijah" | "Sinclair" | "Regine";

export type BriefingType = "morning-standup" | "cob-work-day" | "goodnight";

export type MeetingTopic =
  | "communications"
  | "calendar"
  | "travel"
  | "projects"
  | "reports-artifacts"
  | "general";

// Pile keys per surface
export type InboxPile = "urgent" | "needs-attention" | "updates";
export type ReportsPile = "reports" | "briefs" | "drafts";
export type ProjectsPile = "active" | "blocked" | "completed";
export type TravelPile = "decisions" | "research" | "itineraries";
export type CommsPile = "emails" | "sms-voice" | "social";
export type CalendarPile = "today" | "conflicts" | "upcoming";

// Item kind drives the action set in pile overlays.
// - approval: approve/modify/i'll do myself (+ defer when allowed) + Open source
// - update: open + (within retraction window) Pull back
// - event: open + Approve hold (when state allows)
export type ItemKind = "approval" | "update" | "event";

export const clientProfile = {
  displayName: "Marcus Bivines",
  initials: "MB",
  role: "Client",
  contextLabels: ["Work", "Business", "Personal"] as string[],
  timezone: "America/New_York",
};

export const todayOperatingPicture = {
  date: "Monday, May 18",
  greeting: "Good morning, Marcus.",
  nextFocus: "Team sync in 1h 12m",
  dayStatus: "Morning Standup ready",
  urgentBlocker: null as string | null,
};

// -----------------------------------------------------------------------
// Dashboard · Client Inbox
// -----------------------------------------------------------------------

export type InboxItem = {
  id: string;
  pile: InboxPile;
  kind: ItemKind;
  title: string;
  status: CardStatus;
  agent: AgentName;
  detail: string;
  when: string;
  canDefer?: boolean;
  sourceLinkLabel?: string;
  approvalId?: string;
};

export const inboxItems: InboxItem[] = [
  {
    id: "u-1",
    pile: "urgent",
    kind: "approval",
    title: "Approve response to Janelle Cox (Q3 contract)",
    status: "Ready to approve",
    agent: "Sinclair",
    detail: "Draft ready · 2 source threads · est. 45s to review",
    when: "9m ago",
    sourceLinkLabel: "Gmail thread",
  },
  {
    id: "u-2",
    pile: "urgent",
    kind: "approval",
    title: "Board pre-read v2 is blocked — missing finance summary",
    status: "Blocked",
    agent: "Khadijah",
    detail: "Due Mon. Provide input or reassign.",
    when: "22m ago",
  },
  {
    id: "u-3",
    pile: "urgent",
    kind: "approval",
    title: "Sign off on travel options to Atlanta",
    status: "Needs review",
    agent: "Regine",
    detail: "3 itineraries compared · brief ready",
    when: "1h ago",
    sourceLinkLabel: "Travel brief",
  },
  {
    id: "n-1",
    pile: "needs-attention",
    kind: "approval",
    title: "Confirm hold on Thursday 3pm with Pinnacle team",
    status: "Waiting on you",
    agent: "Sinclair",
    detail: "Calendar hold pending your OK",
    when: "today",
    canDefer: true,
    sourceLinkLabel: "Google Calendar",
  },
  {
    id: "n-2",
    pile: "needs-attention",
    kind: "approval",
    title: "Conflict: Thu 3pm overlaps board prep",
    status: "Waiting on you",
    agent: "Sinclair",
    detail: "Two events scheduled in same window",
    when: "today",
    canDefer: true,
  },
  {
    id: "n-3",
    pile: "needs-attention",
    kind: "approval",
    title: "Pinnacle rollout brief needs your review",
    status: "Needs review",
    agent: "Khadijah",
    detail: "v3 draft ready · 4 min read",
    when: "2h ago",
    sourceLinkLabel: "Brief artifact",
  },
  {
    id: "n-4",
    pile: "needs-attention",
    kind: "approval",
    title: "Reply drafted for Devon — Q3 plan",
    status: "Draft ready",
    agent: "Sinclair",
    detail: "Read and approve, or send for revision",
    when: "today",
    sourceLinkLabel: "Gmail thread",
  },
  {
    id: "p-1",
    pile: "updates",
    kind: "update",
    title: "Q2 retro summary filed in Reports & Artifacts",
    status: "Completed",
    agent: "Khadijah",
    detail: "Filed automatically after approval",
    when: "12m ago",
  },
  {
    id: "p-2",
    pile: "updates",
    kind: "update",
    title: "Approved reply to Devon sent",
    status: "Sent",
    agent: "Sinclair",
    detail: "Delivered · within retraction window",
    when: "34m ago",
  },
  {
    id: "p-3",
    pile: "updates",
    kind: "update",
    title: "Gmail sync caught up · 14 items normalized",
    status: "Completed",
    agent: "Sinclair",
    detail: "Provider sync healthy",
    when: "1h ago",
  },
  {
    id: "p-4",
    pile: "updates",
    kind: "update",
    title: "Travel research artifact created for Atlanta trip",
    status: "Completed",
    agent: "Regine",
    detail: "Linked to trip · ready when you are",
    when: "3h ago",
  },
];

export const inboxCounts = inboxItems.reduce(
  (acc, item) => {
    acc[item.pile] += 1;
    return acc;
  },
  { urgent: 0, "needs-attention": 0, updates: 0 } as Record<InboxPile, number>,
);

export const goalsAndMilestones = [
  {
    id: "g-1",
    label: "Q3 revenue",
    value: "62%",
    detail: "of target · pacing on plan",
    tone: "ok" as const,
  },
  {
    id: "g-2",
    label: "Pinnacle launch",
    value: "Wk 3 / 5",
    detail: "rollout brief pending approval",
    tone: "attention" as const,
  },
  {
    id: "g-3",
    label: "Board prep",
    value: "v2",
    detail: "blocked on finance summary",
    tone: "blocked" as const,
  },
  {
    id: "g-4",
    label: "Wellness",
    value: "7/10",
    detail: "trending up · 5-day avg",
    tone: "ok" as const,
  },
];

export const calendarMonth = {
  label: "May 2026",
  weekdays: ["S", "M", "T", "W", "Th", "F", "S"],
  // 6 rows × 7 cols. null = padding cell.
  weeks: [
    [null, null, null, null, null, 1, 2],
    [3, 4, 5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14, 15, 16],
    [17, 18, 19, 20, 21, 22, 23],
    [24, 25, 26, 27, 28, 29, 30],
    [31, null, null, null, null, null, null],
  ] as Array<Array<number | null>>,
  today: 18,
  marked: [20, 22, 24, 25, 26] as number[],
};

// -----------------------------------------------------------------------
// Reports & Artifacts surface
// -----------------------------------------------------------------------

export type ArtifactPileItem = {
  id: string;
  pile: ReportsPile;
  kind: ItemKind;
  title: string;
  artifactType: string; // canon: client_artifacts.artifact_type
  status: CardStatus;
  agent: AgentName;
  context: string;
  updated: string;
  sourceLinkLabel?: string;
  canDefer?: boolean;
};

export const reportsItems: ArtifactPileItem[] = [
  {
    id: "rep-1",
    pile: "reports",
    kind: "approval",
    title: "Q2 finance retro",
    artifactType: "report",
    status: "Ready to approve",
    agent: "Khadijah",
    context: "Business",
    updated: "1h ago",
    sourceLinkLabel: "Google Docs",
  },
  {
    id: "rep-2",
    pile: "reports",
    kind: "update",
    title: "March wellness rollup",
    artifactType: "report",
    status: "Completed",
    agent: "Sinclair",
    context: "Personal",
    updated: "yesterday",
  },
  {
    id: "rep-3",
    pile: "reports",
    kind: "update",
    title: "Q2 retro summary",
    artifactType: "report",
    status: "Completed",
    agent: "Khadijah",
    context: "Business",
    updated: "12m ago",
  },
  {
    id: "br-1",
    pile: "briefs",
    kind: "approval",
    title: "Pinnacle rollout brief v3",
    artifactType: "brief",
    status: "Needs review",
    agent: "Khadijah",
    context: "Work",
    updated: "2h ago",
    sourceLinkLabel: "Brief artifact",
  },
  {
    id: "br-2",
    pile: "briefs",
    kind: "approval",
    title: "Atlanta travel brief",
    artifactType: "brief",
    status: "Ready to approve",
    agent: "Regine",
    context: "Business",
    updated: "1h ago",
  },
  {
    id: "br-3",
    pile: "briefs",
    kind: "update",
    title: "Board prep brief v1",
    artifactType: "brief",
    status: "Pulled back",
    agent: "Khadijah",
    context: "Work",
    updated: "yesterday",
  },
  {
    id: "dr-1",
    pile: "drafts",
    kind: "approval",
    title: "Reply to Janelle Cox · Q3 contract",
    artifactType: "draft_email",
    status: "Draft ready",
    agent: "Sinclair",
    context: "Work",
    updated: "9m ago",
    sourceLinkLabel: "Gmail thread",
  },
  {
    id: "dr-2",
    pile: "drafts",
    kind: "approval",
    title: "Reply to Devon · Q3 plan",
    artifactType: "draft_email",
    status: "Draft ready",
    agent: "Sinclair",
    context: "Work",
    updated: "today",
    sourceLinkLabel: "Gmail thread",
  },
];

export const reportsStats = [
  {
    id: "rs-1",
    label: "Pending review",
    value: "4",
    detail: "across all types",
    tone: "attention" as const,
  },
  {
    id: "rs-2",
    label: "Filed this month",
    value: "11",
    detail: "+3 vs April",
    tone: "ok" as const,
  },
  {
    id: "rs-3",
    label: "Drafts in flight",
    value: "2",
    detail: "all comms",
    tone: "neutral" as const,
  },
  {
    id: "rs-4",
    label: "Avg approval time",
    value: "2.1h",
    detail: "↓ 18% this month",
    tone: "ok" as const,
  },
];

// -----------------------------------------------------------------------
// Projects surface
// -----------------------------------------------------------------------

export type ProjectPileItem = {
  id: string;
  pile: ProjectsPile;
  kind: ItemKind;
  title: string;
  status: CardStatus;
  owner: AgentName;
  nextStep: string;
  context: string;
  dueAt: string;
  sourceLinkLabel?: string;
};

export const projectsItems: ProjectPileItem[] = [
  {
    id: "pr-1",
    pile: "active",
    kind: "approval",
    title: "Pinnacle launch readiness",
    status: "In progress",
    owner: "Khadijah",
    nextStep: "Approve the rollout brief",
    context: "Work",
    dueAt: "Fri May 22",
    sourceLinkLabel: "Project doc",
  },
  {
    id: "pr-2",
    pile: "active",
    kind: "approval",
    title: "Atlanta site visit",
    status: "Waiting on you",
    owner: "Regine",
    nextStep: "Choose itinerary option",
    context: "Business",
    dueAt: "Wed May 20",
  },
  {
    id: "pr-3",
    pile: "blocked",
    kind: "approval",
    title: "Board pre-read v2",
    status: "Blocked",
    owner: "Khadijah",
    nextStep: "Missing finance summary input",
    context: "Work",
    dueAt: "Mon May 18",
  },
  {
    id: "pr-4",
    pile: "completed",
    kind: "update",
    title: "Q1 hiring round",
    status: "Completed",
    owner: "Khadijah",
    nextStep: "—",
    context: "Work",
    dueAt: "Apr 30",
  },
  {
    id: "pr-5",
    pile: "completed",
    kind: "update",
    title: "April wellness program rollout",
    status: "Completed",
    owner: "Sinclair",
    nextStep: "—",
    context: "Personal",
    dueAt: "May 1",
  },
];

export const projectsStats = [
  {
    id: "ps-1",
    label: "Active",
    value: "2",
    detail: "1 needs your input",
    tone: "attention" as const,
  },
  {
    id: "ps-2",
    label: "Blocked",
    value: "1",
    detail: "Board pre-read",
    tone: "blocked" as const,
  },
  {
    id: "ps-3",
    label: "Completed this quarter",
    value: "7",
    detail: "+2 vs last quarter",
    tone: "ok" as const,
  },
  {
    id: "ps-4",
    label: "Due this week",
    value: "3",
    detail: "Pinnacle, Atlanta, Board",
    tone: "neutral" as const,
  },
];

// -----------------------------------------------------------------------
// Travel & Logistics surface
// -----------------------------------------------------------------------

export type TravelPileItem = {
  id: string;
  pile: TravelPile;
  kind: ItemKind;
  title: string;
  status: CardStatus;
  agent: AgentName;
  detail: string;
  trip: string;
  updated: string;
  sourceLinkLabel?: string;
};

export const travelItems: TravelPileItem[] = [
  {
    id: "tv-1",
    pile: "decisions",
    kind: "approval",
    title: "Choose Atlanta itinerary · 3 options",
    status: "Ready to approve",
    agent: "Regine",
    detail: "Direct flight, $480 mid-tier hotel preferred",
    trip: "Atlanta site visit",
    updated: "1h ago",
    sourceLinkLabel: "Travel brief",
  },
  {
    id: "tv-2",
    pile: "decisions",
    kind: "approval",
    title: "Approve Paris hotel hold",
    status: "Waiting on you",
    agent: "Regine",
    detail: "Hold expires Friday",
    trip: "Paris · BAR conference",
    updated: "yesterday",
    sourceLinkLabel: "Hotel page",
  },
  {
    id: "tr-1",
    pile: "research",
    kind: "update",
    title: "Atlanta restaurant shortlist",
    status: "Completed",
    agent: "Regine",
    detail: "5 dinner options near hotel",
    trip: "Atlanta site visit",
    updated: "3h ago",
  },
  {
    id: "tr-2",
    pile: "research",
    kind: "update",
    title: "BAR conference agenda summary",
    status: "Completed",
    agent: "Regine",
    detail: "Speakers, sessions, networking events",
    trip: "Paris · BAR conference",
    updated: "yesterday",
  },
  {
    id: "ti-1",
    pile: "itineraries",
    kind: "approval",
    title: "Atlanta v2 itinerary",
    status: "Draft ready",
    agent: "Regine",
    detail: "Day 1 client meetings · Day 2 wrap",
    trip: "Atlanta site visit",
    updated: "30m ago",
  },
];

export const travelStats = [
  {
    id: "tvs-1",
    label: "Upcoming trips",
    value: "3",
    detail: "next 90 days",
    tone: "neutral" as const,
  },
  {
    id: "tvs-2",
    label: "Decisions to make",
    value: "2",
    detail: "1 expires Friday",
    tone: "attention" as const,
  },
  {
    id: "tvs-3",
    label: "Research items",
    value: "2",
    detail: "ready when you are",
    tone: "ok" as const,
  },
  {
    id: "tvs-4",
    label: "Itineraries",
    value: "1",
    detail: "in draft",
    tone: "neutral" as const,
  },
];

export const trips = [
  {
    id: "trip-1",
    title: "Atlanta site visit",
    phase: "Planning",
    when: "May 24–26",
    summary:
      "Two days of client meetings in Buckhead. Direct ATL flight preferred; mid-tier hotel near the office.",
  },
  {
    id: "trip-2",
    title: "Paris · BAR conference",
    phase: "Booked",
    when: "Jul 16–18",
    summary:
      "Speaking at BAR. Marais hotel hold expires Friday. Carry-on only.",
  },
  {
    id: "trip-3",
    title: "BF wedding event",
    phase: "Planning",
    when: "Aug 9–11",
    summary: "Family travel. Coordinate with household calendar.",
  },
];

export const logistics = {
  hospitality: [
    "Hotel options · Atlanta",
    "Marais hotel · Paris",
    "Airbnb · BF event",
  ],
  transportation: [
    "Direct ATL flight",
    "Eurostar · Paris arrival",
    "Rental car · BF event",
  ],
  dining: ["Buckhead shortlist", "Marais dinner picks", "Family reunion menu"],
  locations: ["ATL office", "BAR venue · Paris", "BF wedding venue"],
};

// -----------------------------------------------------------------------
// Communications surface
// -----------------------------------------------------------------------

export type CommsItem = {
  id: string;
  pile: CommsPile;
  kind: ItemKind;
  title: string;
  status: CardStatus;
  agent: AgentName;
  detail: string;
  context: string;
  when: string;
  sourceLinkLabel?: string;
  canDefer?: boolean;
};

export const commsPileItems: CommsItem[] = [
  {
    id: "em-1",
    pile: "emails",
    kind: "approval",
    title: "Janelle Cox · Q3 contract terms",
    status: "Draft ready",
    agent: "Sinclair",
    detail: "Reply drafted · awaiting your OK",
    context: "Work",
    when: "9m ago",
    sourceLinkLabel: "Gmail thread",
  },
  {
    id: "em-2",
    pile: "emails",
    kind: "approval",
    title: "Devon · Q3 plan",
    status: "Draft ready",
    agent: "Sinclair",
    detail: "Read and approve",
    context: "Work",
    when: "today",
    sourceLinkLabel: "Gmail thread",
  },
  {
    id: "em-3",
    pile: "emails",
    kind: "update",
    title: "Reply to Janelle sent (last week)",
    status: "Sent",
    agent: "Sinclair",
    detail: "Delivered",
    context: "Work",
    when: "5d ago",
  },
  {
    id: "sm-1",
    pile: "sms-voice",
    kind: "approval",
    title: "SMS reply · Atlanta venue",
    status: "Draft ready",
    agent: "Regine",
    detail: "Confirming arrival window",
    context: "Business",
    when: "1h ago",
  },
  {
    id: "so-1",
    pile: "social",
    kind: "update",
    title: "LinkedIn DM · intro request",
    status: "Queued",
    agent: "Sinclair",
    detail: "Awaiting your decision · social DMs queue",
    context: "Work",
    when: "yesterday",
  },
];

export const commsStats = [
  {
    id: "cms-1",
    label: "Drafts pending",
    value: "3",
    detail: "across channels",
    tone: "attention" as const,
  },
  {
    id: "cms-2",
    label: "Sent today",
    value: "4",
    detail: "all healthy",
    tone: "ok" as const,
  },
  {
    id: "cms-3",
    label: "Awaiting reply",
    value: "6",
    detail: "Sinclair watching",
    tone: "neutral" as const,
  },
  {
    id: "cms-4",
    label: "Unread urgent",
    value: "1",
    detail: "from Janelle Cox",
    tone: "blocked" as const,
  },
];

export const contactsByContext: Array<{
  context: string;
  contacts: Array<{ id: string; name: string; meta: string }>;
}> = [
  {
    context: "Work",
    contacts: [
      { id: "c-1", name: "Janelle Cox", meta: "Pinnacle · Director" },
      { id: "c-2", name: "Devon Hill", meta: "Internal · Strategy" },
      { id: "c-3", name: "Sarah Levin", meta: "Pinnacle · Counsel" },
    ],
  },
  {
    context: "Business",
    contacts: [
      { id: "c-4", name: "Atlanta Office", meta: "Front desk · ATL" },
      { id: "c-5", name: "BAR conference org", meta: "Paris" },
    ],
  },
  {
    context: "Personal",
    contacts: [
      { id: "c-6", name: "Family · BF event", meta: "Wedding coordinator" },
    ],
  },
];

// -----------------------------------------------------------------------
// Calendar surface
// -----------------------------------------------------------------------

export type CalendarItem = {
  id: string;
  pile: CalendarPile;
  kind: ItemKind;
  title: string;
  status: CardStatus;
  agent: AgentName;
  detail: string;
  when: string;
  context: string;
  sourceLinkLabel?: string;
  canDefer?: boolean;
};

export const calendarPileItems: CalendarItem[] = [
  {
    id: "cl-1",
    pile: "today",
    kind: "event",
    title: "Team sync",
    status: "In progress",
    agent: "Sinclair",
    detail: "10:30 AM · 30 min · 4 participants",
    when: "Today",
    context: "Work",
    sourceLinkLabel: "Google Calendar",
  },
  {
    id: "cl-2",
    pile: "today",
    kind: "event",
    title: "Pinnacle 1:1 with Janelle",
    status: "In progress",
    agent: "Sinclair",
    detail: "2:00 PM · 45 min",
    when: "Today",
    context: "Work",
    sourceLinkLabel: "Google Calendar",
  },
  {
    id: "cl-3",
    pile: "conflicts",
    kind: "approval",
    title: "Thu 3pm overlaps board prep",
    status: "Waiting on you",
    agent: "Sinclair",
    detail: "Pinnacle hold vs. Board prep block",
    when: "Thu May 21",
    context: "Work",
    canDefer: true,
  },
  {
    id: "cl-4",
    pile: "upcoming",
    kind: "event",
    title: "Board prep block",
    status: "In progress",
    agent: "Khadijah",
    detail: "Wed 9:00 AM · 2h",
    when: "Wed May 20",
    context: "Work",
  },
  {
    id: "cl-5",
    pile: "upcoming",
    kind: "approval",
    title: "Atlanta trip · calendar hold",
    status: "Ready to approve",
    agent: "Regine",
    detail: "May 24–26 · travel + meetings",
    when: "May 24",
    context: "Business",
  },
  {
    id: "cl-6",
    pile: "upcoming",
    kind: "event",
    title: "BF event family call",
    status: "In progress",
    agent: "Regine",
    detail: "Fri 7:00 PM · 1h",
    when: "Fri May 22",
    context: "Personal",
  },
];

export const calendarStats = [
  {
    id: "cas-1",
    label: "Today's events",
    value: "4",
    detail: "next at 10:30 AM",
    tone: "neutral" as const,
  },
  {
    id: "cas-2",
    label: "Conflicts",
    value: "1",
    detail: "Thu 3pm overlap",
    tone: "blocked" as const,
  },
  {
    id: "cas-3",
    label: "This week",
    value: "11",
    detail: "incl. board prep",
    tone: "neutral" as const,
  },
  {
    id: "cas-4",
    label: "Travel days",
    value: "3",
    detail: "Atlanta May 24–26",
    tone: "info" as const,
  },
];

// -----------------------------------------------------------------------
// Briefings + Meetings launch (kept)
// -----------------------------------------------------------------------

export const briefings: Record<
  BriefingType,
  {
    title: string;
    direction: string;
    scheduledFor: string;
    preparedStatus: "ready" | "in_progress" | "completed" | "not_prepared";
    topicCount: number;
    approvalCount: number;
  }
> = {
  "morning-standup": {
    title: "Morning Standup",
    direction: "Agent → Client",
    scheduledFor: "7:30 AM",
    preparedStatus: "ready",
    topicCount: 8,
    approvalCount: 3,
  },
  "cob-work-day": {
    title: "COB Work Day",
    direction: "Agent → Client",
    scheduledFor: "5:30 PM",
    preparedStatus: "not_prepared",
    topicCount: 0,
    approvalCount: 0,
  },
  goodnight: {
    title: "Goodnight",
    direction: "Client → Agent",
    scheduledFor: "9:30 PM",
    preparedStatus: "not_prepared",
    topicCount: 0,
    approvalCount: 0,
  },
};

export const meetings: Record<
  MeetingTopic,
  {
    title: string;
    preparedSummary: string;
    openApprovals: number;
    artifactCount: number;
    lastUpdate: string;
  }
> = {
  communications: {
    title: "Communications",
    preparedSummary: "3 drafts ready",
    openApprovals: 3,
    artifactCount: 4,
    lastUpdate: "9m ago",
  },
  calendar: {
    title: "Calendar",
    preparedSummary: "1 conflict to resolve",
    openApprovals: 1,
    artifactCount: 2,
    lastUpdate: "today",
  },
  travel: {
    title: "Travel / Logistics",
    preparedSummary: "1 trip in planning",
    openApprovals: 2,
    artifactCount: 5,
    lastUpdate: "1h ago",
  },
  projects: {
    title: "Projects",
    preparedSummary: "3 active · 1 blocked",
    openApprovals: 2,
    artifactCount: 5,
    lastUpdate: "2h ago",
  },
  "reports-artifacts": {
    title: "Reports & Artifacts",
    preparedSummary: "4 ready for approval",
    openApprovals: 4,
    artifactCount: 8,
    lastUpdate: "12m ago",
  },
  general: {
    title: "General Command Center review",
    preparedSummary: "Walk the operating picture",
    openApprovals: 3,
    artifactCount: 0,
    lastUpdate: "now",
  },
};
