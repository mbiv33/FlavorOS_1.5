import type { ChatMessage, Thread } from "@/lib/types/threads";

export const THREADS: Thread[] = [
  {
    id: "group",
    label: "Group room",
    personas: ["khadijah", "sinclair"],
    composerPlaceholder: "Talk to Khadijah, Sinclair, or both…",
  },
  {
    id: "sinclair",
    label: "Sinclair",
    personas: ["sinclair"],
    composerPlaceholder: "Type to Sinclair…",
  },
  {
    id: "khadijah",
    label: "Khadijah",
    personas: ["khadijah"],
    composerPlaceholder: "Type to Khadijah…",
  },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "m-grp-1",
    threadId: "group",
    author: "sinclair",
    body: "So excited for Paris — woo woo woo 🌟",
    timestampLabel: "2m",
  },
  {
    id: "m-sin-1",
    threadId: "sinclair",
    author: "sinclair",
    body: "Good afternoon — how was lunch?",
    timestampLabel: "just now",
  },
  {
    id: "m-sin-2",
    threadId: "sinclair",
    author: "user",
    body: "fine, I'm tired tho",
    timestampLabel: "just now",
  },
  {
    id: "m-kha-1",
    threadId: "khadijah",
    author: "khadijah",
    body: "Hey Boss — anything to bump to the briefing?",
    timestampLabel: "12m",
  },
  {
    id: "m-kha-2",
    threadId: "khadijah",
    author: "user",
    body: "where are we on travel?",
    timestampLabel: "12m",
  },
];
