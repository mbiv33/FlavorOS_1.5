/*
 * Preferences are grouped by life-domain (Travel / Work / Wellness / General),
 * not by app section. PRD 04 §4.7.
 */

export type DomainId = "travel" | "work" | "wellness" | "general";

export interface PreferenceGroup {
  domain: DomainId;
  label: string;
  /** Top-line description shown under the group title. */
  description?: string;
  items: PreferenceItem[];
}

export interface PreferenceItem {
  id: string;
  label: string;
  /** Plain-English current value, e.g. "Direct flights, aisle seat, late morning". */
  value: string;
  /** Optional context-scope tag if this preference is scoped (rare). */
  scope?: string;
}
