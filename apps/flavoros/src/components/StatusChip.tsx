import type { CardStatus } from "@/lib/fixtures";
import { statusChipClasses } from "@/lib/statusAccent";

export function StatusChip({ status }: { status: CardStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border bg-surface px-2 py-0.5 text-xs font-medium ${statusChipClasses(status)}`}
    >
      {status}
    </span>
  );
}
