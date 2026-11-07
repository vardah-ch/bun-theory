"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches the order page every 20 s while the order is in progress (pauses in background tabs). */
export function StatusRefresher() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 20000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
