import type { Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "@/components/product/AddToCart";
import { Reveal } from "./Reveal";

/** What each combo would cost à la carte, so the receipt can show the real saving. */
const CONTENTS: Record<string, { label: string; slug: string; qty?: number }[]> = {
  "classic-combo": [{ label: "The Classic", slug: "the-classic" }, { label: "Fries, regular", slug: "fries" }, { label: "Cola", slug: "cola" }],
  "double-date": [{ label: "Signature, from", slug: "greenhouse", qty: 2 }, { label: "Fries, regular", slug: "fries", qty: 2 }, { label: "Cola", slug: "cola", qty: 2 }],
  "smash-and-shake": [{ label: "Double Smash", slug: "double-smash" }, { label: "Fries, regular", slug: "fries" }, { label: "Thick shake", slug: "thick-shake" }],
};

/**
 * Deals printed as till receipts: line items, the would-be total struck
 * through, the real one underneath. Honest maths is the selling point.
 */
export function Combos({ combos, products }: { combos: Product[]; products: Product[] }) {
  const price = (slug: string) => products.find((p) => p.slug === slug)?.priceCents ?? 0;
  return (
    <section aria-labelledby="combos-title" className="relative z-20 bg-smoke bg-[radial-gradient(60%_50%_at_50%_40%,#5a2814_0%,transparent_70%)] px-5 py-24 md:px-10 md:py-40">
      <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="type-annot text-fire">Nº 005 · Combos</p>
          <h2 id="combos-title" className="type-display mt-6 text-[15vw] text-cream md:text-[7vw]">
            The maths
            <br />
            works out.
          </h2>
        </div>
        <p className="max-w-sm text-cream/80">
          No mystery bundles. Here&apos;s what&apos;s in each one, what it would cost separately, and what you actually pay.
        </p>
      </div>

      <ul className="mx-auto grid max-w-md gap-8 md:max-w-none md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {combos.map((c, i) => {
          const lines = CONTENTS[c.slug] ?? [];
          const separate = lines.reduce((s, l) => s + price(l.slug) * (l.qty ?? 1), 0);
          const saving = separate - c.priceCents;
          return (
            <Reveal as="li" key={c.id} delay={i * 0.1} className={i === 1 ? "lg:translate-y-10" : ""}>
              <article className="receipt relative bg-[#fff6e6] px-6 pb-8 pt-7 font-mono text-[13px] text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
                <header className="border-b border-dashed border-ink/40 pb-4 text-center">
                  <p className="type-display text-3xl tracking-tight">BUN THEORY</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ink/60">Ticket Nº {String(101 + i * 37).padStart(4, "0")}</p>
                </header>
                <h3 className="type-display mt-5 text-4xl">{c.name}</h3>
                <p className="mt-1 text-ink/65">{c.tagline}</p>
                <dl className="mt-5 space-y-1.5">
                  {lines.map((l) => (
                    <div key={l.label} className="flex justify-between gap-4">
                      <dt>{(l.qty ?? 1)}× {l.label}</dt>
                      <dd className="tabular-nums">{formatPrice(price(l.slug) * (l.qty ?? 1))}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 border-t border-dashed border-ink/40 pt-4">
                  <div className="flex justify-between text-ink/50">
                    <span>Separately</span>
                    <s className="tabular-nums">{formatPrice(separate)}</s>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-semibold uppercase">Combo</span>
                    <span className="type-display text-4xl tabular-nums">{formatPrice(c.priceCents)}</span>
                  </div>
                  {saving > 0 && <p className="mt-1 text-right text-fire-deep">You keep {formatPrice(saving)}</p>}
                </div>
                <div className="mt-6 flex justify-center">
                  <AddToCart product={c} label="Add combo" className="w-full justify-center !rounded-none" />
                </div>
              </article>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
