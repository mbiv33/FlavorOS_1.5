"use client";

import { notFound } from "next/navigation";
import { useParams } from "next/navigation";

import { Header } from "@/components/Header";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { ApprovalCard } from "@/components/ApprovalCard";
import {
  BRIEFING_DEFINITIONS,
  BRIEFING_SECTIONS,
  isBriefingType,
} from "@/lib/briefings-config";
import { useBriefingsData } from "@/lib/hooks/useBriefingsData";

export default function BriefingScreen() {
  const params = useParams();
  const typeParam = typeof params.type === "string" ? params.type : "";
  if (!isBriefingType(typeParam)) notFound();

  const b = BRIEFING_DEFINITIONS[typeParam];
  const sections = BRIEFING_SECTIONS[typeParam];
  const { attentionItems, loading, error } = useBriefingsData();

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
