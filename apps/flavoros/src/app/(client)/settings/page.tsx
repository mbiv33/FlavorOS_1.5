"use client";

import { Header } from "@/components/Header";
import { Zone } from "@/components/Zone";
import { Card, CardMeta, CardTitle } from "@/components/Card";
import { useSettingsData } from "@/lib/hooks/useSettingsData";
import type { ProviderConnection } from "@/lib/api";

const PROVIDER_LABELS: Record<ProviderConnection["provider"], string> = {
  gmail: "Gmail",
  googlecalendar: "Google Calendar",
  googledrive: "Google Drive / Docs",
};

const STATUS_LABELS: Record<ProviderConnection["status"], string> = {
  not_started: "Not started",
  pending_consent: "Pending consent",
  initiated: "Initiated",
  connected: "Connected",
  syncing: "Syncing",
  ready: "Ready",
  degraded: "Degraded",
  blocked: "Blocked",
  revoked: "Revoked",
  failed: "Failed",
};

function formatContextId(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
}

function humanizeKey(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function SettingsPage() {
  const { profile, providers, envelope, loading, error } = useSettingsData();

  const contextLabels =
    envelope && envelope.contexts.length > 0
      ? envelope.contexts.map((ctx) => ctx.name || formatContextId(ctx.type))
      : [
          ...new Set(
            providers
              .map((conn) => conn.context_id)
              .filter((id): id is string => Boolean(id)),
          ),
        ].map(formatContextId);

  const preferences = profile?.preferences ?? null;
  const authorityDefaults =
    envelope?.authority && typeof envelope.authority === "object"
      ? (envelope.authority as Record<string, string>)
      : preferences &&
          typeof preferences === "object" &&
          "authority_defaults" in preferences &&
          preferences.authority_defaults &&
          typeof preferences.authority_defaults === "object"
        ? (preferences.authority_defaults as Record<string, string>)
        : null;

  const onboardingSlice = envelope?.onboarding?.status;
  const onboardingStatus =
    onboardingSlice &&
    typeof onboardingSlice === "object" &&
    "status" in onboardingSlice
      ? String((onboardingSlice as Record<string, unknown>).status)
      : preferences &&
          typeof preferences === "object" &&
          "onboarding" in preferences &&
          preferences.onboarding &&
          typeof preferences.onboarding === "object" &&
          "status" in preferences.onboarding
        ? String((preferences.onboarding as Record<string, unknown>).status)
        : null;

  return (
    <>
      <Header
        title="Settings / Profile"
        nextFocus="Profile, contexts, providers, and preferences"
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-8">
          {error ? (
            <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="text-sm text-muted">Loading settings…</p>
          ) : (
            <>
              <Zone title="Profile">
                <Card>
                  {profile ? (
                    <>
                      <CardTitle>{profile.display_name}</CardTitle>
                      <CardMeta>
                        Timezone: {profile.timezone ?? "Not set"}
                      </CardMeta>
                    </>
                  ) : (
                    <CardMeta>Sign in to view your profile.</CardMeta>
                  )}
                </Card>
              </Zone>

              <Zone title="Contexts">
                <Card>
                  {contextLabels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {contextLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-border-strong px-2 py-0.5 text-xs"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <CardMeta>
                      No contexts yet — they appear after onboarding and provider
                      setup.
                    </CardMeta>
                  )}
                </Card>
              </Zone>

              <Zone title="Connected accounts">
                <div className="space-y-3">
                  {providers.length > 0 ? (
                    providers.map((conn) => (
                      <Card key={conn.id}>
                        <CardTitle>
                          {PROVIDER_LABELS[conn.provider] ?? conn.provider}
                        </CardTitle>
                        <CardMeta>
                          {STATUS_LABELS[conn.status]}
                          {conn.context_id ? ` · ${formatContextId(conn.context_id)}` : ""}
                          {conn.account_alias ? ` · ${conn.account_alias}` : ""}
                          {conn.purpose ? ` · ${conn.purpose}` : ""}
                        </CardMeta>
                        {conn.status_reason ? (
                          <p className="mt-1 text-xs text-muted">{conn.status_reason}</p>
                        ) : null}
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardMeta>
                        No provider connections yet. Complete onboarding to connect
                        Gmail, Calendar, and Drive.
                      </CardMeta>
                    </Card>
                  )}
                </div>
              </Zone>

              <Zone title="Authority defaults">
                <Card>
                  {authorityDefaults ? (
                    <div className="space-y-2">
                      {Object.entries(authorityDefaults).map(([key, value]) => (
                        <p key={key} className="text-sm text-muted">
                          <span className="font-medium text-foreground">
                            {humanizeKey(key)}:
                          </span>{" "}
                          {humanizeKey(String(value))}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <CardMeta>
                      HITL defaults per category (comms, calendar, finance, travel,
                      relationships) will appear here after onboarding.
                    </CardMeta>
                  )}
                </Card>
              </Zone>

              <Zone title="Briefing preferences">
                <Card>
                  {onboardingStatus ? (
                    <CardMeta>Onboarding status: {humanizeKey(onboardingStatus)}</CardMeta>
                  ) : (
                    <CardMeta>
                      Morning Standup, COB Work Day, and Goodnight times and opt-in
                      sections will be editable in a later phase.
                    </CardMeta>
                  )}
                </Card>
              </Zone>
            </>
          )}
        </div>
      </div>
    </>
  );
}
