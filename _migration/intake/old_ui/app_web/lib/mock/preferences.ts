import type { PreferenceGroup } from "@/lib/types/preferences";

export const MOCK_PREFERENCE_GROUPS: PreferenceGroup[] = [
  {
    domain: "travel",
    label: "Travel",
    description: "Transportation, lodging, dining, time preferences",
    items: [
      { id: "tr-1", label: "Transportation", value: "Direct flights, aisle seat, mid-morning departures" },
      { id: "tr-2", label: "Lodging", value: "Boutique > chain · ceiling $300/night · walkable to metro" },
      { id: "tr-3", label: "Dining", value: "Pescatarian when traveling solo · plant-forward by default" },
      { id: "tr-4", label: "Time", value: "Avoid red-eyes · pad day for jet lag on intl > 6h" },
    ],
  },
  {
    domain: "work",
    label: "Work",
    description: "Focus blocks, communication cadence, escalation thresholds",
    items: [
      { id: "wk-1", label: "Focus blocks", value: "3:00–4:30 PM most days · Sinclair holds the slot" },
      { id: "wk-2", label: "Communication cadence", value: "Email batches at 8 AM / 12 PM / 4 PM EST" },
      { id: "wk-3", label: "Escalation thresholds", value: "Money > $1k or board-member-named → ready-for-you" },
    ],
  },
  {
    domain: "wellness",
    label: "Wellness",
    description: "Stress signals, recovery rules, calendar holds",
    items: [
      { id: "wl-1", label: "Stress signals to watch", value: "Back-to-backs > 3 · late nights · skipped meals" },
      { id: "wl-2", label: "Recovery rules", value: "Cool-down day after big events · no early Mondays after travel" },
      { id: "wl-3", label: "Holds", value: "Protect Friday afternoon · no meetings before 9 AM" },
    ],
  },
  {
    domain: "general",
    label: "General",
    description: "Notifications, voice mode, contexts",
    items: [
      { id: "ge-1", label: "Notifications", value: "Push for ready-for-you only · sound off · no haptic at night" },
      { id: "ge-2", label: "Voice mode", value: "Push-to-talk default" },
      { id: "ge-3", label: "Contexts", value: "W2 Work · FlourishED · Career · Personal" },
    ],
  },
];
