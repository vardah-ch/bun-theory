"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product/ProductImage";
import { AddToCart } from "@/components/product/AddToCart";

/**
 * The signature burgers as a running order, not a card grid. On desktop the
 * hovered burger's photo trails the cursor across its row; the names stay big
 * enough to read from across a room, like a menu board.
 */
export function Lineup({ products }: { products: Product[] }) {
  const area = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 180, damping: 22, mass: 0.6 });

  const onMove = (e: React.PointerEvent) => {
    const r = area.current?.getBoundingClientRect();
    if (!r) return;
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  return (
    <section id="lineup" aria-labelledby="lineup-title" className="theme-light relative z-20 bg-ink px-5 py-24 md:px-10 md:py-40">
      <header className="mb-14 grid gap-6 md:mb-20 md:grid-cols-12">
        <p className="type-annot text-fire md:col-span-3">Nº 002 · The line-up</p>
        <h2 id="lineup-title" className="type-display text-[15vw] text-cream md:col-span-9 md:text-[8vw]">
          Four we&apos;d put
          <br />
          our name on.
        </h2>
      </header>

      <div ref={area} onPointerMove={onMove} onPointerLeave={() => setActive(null)} className="relative">
        <ol className="border-t border-cream/15">
          {products.map((p, i) => (
            <li
              key={p.id}
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
              className="group relative grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 border-b border-cream/15 py-7 md:grid-cols-12 md:py-9"
            >
              <span className="type-annot self-start pt-2 text-cream/40 md:col-span-1">{String(i + 1).padStart(2, "0")}</span>

              <div className="md:col-span-6">
                <Link href={`/menu/${p.slug}`} className="block">
                  <h3 className="type-display text-[13vw] text-cream transition-colors duration-300 group-hover:text-fire md:text-[6.2vw]">
                    {p.name}
                  </h3>
                </Link>
                {p.tags?.length ? (
                  <p className="type-annot mt-2 text-fire/80">{p.tags.join(" · ")}</p>
                ) : null}
              </div>

              {/* Touch screens and tablets get the photo inline */}
              <div className="col-span-2 -my-2 w-full md:col-span-12 md:row-start-2 lg:hidden">
                <ProductImage product={p} sizes="(min-width:768px) 90vw, 100vw" className="aspect-[4/3] w-full rounded-2xl sm:aspect-[16/9]" />
              </div>

              <p className="col-span-2 max-w-sm text-cream/70 md:col-span-5 md:col-start-8 lg:col-span-3">{p.tagline}</p>

              <div className="col-span-2 flex items-center justify-between gap-4 md:col-span-12 lg:col-span-2 lg:flex-col lg:items-end">
                <span className="type-display text-4xl text-cream">{formatPrice(p.priceCents)}</span>
                <div className="flex items-center gap-2">
                  <AddToCart product={p} label="Add" />
                  <Link
                    href={`/menu/${p.slug}`}
                    aria-label={`${p.name} details`}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-fire hover:text-fire"
                  >
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* Cursor-following photo (desktop) */}
        <motion.div
          style={{ x: sx, y: sy }}
          className="pointer-events-none absolute left-0 top-0 z-10 hidden lg:block"
          aria-hidden="true"
        >
          <AnimatePresence mode="popLayout">
            {active !== null && (
              <motion.div
                key={products[active].id}
                initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: 6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="-translate-x-1/2 -translate-y-1/2"
              >
                <ProductImage product={products[active]} sizes="340px" className="h-[21rem] w-[17rem] rounded-2xl shadow-[0_40px_70px_-20px_rgba(60,20,0,0.55)] ring-4 ring-[#fff4e3]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="mt-12 flex justify-end">
        <Link href="/menu" className="type-annot inline-flex items-center gap-2 text-cream/70 hover:text-fire">
          Full menu: burgers, fries, shakes <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
