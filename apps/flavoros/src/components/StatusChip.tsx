import type { CardStatus } from "@/lib/fixtures";

const STATUS_TONE: Record<CardStatus, string> = {
  "Needs review": "bg-amber-50 text-amber-800 border-amber-200",
  "Ready to approve": "bg-violet-50 text-violet-800 border-violet-200",
  "Waiting on you": "bg-amber-50 text-amber-800 border-amber-200",
  Blocked: "bg-rose-50 text-rose-800 border-rose-200",
  "In progress": "bg-stone-100 text-stone-700 border-stone-200",
  "Draft ready": "bg-blue-50 text-blue-800 border-blue-200",
  "Ready for briefing": "bg-emerald-50 text-emerald-800 border-emerald-200",
  Completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Sent: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Queued: "bg-stone-100 text-stone-700 border-stone-200",
  Failed: "bg-rose-50 text-rose-800 border-rose-200",
  "Pulled back": "bg-stone-100 text-stone-700 border-stone-200",
};

export function StatusChip({ status }: { status: CardStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`}
    >
      {status}
    </span>
  );
}
