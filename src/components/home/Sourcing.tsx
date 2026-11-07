"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProductImage } from "@/components/product/ProductImage";
import { Reveal } from "./Reveal";

gsap.registerPlugin(ScrollTrigger);

const FACTS = [
  { n: "180", unit: "g", title: "Of beef, weighed", body: "Chuck for flavour, brisket for fat. Ground every morning and pressed by hand. Every patty goes on the scale." },
  { n: "05", unit: ":00", title: "Buns in the oven", body: "Our brioche is proved overnight and baked before sunrise. What isn't sold by close becomes the staff's breakfast." },
  { n: "40", unit: "s", title: "Of melt", body: "Cheese goes on for the last forty seconds under a dome. Long enough to slump down the sides, not so long that it splits." },
  { n: "0", unit: "", title: "Freezers for meat", body: "We don't own one. If the beef doesn't arrive, the smash burgers come off the board for the day." },
];

/**
 * Editorial spread. Numbers lead because they're the claims we can back up;
 * the photos drift at different speeds for depth, never more than a hand's width.
 */
export function Sourcing() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        const speed = Number(el.dataset.speed);
        gsap.fromTo(el, { yPercent: speed * 40 }, {
          yPercent: speed * -40,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} aria-labelledby="sourcing-title" className="relative z-20 overflow-hidden bg-mustard px-5 py-24 text-ink md:px-10 md:py-40">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="type-annot text-ketchup">Nº 003 · What goes in</p>
          <h2 id="sourcing-title" className="type-display mt-6 text-[16vw] md:text-[7.5vw]">
            Short list.
            <br />
            Long hours.
          </h2>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink/75">
            There&apos;s no secret ingredient. There are a few ordinary ones, done properly and on time, every day. Here&apos;s what that means in numbers.
          </p>
        </div>

        <div className="relative hidden md:col-span-7 md:block" aria-hidden="true">
          <div data-speed="0.6" className="absolute right-[4%] top-0 w-[58%]">
            <ProductImage product={{ slug: "the-classic", name: "" }} sizes="40vw" className="drop-shadow-[0_40px_50px_rgba(60,20,0,0.35)]" />
          </div>
          <div data-speed="-0.4" className="absolute left-0 top-[42%] w-[38%] rotate-[-8deg]">
            <ProductImage product={{ slug: "theory-fries", name: "" }} sizes="25vw" className="drop-shadow-[0_30px_40px_rgba(60,20,0,0.3)]" />
          </div>
        </div>
      </div>

      <ol className="mt-20 grid gap-x-10 gap-y-16 md:mt-56 md:grid-cols-4">
        {FACTS.map((f, i) => (
          <Reveal as="li" key={f.title} delay={i * 0.08} className="border-t border-ink/25 pt-6">
            <p className="type-display text-[28vw] leading-[0.78] md:text-[9vw]">
              {f.n}
              <span className="text-ketchup">{f.unit}</span>
            </p>
            <h3 className="type-annot mt-6 text-ink">{f.title}</h3>
            <p className="mt-3 max-w-xs leading-relaxed text-ink/70">{f.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
