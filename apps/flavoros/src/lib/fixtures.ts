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
  | "comms-calendar"
  | "travel"
  | "projects"
  | "reports-artifacts"
  | "general";

export type InboxPile = "urgent" | "needs-attention" | "updates";

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

export type InboxItem = {
  id: string;
  pile: InboxPile;
  title: string;
  status: CardStatus;
  agent: AgentName;
  detail: string;
  when: string;
};

export const inboxItems: InboxItem[] = [
  {
    id: "u-1",
    pile: "urgent",
    title: "Approve response to Janelle Cox (Q3 contract)",
    status: "Ready to approve",
    agent: "Sinclair",
    detail: "Draft ready · 2 source threads · est. 45s to review",
    when: "9m ago",
  },
  {
    id: "u-2",
    pile: "urgent",
    title: "Board pre-read v2 is blocked — missing finance summary",
    status: "Blocked",
    agent: "Khadijah",
    detail: "Due Mon. Provide input or reassign.",
    when: "22m ago",
  },
  {
    id: "u-3",
    pile: "urgent",
    title: "Sign off on travel options to Atlanta",
    status: "Needs review",
    agent: "Regine",
    detail: "3 itineraries compared · brief ready",
    when: "1h ago",
  },
  {
    id: "n-1",
    pile: "needs-attention",
    title: "Confirm hold on Thursday 3pm with Pinnacle team",
    status: "Waiting on you",
    agent: "Sinclair",
    detail: "Calendar hold pending your OK",
    when: "today",
  },
  {
    id: "n-2",
    pile: "needs-attention",
    title: "Conflict: Thu 3pm overlaps board prep",
    status: "Waiting on you",
    agent: "Sinclair",
    detail: "Two events scheduled in same window",
    when: "today",
  },
  {
    id: "n-3",
    pile: "needs-attention",
    title: "Pinnacle rollout brief needs your review",
    status: "Needs review",
    agent: "Khadijah",
    detail: "v3 draft ready · 4 min read",
    when: "2h ago",
  },
  {
    id: "n-4",
    pile: "needs-attention",
    title: "Reply drafted for Devon — Q3 plan",
    status: "Draft ready",
    agent: "Sinclair",
    detail: "Read and approve, or send for revision",
    when: "today",
  },
  {
    id: "p-1",
    pile: "updates",
    title: "Q2 retro summary filed in Reports & Artifacts",
    status: "Completed",
    agent: "Khadijah",
    detail: "Filed automatically after approval",
    when: "12m ago",
  },
  {
    id: "p-2",
    pile: "updates",
    title: "Approved reply to Devon sent",
    status: "Sent",
    agent: "Sinclair",
    detail: "Delivered · no bounce",
    when: "34m ago",
  },
  {
    id: "p-3",
    pile: "updates",
    title: "Gmail sync caught up · 14 items normalized",
    status: "Completed",
    agent: "Sinclair",
    detail: "Provider sync healthy",
    when: "1h ago",
  },
  {
    id: "p-4",
    pile: "updates",
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
    title: "Q3 revenue",
    value: "62%",
    detail: "of target · pacing on plan",
    tone: "ok" as const,
  },
  {
    id: "g-2",
    title: "Pinnacle launch",
    value: "Wk 3 / 5",
    detail: "rollout brief pending approval",
    tone: "attention" as const,
  },
  {
    id: "g-3",
    title: "Board prep",
    value: "v2",
    detail: "blocked on finance summary",
    tone: "blocked" as const,
  },
  {
    id: "g-4",
    title: "Wellness",
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

// Legacy fixtures kept for non-dashboard surfaces.

export const projects = [
  {
    id: "pr-1",
    title: "Pinnacle launch readiness",
    status: "In progress" as CardStatus,
    owner: "Khadijah" as AgentName,
    nextStep: "Approve the rollout brief",
    blocked: false,
    dueAt: "Fri",
  },
  {
    id: "pr-2",
    title: "Atlanta site visit",
    status: "Waiting on you" as CardStatus,
    owner: "Regine" as AgentName,
    nextStep: "Choose itinerary option",
    blocked: false,
    dueAt: "Wed",
  },
  {
    id: "pr-3",
    title: "Board pre-read v2",
    status: "Blocked" as CardStatus,
    owner: "Khadijah" as AgentName,
    nextStep: "Missing finance summary input",
    blocked: true,
    dueAt: "Mon",
  },
];

export const commsItems = [
  {
    id: "cm-1",
    title: "Janelle Cox — Q3 contract terms",
    status: "Draft ready" as CardStatus,
    agent: "Sinclair" as AgentName,
    detail: "Reply drafted · waiting on your OK",
  },
  {
    id: "cm-2",
    title: "Conflict: Thu 3pm overlaps board prep",
    status: "Waiting on you" as CardStatus,
    agent: "Sinclair" as AgentName,
    detail: "Two events scheduled in same window",
  },
];

export const artifacts = [
  {
    id: "ar-1",
    title: "Q2 retro summary",
    type: "Report",
    status: "Completed" as CardStatus,
    agent: "Khadijah" as AgentName,
    updated: "12m ago",
  },
  {
    id: "ar-2",
    title: "Atlanta travel brief",
    type: "Travel brief",
    status: "Ready to approve" as CardStatus,
    agent: "Regine" as AgentName,
    updated: "1h ago",
  },
  {
    id: "ar-3",
    title: "Pinnacle rollout brief",
    type: "Project brief",
    status: "Needs review" as CardStatus,
    agent: "Khadijah" as AgentName,
    updated: "2h ago",
  },
];

export const trips = [
  {
    id: "tr-1",
    title: "Atlanta site visit",
    phase: "Planning",
    status: "Needs review" as CardStatus,
    when: "May 24–26",
  },
];

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
  "comms-calendar": {
    title: "Comms & Calendar",
    preparedSummary: "2 drafts ready, 1 conflict",
    openApprovals: 2,
    artifactCount: 4,
    lastUpdate: "12m ago",
  },
  travel: {
    title: "Travel / Logistics",
    preparedSummary: "1 trip in planning",
    openApprovals: 1,
    artifactCount: 3,
    lastUpdate: "1h ago",
  },
  projects: {
    title: "Projects",
    preparedSummary: "3 active · 1 blocked",
    openApprovals: 0,
    artifactCount: 5,
    lastUpdate: "2h ago",
  },
  "reports-artifacts": {
    title: "Reports & Artifacts",
    preparedSummary: "1 ready for approval",
    openApprovals: 1,
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
