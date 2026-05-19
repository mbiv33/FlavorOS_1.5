/**
 * Static demo data backing all MVP surfaces until real API wiring.
 * Every record uses the shapes expected by the UI components.
 */

export type DemoBriefing = {
  id: string;
  title: string;
  kind: "morning" | "evening" | "travel" | "project";
  status: "ready" | "generating" | "delivered";
  summary: string;
  agentName: string;
  generatedAt: string;
};

export type DemoMeeting = {
  id: string;
  title: string;
  time: string;
  participants: string[];
  status: "upcoming" | "in-progress" | "completed";
  prepReady: boolean;
};

export type DemoArtifact = {
  id: string;
  title: string;
  kind: "brief" | "report" | "email_draft" | "itinerary" | "memo" | "analysis";
  status: "draft" | "final" | "approved" | "archived";
  agentName: string;
  createdAt: string;
  preview: string;
};

export type DemoApproval = {
  id: string;
  title: string;
  kind: "send" | "book" | "publish" | "expense" | "schedule";
  status: "pending" | "approved" | "rejected";
  agentName: string;
  createdAt: string;
  summary: string;
};

export type DemoProject = {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  progress: number;
  agentName: string;
  lastActivity: string;
};

export type DemoComm = {
  id: string;
  channel: "email" | "slack" | "sms" | "calendar";
  subject: string;
  sender: string;
  priority: "high" | "normal" | "low";
  triaged: boolean;
  receivedAt: string;
};

export type DemoTrip = {
  id: string;
  destination: string;
  dates: string;
  status: "planning" | "booked" | "in-transit" | "completed";
  nextAction: string;
};

// ---------------------------------------------------------------------------

export const briefings: DemoBriefing[] = [
  {
    id: "br-1",
    title: "Morning Standup Brief",
    kind: "morning",
    status: "delivered",
    summary:
      "3 meetings today. 2 approvals pending. Travel confirmation for Thursday needed.",
    agentName: "Khadijah",
    generatedAt: "2026-05-18T08:00:00Z",
  },
  {
    id: "br-2",
    title: "Evening Wrap-Up",
    kind: "evening",
    status: "ready",
    summary:
      "4 artifacts generated. 1 approval completed. Tomorrow: board prep due.",
    agentName: "Khadijah",
    generatedAt: "2026-05-18T18:00:00Z",
  },
  {
    id: "br-3",
    title: "Tokyo Trip Prep",
    kind: "travel",
    status: "generating",
    summary: "Compiling flight options, hotel availability, and meeting logistics...",
    agentName: "Sinclair",
    generatedAt: "2026-05-18T10:30:00Z",
  },
];

export const meetings: DemoMeeting[] = [
  {
    id: "mt-1",
    title: "Weekly 1:1 with Sarah",
    time: "10:00 AM",
    participants: ["Sarah Chen", "You"],
    status: "upcoming",
    prepReady: true,
  },
  {
    id: "mt-2",
    title: "Product Review",
    time: "2:00 PM",
    participants: ["Design Team", "Engineering Leads", "You"],
    status: "upcoming",
    prepReady: false,
  },
  {
    id: "mt-3",
    title: "Board Pre-Read Sync",
    time: "4:30 PM",
    participants: ["CFO", "COO", "You"],
    status: "upcoming",
    prepReady: true,
  },
];

export const artifacts: DemoArtifact[] = [
  {
    id: "art-1",
    title: "Q2 Board Deck Draft",
    kind: "report",
    status: "draft",
    agentName: "Kyle",
    createdAt: "2026-05-17T14:00:00Z",
    preview: "12-slide deck covering revenue, product milestones, and hiring plan.",
  },
  {
    id: "art-2",
    title: "Partner Outreach Email",
    kind: "email_draft",
    status: "final",
    agentName: "Maxine",
    createdAt: "2026-05-18T09:15:00Z",
    preview: "Introduction email to Acme Corp partnership team — warm, concise.",
  },
  {
    id: "art-3",
    title: "Morning Brief — May 18",
    kind: "brief",
    status: "approved",
    agentName: "Khadijah",
    createdAt: "2026-05-18T08:00:00Z",
    preview: "Today's priorities, open loops, and decision points.",
  },
  {
    id: "art-4",
    title: "Tokyo Itinerary v2",
    kind: "itinerary",
    status: "draft",
    agentName: "Sinclair",
    createdAt: "2026-05-18T11:00:00Z",
    preview: "3-day itinerary: flights, hotels, dinner reservations, meeting logistics.",
  },
];

export const approvals: DemoApproval[] = [
  {
    id: "ap-1",
    title: "Send partner intro email",
    kind: "send",
    status: "pending",
    agentName: "Maxine",
    createdAt: "2026-05-18T09:20:00Z",
    summary: "Ready to send the Acme Corp introduction. Confirm recipient and tone.",
  },
  {
    id: "ap-2",
    title: "Book Tokyo flights",
    kind: "book",
    status: "pending",
    agentName: "Sinclair",
    createdAt: "2026-05-18T10:45:00Z",
    summary: "ANA direct, May 22–25. $2,340 round trip. Window seat preferred.",
  },
  {
    id: "ap-3",
    title: "Publish Q2 board deck",
    kind: "publish",
    status: "approved",
    agentName: "Kyle",
    createdAt: "2026-05-17T16:00:00Z",
    summary: "Final version reviewed and approved for board distribution.",
  },
];

export const projects: DemoProject[] = [
  {
    id: "pj-1",
    name: "Q2 Board Preparation",
    status: "active",
    progress: 65,
    agentName: "Kyle",
    lastActivity: "2026-05-18T09:00:00Z",
  },
  {
    id: "pj-2",
    name: "Tokyo Business Trip",
    status: "active",
    progress: 40,
    agentName: "Sinclair",
    lastActivity: "2026-05-18T10:45:00Z",
  },
  {
    id: "pj-3",
    name: "Partnership Pipeline",
    status: "active",
    progress: 25,
    agentName: "Maxine",
    lastActivity: "2026-05-18T09:20:00Z",
  },
  {
    id: "pj-4",
    name: "Quarterly OKR Review",
    status: "paused",
    progress: 80,
    agentName: "Khadijah",
    lastActivity: "2026-05-15T14:00:00Z",
  },
];

export const comms: DemoComm[] = [
  {
    id: "cm-1",
    channel: "email",
    subject: "RE: Q2 numbers follow-up",
    sender: "CFO Office",
    priority: "high",
    triaged: false,
    receivedAt: "2026-05-18T08:30:00Z",
  },
  {
    id: "cm-2",
    channel: "slack",
    subject: "#product — launch timeline updated",
    sender: "PM Team",
    priority: "normal",
    triaged: true,
    receivedAt: "2026-05-18T09:00:00Z",
  },
  {
    id: "cm-3",
    channel: "email",
    subject: "Tokyo meeting confirmation",
    sender: "Tanaka-san",
    priority: "high",
    triaged: false,
    receivedAt: "2026-05-18T07:15:00Z",
  },
  {
    id: "cm-4",
    channel: "calendar",
    subject: "Board dinner — RSVP needed",
    sender: "EA Team",
    priority: "normal",
    triaged: false,
    receivedAt: "2026-05-17T16:00:00Z",
  },
];

export const trips: DemoTrip[] = [
  {
    id: "tr-1",
    destination: "Tokyo, Japan",
    dates: "May 22–25, 2026",
    status: "planning",
    nextAction: "Confirm flight booking",
  },
  {
    id: "tr-2",
    destination: "New York, NY",
    dates: "Jun 5–7, 2026",
    status: "booked",
    nextAction: "Review dinner reservations",
  },
];
