"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product/ProductImage";
import { AddToCart } from "@/components/product/AddToCart";

/**
 * Once the burger has been taken apart and rebuilt, appetite is at its peak.
 * This bar keeps the shortest path to eating it one tap away for the rest
 * of the page, then steps aside at the footer, which has its own calls to action.
 */
export function HungryBar({ product }: { product: Product }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const footer = document.getElementById("visit");
    let footerVisible = false;
    const update = () => setShow(window.scrollY > window.innerHeight * 1.2 && !footerVisible);
    const io = new IntersectionObserver(([e]) => {
      footerVisible = e.isIntersecting;
      update();
    });
    if (footer) io.observe(footer);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);

  if (!product.available) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          aria-label="Quick order"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed inset-x-3 bottom-3 z-[56] flex items-center gap-3 rounded-full bg-ink/[0.97] py-2 pl-2 pr-2 text-cream shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] ring-1 ring-cream/10 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:pr-2"
        >
          <Link href={`/menu/${product.slug}`} className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_60%,#ff9a3c,#c8330f)]">
              <ProductImage product={product} sizes="48px" className="h-11 w-11" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="type-annot block text-mustard">Hungry yet?</span>
              <span className="block truncate text-sm font-semibold">
                {product.name} · {formatPrice(product.priceCents)}
              </span>
            </span>
          </Link>
          <AddToCart product={product} label="Add" className="ml-auto shrink-0 !bg-mustard !text-[#170b06] hover:!bg-cream" />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
