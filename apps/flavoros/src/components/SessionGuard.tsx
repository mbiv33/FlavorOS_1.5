"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { loadSession } from "@/lib/api";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!loadSession()) {
      router.replace("/login");
    }
  }, [router]);

  if (typeof window !== "undefined" && !loadSession()) {
    return null;
  }

  return <>{children}</>;
}
