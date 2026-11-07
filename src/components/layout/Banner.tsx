"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

const subscribe = (cb: () => void) => {
  window.addEventListener("bt-banner", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("bt-banner", cb);
    window.removeEventListener("storage", cb);
  };
};

/** Admin-editable announcement strip. Dismissal is remembered per message. */
export function Banner({ text, href, enabled }: { text: string; href: string; enabled: boolean }) {
  const path = usePathname();
  const key = `bt-banner:${text}`;
  // Server render (and first paint) treat the banner as dismissed; the client then reads localStorage.
  const hidden = useSyncExternalStore(subscribe, () => localStorage.getItem(key) === "1", () => true);
  // Not on staff pages, the photo studio, or pages that have their own bottom order bar.
  const quiet = ["/admin", "/studio", "/pay", "/build", "/checkout", "/menu/"].some((p) => path.startsWith(p));
  if (!enabled || !text || hidden || quiet) return null;
  return (
    // Phones: a slim one-line strip tucked under the nav. Larger screens: a pill bottom-left.
    <div className="fixed inset-x-0 top-[6.35rem] z-[45] flex items-center gap-3 bg-fire py-1.5 pl-5 pr-10 text-xs font-medium text-ink sm:inset-x-auto sm:bottom-4 sm:left-4 sm:top-auto sm:z-[55] sm:max-w-md sm:rounded-full sm:py-2.5 sm:pr-11 sm:text-sm sm:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.7)]">
      <Link href={href} className="truncate hover:underline">{text} →</Link>
      <button
        aria-label="Dismiss announcement"
        onClick={() => {
          localStorage.setItem(key, "1");
          window.dispatchEvent(new Event("bt-banner"));
        }}
        className="absolute right-3 sm:right-3.5"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
