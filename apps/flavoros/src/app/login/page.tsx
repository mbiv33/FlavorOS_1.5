import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-surface p-8">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Log in</h1>
          <p className="text-sm text-muted">
            Choose how you&apos;re signing in. Real auth will wire up in Phase
            3.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/command-center"
            className="block rounded-md bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Continue as Client
          </Link>
          <Link
            href="/admin"
            className="block rounded-md border border-border-strong px-4 py-2.5 text-center text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            Continue as Operator
          </Link>
        </div>
        <p className="text-center text-xs text-muted">
          <Link href="/onboarding" className="underline hover:text-foreground">
            New here? Start onboarding
          </Link>
        </p>
      </div>
    </main>
  );
}
