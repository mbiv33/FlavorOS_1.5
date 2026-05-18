import Link from "next/link";

const STEPS = [
  {
    title: "Profile",
    detail:
      "Name, timezone, persona signature preference. Builds the client envelope.",
  },
  {
    title: "Contexts",
    detail:
      "Choose context labels (Work, Business, Personal, custom). Configurable; never hardcoded.",
  },
  {
    title: "Connect Google Workspace",
    detail:
      "Gmail, Calendar, Docs, Sheets, Slides. Connection metadata only — secrets handled per protocol.",
  },
  {
    title: "Authority defaults",
    detail:
      "HITL defaults per category (comms, calendar, finance, travel, relationships).",
  },
  {
    title: "Briefing preferences",
    detail:
      "Times for Morning Standup, COB Work Day, Goodnight. Opt-in sections.",
  },
];

export default function OnboardingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-background px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted">
          FlavorOS
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Client onboarding
        </h1>
        <p className="text-sm text-muted">
          Five steps to prepare your governed Client Universe. None of this
          actually persists yet — Phase 2/4 wires it up.
        </p>
      </div>

      <ol className="mt-8 space-y-3">
        {STEPS.map((step, idx) => (
          <li
            key={step.title}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-strong text-xs font-medium">
                {idx + 1}
              </span>
              <div className="space-y-0.5">
                <h2 className="text-sm font-medium">{step.title}</h2>
                <p className="text-xs text-muted">{step.detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex items-center justify-between">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          Back
        </Link>
        <Link
          href="/command-center"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Finish &amp; open Command Center
        </Link>
      </div>
    </main>
  );
}
