"use client";

import dynamic from "next/dynamic";
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
        <div className="absolute inset-0 bg-[radial-gradient(70%_62%_at_55%_52%,#ff9a3c_0%,#f0601c_26%,#a8260c_55%,#4a1206_82%,#250904_100%)]" />
        {/* Heat: flares while the burger is apart, driven per frame by the 3D scene (--heat). */}
        <div
          className="absolute inset-0 bg-[radial-gradient(45%_42%_at_52%_50%,#ffe08a_0%,#ffb340_35%,transparent_75%)] mix-blend-screen"
          style={{ opacity: "var(--heat, 0.35)" }}
        />
        {/* Vignette keeps the headline edges legible. */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,rgba(30,6,2,0.55)_100%)]" />
      </div>
      <div
        className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`}
        data-stage
      >
        <div className="h-full w-full animate-[stagein_1.6s_var(--ease-out-expo)_both]">
          <HomeStage active={active} />
        </div>
      </div>
    </>
  );
}
