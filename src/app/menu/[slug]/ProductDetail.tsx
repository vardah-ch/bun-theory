"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import type { OptionGroup, Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { useCart, type CartOption } from "@/lib/cart/store";
import { ProductImage } from "@/components/product/ProductImage";
import { customiseLayers } from "@/lib/burger/layers";

const ProductScene = dynamic(() => import("@/components/three/ProductScene"), { ssr: false });

type Picks = Record<string, string[]>;

const defaults = (groups: OptionGroup[]): Picks =>
  Object.fromEntries(groups.map((g) => [g.id, g.type === "single" && g.required ? [g.options[0].id] : []]));

export function ProductDetail({ product, categoryName, related }: { product: Product; categoryName: string; related: Product[] }) {
  const groups = useMemo(() => product.optionGroups ?? [], [product.optionGroups]);
  const params = useSearchParams();
  const router = useRouter();
  const editId = params.get("edit");
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const update = useCart((s) => s.update);
  const editing = editId ? items.find((i) => i.lineId === editId && i.productId === product.id) : undefined;

  const [picks, setPicks] = useState<Picks>(() => defaults(groups));
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const [view3d, setView3d] = useState(true);
  const loaded = useRef(false);

  // Editing from the cart: restore that line's choices once the cart has loaded.
  useEffect(() => {
    if (loaded.current || !editing) return;
    const restored = defaults(groups);
    for (const o of editing.options) {
      const g = groups.find((x) => x.name === o.group);
      if (g) restored[g.id] = g.type === "single" ? [o.optionId] : [...(restored[g.id] ?? []), o.optionId];
    }
    setPicks(restored);
    setQty(editing.quantity);
    setNote(editing.note ?? "");
    loaded.current = true;
  }, [editing, groups]);

  const chosen: CartOption[] = groups.flatMap((g) =>
    (picks[g.id] ?? []).map((id) => {
      const o = g.options.find((x) => x.id === id)!;
      return { group: g.name, optionId: o.id, label: o.label, priceCents: o.priceCents };
    }),
  );
  const unit = product.priceCents + chosen.reduce((s, o) => s + o.priceCents, 0);
  const chosenKey = chosen.map((o) => o.optionId).join(",");
  const liveLayers = useMemo(
    () => (product.layers && product.category !== "combos" ? customiseLayers(product.layers, chosenKey.split(",")) : product.layers),
    [product.layers, product.category, chosenKey],
  );

  const pick = (g: OptionGroup, id: string) =>
    setPicks((p) => {
      const cur = p[g.id] ?? [];
      if (g.type === "single") return { ...p, [g.id]: g.required ? [id] : cur[0] === id ? [] : [id] };
      return { ...p, [g.id]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });

  const commit = () => {
    const line = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      basePriceCents: product.priceCents,
      quantity: qty,
      options: chosen,
      note: note.trim() || undefined,
    };
    if (editing) {
      update(editing.lineId, line);
      router.push("/cart");
      return;
    }
    add(line);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const has3d = Boolean(product.layers || product.artwork);

  return (
    <>
      <div className="grid md:grid-cols-12">
        {/* Showcase */}
        <div className="theme-glow relative h-[62dvh] bg-[radial-gradient(65%_60%_at_50%_56%,#ffa848_0%,#e8601e_42%,#9a2a0c_80%,#5a1606_100%)] md:sticky md:top-0 md:col-span-7 md:h-dvh">
          {has3d && view3d ? (
            <ProductScene product={{ ...product, layers: liveLayers }} interactive />
          ) : (
            <div className="flex h-full items-center justify-center p-10">
              <ProductImage product={product} sizes="60vw" priority className="max-h-full w-auto" />
            </div>
          )}
          <div className="absolute bottom-5 left-5 flex items-center gap-3 md:bottom-8 md:left-10">
            {has3d && (
              <button
                type="button"
                onClick={() => setView3d((v) => !v)}
                className="type-annot rounded-full border border-[#fff4e3]/40 bg-[#170b06]/25 px-3 py-2 text-[#fff4e3] backdrop-blur-sm hover:border-[#fff4e3]"
              >
                {view3d ? "Photo" : "3D view"}
              </button>
            )}
            {has3d && view3d && <span className="type-annot hidden text-[#fff4e3]/70 md:inline">Drag to turn · Scroll to zoom</span>}
          </div>
        </div>

        {/* Details */}
        <div className="px-5 pb-36 pt-10 md:col-span-5 md:px-10 md:pb-16 md:pt-32">
          <Link href={`/menu?c=${product.category}`} className="type-annot inline-flex items-center gap-1.5 text-cream/55 hover:text-fire">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {categoryName}
          </Link>
          <h1 className="type-display mt-5 text-6xl text-cream [overflow-wrap:anywhere] sm:text-7xl md:text-6xl lg:text-7xl xl:text-8xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="type-display text-4xl text-fire">{formatPrice(product.priceCents)}</span>
            {product.tags?.map((t) => (
              <span key={t} className="type-annot rounded-full border border-cream/15 px-2.5 py-1 text-cream/60">{t}</span>
            ))}
            {product.calories && <span className="type-annot text-cream/40">{product.calories} kcal</span>}
          </div>
          <p className="mt-6 text-lg leading-relaxed text-cream/75">{product.description}</p>

          {!product.available && (
            <p className="mt-6 rounded-xl border border-fire/40 p-4 text-cream/80">Sold out for today. It&apos;s back on the board tomorrow.</p>
          )}

          {groups.map((g) => (
            <fieldset key={g.id} className="mt-10">
              <legend className="flex w-full items-baseline justify-between border-b border-cream/15 pb-3">
                <span className="type-display text-3xl text-cream">{g.name}</span>
                <span className="type-annot text-cream/40">{g.type === "single" ? (g.required ? "Required" : "Optional") : "Pick any"}</span>
              </legend>
              <ul className="mt-3 divide-y divide-cream/10">
                {g.options.map((o) => {
                  const on = (picks[g.id] ?? []).includes(o.id);
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        role={g.type === "single" ? "radio" : "checkbox"}
                        aria-checked={on}
                        onClick={() => pick(g, o.id)}
                        className="flex w-full items-center justify-between gap-4 py-3.5 text-left"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-5 w-5 items-center justify-center border transition-colors ${g.type === "single" ? "rounded-full" : "rounded-md"} ${on ? "border-fire bg-fire text-ink" : "border-cream/30"}`}
                            aria-hidden="true"
                          >
                            {on && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className={on ? "text-cream" : "text-cream/80"}>{o.label}</span>
                        </span>
                        <span className="type-annot text-cream/50">{o.priceCents ? `+${formatPrice(o.priceCents)}` : ""}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ))}

          <label className="mt-10 block">
            <span className="type-display text-3xl text-cream">Note for the kitchen</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="Cut in half, sauce on the side…"
              className="mt-3 w-full resize-none rounded-xl border border-cream/15 bg-transparent p-3 text-cream placeholder:text-cream/30 focus:border-fire focus:outline-none"
            />
            <span className="type-annot text-cream/35">{note.length}/200</span>
          </label>

          {related.length > 0 && (
            <section className="mt-16" aria-labelledby="related-title">
              <h2 id="related-title" className="type-annot text-cream/50">Also from {categoryName}</h2>
              <ul className="mt-4 grid grid-cols-3 gap-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/menu/${r.slug}`} className="group block">
                      <ProductImage product={r} sizes="15vw" className="aspect-square w-full rounded-xl bg-cream/[0.03] transition-transform group-hover:-rotate-3" />
                      <p className="mt-2 text-sm text-cream/80 group-hover:text-fire">{r.name}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Order bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream/10 bg-ink/95 px-5 py-4 backdrop-blur md:left-auto md:w-[calc(5/12*100%)] md:px-5 lg:px-10">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="flex items-center rounded-full border border-cream/20">
            <button type="button" aria-label="One fewer" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center text-cream/80 hover:text-fire">
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-6 text-center tabular-nums" aria-label={`Quantity ${qty}`}>{qty}</span>
            <button type="button" aria-label="One more" onClick={() => setQty((q) => Math.min(20, q + 1))} className="flex h-11 w-11 items-center justify-center text-cream/80 hover:text-fire">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            disabled={!product.available}
            onClick={commit}
            className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full bg-fire px-5 py-3.5 text-ink lg:px-6 transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:bg-cream/20 disabled:text-cream/50"
          >
            <span className="truncate text-xs font-semibold uppercase tracking-wide sm:text-sm">
              {!product.available ? "Sold out" : added ? "Added to order" : editing ? "Save changes" : "Add to order"}
            </span>
            <span className="type-display text-2xl tabular-nums">{formatPrice(unit * qty)}</span>
          </button>
        </div>
        {added && (
          <p className="type-annot mt-2 text-right text-cream/60">
            In your bag. <Link href="/cart" className="text-fire hover:underline">View order →</Link>
          </p>
        )}
      </div>
    </>
  );
}
