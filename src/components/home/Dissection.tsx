"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CLASSIC, stackLayers } from "@/lib/burger/layers";
import { story } from "@/components/three/story";

gsap.registerPlugin(ScrollTrigger);

const { layers } = stackLayers(CLASSIC);
const topDown = [...layers].reverse().map((l) => l.key);
const bottomUp = layers.map((l) => l.key);

type Note = { fig: string; title: string; body: string; side: 1 | -1 };

// Written like margin notes in a recipe notebook: short, specific, no adjectives for their own sake.
const NOTES: Record<string, Note> = {
  "bunTop-1": { fig: "01", title: "Freshly baked", body: "Sesame brioche, out of the oven at five every morning. Toasted face-down so the sauce can't soak through.", side: 1 },
  "sauce-2": { fig: "02", title: "House sauce", body: "Mayo, mustard, pickle brine, smoked paprika. The ratio stays in the kitchen.", side: -1 },
  "lettuce-1": { fig: "03", title: "Cold crunch", body: "Iceberg, straight from the fridge. It's there for crunch and nothing else.", side: 1 },
  "tomato-1": { fig: "04", title: "Thick-cut tomato", body: "Beefsteak, a finger thick, salted thirty seconds before it goes on.", side: -1 },
  "onion-1": { fig: "05", title: "Raw red onion", body: "Shaved thin. A bit of bite to cut through the fat.", side: 1 },
  "cheese-1": { fig: "06", title: "Real cheese", body: "Aged cheddar, laid on for the last forty seconds so it slumps down the sides.", side: -1 },
  "patty-1": { fig: "07", title: "Premium beef", body: "180 g of chuck and brisket. Smashed once, seared hard, salt and pepper only.", side: 1 },
  "bunBottom-1": { fig: "08", title: "The foundation", body: "Buttered and griddled. It holds the whole thing up, right to the last bite.", side: -1 },
};

export function Dissection({ finale = { headline: "The art of a", accent: "perfect bite." } }: { finale?: { headline: string; accent: string } }) {
  const track = useRef<HTMLDivElement>(null);
  const chapterA = useRef<HTMLDivElement>(null);
  const chapterB = useRef<HTMLDivElement>(null);
  const chapterC = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    for (const k of bottomUp) story.targets[k] = 0;

    const ctx = gsap.context(() => {
      const cam = story.camera;
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: 0.5 },
      });

      // 0 → 1  The hero hands over: the burger lifts off the page as the camera leans in.
      tl.to(cam, { distance: 7.0, phi: 0.2, duration: 1 }, 0);
      tl.to(story, { spin: 0.4, duration: 1 }, 0);

      // 1 → 4.4  Dissection, crown first. Each layer leaves on its own beat.
      topDown.forEach((key, i) => {
        tl.to(story.targets, { [key]: 1, duration: 1.3, ease: "power3.inOut" }, 1 + i * 0.26);
      });
      tl.to(cam, { distance: 19.5, targetY: 2.6, phi: 0.16, theta: 0.55, duration: 3.2 }, 1);
      tl.fromTo(chapterA.current, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 1.2);
      tl.to(chapterA.current, { autoAlpha: 0, y: -40, duration: 0.6 }, 3.2);

      // 4.4 → 6  Hold, exploded. The camera walks round the specimen while the notes are up.
      tl.to(story, { labels: 1, duration: 0.5, ease: "none" }, 4.1);
      tl.to(cam, { theta: -0.45, duration: 1.8, ease: "sine.inOut" }, 4.3);
      tl.to(story, { spin: 1.2, duration: 1.8, ease: "sine.inOut" }, 4.3);
      tl.to(story, { labels: 0, duration: 0.4, ease: "none" }, 6.0);

      // 6.2 → 9.4  Assembly, from the heel up. The springs in the scene add the settle.
      bottomUp.forEach((key, i) => {
        tl.to(story.targets, { [key]: 0, duration: 0.9, ease: "power2.in" }, 6.3 + i * 0.32);
      });
      // The camera pulls back a touch while parts are in flight, then follows the
      // stack down only once the upper layers are on their way home.
      tl.to(cam, { distance: 17.5, theta: 0.3, phi: 0.1, duration: 1.6 }, 6.2);
      tl.to(cam, { targetY: 0.6, duration: 2, ease: "sine.inOut" }, 7.6);
      tl.fromTo(chapterB.current, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 6.4);
      tl.to(chapterB.current, { autoAlpha: 0, duration: 0.5 }, 8.6);

      // 9.4 → 11  Done. Push in low, like a hero shot, and let the headline land.
      // Aim below the burger so it sits in the upper half, above the headline.
      tl.to(cam, { distance: 8.4, phi: 0.06, theta: 0.12, targetY: -0.6, duration: 1.4, ease: "power3.inOut" }, 9.3);
      tl.to(story, { spin: 2.0, duration: 1.6 }, 9.3);
      tl.fromTo(chapterC.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 10.0);
      tl.set({}, {}, 11);
    }, el);

    return () => {
      ctx.revert();
      story.labels = 0;
      for (const k of bottomUp) story.targets[k] = 0;
    };
  }, []);

  return (
    <section ref={track} id="dissect" data-stage-zone aria-label="The Classic, taken apart and rebuilt" className="relative h-[540vh]">
      <div className="sticky top-0 z-20 h-dvh overflow-hidden">
        {/* Chapter A: lower left, out of the burger's way */}
        <div ref={chapterA} className="invisible absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/85 to-transparent px-5 pb-10 pt-24 md:inset-x-auto md:bottom-14 md:left-10 md:max-w-[34rem] md:bg-none md:p-0">
          <p className="type-annot text-mustard">Fig. A · The Classic, exploded view</p>
          <h2 className="type-display mt-4 text-[17vw] text-cream md:text-[8.5vw]">
            Take it
            <br />
            apart.
          </h2>
          <p className="mt-4 max-w-xs text-cream/70">Nine layers. Every one of them earns its place. Keep scrolling and we&apos;ll show you why.</p>
        </div>

        {/* Ingredient notes, positioned every frame by the 3D scene */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {Object.entries(NOTES).map(([key, n]) => (
            <div
              key={key}
              data-side={n.side}
              ref={(node) => {
                if (node) story.labelEls.set(key, node);
                else story.labelEls.delete(key);
              }}
              className="absolute left-0 top-0 opacity-0 will-change-transform"
            >
              <span className={`absolute top-0 h-px w-[var(--w)] bg-cream/60 ${n.side > 0 ? "left-0" : "right-0"}`} />
              <span className="absolute -left-[3px] -top-[3px] h-[7px] w-[7px] rounded-full border border-mustard bg-ink" />
              <div
                className={`absolute top-0 w-44 -translate-y-1/2 md:w-60 ${n.side > 0 ? "left-[calc(var(--w)+14px)]" : "right-[calc(var(--w)+14px)] text-right"} max-md:-translate-y-[calc(100%+8px)] max-md:w-32 ${n.side > 0 ? "max-md:left-auto max-md:right-[calc(-1*var(--w)+0px)] max-md:text-right" : "max-md:right-auto max-md:left-[calc(-1*var(--w))] max-md:text-left"}`}
              >
                <p className="type-annot text-mustard">Fig. {n.fig}</p>
                <p className="type-display mt-1 text-2xl text-cream md:text-3xl">{n.title}</p>
                <p className="mt-1 hidden text-sm leading-snug text-cream/85 md:block">{n.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Screen-reader version of the notes */}
        <ol className="sr-only">
          {Object.values(NOTES).map((n) => (
            <li key={n.fig}>
              {n.title}: {n.body}
            </li>
          ))}
        </ol>

        {/* Chapter B: upper right while the stack rebuilds */}
        <div ref={chapterB} className="invisible absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/85 to-transparent px-5 pb-10 pt-24 text-right md:inset-x-auto md:bottom-auto md:right-10 md:top-36 md:max-w-[30rem] md:bg-none md:p-0">
          <p className="type-annot text-mustard">Fig. B · Reassembly</p>
          <h2 className="type-display mt-4 text-[15vw] text-cream md:text-[7vw]">
            Order is
            <br />
            the recipe.
          </h2>
          <p className="ml-auto mt-4 max-w-xs text-cream/70">
            Sauce under the patty, cheese on top of it, lettuce up against the crown. Change the order and you&apos;ve made a different burger.
          </p>
        </div>

        {/* Chapter C: the payoff */}
        <div ref={chapterC} className="invisible absolute inset-x-5 bottom-10 md:inset-x-10 md:bottom-12">
          <h2 className="type-display text-[16vw] leading-[0.8] text-cream md:text-[10.5vw]">
            {finale.headline} <span className="text-mustard">{finale.accent}</span>
          </h2>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Link
              href="/menu/the-classic"
              className="rounded-full bg-mustard px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-ink shadow-[0_10px_30px_-8px_rgba(255,180,40,0.6)] transition-transform hover:-translate-y-0.5"
            >
              Order The Classic
            </Link>
            <Link href="/build" className="type-annot text-cream/70 underline-offset-4 hover:text-cream hover:underline">
              Or stack your own →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
