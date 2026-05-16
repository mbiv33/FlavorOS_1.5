"use client";

import { create } from "zustand";
import type { PersonaId } from "@/lib/types/persona";

export type VoiceState = "idle" | "listening" | "processing";
export type VoiceMode = "push-to-talk" | "always-on";

interface VoiceStateStore {
  state: VoiceState;
  mode: VoiceMode;
  /** Persona currently being addressed (resolves from active thread + redirect prefix). */
  target: PersonaId | "group";
  setState: (s: VoiceState) => void;
  setMode: (m: VoiceMode) => void;
  setTarget: (t: PersonaId | "group") => void;
}

export const useVoiceStore = create<VoiceStateStore>((set) => ({
  state: "idle",
  mode: "push-to-talk",
  target: "sinclair",
  setState: (state) => set({ state }),
  setMode: (mode) => set({ mode }),
  setTarget: (target) => set({ target }),
}));
