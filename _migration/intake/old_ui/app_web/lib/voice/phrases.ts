/*
 * Voice phrase → action mapping. Stub implementation: takes a transcribed
 * phrase, matches against known intents, returns an action descriptor.
 *
 * Real transport (STT, NATS event publish) lands when backend wiring goes
 * in — this module's interface stays the same; only the source of `phrase`
 * changes from "string typed in dev" to "ASR result".
 */

import { useApprovalsStore } from "@/lib/state/approvals";
import { useCallStore } from "@/lib/state/call";

export type VoiceAction =
  | { kind: "approve"; approvalId: string; matched: string }
  | { kind: "modify"; approvalId: string; matched: string }
  | { kind: "do-myself"; approvalId: string; matched: string }
  | { kind: "start-briefing"; matched: string }
  | { kind: "end-call"; matched: string }
  | { kind: "navigate"; href: string; matched: string }
  | { kind: "noop"; matched: string };

const NAV_TARGETS: { phrases: string[]; href: string }[] = [
  { phrases: ["today"], href: "/" },
  { phrases: ["work", "projects"], href: "/work" },
  { phrases: ["travel", "trips"], href: "/work/travel" },
  { phrases: ["messages", "inbox"], href: "/messages" },
  { phrases: ["calendar"], href: "/calendar" },
  { phrases: ["library"], href: "/library" },
  { phrases: ["preferences", "settings"], href: "/preferences" },
];

/**
 * Resolve a phrase to an action. Read-only: callers decide whether/how to
 * apply (some actions are router-bound; others mutate stores directly).
 */
export function resolvePhrase(phrase: string): VoiceAction {
  const lower = phrase.toLowerCase().trim();

  // Call control
  if (/^(end|stop|hang up)( the call| this call)?$/.test(lower)) {
    return { kind: "end-call", matched: lower };
  }
  if (/^(start|begin)\b.*briefing/.test(lower)) {
    return { kind: "start-briefing", matched: lower };
  }

  // Approve / modify / do-myself by approval object match
  // "approve the Acme invoice" / "modify John's reply" / "I'll do the gala myself"
  const approvals = useApprovalsStore.getState().approvals;
  for (const a of approvals) {
    const haystack = `${a.object} ${a.verb}`.toLowerCase();
    const tokens = haystack.replace(/[#:,]/g, "").split(/\s+/).filter(Boolean);
    const match = tokens.some((t) => t.length > 3 && lower.includes(t));
    if (!match) continue;
    if (/\bapprove\b/.test(lower)) {
      return { kind: "approve", approvalId: a.id, matched: lower };
    }
    if (/\bmodify\b/.test(lower)) {
      return { kind: "modify", approvalId: a.id, matched: lower };
    }
    if (/\b(myself|i'?ll do|i will do)\b/.test(lower)) {
      return { kind: "do-myself", approvalId: a.id, matched: lower };
    }
  }

  // Navigation
  for (const target of NAV_TARGETS) {
    if (target.phrases.some((p) => lower.includes(p))) {
      return { kind: "navigate", href: target.href, matched: lower };
    }
  }

  return { kind: "noop", matched: lower };
}

/**
 * Apply a resolved action against the stores. Returns a label describing
 * what happened (callers can toast / log it). Navigation is router-bound
 * and signaled via the returned action; the caller routes.
 */
export function applyAction(
  action: VoiceAction,
): { label: string; navigate?: string } {
  switch (action.kind) {
    case "approve": {
      useApprovalsStore.getState().approve(action.approvalId);
      return { label: `Approved · ${action.approvalId}` };
    }
    case "do-myself": {
      useApprovalsStore.getState().doMyself(action.approvalId);
      return { label: `Took on yourself · ${action.approvalId}` };
    }
    case "modify": {
      // Modify needs the subform — surface a hint instead of mutating.
      return {
        label: `Open Modify on ${action.approvalId} (use the card subform)`,
      };
    }
    case "start-briefing": {
      useCallStore.getState().startMorningBriefing();
      return { label: "Started morning briefing" };
    }
    case "end-call": {
      useCallStore.getState().end();
      return { label: "Ended call" };
    }
    case "navigate":
      return { label: `Jump to ${action.href}`, navigate: action.href };
    case "noop":
      return { label: `Heard: "${action.matched}" (no match)` };
  }
}
