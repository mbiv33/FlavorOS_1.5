import type { LibraryArtifact } from "@/lib/types/library";

export const MOCK_LIBRARY: LibraryArtifact[] = [
  {
    id: "lib-paris-brief",
    title: "Paris travel brief",
    kind: "brief",
    attribution: "khadijah",
    contextId: "llc-flourished",
    projectId: "paris-2026",
    createdLabel: "May 5",
    status: "final",
    body:
      "Paris · June 14–22 (8 nights). Mixed FlourishED + Personal trip. Anchor commitments: dinner with M. on the 16th; Sorbonne talk inquiry on the 18th. Sleep priority over all else.",
  },
  {
    id: "lib-paris-r3",
    title: "Round 3 finalists",
    kind: "research",
    attribution: "scooter",
    contextId: "llc-flourished",
    projectId: "paris-2026",
    createdLabel: "today",
    status: "final",
    rows: [
      { label: "Hôtel des Marronniers", value: "$272/night · 6th arr." },
      { label: "Hôtel Récamier", value: "$295/night · 6th arr." },
      { label: "Le Bellechasse", value: "$248/night · 7th arr." },
    ],
  },
  {
    id: "lib-fy27-draft",
    title: "FY27 budget draft v3",
    kind: "draft",
    attribution: "maxine",
    contextId: "w2-ntc",
    projectId: "ntc-budget",
    createdLabel: "yesterday",
    status: "final",
    body:
      "FY27 carries the literacy initiative budget forward at 102% of FY26, with two flagged line items (PD spend carryover, technology refresh cycle) staged for your call.",
    versions: [
      { id: "v1", label: "v1 · May 5" },
      { id: "v2", label: "v2 · May 6" },
    ],
  },
  {
    id: "lib-fy27-variance",
    title: "Variance memo (lines 14, 22)",
    kind: "brief",
    attribution: "maxine",
    contextId: "w2-ntc",
    projectId: "ntc-budget",
    createdLabel: "yesterday",
    body:
      "Line 14 (PD spend carryover): proposing $42k roll-forward into the late-summer cohort. Line 22 (technology refresh cycle): biennial vs annual is a budget-time-vs-disruption tradeoff.",
  },
  {
    id: "lib-q2-snapshot",
    title: "Q2 pipeline snapshot",
    kind: "brief",
    attribution: "khadijah",
    contextId: "llc-flourished",
    projectId: "flourished-q2",
    createdLabel: "May 7",
    status: "final",
  },
  {
    id: "lib-acme-invoice-prev",
    title: "Invoice #246 to Acme Co.",
    kind: "invoice",
    attribution: "maxine",
    contextId: "llc-flourished",
    projectId: "flourished-q2",
    createdLabel: "Apr 15",
    status: "sent",
    rows: [
      { label: "Hours billed", value: "18 @ $200" },
      { label: "Total", value: "$3,600" },
      { label: "Paid", value: "May 3 (18 days)" },
    ],
  },
];
