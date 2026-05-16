import type { AppContext } from "@/lib/types/context";
import type { User } from "@/lib/types/user";

/*
 * Mock user profile + contexts. Mirrors the shape that will eventually come
 * from clients/<user>/contexts/*. Swap to a real fetch by replacing this
 * module — the call sites import from @/lib/mock/profile only.
 *
 * To exercise the single-context "zero chrome" rule, set NEXT_PUBLIC_FLAVOROS_SINGLE_CONTEXT=1.
 */

export const MOCK_USER: User = {
  id: "test-client",
  fullName: "Test Client",
  firstName: "Client",
  initials: "TC",
};

const ALL_CONTEXTS: AppContext[] = [
  { id: "w2-ntc", label: "W2 Work", longLabel: "NTC" },
  { id: "llc-flourished", label: "FlourishED", longLabel: "FlourishED Strategies" },
  { id: "career", label: "Career" },
  { id: "personal", label: "Personal" },
];

function singleContextMode(): boolean {
  if (typeof process !== "undefined") {
    return process.env.NEXT_PUBLIC_FLAVOROS_SINGLE_CONTEXT === "1";
  }
  return false;
}

export function getContexts(): AppContext[] {
  return singleContextMode() ? [ALL_CONTEXTS[0]] : ALL_CONTEXTS;
}

export function getContextById(id: string): AppContext | undefined {
  return getContexts().find((c) => c.id === id);
}
