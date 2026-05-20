"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import {
  apiRequest,
  ClientContext,
  ContextProviderDef,
  listContexts,
  listProviderConnections,
  loadSession,
  OnboardingSaveResponse,
  ProviderConnection,
  ProviderConnectLinkResponse,
  ProviderSyncResponse,
  FlavorOSSession,
} from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type OnboardingStep = 1 | 2 | 3 | 4;

type IdentityForm = {
  displayName: string;
  preferredName: string;
  timezone: string;
};

type ContextDraft = {
  /** Stable client-side key (before server ID is known) */
  key: string;
  type: "personal" | "professional" | "business";
  name: string;
  /** Server-assigned id after POST /contexts */
  serverId: string | null;
};

type ProviderSlot = {
  contextKey: string;
  provider: string;
  label: string;
  category: string;
  /** email / account entered by user */
  accountEmail: string;
  /** server-side connection once save was called */
  connection: ProviderConnection | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const FALLBACK_PROVIDERS: Record<string, Omit<ContextProviderDef, "toolkit">[]> = {
  personal: [
    { provider: "gmail", label: "Gmail", category: "email", enabled: true },
    { provider: "googlecalendar", label: "Google Calendar", category: "calendar", enabled: true },
  ],
  professional: [
    { provider: "gmail", label: "Work Gmail", category: "email", enabled: true },
    { provider: "googlecalendar", label: "Work Calendar", category: "calendar", enabled: true },
  ],
  business: [
    { provider: "gmail", label: "Business Gmail", category: "email", enabled: true },
    { provider: "googlecalendar", label: "Business Calendar", category: "calendar", enabled: true },
    { provider: "googledrive", label: "Google Drive / Docs", category: "files", enabled: true },
  ],
};

const STATUS_LABELS: Record<ProviderConnection["status"] | "not_started", string> = {
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

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "UTC",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusClasses(status: ProviderConnection["status"] | "not_started") {
  if (status === "ready") return "border-emerald-700 bg-emerald-50 text-emerald-800";
  if (status === "connected" || status === "syncing" || status === "degraded")
    return "border-sky-700 bg-sky-50 text-sky-800";
  if (status === "failed" || status === "blocked" || status === "revoked")
    return "border-rose-700 bg-rose-50 text-rose-800";
  return "border-border-strong bg-surface text-muted";
}

function typeBadgeClasses(type: ClientContext["type"]) {
  if (type === "personal") return "bg-violet-100 text-violet-800";
  if (type === "professional") return "bg-sky-100 text-sky-800";
  return "bg-amber-100 text-amber-800";
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: OnboardingStep }) {
  const steps: { n: OnboardingStep; label: string }[] = [
    { n: 1, label: "Identity" },
    { n: 2, label: "Contexts" },
    { n: 3, label: "Connect" },
    { n: 4, label: "Ready" },
  ];
  return (
    <nav className="flex items-center gap-1 text-xs" aria-label="Onboarding progress">
      {steps.map((s, i) => (
        <span key={s.n} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted">—</span>}
          <span
            className={`font-medium ${
              s.n === current
                ? "text-foreground"
                : s.n < current
                  ? "text-muted line-through"
                  : "text-muted"
            }`}
          >
            {s.n}. {s.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

// ─── Main page (wrapped) ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}

function OnboardingInner() {
  const router = useRouter();

  const [session, setSession] = useState<FlavorOSSession | null>(null);
  const [step, setStep] = useState<OnboardingStep>(1);

  // Step 1 — Identity
  const [identity, setIdentity] = useState<IdentityForm>({
    displayName: "",
    preferredName: "",
    timezone: "America/New_York",
  });

  // Step 2 — Contexts
  const [professionalEnabled, setProfessionalEnabled] = useState(false);
  const [employerName, setEmployerName] = useState("");
  const [businesses, setBusinesses] = useState<{ key: string; name: string }[]>([]);
  const [newBusinessName, setNewBusinessName] = useState("");

  // Step 3 — Provider slots & connections
  const [contexts, setContexts] = useState<ContextDraft[]>([]);
  const [slots, setSlots] = useState<ProviderSlot[]>([]);

  // Shared state
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Auth check + server state hydration on mount ───────────────────────────
  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSession(s);

    // Re-hydrate existing contexts and connections from server so state
    // survives page remounts (back navigation, new-tab OAuth returns, etc.)
    Promise.all([listContexts(s), listProviderConnections(s)])
      .then(([ctxs, conns]) => {
        if (ctxs.length === 0) return; // fresh user — stay on step 1

        const drafts: ContextDraft[] = ctxs.map((c) => ({
          key: c.id,
          type: c.type,
          name: c.name,
          serverId: c.id,
        }));
        setContexts(drafts);

        if (conns.length > 0) {
          const rebuilt: ProviderSlot[] = conns.map((conn) => {
            const ctx = drafts.find((d) => d.serverId === conn.client_context_id) ?? drafts[0];
            const fallback = FALLBACK_PROVIDERS[ctx?.type ?? "personal"] ?? [];
            const def = fallback.find((p) => p.provider === conn.provider);
            return {
              contextKey: ctx?.key ?? "",
              provider: conn.provider,
              label: def?.label ?? conn.provider,
              category: def?.category ?? "",
              accountEmail: conn.account_alias ?? "",
              connection: conn,
            };
          });
          setSlots(rebuilt);
          setStep(3);
        } else {
          setStep(2);
        }
      })
      .catch(() => { /* network error — stay on step 1 */ });
  }, [router]);

  // ── Listen for OAuth callback message from new tab ──────────────────────────
  useEffect(() => {
    if (!session) return;
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "oauth_complete") return;
      listProviderConnections(session!).then((conns) => {
        setSlots((prev) =>
          prev.map((s) => {
            const updated = conns.find((c) => c.id === s.connection?.id);
            return updated ? { ...s, connection: updated } : s;
          }),
        );
      });
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [session]);

  // ── Step 1: save identity ───────────────────────────────────────────────────
  async function handleIdentityContinue() {
    if (!session) return;
    if (!identity.displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    setBusyId("identity");
    setError(null);
    setMessage(null);
    try {
      // Light-touch save — we send the identity data; full save happens in step 3
      await apiRequest<OnboardingSaveResponse>("/onboarding/save", session, {
        method: "POST",
        body: JSON.stringify({
          identity: {
            display_name: identity.displayName.trim(),
            legal_name: identity.displayName.trim(),
            preferred_name: identity.preferredName.trim() || identity.displayName.trim(),
            timezone: identity.timezone,
            locale: "en-US",
          },
          authority_defaults: {
            outbound_comms: "draft_only",
            calendar_commits: "approval_required",
            travel_booking: "approval_required",
            money_movement: "blocked_without_explicit_approval",
          },
          onboarding: { status: "pending" },
          contexts: [],
        }),
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save identity.");
    } finally {
      setBusyId(null);
    }
  }

  // ── Step 2: build context list + fetch providers ────────────────────────────
  async function handleContextsContinue() {
    if (!session) return;
    setError(null);
    setMessage(null);

    if (professionalEnabled && !employerName.trim()) {
      setError("Enter your employer name or disable the Professional context.");
      return;
    }

    setBusyId("contexts");

    // Build drafts
    const drafts: ContextDraft[] = [
      { key: "personal", type: "personal", name: "Personal", serverId: null },
    ];
    if (professionalEnabled) {
      drafts.push({
        key: "professional",
        type: "professional",
        name: employerName.trim(),
        serverId: null,
      });
    }
    for (const b of businesses) {
      if (b.name.trim()) {
        drafts.push({ key: b.key, type: "business", name: b.name.trim(), serverId: null });
      }
    }

    // Try to create each context via POST /contexts; fall back to local-only
    const resolved: ContextDraft[] = [];
    for (const draft of drafts) {
      try {
        const resp = await apiRequest<ClientContext>("/contexts", session, {
          method: "POST",
          body: JSON.stringify({ type: draft.type, name: draft.name }),
        });
        resolved.push({ ...draft, serverId: resp.id });
      } catch {
        // 404 or other error — keep as local draft
        resolved.push(draft);
      }
    }

    setContexts(resolved);

    // Fetch providers for each context (with fallback)
    const newSlots: ProviderSlot[] = [];
    for (const ctx of resolved) {
      let providers: Omit<ContextProviderDef, "toolkit">[] = FALLBACK_PROVIDERS[ctx.type] ?? [];
      if (ctx.serverId) {
        try {
          const fetched = await apiRequest<ContextProviderDef[]>(
            `/contexts/${ctx.serverId}/providers`,
            session,
          );
          providers = fetched.filter((p) => p.enabled);
        } catch {
          // 404 or not yet implemented — use fallback
        }
      }
      for (const p of providers) {
        newSlots.push({
          contextKey: ctx.key,
          provider: p.provider,
          label: p.label,
          category: p.category,
          accountEmail: "",
          connection: null,
        });
      }
    }

    setSlots(newSlots);
    setBusyId(null);
    setStep(3);
  }

  // ── Step 3: connect helpers ─────────────────────────────────────────────────

  const slotId = useCallback(
    (s: ProviderSlot) => `${s.contextKey}__${s.provider}`,
    [],
  );

  async function saveSlotAndConnect(slot: ProviderSlot) {
    if (!session) return;
    const id = slotId(slot);
    setBusyId(id);
    setError(null);
    setMessage(null);

    try {
      const contextDraft = contexts.find((c) => c.key === slot.contextKey);
      const contextAccountId = `${slot.contextKey}_${slot.provider}`;

      const contextPayload = contexts.map((ctx) => ({
        context_id: ctx.serverId ?? ctx.key,
        context_type: ctx.type,
        display_name: ctx.name,
        status: "active",
        context_accounts: slots
          .filter((s) => s.contextKey === ctx.key)
          .map((s) => ({
            context_account_id: `${s.contextKey}_${s.provider}`,
            provider: s.provider,
            context_account_purpose: s.category,
            account_alias: `${s.contextKey}_${s.provider}`,
            auth_scheme: "oauth",
            ...(ctx.serverId ? { context_id: ctx.serverId } : {}),
            ...(s.accountEmail ? { account_email: s.accountEmail } : {}),
          })),
      }));

      const result = await apiRequest<OnboardingSaveResponse>("/onboarding/save", session, {
        method: "POST",
        body: JSON.stringify({
          identity: {
            display_name: identity.displayName.trim(),
            legal_name: identity.displayName.trim(),
            preferred_name: identity.preferredName.trim() || identity.displayName.trim(),
            timezone: identity.timezone,
            locale: "en-US",
          },
          authority_defaults: {
            outbound_comms: "draft_only",
            calendar_commits: "approval_required",
            travel_booking: "approval_required",
            money_movement: "blocked_without_explicit_approval",
          },
          onboarding: { status: "pending" },
          contexts: contextPayload,
        }),
      });

      // Find the connection for this slot
      const conn =
        result.provider_connections.find(
          (c) => c.context_account_id === contextAccountId,
        ) ??
        result.provider_connections.find((c) => c.provider === slot.provider) ??
        null;

      setSlots((prev) =>
        prev.map((s) => (slotId(s) === id ? { ...s, connection: conn } : s)),
      );

      setMessage(conn ? `Account saved. Click Connect to start OAuth.` : `Provider slot saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect account.");
    } finally {
      setBusyId(null);
    }
  }

  async function triggerConnectLink(conn: ProviderConnection, busyKey: string) {
    if (!session) return;
    try {
      const result = await apiRequest<ProviderConnectLinkResponse>(
        `/providers/${conn.provider}/connect-link`,
        session,
        {
          method: "POST",
          body: JSON.stringify({
            provider_connection_id: conn.id,
            redirect_uri: `${window.location.origin}/onboarding/callback`,
          }),
        },
      );
      setSlots((prev) =>
        prev.map((s) =>
          s.connection?.id === conn.id
            ? { ...s, connection: { ...conn, status: result.status } }
            : s,
        ),
      );
      if (!result.url.includes("stub=true")) {
        window.open(result.url, "_blank", "noopener,noreferrer");
        setMessage(`OAuth window opened for ${conn.provider}. Complete the sign-in there, then come back and click Verify.`);
      } else {
        setMessage(`Connect link created for ${conn.provider}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create connect link.");
    }
  }

  async function handleVerifySync(conn: ProviderConnection) {
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
      setSlots((prev) =>
        prev.map((s) =>
          s.connection?.id === conn.id
            ? { ...s, connection: { ...s.connection!, status: result.status } }
            : s,
        ),
      );
      setMessage(`Sync verified for ${conn.provider}; workflow ${result.workflow_run_id ?? "—"} queued.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify sync.");
    } finally {
      setBusyId(null);
    }
  }

  // ── Computed values ─────────────────────────────────────────────────────────
  const readyCount = slots.filter((s) => s.connection?.status === "ready").length;
  const connectedCount = slots.filter(
    (s) =>
      s.connection?.status === "connected" ||
      s.connection?.status === "ready" ||
      s.connection?.status === "syncing",
  ).length;
  const canGoToCommandCenter = readyCount > 0;

  // ── No session guard ────────────────────────────────────────────────────────
  if (!session) {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-background px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Client onboarding</h1>
        <p className="mt-3 text-sm text-muted">
          Sign in first so onboarding can write tenant-scoped profile, provider, workflow, and
          memory records.
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

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-background px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">FlavorOS</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Client onboarding</h1>
        </div>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          Back
        </Link>
      </div>

      <div className="mt-4">
        <StepIndicator current={step} />
      </div>

      {/* Feedback banners */}
      {message && (
        <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p>
      )}

      {/* ── Step 1: Identity ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <section className="mt-8 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-base font-medium">Your identity</h2>
          <p className="mt-1 text-sm text-muted">
            This is how FlavorOS will know you and default your time settings.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted" htmlFor="displayName">
                Display name <span className="text-rose-500">*</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={identity.displayName}
                onChange={(e) => setIdentity((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g. Marcus Bivines"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted" htmlFor="preferredName">
                Preferred name
              </label>
              <input
                id="preferredName"
                type="text"
                value={identity.preferredName}
                onChange={(e) =>
                  setIdentity((prev) => ({ ...prev, preferredName: e.target.value }))
                }
                placeholder="e.g. Marcus"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted" htmlFor="timezone">
                Timezone
              </label>
              <select
                id="timezone"
                value={identity.timezone}
                onChange={(e) => setIdentity((prev) => ({ ...prev, timezone: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleIdentityContinue}
              disabled={busyId === "identity"}
              className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyId === "identity" ? "Saving..." : "Continue"}
            </button>
          </div>
        </section>
      )}

      {/* ── Step 2: Contexts ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <section className="mt-8 space-y-4">
          <div>
            <h2 className="text-base font-medium">Your contexts</h2>
            <p className="mt-1 text-sm text-muted">
              Choose which areas of your life to connect. FlavorOS keeps them separate.
            </p>
          </div>

          {/* Personal — always on */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-violet-100 text-violet-800 mb-1">
                  personal
                </span>
                <p className="text-sm font-medium">Personal</p>
                <p className="text-xs text-muted">Always enabled. Email and calendar.</p>
              </div>
              <span className="rounded-md border border-border-strong px-2 py-1 text-xs text-muted">
                Included
              </span>
            </div>
          </div>

          {/* Professional — optional */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-sky-100 text-sky-800 mb-1">
                  professional
                </span>
                <p className="text-sm font-medium">Professional</p>
                <p className="text-xs text-muted">Your work email and calendar.</p>
                {professionalEnabled && (
                  <input
                    type="text"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    placeholder="Employer name"
                    className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => setProfessionalEnabled((v) => !v)}
                className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  professionalEnabled
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border-strong bg-background text-muted hover:text-foreground"
                }`}
              >
                {professionalEnabled ? "Enabled" : "Add"}
              </button>
            </div>
          </div>

          {/* Business — multiple */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 mb-1">
                  business
                </span>
                <p className="text-sm font-medium">Business</p>
                <p className="text-xs text-muted">One entry per business. Add as many as you need.</p>
              </div>
            </div>

            {/* Existing businesses */}
            {businesses.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {businesses.map((b) => (
                  <span
                    key={b.key}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs"
                  >
                    {b.name}
                    <button
                      type="button"
                      onClick={() =>
                        setBusinesses((prev) => prev.filter((x) => x.key !== b.key))
                      }
                      className="text-muted hover:text-foreground"
                      aria-label={`Remove ${b.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add business */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newBusinessName.trim()) {
                    setBusinesses((prev) => [
                      ...prev,
                      { key: uid(), name: newBusinessName.trim() },
                    ]);
                    setNewBusinessName("");
                  }
                }}
                placeholder="Business name"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => {
                  if (newBusinessName.trim()) {
                    setBusinesses((prev) => [
                      ...prev,
                      { key: uid(), name: newBusinessName.trim() },
                    ]);
                    setNewBusinessName("");
                  }
                }}
                className="rounded-md border border-border-strong px-3 py-2 text-xs font-medium text-foreground hover:bg-surface"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-muted hover:text-foreground"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContextsContinue}
              disabled={busyId === "contexts"}
              className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyId === "contexts" ? "Setting up..." : "Continue"}
            </button>
          </div>
        </section>
      )}

      {/* ── Step 3: Connect Accounts ─────────────────────────────────────────── */}
      {step === 3 && (
        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-base font-medium">Connect accounts</h2>
            <p className="mt-1 text-sm text-muted">
              Enter the email for each account and click Save. Once saved, click Connect to open the OAuth window — you can connect all accounts before moving on.
            </p>
          </div>

          {contexts.map((ctx) => {
            const ctxSlots = slots.filter((s) => s.contextKey === ctx.key);
            return (
              <div key={ctx.key} className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{ctx.name}</h3>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeBadgeClasses(ctx.type)}`}
                  >
                    {ctx.type}
                  </span>
                </div>

                <div className="space-y-3">
                  {ctxSlots.map((slot) => {
                    const id = slotId(slot);
                    const conn = slot.connection;
                    const status = conn?.status ?? "not_started";
                    const isBusy = busyId === id || (conn && busyId === conn.id);

                    return (
                      <div
                        key={id}
                        className="rounded-md border border-border bg-background p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{slot.label}</p>
                            <p className="text-xs text-muted capitalize">{slot.category}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-md border px-2 py-1 text-xs ${statusClasses(status)}`}
                          >
                            {STATUS_LABELS[status]}
                          </span>
                        </div>

                        {/* Email input + save, then connect */}
                        {!conn && (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="email"
                              value={slot.accountEmail}
                              onChange={(e) =>
                                setSlots((prev) =>
                                  prev.map((s) =>
                                    slotId(s) === id
                                      ? { ...s, accountEmail: e.target.value }
                                      : s,
                                  ),
                                )
                              }
                              placeholder="Account email"
                              className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                            <button
                              type="button"
                              disabled={!!isBusy}
                              onClick={() => saveSlotAndConnect(slot)}
                              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy ? "Saving..." : "Save"}
                            </button>
                          </div>
                        )}

                        {/* Connect OAuth once slot is saved */}
                        {conn && (status === "not_started") && (
                          <div className="mt-3">
                            <button
                              type="button"
                              disabled={!!isBusy}
                              onClick={() => triggerConnectLink(conn, conn.id)}
                              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy ? "Opening..." : "Connect"}
                            </button>
                          </div>
                        )}

                        {/* Action buttons once connection exists */}
                        {conn && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(status === "pending_consent" || status === "initiated") && (
                              <button
                                type="button"
                                disabled={!!isBusy}
                                onClick={() => triggerConnectLink(conn, conn.id)}
                                className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isBusy ? "Opening..." : "Re-open OAuth"}
                              </button>
                            )}
                            {(status === "connected" || status === "degraded") && (
                              <button
                                type="button"
                                disabled={!!isBusy}
                                onClick={() => handleVerifySync(conn)}
                                className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isBusy ? "Syncing..." : "Verify sync"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-muted hover:text-foreground"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="rounded-md border border-border-strong px-5 py-2 text-sm font-medium text-foreground hover:bg-surface"
            >
              Continue to summary
            </button>
          </div>
        </section>
      )}

      {/* ── Step 4: Ready ────────────────────────────────────────────────────── */}
      {step === 4 && (
        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-base font-medium">Setup summary</h2>
            <p className="mt-1 text-sm text-muted">
              Here is what was connected during onboarding.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Contexts</dt>
                <dd className="font-medium">{contexts.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Accounts connected</dt>
                <dd className="font-medium">{connectedCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Accounts ready</dt>
                <dd className="font-medium text-emerald-700">{readyCount}</dd>
              </div>
            </dl>

            {/* Per-context summary */}
            {contexts.length > 0 && (
              <div className="mt-5 space-y-3">
                {contexts.map((ctx) => {
                  const ctxSlots = slots.filter((s) => s.contextKey === ctx.key);
                  return (
                    <div key={ctx.key} className="rounded-md border border-border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">{ctx.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeBadgeClasses(ctx.type)}`}
                        >
                          {ctx.type}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {ctxSlots.map((slot) => {
                          const status = slot.connection?.status ?? "not_started";
                          return (
                            <div
                              key={slotId(slot)}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-muted">{slot.label}</span>
                              <span
                                className={`rounded border px-1.5 py-0.5 ${statusClasses(status)}`}
                              >
                                {STATUS_LABELS[status]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-muted">
            You can add more accounts in Settings.
          </p>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-sm text-muted hover:text-foreground"
            >
              Back
            </button>
            <Link
              href={canGoToCommandCenter ? "/command-center" : "#"}
              aria-disabled={!canGoToCommandCenter}
              className={`rounded-md px-5 py-2 text-sm font-medium ${
                canGoToCommandCenter
                  ? "bg-accent text-accent-foreground hover:opacity-90"
                  : "cursor-not-allowed border border-border-strong text-muted"
              }`}
            >
              Go to Command Center
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
