import type { Metadata } from "next";

import { ArtifactCard } from "../components/ui/ArtifactCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { artifacts } from "../../lib/demo";

export const metadata: Metadata = {
  title: "Reports & Artifacts — FlavorOS Client",
};

export default function ReportsPage() {
  const drafts = artifacts.filter(
    (a) => a.status === "draft" || a.status === "final",
  );
  const completed = artifacts.filter(
    (a) => a.status === "approved" || a.status === "archived",
  );

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reports & Artifacts
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Everything your agents have produced — drafts, finals, and archives.
        </p>
      </div>

      {drafts.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="In Progress"
            count={drafts.length}
            description="Drafts and finalized artifacts awaiting your review."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((a) => (
              <ArtifactCard
                key={a.id}
                title={a.title}
                kind={a.kind}
                status={a.status}
                agent={a.agentName}
                preview={a.preview}
                date={a.createdAt}
              />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Completed" count={completed.length} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((a) => (
              <ArtifactCard
                key={a.id}
                title={a.title}
                kind={a.kind}
                status={a.status}
                agent={a.agentName}
                preview={a.preview}
                date={a.createdAt}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
