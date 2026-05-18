"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AccountStatus =
  | "not_started"
  | "pending_consent"
  | "connected"
  | "syncing"
  | "ready"
  | "blocked"
  | "failed"
  | "revoked";

type ContextAccount = {
  contextId: string;
  contextLabel: string;
  contextAccountId: string;
  provider: "gmail" | "googlecalendar" | "googledrive" | "manual";
  label: string;
  purpose: string;
  accountAlias: string;
  authScheme: "oauth" | "manual";
};

type PlannedConnection = ContextAccount & {
  status: AccountStatus;
  composioUserId: string;
};

const CONTEXT_ACCOUNTS: ContextAccount[] = [
  {
    contextId: "business",
    contextLabel: "Business",
    contextAccountId: "business_gmail",
    provider: "gmail",
    label: "Business Gmail",
    purpose: "email",
    accountAlias: "business_email",
    authScheme: "oauth",
  },
  {
    contextId: "business",
    contextLabel: "Business",
    contextAccountId: "business_calendar",
    provider: "googlecalendar",
    label: "Business Calendar",
    purpose: "calendar",
    accountAlias: "business_calendar",
    authScheme: "oauth",
  },
  {
    contextId: "business",
    contextLabel: "Business",
    contextAccountId: "business_drive",
    provider: "googledrive",
    label: "Business Drive / Docs",
    purpose: "knowledge_base",
    accountAlias: "business_docs",
    authScheme: "oauth",
  },
  {
    contextId: "personal",
    contextLabel: "Personal",
    contextAccountId: "personal_notes",
    provider: "manual",
    label: "Personal Notes",
    purpose: "knowledge_base",
    accountAlias: "personal_notes",
    authScheme: "manual",
  },
];

const STATUS_LABELS: Record<AccountStatus, string> = {
  not_started: "Not started",
  pending_consent: "Pending consent",
  connected: "Connected",
  syncing: "Syncing",
  ready: "Ready",
  blocked: "Blocked",
  failed: "Failed",
  revoked: "Revoked",
};

const PROVIDER_LABELS: Record<ContextAccount["provider"], string> = {
  gmail: "Gmail",
  googlecalendar: "Google Calendar",
  googledrive: "Google Drive / Docs",
  manual: "Manual",
};

function statusClasses(status: AccountStatus) {
  if (status === "ready") return "border-emerald-700 bg-emerald-50 text-emerald-800";
  if (status === "connected" || status === "syncing") {
    return "border-sky-700 bg-sky-50 text-sky-800";
  }
  if (status === "failed" || status === "blocked" || status === "revoked") {
    return "border-rose-700 bg-rose-50 text-rose-800";
  }
  return "border-border-strong bg-surface text-muted";
}

function nextStatus(status: AccountStatus): AccountStatus {
  if (status === "not_started") return "pending_consent";
  if (status === "pending_consent") return "connected";
  if (status === "connected") return "ready";
  return status;
}

export default function OnboardingPage() {
  const [intakeSaved, setIntakeSaved] = useState(false);
  const [connections, setConnections] = useState<PlannedConnection[]>([]);

  const eligibleAccounts = useMemo(
    () => CONTEXT_ACCOUNTS.filter((account) => account.authScheme === "oauth"),
    [],
  );
  const displayedConnections: PlannedConnection[] = intakeSaved
    ? connections
    : eligibleAccounts.map((account) => ({
        ...account,
        status: "not_started",
        composioUserId: "tenant:demo:user:current",
      }));

  const readyCount = connections.filter((conn) => conn.status === "ready").length;
  const canFinish = intakeSaved && readyCount === eligibleAccounts.length;

  function saveIntake() {
    setIntakeSaved(true);
    setConnections(
      eligibleAccounts.map((account) => ({
        ...account,
        status: "not_started",
        composioUserId: "tenant:demo:user:current",
      })),
    );
  }

  function advanceConnection(contextAccountId: string) {
    setConnections((current) =>
      current.map((conn) =>
        conn.contextAccountId === contextAccountId
          ? { ...conn, status: nextStatus(conn.status) }
          : conn,
      ),
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-background px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted">FlavorOS</p>
          <h1 className="text-2xl font-semibold tracking-tight">Client onboarding</h1>
          <p className="max-w-2xl text-sm text-muted">
            Intake creates the client profile, contexts, authority defaults, and
            context accounts before provider auth begins.
          </p>
        </div>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          Back
        </Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-[1fr_1.1fr]">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Saved intake</h2>
            <p className="text-xs text-muted">
              Marcus Bivines · America/New_York · outbound communications are
              draft-only.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {CONTEXT_ACCOUNTS.map((account) => (
              <div
                key={account.contextAccountId}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{account.label}</p>
                  <p className="text-xs text-muted">
                    {account.contextLabel} · {PROVIDER_LABELS[account.provider]} ·{" "}
                    {account.purpose}
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-border-strong px-2 py-1 text-xs text-muted">
                  {account.authScheme}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={saveIntake}
            className="mt-4 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Save intake
          </button>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-medium">Provider readiness</h2>
              <p className="text-xs text-muted">
                {intakeSaved
                  ? `${connections.length} OAuth-backed context accounts planned`
                  : "Provider planning starts after intake is saved"}
              </p>
            </div>
            <span className="rounded-md border border-border-strong px-2 py-1 text-xs text-muted">
              {readyCount}/{eligibleAccounts.length} ready
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {displayedConnections.map((conn) => {
              const status = conn.status;
              return (
                <div
                  key={conn.contextAccountId}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium">{conn.label}</h3>
                      <p className="text-xs text-muted">
                        {conn.contextId} · {conn.contextAccountId} ·{" "}
                        {PROVIDER_LABELS[conn.provider]}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-1 text-xs ${statusClasses(
                        status,
                      )}`}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!intakeSaved || status === "ready"}
                      onClick={() => advanceConnection(conn.contextAccountId)}
                      className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {status === "not_started"
                        ? "Create Connect Link"
                        : status === "pending_consent"
                          ? "Record callback"
                          : "Verify first sync"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <p className="text-sm text-muted">
          {canFinish
            ? "Onboarding is ready for Command Center."
            : "Command Center opens after required provider readiness is complete."}
        </p>
        <Link
          href={canFinish ? "/command-center" : "#"}
          aria-disabled={!canFinish}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            canFinish
              ? "bg-accent text-accent-foreground hover:opacity-90"
              : "cursor-not-allowed border border-border-strong text-muted"
          }`}
        >
          Finish onboarding
        </Link>
      </div>
    </main>
  );
}
