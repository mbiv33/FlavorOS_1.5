/*
 * Persona is what the user sees as the author of an artifact. It is the
 * `attribution_persona` value declared on the underlying skill — never an
 * agent ID, never a routing detail. See PRD 00 §Persona attribution.
 */

export type PersonaId =
  | "khadijah"
  | "sinclair"
  | "maxine"
  | "kyle"
  | "scooter"
  | "regine"
  | "overton";

export interface Persona {
  id: PersonaId;
  /** Display name shown to the user. */
  name: string;
  /** 2-letter monogram for the avatar. */
  initials: string;
  /** Token name on the persona color palette. */
  color: "kha" | "sin" | "max" | "kyl" | "sco";
}

export const PERSONAS: Record<PersonaId, Persona> = {
  khadijah: { id: "khadijah", name: "Khadijah", initials: "KJ", color: "kha" },
  sinclair: { id: "sinclair", name: "Sinclair", initials: "SJ", color: "sin" },
  maxine: { id: "maxine", name: "Maxine", initials: "MX", color: "max" },
  kyle: { id: "kyle", name: "Kyle", initials: "KB", color: "kyl" },
  scooter: { id: "scooter", name: "Scooter", initials: "SC", color: "sco" },
  // Regine surfaces Kyle's social/dev work; Overton surfaces Maxine's
  // household/IT work. Same agents underneath; the persona is what the
  // artifact carries.
  regine: { id: "regine", name: "Regine", initials: "RG", color: "kyl" },
  overton: { id: "overton", name: "Overton", initials: "OV", color: "max" },
};
