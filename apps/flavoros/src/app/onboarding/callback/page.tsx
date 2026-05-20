"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackInner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const connected = status.toUpperCase() === "ACTIVE";

  useEffect(() => {
    // Notify the opener (onboarding page) so it can refresh connection status
    if (window.opener) {
      window.opener.postMessage({ type: "oauth_complete", connected }, window.location.origin);
    }
    const t = setTimeout(() => window.close(), 2000);
    return () => clearTimeout(t);
  }, [connected]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mb-3 text-3xl">{connected ? "✓" : "⚠"}</div>
        <h1 className="text-base font-semibold text-foreground">
          {connected ? "Account connected!" : "Connection pending"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {connected
            ? "You can close this tab and return to onboarding."
            : "Something may have gone wrong. Close this tab and try again."}
        </p>
        <button
          onClick={() => window.close()}
          className="mt-5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Close tab
        </button>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
