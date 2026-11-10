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
      {/* The warm pool of light the burger sits in: a grill-lit amber, not a black void.
          Fixed, so it travels with the burger. */}
      <div
        className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      >
        {/* Glow and edge vignette in one layer: one full-screen paint instead of two. */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,rgba(30,6,2,0.55)_100%),radial-gradient(70%_62%_at_55%_52%,#ff9a3c_0%,#f0601c_26%,#a8260c_55%,#4a1206_82%,#250904_100%)]" />
        {/* Heat: flares while the burger is apart, driven per frame by the 3D scene (--heat). */}
        <div
          className="absolute inset-0 bg-[radial-gradient(45%_42%_at_52%_50%,#ffe08a_0%,#ffb340_35%,transparent_75%)]"
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
