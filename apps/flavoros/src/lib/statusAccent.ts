import type { CardStatus } from "@/lib/fixtures";
import type { StatTone } from "@/components/StatStrip";

/** Left accent bar for cards and list rows (SAFE: status via border, not full fills). */
export function statusAccentBorder(status: CardStatus): string {
  switch (status) {
    case "Blocked":
    case "Failed":
      return "border-l-status-blocked";
    case "Needs review":
    case "Waiting on you":
      return "border-l-status-attention";
    case "Ready to approve":
    case "Queued":
      return "border-l-status-pending";
    case "Ready for briefing":
    case "Completed":
    case "Sent":
      return "border-l-status-ok";
    case "Draft ready":
    case "In progress":
      return "border-l-status-info";
    default:
      return "border-l-border-strong";
  }
}

export function statToneAccentBorder(tone: StatTone): string {
  switch (tone) {
    case "ok":
      return "border-l-status-ok";
    case "attention":
      return "border-l-status-attention";
    case "blocked":
      return "border-l-status-blocked";
    case "info":
      return "border-l-status-info";
    default:
      return "border-l-border-strong";
  }
}

export function statusChipClasses(status: CardStatus): string {
  switch (status) {
    case "Blocked":
    case "Failed":
      return "border-status-blocked/30 text-status-blocked";
    case "Needs review":
    case "Waiting on you":
      return "border-status-attention/30 text-status-attention";
    case "Ready to approve":
    case "Queued":
      return "border-status-pending/30 text-status-pending";
    case "Ready for briefing":
    case "Completed":
    case "Sent":
      return "border-status-ok/30 text-status-ok";
    case "Draft ready":
    case "In progress":
      return "border-status-info/30 text-status-info";
    default:
      return "border-border text-muted-strong";
  }
}
