import type { Project } from "@/lib/types/project";

/*
 * Mock projects. Mix of travel and standard so the UI exercises both code
 * paths (5-phase Status pane vs simple Status pane).
 */

export const MOCK_PROJECTS: Project[] = [
  {
    id: "paris-2026",
    kind: "travel",
    status: "active",
    title: "Paris",
    subtitle: "June 14 – 22 · 8 nights · FlourishED + Personal",
    contextId: "llc-flourished",
    statusSentence: "Refining options · round 3",
    nextMilestone: "Final tee-up ~May 19",
    phase: { current: "planning", statusLabel: "refining round 3" },
    daysUntil: 37,
    anchorLabel: "June 14",
    briefParagraphs: [
      "Round 3 narrowed to 3 finalists — all under your $300/night ceiling, all 6th–7th arr., all walkable to metro. Hôtel des Marronniers leads on price + location; Récamier is the quiet pick.",
      "Flight pairings hold a refundable AF business-saver hold through May 16. Scooter is matching transfers to the chosen hotel and will bundle into the final tee-up.",
    ],
    decisions: [
      {
        id: "d-paris-1",
        dateLabel: "May 7",
        text: 'You said: "closer to the 6th arrondissement."',
        kind: "briefing-decision",
      },
      {
        id: "d-paris-2",
        dateLabel: "May 9",
        text: 'You said: "$300/night ceiling, walkable to the metro."',
        kind: "briefing-decision",
      },
    ],
    files: [
      {
        id: "f-paris-1",
        title: "Paris travel brief",
        kind: "brief",
        attribution: "khadijah",
        createdLabel: "May 5",
        status: "final",
      },
      {
        id: "f-paris-2",
        title: "Round 1 candidates",
        kind: "research",
        attribution: "scooter",
        createdLabel: "May 7",
        status: "superseded",
      },
      {
        id: "f-paris-3",
        title: "Round 2 candidates",
        kind: "research",
        attribution: "scooter",
        createdLabel: "May 9",
        status: "superseded",
      },
      {
        id: "f-paris-4",
        title: "Round 3 finalists",
        kind: "research",
        attribution: "scooter",
        createdLabel: "today",
        status: "final",
      },
    ],
    timeline: [
      {
        id: "t-1",
        dateLabel: "May 5",
        text: "Scooter started research — 32 candidate hotels, 4 flight pairings.",
        state: "past",
      },
      {
        id: "t-2",
        dateLabel: "May 7",
        text: "Round 1 — 12 hotels presented.",
        quote: "closer to the 6th arrondissement.",
        state: "past",
      },
      {
        id: "t-3",
        dateLabel: "May 9",
        text: "Round 2 — 5 hotels presented.",
        quote: "$300/night ceiling, walkable to the metro.",
        state: "past",
      },
      {
        id: "t-4",
        dateLabel: "today",
        text: "Round 3 — Scooter is narrowing within your filters.",
        state: "now",
      },
      {
        id: "t-5",
        dateLabel: "~May 19",
        text: "Final tee-up — flight + hotel + transfers bundled, ready for you to book.",
        state: "future",
      },
    ],
    candidates: [
      {
        id: "c-1",
        name: "Hôtel des Marronniers",
        meta: "6th arr. · 4 min walk to St-Germain",
        price: "$272/night",
      },
      {
        id: "c-2",
        name: "Hôtel Récamier",
        meta: "6th arr. · facing Saint-Sulpice",
        price: "$295/night",
      },
      {
        id: "c-3",
        name: "Le Bellechasse",
        meta: "7th arr. · 8 min walk to metro",
        price: "$248/night",
      },
    ],
  },
  {
    id: "nyc-2026",
    kind: "travel",
    status: "active",
    title: "New York",
    subtitle: "July 9 – 11 · NTC offsite",
    contextId: "w2-ntc",
    statusSentence: "Planning · gathering options",
    nextMilestone: "Round 1 ~May 22",
    phase: { current: "planning", statusLabel: "gathering options" },
    daysUntil: 62,
    anchorLabel: "July 9",
    decisions: [],
    files: [],
    timeline: [
      {
        id: "tn-1",
        dateLabel: "May 6",
        text: "Scooter opened research — NTC offsite blocks the dates; hotel + airport transfer scope only.",
        state: "past",
      },
      {
        id: "tn-2",
        dateLabel: "today",
        text: "Gathering hotel options near the offsite venue.",
        state: "now",
      },
      {
        id: "tn-3",
        dateLabel: "~May 22",
        text: "Round 1 candidates — first read.",
        state: "future",
      },
    ],
  },
  {
    id: "ntc-budget",
    kind: "standard",
    status: "active",
    title: "NTC FY27 Budget",
    subtitle: "Board readout · Friday",
    contextId: "w2-ntc",
    statusSentence: "Maxine has the FY27 draft ready for your read",
    nextMilestone: "Friday board readout",
    briefParagraphs: [
      "Draft is in. Two line items flagged for your judgment: line 14 (PD spend carryover) and line 22 (technology refresh cycle). Maxine staged context on both for the morning briefing.",
    ],
    decisions: [
      {
        id: "d-ntc-1",
        dateLabel: "May 4",
        text: "You approved Maxine to draft from last year's framework with line-by-line variance notes.",
        kind: "approved",
      },
    ],
    files: [
      {
        id: "f-ntc-1",
        title: "FY27 budget draft v3",
        kind: "draft",
        attribution: "maxine",
        createdLabel: "yesterday",
        status: "final",
      },
      {
        id: "f-ntc-2",
        title: "Variance memo (lines 14, 22)",
        kind: "brief",
        attribution: "maxine",
        createdLabel: "yesterday",
      },
    ],
  },
  {
    id: "flourished-q2",
    kind: "standard",
    status: "active",
    title: "FlourishED Q2",
    subtitle: "3 active engagements",
    contextId: "llc-flourished",
    statusSentence: "Healthy pipeline · Acme invoice ready for you",
    nextMilestone: "Acme invoice approval",
    decisions: [],
    files: [
      {
        id: "f-flo-1",
        title: "Q2 pipeline snapshot",
        kind: "brief",
        attribution: "khadijah",
        createdLabel: "May 7",
      },
    ],
  },
];

export function getProject(id: string): Project | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id);
}

export function getTravelProjects(): Project[] {
  return MOCK_PROJECTS.filter((p) => p.kind === "travel");
}
