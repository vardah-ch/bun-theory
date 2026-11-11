"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";

// three.js stays out of the server bundle and off the critical path:
// the typography paints first, the burger arrives a beat later.
const HomeStage = dynamic(() => import("@/components/three/HomeStage"), { ssr: false });

/**
 * The fixed WebGL stage behind the hero and the dissection. Once neither is on
 * screen it fades out and stops rendering entirely, so the rest of the page
 * costs the GPU nothing.
 */
export function StageLayer() {
  const [active, setActive] = useState(true);
  // The 3D scene is mounted only once the page has painted and the browser is
  // idle: compiling its shaders can stall the first frame for seconds on a phone.
  // Until then (and while it warms up) a render of the same burger stands in.
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const go = () => !cancelled && setMount(true);
    // After load, after two painted frames, then when the browser is idle.
    const afterPaint = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if ("requestIdleCallback" in window) window.requestIdleCallback(go, { timeout: 1200 });
          else setTimeout(go, 200);
        }),
      );
    if (document.readyState === "complete") afterPaint();
    else window.addEventListener("load", afterPaint, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", afterPaint);
    };
  }, []);

  useEffect(() => {
    const zones = document.querySelectorAll("[data-stage-zone]");
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
        setActive(visible.size > 0);
      },
      { rootMargin: "0px 0px -35% 0px" },
    );
    zones.forEach((z) => io.observe(z));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* A dark, warm studio with one spotlight on the burger, the way food is shot
          for a menu board. The golden bun needs a deep background to glow against:
          an orange backdrop swallowed it. Fixed, so it travels with the burger. */}
      <div
        className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      >
        {/* Spotlight and edge vignette in one layer: one full-screen paint instead of two. */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_50%,rgba(8,3,1,0.6)_100%),radial-gradient(58%_55%_at_54%_54%,#6e2d12_0%,#4a1c0b_30%,#2a0f06_62%,#150804_100%)]" />
        {/* Heat: a low ember glow while the burger is apart, driven per frame by the 3D scene (--heat). */}
        <div
          className="absolute inset-0 bg-[radial-gradient(40%_38%_at_52%_52%,rgba(255,140,50,0.42)_0%,rgba(220,80,20,0.18)_45%,transparent_75%)]"
          style={{ opacity: "var(--heat, 0.35)" }}
        />
      </div>
      <div
        className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`}
        data-stage
      >
        {/* Stand-in: same burger, already on screen at first paint. */}
        <div
          className={`pointer-events-none absolute left-1/2 top-[44%] w-[108vw] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 md:top-[51%] md:w-[min(94vh,60vw)] ${ready ? "opacity-0" : "opacity-100"}`}
          aria-hidden="true"
        >
          <Image src="/renders/the-classic.png" alt="" width={900} height={900} priority sizes="(min-width:768px) 60vw, 100vw" className="h-auto w-full" />
        </div>
        <div className={`h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
          {mount && <HomeStage active={active} onReady={() => setReady(true)} />}
        </div>
      </div>
    </>
  );
}
