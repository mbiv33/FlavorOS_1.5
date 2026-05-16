"use client";

import { create } from "zustand";
import type { Approval, ApprovalState } from "@/lib/types/approval";
import { MOCK_APPROVALS } from "@/lib/mock/approvals";

/*
 * Approvals store. Single source of truth for Approval Card state.
 *
 * Why one store: the same Approval Card appears in Today, per-project Status,
 * Messages, and right-rail thread (PRD 03 §Where Approval Cards appear).
 * Acting from any one updates all the others.
 *
 * Pull-back window: when state moves to "approved", the post-approve bar
 * stays visible for ~5 min so client can pull back. After that the card
 * collapses to the handled tray. Slice 2 keeps it visible indefinitely; the
 * timer can land in Slice 3 when Today renders the handled drawer.
 */

export type ModifyAxis = "tone" | "format" | "senderRequest";

export interface ModifySelections {
  tone: { warmer: boolean; moreProfessional: boolean };
  format: { narrative: boolean; outline: boolean };
  senderRequest: { clarity: boolean; additionalDetails: boolean };
}

export const EMPTY_MODIFY: ModifySelections = {
  tone: { warmer: false, moreProfessional: false },
  format: { narrative: false, outline: false },
  senderRequest: { clarity: false, additionalDetails: false },
};

interface ApprovalsState {
  approvals: Approval[];
  approve: (id: string) => void;
  /** Submit Modify subform. Selections are not persisted in this slice; the
   * effect is the same: the card transitions to "revising" and a v2 will land
   * later. */
  submitModify: (id: string, selections: ModifySelections) => void;
  doMyself: (id: string) => void;
  pullBack: (id: string) => void;
  setState: (id: string, state: ApprovalState) => void;
  /** Pending count for the header chip. */
  pendingCount: () => number;
}

export const useApprovalsStore = create<ApprovalsState>((set, get) => ({
  approvals: MOCK_APPROVALS,
  approve: (id) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === id ? { ...a, state: "approved" } : a,
      ),
    })),
  submitModify: (id) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === id ? { ...a, state: "revising" } : a,
      ),
    })),
  doMyself: (id) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === id ? { ...a, state: "doing-myself" } : a,
      ),
    })),
  pullBack: (id) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === id ? { ...a, state: "pending" } : a,
      ),
    })),
  setState: (id, state) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === id ? { ...a, state } : a,
      ),
    })),
  pendingCount: () => get().approvals.filter((a) => a.state === "pending").length,
}));

/** Convenience selector hooks. */
export function usePendingApprovals(): Approval[] {
  return useApprovalsStore((s) =>
    s.approvals.filter((a) => a.state === "pending" || a.state === "approved"),
  );
}

export function usePendingCount(): number {
  return useApprovalsStore(
    (s) => s.approvals.filter((a) => a.state === "pending").length,
  );
}
