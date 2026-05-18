import Link from "next/link";

export default function Landing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-widest text-muted">
            FlavorOS
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your calm operating picture.
          </h1>
          <p className="text-sm text-muted">
            A multi-agent client command center. Review prepared work, approve
            what matters, and move on with your day.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block rounded-md bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="block rounded-md border border-border-strong px-4 py-2.5 text-center text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            Sign up · Client onboarding
          </Link>
        </div>
        <p className="text-center text-xs text-muted">
          Operators can also{" "}
          <Link href="/admin" className="underline hover:text-foreground">
            open the operator console
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
