"use client";

import { Header } from "@/components/Header";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { ApprovalCard } from "@/components/ApprovalCard";
import { WorkflowLaunchButton } from "@/components/WorkflowLaunchButton";
import {
  MEETING_DEFINITIONS,
  MEETING_SECTIONS,
  type MeetingTopic,
} from "@/lib/meetings-config";
import { useMeetingsData } from "@/lib/hooks/useMeetingsData";
import type { InboxItem } from "@/lib/fixtures";

// Map meeting topics to the workflow that prepares them
const MEETING_WORKFLOW_MAP: Record<MeetingTopic, string | null> = {
  communications: "communication_sweep",
  calendar: "comms_calendar",
  travel: null,
  projects: "projects_review",
  "reports-artifacts": null,
  general: null,
};

export function MeetingTopicView({ topic }: { topic: MeetingTopic }) {
  const def = MEETING_DEFINITIONS[topic];
  const sections = MEETING_SECTIONS[topic];
  const workflowType = MEETING_WORKFLOW_MAP[topic];
  const { inboxItems, loading, error } = useMeetingsData();

  const attention = inboxItems.filter(
    (i) => i.pile === "urgent" || i.pile === "needs-attention",
  );

  return (
    <>
      <Header title={`Meeting · ${def.title}`} nextFocus={def.preparedSummary} />
      <MeetingBody
        sections={sections}
        defTitle={def.title}
        attention={attention}
        loading={loading}
        error={error}
        workflowType={workflowType}
      />
    </>
  );
}

function MeetingBody({
  sections,
  defTitle,
  attention,
  loading,
  error,
  workflowType,
}: {
  sections: string[];
  defTitle: string;
  attention: InboxItem[];
  loading: boolean;
  error: string | null;
  workflowType: string | null;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      {error ? (
        <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading meeting…</p>
      ) : (
        <MeetingGrid
          sections={sections}
          defTitle={defTitle}
          attention={attention}
          workflowType={workflowType}
        />
      )}
    </div>
  );
}

function MeetingGrid({
  sections,
  defTitle,
  attention,
  workflowType,
}: {
  sections: string[];
  defTitle: string;
  attention: InboxItem[];
  workflowType: string | null;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-border bg-surface p-3">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-strong">
          Agenda
        </p>
        <ul className="space-y-0.5">
          {sections.map((s, i) => (
            <li
              key={s}
              className={`rounded-md px-2 py-1.5 text-sm ${
                i === 0 ? "bg-surface-muted font-medium" : "text-muted-strong"
              }`}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ul>
        {workflowType ? (
          <div className="mt-4 border-t border-border pt-4">
            <WorkflowLaunchButton
              workflowType={workflowType}
              label="Prepare Meeting"
              labelDone="Meeting Ready"
              className="w-full rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            />
            <p className="mt-1.5 text-xs text-muted">Ask the agent to prepare now.</p>
          </div>
        ) : null}
      </aside>
      <div className="space-y-4">
        <Card>
          <div className="space-y-1">
            <CardTitle>{sections[0] ?? "Section"}</CardTitle>
            <CardMeta>
              Prepared state from the {defTitle} channel will appear here after sync.
            </CardMeta>
          </div>
        </Card>
        {attention.length === 0 ? (
          <p className="text-sm text-muted">No urgent items in the shared inbox right now.</p>
        ) : (
          attention.slice(0, 1).map((a) => (
            <ApprovalCard
              key={a.id}
              title={a.title}
              detail={a.detail}
              status={a.status}
              agent={a.agent}
              preview={a.preview}
              stakes={a.stakes}
              sourceLinkLabel={a.sourceLinkLabel}
            />
          ))
        )}
        <Card>
          <div className="space-y-2">
            <CardTitle>Notes &amp; questions</CardTitle>
            <textarea
              placeholder="Capture a note or a question for the agent. Not a live chat."
              className="h-24 w-full resize-none rounded-md border border-border-strong bg-surface-muted p-2 text-sm outline-none focus:border-ring"
            />
          </div>
        </Card>
        <div className="flex gap-2">
          <button className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
            Continue
          </button>
          <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium">
            Save &amp; resume later
          </button>
          <button className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium">
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}
