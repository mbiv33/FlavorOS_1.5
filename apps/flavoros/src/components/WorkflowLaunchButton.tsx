"use client";

import { useWorkflowLaunch } from "@/lib/hooks/useWorkflowLaunch";
import type { WorkflowRunRead } from "@/lib/api";

export function WorkflowLaunchButton({
  workflowType,
  label = "Prepare Now",
  labelLaunching = "Preparing…",
  labelPolling = "Preparing…",
  labelDone = "Ready",
  labelFailed = "Retry",
  onComplete,
  className,
}: {
  workflowType: string;
  label?: string;
  labelLaunching?: string;
  labelPolling?: string;
  labelDone?: string;
  labelFailed?: string;
  onComplete?: (run: WorkflowRunRead) => void;
  className?: string;
}) {
  const { state, launch, reset } = useWorkflowLaunch(onComplete);

  const busy = state.phase === "launching" || state.phase === "polling";
  const done = state.phase === "completed";
  const failed = state.phase === "failed";

  const buttonLabel =
    state.phase === "launching"
      ? labelLaunching
      : state.phase === "polling"
        ? labelPolling
        : done
          ? labelDone
          : failed
            ? labelFailed
            : label;

  const baseClass =
    className ??
    "rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50";

  const colorClass = done
    ? "bg-status-done/15 text-status-done border border-status-done/30"
    : failed
      ? "bg-status-blocked/10 text-status-blocked border border-status-blocked/30"
      : "bg-accent text-accent-foreground hover:opacity-90";

  function handleClick() {
    if (failed) {
      reset();
      return;
    }
    if (!busy && !done) {
      launch(workflowType);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={busy || done}
        onClick={handleClick}
        className={`${baseClass} ${colorClass}`}
      >
        {busy ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {buttonLabel}
          </span>
        ) : (
          buttonLabel
        )}
      </button>
      {failed && state.phase === "failed" ? (
        <p className="text-xs text-status-blocked">{state.error}</p>
      ) : null}
    </div>
  );
}
