"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCart, type CartOption } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/catalog/types";

/** Required single-choice groups default to their first option, so a one-tap add is always a valid order. */
export function defaultOptions(p: Pick<Product, "optionGroups">): CartOption[] {
  return (p.optionGroups ?? [])
    .filter((g) => g.type === "single" && g.required)
    .map((g) => ({ group: g.name, optionId: g.options[0].id, label: g.options[0].label, priceCents: g.options[0].priceCents }));
}

type Props = {
  product: Pick<Product, "id" | "slug" | "name" | "priceCents" | "available" | "optionGroups">;
  className?: string;
  label?: string;
  variant?: "solid" | "ghost";
};

export function AddToCart({ product, className = "", label, variant = "solid" }: Props) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!product.available) {
    return (
      <span className={`type-annot inline-flex items-center rounded-full border border-cream/15 px-4 py-2.5 text-cream/45 ${className}`}>
        Sold out today
      </span>
    );
  }

  const onClick = () => {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      basePriceCents: product.priceCents,
      quantity: 1,
      options: defaultOptions(product),
    });
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  const base =
    variant === "solid"
      ? "bg-fire text-ink hover:bg-cream"
      : "border border-cream/25 text-cream hover:border-fire hover:text-fire";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors duration-300 ${base} ${className}`}
      aria-live="polite"
    >
      {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
      {added ? "Added" : (label ?? `Add · ${formatPrice(product.priceCents)}`)}
    </button>
  );
}
