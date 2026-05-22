"use client";

import { notFound } from "next/navigation";
import { useParams } from "next/navigation";

import { Header } from "@/components/Header";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { ApprovalCard } from "@/components/ApprovalCard";
import { WorkflowLaunchButton } from "@/components/WorkflowLaunchButton";
import {
  BRIEFING_DEFINITIONS,
  BRIEFING_SECTIONS,
  isBriefingType,
  type BriefingType,
} from "@/lib/briefings-config";
import { useBriefingsData } from "@/lib/hooks/useBriefingsData";

const BRIEFING_WORKFLOW_MAP: Record<BriefingType, string | null> = {
  "morning-standup": "morning_standup",
  "cob-work-day": "cob_workday",
  goodnight: null, // goodnight is client → agent; no server workflow yet
};

export default function BriefingScreen() {
  const params = useParams();
  const typeParam = typeof params.type === "string" ? params.type : "";
  if (!isBriefingType(typeParam)) notFound();

  const b = BRIEFING_DEFINITIONS[typeParam];
  const sections = BRIEFING_SECTIONS[typeParam];
  const { attentionItems, loading, error, refresh } = useBriefingsData();

  const workflowType = BRIEFING_WORKFLOW_MAP[typeParam];

  const highlightItems = attentionItems
    .filter((i) => i.pile === "urgent" || i.pile === "needs-attention")
    .slice(0, 2);

  return (
    <>
      <Header
        title={b.title}
        nextFocus={`${b.direction} · ${b.scheduledFor}`}
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
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
                    i === 0
                      ? "bg-surface-muted font-medium"
                      : "text-muted-strong"
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
                  label="Prepare Briefing"
                  labelDone="Briefing Ready"
                  onComplete={() => refresh()}
                  className="w-full rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
                />
                <p className="mt-1.5 text-xs text-muted">
                  Ask the agent to prepare now.
                </p>
              </div>
            ) : null}
          </aside>

          <div className="space-y-4">
            <Card>
              <div className="space-y-1">
                <CardTitle>{sections[0] ?? "Section"}</CardTitle>
                <CardMeta>
                  {loading
                    ? "Loading context from your inbox…"
                    : error
                      ? "Could not load inbox context."
                      : highlightItems.length > 0
                        ? "Pending items from your artifacts and approvals."
                        : "No pending items — agenda sections are ready to walk through."}
                </CardMeta>
              </div>
            </Card>

            {error ? (
              <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </p>
            ) : loading ? (
              <p className="text-sm text-muted">Loading approvals…</p>
            ) : highlightItems.length === 0 ? (
              <p className="text-sm text-muted">
                No urgent approvals or artifacts need attention for this
                briefing.
              </p>
            ) : (
              highlightItems.map((a) => (
                <ApprovalCard
                  key={a.id}
                  title={a.title}
                  detail={a.detail}
                  status={a.status}
                  agent={a.agent}
                />
              ))
            )}

            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
              >
                Continue
              </button>
              <button
                type="button"
                className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium"
              >
                Defer
              </button>
              <button
                type="button"
                className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
