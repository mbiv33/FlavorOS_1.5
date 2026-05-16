import type { ActiveCall } from "@/lib/types/call";

/**
 * Seed for the morning briefing demo. The call store hydrates with this
 * when "Start morning briefing now" fires.
 */
export const MOCK_MORNING_BRIEFING: ActiveCall = {
  kind: "morning-briefing",
  label: "Morning briefing · Khadijah & Sinclair",
  hosts: ["khadijah", "sinclair"],
  speaking: "khadijah",
  elapsedSeconds: 0,
  muted: false,
  paused: false,
  agenda: [
    { id: "ag-ntc", text: "NTC budget readout", state: "done" },
    { id: "ag-q2", text: "FlourishED Q2 pipeline", state: "done" },
    { id: "ag-wbez", text: "WBEZ podcast — deciding now", state: "active" },
    { id: "ag-tue4", text: "Tuesday 4pm meeting", state: "todo" },
    { id: "ag-paris", text: "Paris check-in", state: "todo" },
    { id: "ag-fy27", text: "FY27 line items 14, 22", state: "todo" },
  ],
  transcript: [
    {
      id: "t-1",
      speaker: "khadijah",
      kind: "speech",
      text: "Good morning. Quick run — six items, should take about 12 minutes if we don't get sidetracked.",
    },
    { id: "t-2", speaker: "user", kind: "speech", text: "Go." },
    {
      id: "t-3",
      speaker: "khadijah",
      kind: "speech",
      text: "NTC budget — Maxine has the FY27 draft ready, two line items flagged, I'll cover those at item 6. Confirmed?",
    },
    { id: "t-4", speaker: "user", kind: "speech", text: "Confirmed." },
    {
      id: "t-5",
      speaker: "khadijah",
      kind: "decision",
      text: "NTC budget readout — confirmed; Maxine continues",
    },
    {
      id: "t-6",
      speaker: "khadijah",
      kind: "speech",
      text: "FlourishED Q2 — three active engagements, healthy pipeline. The Acme invoice is in your queue separately.",
    },
    {
      id: "t-7",
      speaker: "khadijah",
      kind: "decision",
      text: "FlourishED Q2 pipeline — noted",
    },
    {
      id: "t-8",
      speaker: "khadijah",
      kind: "speech",
      text: "WBEZ — producer asked you on May 28 for an education-equity podcast. About 2 hours commitment, 40k weekly listeners. Want me to accept?",
    },
    {
      id: "t-9",
      speaker: "sinclair",
      kind: "note",
      text: "taking note · podcast opportunity, Career context, similar to your 2024 KQED appearance",
    },
  ],
};
