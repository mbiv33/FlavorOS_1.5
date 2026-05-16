/*
 * Contexts are the user's life-streams (W2 Work / LLC Work / Career /
 * Personal — or any subset). They are configured per-user in
 * clients/<user>/contexts/* and the UI must adapt to whatever exists.
 * Never hardcode context IDs or labels. See PRD 02 §Context model.
 */

export interface AppContext {
  id: string;
  /** Short label shown in chips and selectors (e.g. "FlourishED"). */
  label: string;
  /** Long form (e.g. "FlourishED Strategies, LLC"). */
  longLabel?: string;
}
