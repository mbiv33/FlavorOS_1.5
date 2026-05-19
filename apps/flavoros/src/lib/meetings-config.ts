/** Static meeting launcher structure. Live counts come from the API. */

export type MeetingTopic =
  | "communications"
  | "calendar"
  | "travel"
  | "projects"
  | "reports-artifacts"
  | "general";

export const MEETING_TOPICS: MeetingTopic[] = [
  "communications",
  "calendar",
  "travel",
  "projects",
  "reports-artifacts",
  "general",
];

export type MeetingDefinition = {
  title: string;
  preparedSummary: string;
};

export const MEETING_DEFINITIONS: Record<MeetingTopic, MeetingDefinition> = {
  communications: {
    title: "Communications",
    preparedSummary: "Inbox triage and drafts",
  },
  calendar: {
    title: "Calendar",
    preparedSummary: "Schedule and conflicts",
  },
  travel: {
    title: "Travel / Logistics",
    preparedSummary: "Trips and logistics",
  },
  projects: {
    title: "Projects",
    preparedSummary: "Status and blockers",
  },
  "reports-artifacts": {
    title: "Reports & Artifacts",
    preparedSummary: "Work product review",
  },
  general: {
    title: "General Command Center review",
    preparedSummary: "Walk the operating picture",
  },
};

export const MEETING_CHANNEL_HREF: Record<MeetingTopic, string | null> = {
  communications: "/communications",
  calendar: "/calendar",
  travel: "/travel",
  projects: "/projects",
  "reports-artifacts": "/reports",
  general: null,
};

export const MEETING_SECTIONS: Record<MeetingTopic, string[]> = {
  communications: [
    "Inbox triage",
    "Drafts to approve",
    "Outbox status",
    "Awaiting reply",
  ],
  calendar: [
    "Today's schedule",
    "Conflicts to resolve",
    "Upcoming holds",
    "Travel windows",
  ],
  travel: [
    "Trip status",
    "Options to compare",
    "Approvals (holds / bookings)",
    "Travel brief",
    "External links",
  ],
  projects: [
    "Status by project",
    "Open decisions",
    "Artifacts",
    "Approvals",
    "Blockers",
  ],
  "reports-artifacts": [
    "Recent artifacts",
    "Pending review",
    "Filed reports",
    "Source links",
  ],
  general: [
    "Today's operating picture",
    "Open approvals",
    "Recent completions",
    "Open notes",
  ],
};

export function isMeetingTopic(value: string): value is MeetingTopic {
  return (MEETING_TOPICS as string[]).includes(value);
}
