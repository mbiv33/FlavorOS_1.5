"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  key: string;
  type: "personal" | "professional" | "business";
  name: string;
  serverId: string | null;
};

type ProviderSlot = {
  contextKey: string;
  provider: string;
  label: string;
  category: string;
  accountEmail: string;
  connection: ProviderConnection | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const FALLBACK_PROVIDERS: Record<
  string,
  Omit<ContextProviderDef, "toolkit">[]
> = {
  personal: [
    { provider: "gmail", label: "Gmail", category: "email", enabled: true },
    {
      provider: "googlecalendar",
      label: "Google Calendar",
      category: "calendar",
      enabled: true,
    },
  ],
  professional: [
    {
      provider: "gmail",
      label: "Work Gmail",
      category: "email",
      enabled: true,
    },
    {
      provider: "googlecalendar",
      label: "Work Calendar",
      category: "calendar",
      enabled: true,
    },
  ],
  business: [
    {
      provider: "gmail",
      label: "Business Gmail",
      category: "email",
      enabled: true,
    },
    {
      provider: "googlecalendar",
      label: "Business Calendar",
      category: "calendar",
      enabled: true,
    },
    {
      provider: "googledrive",
      label: "Google Drive / Docs",
      category: "files",
      enabled: true,
    },
  ],
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

function typeBadgeClasses(type: ClientContext["type"]) {
  if (type === "personal") return "bg-violet-100 text-violet-800";
  if (type === "professional") return "bg-sky-100 text-sky-800";
  return "bg-amber-100 text-amber-800";
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function isConnected(conn: ProviderConnection | null) {
  if (!conn) return false;
  return ["connected", "syncing", "ready"].includes(conn.status);
}

// ─── Progress bar ───────────────────────────────────────────────────────────

function ProgressBar({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-border">
        <div
          className="h-2 rounded-full bg-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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
  const searchParams = useSearchParams();

  const [session, setSession] = useState<FlavorOSSession | null>(null);
  const [step, setStep] = useState<OnboardingStep>(1);

  // Step 1
  const [identity, setIdentity] = useState<IdentityForm>({
    displayName: "",
    preferredName: "",
    timezone: "America/New_York",
  });

  // Step 2
  const [professionalEnabled, setProfessionalEnabled] = useState(false);
  const [employerName, setEmployerName] = useState("");
  const [businesses, setBusinesses] = useState<
    { key: string; name: string }[]
  >([]);
  const [newBusinessName, setNewBusinessName] = useState("");

  // Step 3
  const [contexts, setContexts] = useState<ContextDraft[]>([]);
  const [slots, setSlots] = useState<ProviderSlot[]>([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);

  // Shared
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const slotId = useCallback(
    (s: ProviderSlot) => `${s.contextKey}__${s.provider}`,
    [],
  );

  // ── Progress computation ──────────────────────────────────────────────────
  // Total = 2 fixed steps (identity + contexts) + N connections + 1 (ready)
  const totalSteps = 2 + slots.length + 1;
  const completedSteps =
    step === 1
      ? 0
      : step === 2
        ? 1
        : step === 3
          ? 2 + currentSlotIndex
          : totalSteps;

  const progressLabel =
    step === 1
      ? "Step 1 — Your identity"
      : step === 2
        ? "Step 2 — Your contexts"
        : step === 3
          ? `Step 3 — Account ${currentSlotIndex + 1} of ${slots.length}`
          : "Complete";

  // ── Mount: hydrate from server + handle OAuth return ──────────────────────
  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSession(s);

    const resetFlag = searchParams.get("reset");
    const oauthConnId = searchParams.get("provider_connection_id");
    const oauthStatus = searchParams.get("status");

    async function hydrate(sess: FlavorOSSession) {
      // Dev reset: wipe contexts + connections and start fresh
      if (resetFlag === "1") {
        try {
          await apiRequest("/onboarding/reset", sess, { method: "DELETE" });
        } catch { /* ignore */ }
        window.history.replaceState({}, "", "/onboarding");
        return; // stay on step 1
      }

      // If returning from OAuth, verify the connection first
      if (oauthConnId && oauthStatus) {
        try {
          const conns = await listProviderConnections(sess);
          const conn = conns.find((c) => c.id === oauthConnId);
          if (conn && !isConnected(conn)) {
            await apiRequest<ProviderSyncResponse>(
              `/providers/${conn.provider}/sync`,
              sess,
              {
                method: "POST",
                body: JSON.stringify({ provider_connection_id: conn.id }),
              },
            );
          }
        } catch {
          // sync verify failed — continue anyway, user can retry
        }
        // Clear query params without a full reload
        window.history.replaceState({}, "", "/onboarding");
      }

      const [ctxs, conns] = await Promise.all([
        listContexts(sess),
        listProviderConnections(sess),
      ]);

      if (ctxs.length === 0) return; // fresh user — stay on step 1

      const drafts: ContextDraft[] = ctxs.map((c) => ({
        key: c.id,
        type: c.type,
        name: c.name,
        serverId: c.id,
      }));
      setContexts(drafts);

      // Build expected slots from contexts
      const expected: ProviderSlot[] = [];
      for (const ctx of drafts) {
        const providers = FALLBACK_PROVIDERS[ctx.type] ?? [];
        for (const p of providers) {
          const existing = conns.find(
            (c) =>
              c.client_context_id === ctx.serverId &&
              c.provider === p.provider,
          );
          expected.push({
            contextKey: ctx.key,
            provider: p.provider,
            label: p.label,
            category: p.category,
            accountEmail: existing?.account_alias ?? "",
            connection: existing ?? null,
          });
        }
      }
      setSlots(expected);

      // Find first unconnected slot
      const firstUnconnected = expected.findIndex(
        (s) => !isConnected(s.connection),
      );
      if (firstUnconnected === -1) {
        // All connected
        setCurrentSlotIndex(expected.length);
        setStep(4);
      } else {
        setCurrentSlotIndex(firstUnconnected);
        setStep(3);
      }
    }

    hydrate(s).catch(() => {});
  }, [router, searchParams]);

  // ── Step 1: save identity ─────────────────────────────────────────────────
  async function handleIdentityContinue() {
    if (!session) return;
    if (!identity.displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequest<OnboardingSaveResponse>("/onboarding/save", session, {
        method: "POST",
        body: JSON.stringify({
          identity: {
            display_name: identity.displayName.trim(),
            legal_name: identity.displayName.trim(),
            preferred_name:
              identity.preferredName.trim() || identity.displayName.trim(),
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
      setError(
        err instanceof Error ? err.message : "Unable to save identity.",
      );
    } finally {
      setBusy(false);
    }
  }

  // ── Step 2: build context list ────────────────────────────────────────────
  async function handleContextsContinue() {
    if (!session) return;
    setError(null);
    setMessage(null);

    if (professionalEnabled && !employerName.trim()) {
      setError("Enter your employer name or disable the Professional context.");
      return;
    }

    setBusy(true);

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
        drafts.push({
          key: b.key,
          type: "business",
          name: b.name.trim(),
          serverId: null,
        });
      }
    }

    const resolved: ContextDraft[] = [];
    for (const draft of drafts) {
      try {
        const resp = await apiRequest<ClientContext>("/contexts", session, {
          method: "POST",
          body: JSON.stringify({ type: draft.type, name: draft.name }),
        });
        resolved.push({ ...draft, serverId: resp.id });
      } catch {
        resolved.push(draft);
      }
    }

    setContexts(resolved);

    // Build provider slots
    const newSlots: ProviderSlot[] = [];
    for (const ctx of resolved) {
      const providers = FALLBACK_PROVIDERS[ctx.type] ?? [];
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
    setCurrentSlotIndex(0);
    setBusy(false);
    setStep(3);
  }

  // ── Step 3: save + connect (single action) ────────────────────────────────
  async function handleConnect(slot: ProviderSlot) {
    if (!session) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const contextPayload = contexts.map((c) => ({
        context_id: c.serverId ?? c.key,
        context_type: c.type,
        display_name: c.name,
        status: "active",
        context_accounts: [
          {
            context_account_id: `${slot.contextKey}_${slot.provider}`,
            provider: slot.provider,
            context_account_purpose: slot.category,
            account_alias: `${slot.contextKey}_${slot.provider}`,
            auth_scheme: "oauth",
            ...(c.serverId ? { context_id: c.serverId } : {}),
            ...(slot.accountEmail ? { account_email: slot.accountEmail } : {}),
          },
        ].filter((a) => a.context_account_id === `${slot.contextKey}_${slot.provider}`
          ? true
          : false),
      }));

      // Save the slot
      const result = await apiRequest<OnboardingSaveResponse>(
        "/onboarding/save",
        session,
        {
          method: "POST",
          body: JSON.stringify({
            authority_defaults: {},
            onboarding: { status: "pending" },
            contexts: contextPayload,
          }),
        },
      );

      const conn =
        result.provider_connections.find(
          (c) =>
            c.context_account_id === `${slot.contextKey}_${slot.provider}`,
        ) ??
        result.provider_connections.find(
          (c) => c.provider === slot.provider,
        ) ??
        null;

      if (!conn) {
        setError("Could not find the saved connection. Try again.");
        setBusy(false);
        return;
      }

      // Get the OAuth URL and redirect (same tab)
      const link = await apiRequest<ProviderConnectLinkResponse>(
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

      if (!link.url.includes("stub=true")) {
        window.location.href = link.url;
      } else {
        // Stub mode — simulate success and advance
        setSlots((prev) =>
          prev.map((s) =>
            slotId(s) === slotId(slot)
              ? { ...s, connection: { ...conn, status: "connected" } }
              : s,
          ),
        );
        advanceToNextSlot(currentSlotIndex);
        setBusy(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to connect account.",
      );
      setBusy(false);
    }
  }

  function advanceToNextSlot(fromIndex: number) {
    const next = slots.findIndex(
      (s, i) => i > fromIndex && !isConnected(s.connection),
    );
    if (next === -1) {
      setStep(4);
    } else {
      setCurrentSlotIndex(next);
    }
  }

  // ── Current slot for step 3 ───────────────────────────────────────────────
  const currentSlot = slots[currentSlotIndex] ?? null;
  const currentCtx = currentSlot
    ? contexts.find((c) => c.key === currentSlot.contextKey)
    : null;

  // ── Computed for step 4 ───────────────────────────────────────────────────
  const connectedCount = slots.filter((s) => isConnected(s.connection)).length;

  // ── No session guard ──────────────────────────────────────────────────────
  if (!session) {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-background px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          Client onboarding
        </h1>
        <p className="mt-3 text-sm text-muted">
          Sign in first so onboarding can write tenant-scoped profile, provider,
          workflow, and memory records.
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto min-h-screen max-w-xl bg-background px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">
            FlavorOS
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Client onboarding
          </h1>
        </div>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          Back
        </Link>
      </div>

      <div className="mt-4">
        <ProgressBar
          current={completedSteps}
          total={totalSteps}
          label={progressLabel}
        />
      </div>

      {/* Feedback */}
      {message && (
        <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      {/* ── Step 1: Identity ─────────────────────────────────────────────── */}
      {step === 1 && (
        <section className="mt-8 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-base font-medium">Your identity</h2>
          <p className="mt-1 text-sm text-muted">
            This is how FlavorOS will know you and default your time settings.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label
                className="block text-xs font-medium text-muted"
                htmlFor="displayName"
              >
                Display name <span className="text-rose-500">*</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={identity.displayName}
                onChange={(e) =>
                  setIdentity((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="e.g. Marcus Bivines"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium text-muted"
                htmlFor="preferredName"
              >
                Preferred name
              </label>
              <input
                id="preferredName"
                type="text"
                value={identity.preferredName}
                onChange={(e) =>
                  setIdentity((prev) => ({
                    ...prev,
                    preferredName: e.target.value,
                  }))
                }
                placeholder="e.g. Marcus"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium text-muted"
                htmlFor="timezone"
              >
                Timezone
              </label>
              <select
                id="timezone"
                value={identity.timezone}
                onChange={(e) =>
                  setIdentity((prev) => ({
                    ...prev,
                    timezone: e.target.value,
                  }))
                }
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
              disabled={busy}
              className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Saving..." : "Continue"}
            </button>
          </div>
        </section>
      )}

      {/* ── Step 2: Contexts ─────────────────────────────────────────────── */}
      {step === 2 && (
        <section className="mt-8 space-y-4">
          <div>
            <h2 className="text-base font-medium">Your contexts</h2>
            <p className="mt-1 text-sm text-muted">
              Choose which areas of your life to connect. FlavorOS keeps them
              separate.
            </p>
          </div>

          {/* Personal — always on */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="mb-1 inline-block rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-800">
                  personal
                </span>
                <p className="text-sm font-medium">Personal</p>
                <p className="text-xs text-muted">
                  Always enabled. Email and calendar.
                </p>
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
                <span className="mb-1 inline-block rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-800">
                  professional
                </span>
                <p className="text-sm font-medium">Professional</p>
                <p className="text-xs text-muted">
                  Your work email and calendar.
                </p>
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
                <span className="mb-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                  business
                </span>
                <p className="text-sm font-medium">Business</p>
                <p className="text-xs text-muted">
                  One entry per business. Add as many as you need.
                </p>
              </div>
            </div>

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
                        setBusinesses((prev) =>
                          prev.filter((x) => x.key !== b.key),
                        )
                      }
                      className="text-muted hover:text-foreground"
                      aria-label={`Remove ${b.name}`}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}

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
              disabled={busy}
              className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Setting up..." : "Continue"}
            </button>
          </div>
        </section>
      )}

      {/* ── Step 3: Connect one account at a time ────────────────────────── */}
      {step === 3 && currentSlot && currentCtx && (
        <section className="mt-8 space-y-6">
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="mb-1 flex items-center gap-2">
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeBadgeClasses(currentCtx.type)}`}
              >
                {currentCtx.type}
              </span>
              <span className="text-xs text-muted">{currentCtx.name}</span>
            </div>

            <h2 className="text-base font-medium">
              Connect your {currentSlot.label}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Enter the email for this account and click Connect. You&apos;ll be
              redirected to sign in, then brought right back here.
            </p>

            <div className="mt-6">
              <label
                className="block text-xs font-medium text-muted"
                htmlFor="accountEmail"
              >
                Account email
              </label>
              <input
                id="accountEmail"
                type="email"
                value={currentSlot.accountEmail}
                onChange={(e) =>
                  setSlots((prev) =>
                    prev.map((s, i) =>
                      i === currentSlotIndex
                        ? { ...s, accountEmail: e.target.value }
                        : s,
                    ),
                  )
                }
                placeholder="you@example.com"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => advanceToNextSlot(currentSlotIndex)}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Skip
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleConnect(currentSlot)}
                className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>

          {/* Mini summary of what's done */}
          {connectedCount > 0 && (
            <div className="rounded-md border border-border bg-background p-3">
              <p className="text-xs font-medium text-muted">
                {connectedCount} of {slots.length} accounts connected
              </p>
              <div className="mt-2 space-y-1">
                {slots.filter((s) => isConnected(s.connection)).map((s) => {
                  const ctx = contexts.find(
                    (c) => c.key === s.contextKey,
                  );
                  return (
                    <div
                      key={slotId(s)}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted">
                        {ctx?.name} — {s.label}
                      </span>
                      <span className="text-emerald-700">Connected</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Step 4: Ready ────────────────────────────────────────────────── */}
      {step === 4 && (
        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-base font-medium">You&apos;re all set</h2>
            <p className="mt-1 text-sm text-muted">
              Here&apos;s what was connected during onboarding.
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
                <dd className="font-medium text-emerald-700">
                  {connectedCount}
                </dd>
              </div>
            </dl>

            {contexts.length > 0 && (
              <div className="mt-5 space-y-3">
                {contexts.map((ctx) => {
                  const ctxSlots = slots.filter(
                    (s) => s.contextKey === ctx.key,
                  );
                  return (
                    <div
                      key={ctx.key}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-medium">{ctx.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeBadgeClasses(ctx.type)}`}
                        >
                          {ctx.type}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {ctxSlots.map((slot) => (
                          <div
                            key={slotId(slot)}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-muted">{slot.label}</span>
                            <span
                              className={
                                isConnected(slot.connection)
                                  ? "text-emerald-700"
                                  : "text-muted"
                              }
                            >
                              {isConnected(slot.connection)
                                ? "Connected"
                                : "Skipped"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-muted">
            You can connect more accounts later in Settings.
          </p>

          <div className="flex justify-end pt-2">
            <Link
              href="/command-center"
              className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              Go to Command Center
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
