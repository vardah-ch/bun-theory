"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Category, Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product/ProductImage";
import { AddToCart } from "@/components/product/AddToCart";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function MenuBrowser({ categories, products }: { categories: Category[]; products: Product[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const active = params.get("c");
  const q = useDeferredValue(query);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const groups = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const match = (p: Product) =>
      terms.every((t) => norm(`${p.name} ${p.tagline} ${p.description} ${(p.tags ?? []).join(" ")}`).includes(t));
    return categories
      .filter((c) => !active || c.slug === active)
      .map((c) => ({ category: c, items: products.filter((p) => p.category === c.slug && match(p)) }))
      .filter((g) => g.items.length > 0);
  }, [categories, products, active, q]);

  const count = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mt-14 md:mt-20">
      {/* Controls: sticky under the nav, category rail scrolls sideways on phones */}
      <div className="sticky top-[6.4rem] z-30 -mx-5 border-y border-cream/10 bg-ink/[0.97] px-5 py-3 md:top-20 md:-mx-10 md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Categories" className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0 [scrollbar-width:none]">
            <ul className="flex gap-2 whitespace-nowrap">
              <li>
                <button
                  type="button"
                  onClick={() => setParam("c", null)}
                  aria-pressed={!active}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${!active ? "border-fire bg-fire text-ink" : "border-cream/15 text-cream/75 hover:border-cream/50"}`}
                >
                  All
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => setParam("c", active === c.slug ? null : c.slug)}
                    aria-pressed={active === c.slug}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${active === c.slug ? "border-fire bg-fire text-ink" : "border-cream/15 text-cream/75 hover:border-cream/50"}`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <label className="relative flex items-center md:w-72">
            <span className="sr-only">Search the menu</span>
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-cream/40" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => setParam("q", query.trim() || null)}
              placeholder="Search: spicy, cheese, shake…"
              className="w-full rounded-full border border-cream/15 bg-transparent py-2.5 pl-10 pr-9 text-sm text-cream placeholder:text-cream/35 focus:border-fire focus:outline-none"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); setParam("q", null); }} className="absolute right-3 text-cream/50 hover:text-cream">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </label>
        </div>
      </div>

      <p className="type-annot mt-6 text-cream/40" role="status">
        {count} {count === 1 ? "item" : "items"}
        {q ? ` matching “${q}”` : ""}
      </p>

      {groups.length === 0 && (
        <div className="py-24 text-center">
          <p className="type-display text-5xl text-cream">Nothing on the grill for that.</p>
          <p className="mt-3 text-cream/60">Try another word, or <button className="text-fire underline-offset-4 hover:underline" onClick={() => { setQuery(""); setParam("q", null); setParam("c", null); }}>show everything</button>.</p>
        </div>
      )}

      {groups.map(({ category, items }) => (
        <section key={category.slug} aria-labelledby={`cat-${category.slug}`} className="mt-16 md:mt-24">
          <div className="flex flex-col justify-between gap-2 border-b border-cream/15 pb-4 md:flex-row md:items-end">
            <h2 id={`cat-${category.slug}`} className="type-display text-5xl text-cream md:text-7xl">{category.name}</h2>
            <p className="text-cream/55">{category.blurb}</p>
          </div>
          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => (
              <li key={p.id} className="group flex flex-col">
                <Link href={`/menu/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-2xl bg-[#1c0f08] shadow-[0_24px_48px_-24px_rgba(60,20,0,0.55)]">
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-20 bg-gradient-to-b from-black/45 to-transparent" />
                  <span className="type-annot absolute left-4 top-4 z-10 text-[#fff4e3]/80">
                    {category.slug.slice(0, 2).toUpperCase()}-{String(i + 1).padStart(2, "0")}
                  </span>
                  {p.tags?.length ? (
                    <span className="type-annot absolute right-4 top-4 z-10 rounded-full bg-ketchup px-2.5 py-1 !tracking-[0.1em] text-[#fff4e3]">{p.tags[0]}</span>
                  ) : null}
                  <ProductImage
                    product={p}
                    sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    className={`h-full w-full transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.06] ${p.available ? "" : "opacity-40 grayscale"}`}
                  />
                </Link>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/menu/${p.slug}`}>
                      <h3 className="type-display text-3xl text-cream transition-colors group-hover:text-fire">{p.name}</h3>
                    </Link>
                    <p className="mt-1 text-sm leading-snug text-cream/60">{p.tagline}</p>
                  </div>
                  <span className="type-display shrink-0 text-2xl text-cream">{formatPrice(p.priceCents)}</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <AddToCart product={p} label="Add" variant="ghost" />
                  {p.optionGroups?.length ? (
                    <Link href={`/menu/${p.slug}`} className="type-annot text-cream/55 hover:text-fire">Customise →</Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
