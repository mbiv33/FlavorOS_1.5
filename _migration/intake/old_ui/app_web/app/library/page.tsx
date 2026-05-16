import { LibraryList } from "@/components/library/LibraryList";

/**
 * Library — every durable artifact, searchable. PRD 04 §4.6.
 */
export default function LibraryPage() {
  return (
    <div>
      <div className="px-1 pt-4 pb-3.5">
        <h1 className="m-0 mb-1 text-[28px] font-bold tracking-tight">Library</h1>
        <div className="text-[13.5px] text-ink-2">
          Every durable artifact across contexts. Drafts, briefs, packets,
          invoices, contracts, debriefs, research, tee-ups.
        </div>
      </div>
      <LibraryList />
    </div>
  );
}
