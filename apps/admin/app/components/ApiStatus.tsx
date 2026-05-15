"use client";

import { useEffect, useState } from "react";

import { apiBaseUrl } from "@/lib/api";

type HealthJson = Record<string, unknown>;

export function ApiStatus() {
  const base = apiBaseUrl();
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    if (!base) {
      setState("err");
      setDetail("Set NEXT_PUBLIC_API_URL in apps/admin/.env.local");
      return;
    }

    const ac = new AbortController();
    fetch(`${base}/health`, { signal: ac.signal })
      .then(async (res) => {
        const text = await res.text();
        let j: HealthJson | null = null;
        try {
          j = JSON.parse(text) as HealthJson;
        } catch {
          /* plain text ok */
        }
        if (!res.ok) {
          setState("err");
          setDetail(`${res.status} ${text}`);
          return;
        }
        setState("ok");
        setDetail(j ? JSON.stringify(j) : text);
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setState("err");
        setDetail(e.message);
      });

    return () => ac.abort();
  }, [base]);

  const color =
    state === "ok"
      ? "text-green-700 dark:text-green-400"
      : state === "err"
        ? "text-red-700 dark:text-red-400"
        : "text-neutral-600 dark:text-neutral-400";

  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4 space-y-2">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        API smoke
      </div>
      <div className={`font-medium ${color}`}>
        {state === "idle" && "Checking…"}
        {state === "ok" && "Reachable"}
        {state === "err" && "Unreachable"}
      </div>
      <div className="text-xs font-mono break-all text-neutral-600 dark:text-neutral-400">
        {base ? `${base}/health` : "(no NEXT_PUBLIC_API_URL)"}
      </div>
      {detail ? (
        <pre className="text-xs whitespace-pre-wrap break-all text-neutral-700 dark:text-neutral-300">
          {detail}
        </pre>
      ) : null}
    </section>
  );
}
