"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  apiRequest,
  loadSession,
  OnboardingSaveResponse,
  ProviderConnection,
  ProviderConnectLinkResponse,
  ProviderSyncResponse,
  FlavorOSSession,
} from "@/lib/api";

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

const STATUS_LABELS: Record<ProviderConnection["status"] | "not_planned", string> = {
  not_planned: "Not planned",
  not_started: "Not started",
  pending_consent: "Pending consent",
  initiated: "Initiated",
  connected: "Connected",
  syncing: "Syncing",
  ready: "Ready",
  degraded: "Degraded",
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

function statusClasses(status: ProviderConnection["status"] | "not_planned") {
  if (status === "ready") return "border-emerald-700 bg-emerald-50 text-emerald-800";
  if (status === "connected" || status === "syncing" || status === "degraded") {
    return "border-sky-700 bg-sky-50 text-sky-800";
  }
  if (status === "failed" || status === "blocked" || status === "revoked") {
    return "border-rose-700 bg-rose-50 text-rose-800";
  }
  return "border-border-strong bg-surface text-muted";
}

function onboardingPayload() {
  return {
    identity: {
      display_name: "Marcus Bivines",
      legal_name: "Marcus Bivines",
      preferred_name: "Marcus",
      timezone: "America/New_York",
      locale: "en-US",
    },
    authority_defaults: {
      outbound_comms: "draft_only",
      calendar_commits: "approval_required",
      travel_booking: "approval_required",
      money_movement: "blocked_without_explicit_approval",
    },
    onboarding: { status: "pending" },
    contexts: [
      {
        context_id: "business",
        context_type: "business",
        display_name: "Business",
        status: "active",
        context_accounts: CONTEXT_ACCOUNTS.filter((account) => account.contextId === "business").map(
          (account) => ({
            context_account_id: account.contextAccountId,
            provider: account.provider,
            context_account_purpose: account.purpose,
            account_alias: account.accountAlias,
            auth_scheme: account.authScheme,
          }),
        ),
      },
      {
        context_id: "personal",
        context_type: "personal",
        display_name: "Personal",
        status: "active",
        context_accounts: CONTEXT_ACCOUNTS.filter((account) => account.contextId === "personal").map(
          (account) => ({
            context_account_id: account.contextAccountId,
            provider: account.provider,
            context_account_purpose: account.purpose,
            account_alias: account.accountAlias,
            auth_scheme: account.authScheme,
          }),
        ),
      },
    ],
  };
}

export default function OnboardingPage() {
  const [session, setSession] = useState<FlavorOSSession | null>(null);
  const [intake, setIntake] = useState<OnboardingSaveResponse | null>(null);
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const eligibleAccounts = useMemo(
    () => CONTEXT_ACCOUNTS.filter((account) => account.authScheme === "oauth"),
    [],
  );
  const readyCount = connections.filter((conn) => conn.status === "ready").length;
  const canFinish = Boolean(intake) && readyCount === eligibleAccounts.length;

  async function saveIntake() {
    if (!session) return;
    setBusyId("intake");
    setError(null);
    setMessage(null);
    try {
      const result = await apiRequest<OnboardingSaveResponse>(
        "/onboarding/save",
        session,
        {
          method: "POST",
          body: JSON.stringify(onboardingPayload()),
        },
      );
      setIntake(result);
      setConnections(result.provider_connections);
      setMessage("Intake saved. Provider connections are planned in Postgres.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save onboarding.");
    } finally {
      setBusyId(null);
    }
  }

  async function createConnectLink(conn: ProviderConnection) {
    if (!session) return;
    setBusyId(conn.id);
    setError(null);
    setMessage(null);
    try {
      const result = await apiRequest<ProviderConnectLinkResponse>(
        `/providers/${conn.provider}/connect-link`,
        session,
        {
          method: "POST",
          body: JSON.stringify({
            provider_connection_id: conn.id,
            redirect_uri: `${window.location.origin}/onboarding`,
          }),
        },
      );
      setConnections((current) =>
        current.map((item) =>
          item.id === conn.id ? { ...item, status: result.status } : item,
        ),
      );
      setMessage(`Connect link created for ${PROVIDER_LABELS[conn.provider]}.`);
      if (!result.url.includes("stub=true")) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create connect link.");
    } finally {
      setBusyId(null);
    }
  }

  async function recordCallback(conn: ProviderConnection) {
    if (!session) return;
    setBusyId(conn.id);
    setError(null);
    setMessage(null);
    try {
      const result = await apiRequest<{ status: ProviderConnection["status"] }>(
        `/providers/callback?provider_connection_id=${conn.id}&status=ACTIVE&connected_account_id=dev_${conn.context_account_id}`,
        session,
      );
      setConnections((current) =>
        current.map((item) => (item.id === conn.id ? { ...item, status: result.status } : item)),
      );
      setMessage(`${PROVIDER_LABELS[conn.provider]} callback recorded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record callback.");
    } finally {
      setBusyId(null);
    }
  }

  async function verifySync(conn: ProviderConnection) {
    if (!session) return;
    setBusyId(conn.id);
    setError(null);
    setMessage(null);
    try {
      const result = await apiRequest<ProviderSyncResponse>(
        `/providers/${conn.provider}/sync`,
        session,
        {
          method: "POST",
          body: JSON.stringify({ provider_connection_id: conn.id }),
        },
      );
      setConnections((current) =>
        current.map((item) => (item.id === conn.id ? { ...item, status: result.status } : item)),
      );
      setMessage(
        `${PROVIDER_LABELS[conn.provider]} sync verified; workflow ${result.workflow_run_id} queued.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify first sync.");
    } finally {
      setBusyId(null);
    }
  }

  function actionFor(conn: ProviderConnection) {
    if (conn.status === "not_started") return () => createConnectLink(conn);
    if (conn.status === "pending_consent" || conn.status === "initiated") {
      return () => recordCallback(conn);
    }
    if (conn.status === "connected" || conn.status === "degraded") return () => verifySync(conn);
    return undefined;
  }

  if (!session) {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-background px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Client onboarding</h1>
        <p className="mt-3 text-sm text-muted">
          Sign in first so onboarding can write tenant-scoped profile, provider, workflow,
          and memory records.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Log in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-background px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted">FlavorOS</p>
          <h1 className="text-2xl font-semibold tracking-tight">Client onboarding</h1>
          <p className="max-w-2xl text-sm text-muted">
            Intake creates the client profile, contexts, authority defaults, provider
            expectations, GBrain memory, and initial agent workflow tasks.
          </p>
        </div>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          Back
        </Link>
      </div>

      {message ? <p className="mt-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="mt-5 rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      <section className="mt-8 grid gap-4 md:grid-cols-[1fr_1.1fr]">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Dev client intake</h2>
            <p className="text-xs text-muted">
              Marcus Bivines · America/New_York · outbound communications are draft-only.
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
            disabled={busyId === "intake"}
            className="mt-4 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyId === "intake" ? "Saving..." : "Save intake"}
          </button>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-medium">Provider readiness</h2>
              <p className="text-xs text-muted">
                {intake
                  ? `${connections.length} OAuth-backed context accounts planned`
                  : "Provider planning starts after intake is saved"}
              </p>
            </div>
            <span className="rounded-md border border-border-strong px-2 py-1 text-xs text-muted">
              {readyCount}/{eligibleAccounts.length} ready
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {eligibleAccounts.map((account) => {
              const conn = connections.find(
                (item) => item.context_account_id === account.contextAccountId,
              );
              const status = conn?.status ?? "not_planned";
              const action = conn ? actionFor(conn) : undefined;
              return (
                <div
                  key={account.contextAccountId}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium">{account.label}</h3>
                      <p className="text-xs text-muted">
                        {account.contextId} · {account.contextAccountId} ·{" "}
                        {PROVIDER_LABELS[account.provider]}
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
                      disabled={!action || busyId === conn?.id}
                      onClick={action}
                      className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {status === "not_started"
                        ? "Create Connect Link"
                        : status === "pending_consent" || status === "initiated"
                          ? "Record callback"
                          : status === "connected" || status === "degraded"
                            ? "Verify first sync"
                            : "No action"}
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
