/** Static briefing structure (routes, titles, agenda). Live counts come from the API. */

export type BriefingType = "morning-standup" | "cob-work-day" | "goodnight";

export type BriefingPreparedStatus =
  | "ready"
  | "in_progress"
  | "completed"
  | "not_prepared";

export type BriefingDefinition = {
  title: string;
  direction: string;
  scheduledFor: string;
};

export const BRIEFING_TYPES: BriefingType[] = [
  "morning-standup",
  "cob-work-day",
  "goodnight",
];

export const BRIEFING_DEFINITIONS: Record<BriefingType, BriefingDefinition> = {
  "morning-standup": {
    title: "Morning Standup",
    direction: "Agent → Client",
    scheduledFor: "7:30 AM",
  },
  "cob-work-day": {
    title: "COB Work Day",
    direction: "Agent → Client",
    scheduledFor: "5:30 PM",
  },
  goodnight: {
    title: "Goodnight",
    direction: "Client → Agent",
    scheduledFor: "9:30 PM",
  },
};

export const BRIEFING_SECTIONS: Record<BriefingType, string[]> = {
  "morning-standup": [
    "Greeting",
    "Wellness check-in",
    "Today's priorities",
    "Calendar and schedule risks",
    "Communications needing review",
    "Client approvals",
    "Projects and dependencies",
    "Reports / artifacts ready",
    "Announcements and reminders",
    "Action items and next steps",
  ],
  "cob-work-day": [
    "Quick check-in / wins",
    "Key outcomes from today",
    "Pending approvals",
    "Updates and responses",
    "Open requests / research",
    "Evening schedule and reminders",
    "Obstacles and support needed",
    "Wellness / recreation note",
    "Action items and next steps",
  ],
  goodnight: [
    "Day review",
    "Wellness meter",
    "Goals / milestones / priorities update",
    "Client journal protocol",
    "Worries / concerns",
    "Announcements and reminders",
    "Early-morning schedule and tasks",
  ],
};

export function isBriefingType(value: string): value is BriefingType {
  return (BRIEFING_TYPES as string[]).includes(value);
}
