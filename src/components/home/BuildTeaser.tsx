"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BUILD_COMBINATIONS, BUILD_GROUPS } from "@/lib/burger/options";
import { ProductImage } from "@/components/product/ProductImage";

function useCountUp(target: number, run: boolean, ms = 1800) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? target : 0);
  useEffect(() => {
    if (!run || reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / ms, 1);
      setN(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, ms, reduce]);
  return n;
}

export function BuildTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const n = useCountUp(BUILD_COMBINATIONS, inView);

  return (
    <section aria-labelledby="build-title" className="theme-ketchup relative z-20 overflow-hidden px-5 py-24 md:px-10 md:py-40">
      <div ref={ref} className="grid items-end gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="type-annot text-fire">Nº 004 · Build your own</p>
          <p className="type-display mt-6 text-[19vw] tabular-nums text-cream lg:text-[12vw]" aria-hidden="true">
            {n.toLocaleString("en-US")}
          </p>
          <h2 id="build-title" className="type-display mt-3 text-[9vw] text-cream/90 lg:text-[4.4vw]">
            ways to stack a burger. <span className="text-fire">Pick yours.</span>
          </h2>
        </div>
        <div className="lg:col-span-4">
          <p className="max-w-sm text-lg leading-relaxed text-cream/85">
            Choose the bun, the patty, the cheese and everything after. The burger on screen rebuilds as you go, layer by layer, and the price follows along.
          </p>
          <ul className="type-annot mt-6 flex flex-wrap gap-2 text-cream/80">
            {BUILD_GROUPS.map((g) => (
              <li key={g.id} className="rounded-full border border-cream/30 px-3 py-1.5">
                {g.name} · {g.options.length}
              </li>
            ))}
          </ul>
          <Link
            href="/build"
            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-fire px-7 py-4 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-cream"
          >
            Start building
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Three different answers to the same question */}
      <div className="mt-20 grid grid-cols-3 gap-2 md:mt-28 md:gap-8" aria-hidden="true">
        {["single-smash", "fire-bird", "greenhouse"].map((slug, i) => (
          <figure key={slug} className={i === 1 ? "md:-translate-y-12" : ""}>
            <ProductImage product={{ slug, name: "" }} sizes="30vw" className="w-full drop-shadow-[0_30px_30px_rgba(70,0,0,0.45)]" />
            <figcaption className="type-annot mt-2 text-center text-cream/70">Build #{(48213 + i * 70411).toString().padStart(6, "0")}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
