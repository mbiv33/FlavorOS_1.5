"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { login, saveSession } from "@/lib/api";
import { isClientReadyForCommandCenter } from "@/lib/onboarding-gate";

export default function LoginPage() {
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = useState("demo");
  const [email, setEmail] = useState("client@demo.local");
  const [password, setPassword] = useState("devclient");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const session = await login({ tenantSlug, email, password });
      saveSession(session);
      const ready = await isClientReadyForCommandCenter(session);
      router.push(ready ? "/command-center" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-6 rounded-xl border border-border bg-surface p-8"
      >
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Log in</h1>
          <p className="text-sm text-muted">
            Sign in to a tenant-scoped dev client before onboarding providers.
          </p>
        </div>
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="text-muted">Tenant</span>
            <input
              value={tenantSlug}
              onChange={(event) => setTenantSlug(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
        {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-center text-xs text-muted">
          <Link href="/" className="underline hover:text-foreground">
            Back to welcome
          </Link>
        </p>
      </form>
    </main>
  );
}
