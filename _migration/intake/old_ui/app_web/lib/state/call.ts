"use client";

import { create } from "zustand";
import type { ActiveCall, AgendaItemState } from "@/lib/types/call";
import { MOCK_MORNING_BRIEFING } from "@/lib/mock/call";
import { useThreadsStore } from "./threads";

interface CallStateStore {
  call: ActiveCall | null;
  /** Hydrate from the mock briefing and start the call. */
  startMorningBriefing: () => void;
  end: () => void;
  togglePause: () => void;
  toggleMute: () => void;
  setAgendaState: (id: string, state: AgendaItemState) => void;
  /** Append the user's quick-reply (silent mode) to the transcript. */
  pushUserReply: (text: string) => void;
}

export const useCallStore = create<CallStateStore>((set, get) => ({
  call: null,
  startMorningBriefing: () =>
    set({ call: { ...MOCK_MORNING_BRIEFING } }),
  end: () => {
    const call = get().call;
    if (!call) return;
    // Khadijah's recap message (PRD 05 §End of call) lands in her thread.
    if (call.kind === "morning-briefing") {
      const done = call.agenda.filter((a) => a.state === "done").length;
      const total = call.agenda.length;
      useThreadsStore.getState().appendAgent({
        threadId: "khadijah",
        author: "khadijah",
        body: `Briefing recap — covered ${done}/${total} items. Decisions filed to Library, transcript saved.`,
        timestampLabel: "just now",
      });
    }
    set({ call: null });
  },
  togglePause: () =>
    set((s) =>
      s.call ? { call: { ...s.call, paused: !s.call.paused } } : s,
    ),
  toggleMute: () =>
    set((s) => (s.call ? { call: { ...s.call, muted: !s.call.muted } } : s)),
  setAgendaState: (id, state) =>
    set((s) =>
      s.call
        ? {
            call: {
              ...s.call,
              agenda: s.call.agenda.map((a) =>
                a.id === id ? { ...a, state } : a,
              ),
            },
          }
        : s,
    ),
  pushUserReply: (text) =>
    set((s) =>
      s.call
        ? {
            call: {
              ...s.call,
              transcript: [
                ...s.call.transcript,
                {
                  id: `t-${Date.now()}`,
                  speaker: "user",
                  kind: "speech",
                  text,
                },
              ],
            },
          }
        : s,
    ),
}));
