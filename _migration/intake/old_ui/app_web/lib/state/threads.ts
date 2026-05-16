"use client";

import { create } from "zustand";
import type { ChatMessage, ThreadId } from "@/lib/types/threads";
import { MOCK_MESSAGES } from "@/lib/mock/threads";

interface ThreadsState {
  active: ThreadId;
  messages: ChatMessage[];
  setActive: (id: ThreadId) => void;
  /** User-authored message; auto-attaches to the active thread. */
  send: (body: string) => void;
  /** Agent-authored message (used by the call recap flow, etc). */
  appendAgent: (m: Omit<ChatMessage, "id">) => void;
}

export const useThreadsStore = create<ThreadsState>((set) => ({
  active: "sinclair",
  messages: MOCK_MESSAGES,
  setActive: (id) => set({ active: id }),
  send: (body) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: `m-${Date.now()}`,
          threadId: s.active,
          author: "user",
          body,
          timestampLabel: "just now",
        },
      ],
    })),
  appendAgent: (m) =>
    set((s) => ({
      messages: [...s.messages, { id: `m-${Date.now()}-${m.author}`, ...m }],
    })),
}));
