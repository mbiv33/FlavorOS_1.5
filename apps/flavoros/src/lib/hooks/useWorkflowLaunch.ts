"use client";

import { useCallback, useRef, useState } from "react";

import {
  getWorkflowRun,
  launchWorkflow,
  loadSession,
  type WorkflowRunRead,
  type WorkflowStatus,
} from "@/lib/api";

const TERMINAL_STATUSES: WorkflowStatus[] = ["completed", "failed", "cancelled"];
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 90; // 3 minutes max before giving up

export type WorkflowLaunchState =
  | { phase: "idle" }
  | { phase: "launching" }
  | { phase: "polling"; runId: string; attempts: number }
  | { phase: "completed"; run: WorkflowRunRead }
  | { phase: "failed"; error: string };

export function useWorkflowLaunch(onComplete?: (run: WorkflowRunRead) => void) {
  const [state, setState] = useState<WorkflowLaunchState>({ phase: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const poll = useCallback(
    async (runId: string) => {
      const session = loadSession();
      if (!session) {
        setState({ phase: "failed", error: "Session expired" });
        return;
      }

      pollCountRef.current += 1;

      if (pollCountRef.current > MAX_POLLS) {
        setState({
          phase: "failed",
          error: "Workflow is taking longer than expected. Check back soon.",
        });
        return;
      }

      try {
        const run = await getWorkflowRun(session, runId);
        setState((prev) => ({
          ...(prev as { phase: "polling"; runId: string; attempts: number }),
          attempts: pollCountRef.current,
        }));

        if (TERMINAL_STATUSES.includes(run.status)) {
          clearTimer();
          if (run.status === "completed") {
            setState({ phase: "completed", run });
            onComplete?.(run);
          } else {
            setState({
              phase: "failed",
              error: run.error || `Workflow ${run.status}`,
            });
          }
          return;
        }

        // Schedule next poll
        timerRef.current = setTimeout(() => poll(runId), POLL_INTERVAL_MS);
      } catch (err) {
        clearTimer();
        setState({
          phase: "failed",
          error: err instanceof Error ? err.message : "Failed to check workflow status",
        });
      }
    },
    [onComplete],
  );

  const launch = useCallback(
    async (workflowType: string, inputData?: Record<string, unknown>) => {
      clearTimer();
      pollCountRef.current = 0;
      setState({ phase: "launching" });

      const session = loadSession();
      if (!session) {
        setState({ phase: "failed", error: "Not logged in" });
        return;
      }

      try {
        const result = await launchWorkflow(session, workflowType, inputData);

        if (TERMINAL_STATUSES.includes(result.status)) {
          // Already done (shouldn't happen with in_process adapter returning queued)
          const run = await getWorkflowRun(session, result.run_id);
          setState({ phase: "completed", run });
          onComplete?.(run);
          return;
        }

        setState({ phase: "polling", runId: result.run_id, attempts: 0 });
        timerRef.current = setTimeout(() => poll(result.run_id), POLL_INTERVAL_MS);
      } catch (err) {
        setState({
          phase: "failed",
          error: err instanceof Error ? err.message : "Failed to launch workflow",
        });
      }
    },
    [poll, onComplete],
  );

  const reset = useCallback(() => {
    clearTimer();
    pollCountRef.current = 0;
    setState({ phase: "idle" });
  }, []);

  return { state, launch, reset };
}
