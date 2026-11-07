"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { useCart, unitPrice } from "@/lib/cart/store";
import { useCheckoutPrefs } from "@/lib/cart/checkout-prefs";
import { formatPrice } from "@/lib/format";
import { quote, type Coupon, type DeliverySettings } from "@/lib/pricing";
import { ProductImage } from "@/components/product/ProductImage";
import { AddToCart } from "@/components/product/AddToCart";
import type { Product } from "@/lib/catalog/types";

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setH(true);
  }, []);
  return h;
}

/** Looks a coupon up on the server; codes and their rules never ship to the browser. */
export function useCoupon(code: string) {
  const [state, setState] = useState<{ coupon: Coupon | null; loading: boolean; checked: string }>({ coupon: null, loading: false, checked: "" });
  useEffect(() => {
    const c = code.trim().toUpperCase();
    if (!c) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ coupon: null, loading: false, checked: "" });
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, loading: true }));
    fetch(`/api/coupons/${encodeURIComponent(c)}`)
      .then((r) => (r.ok ? r.json() : { coupon: null }))
      .then((d: { coupon: Coupon | null }) => !cancelled && setState({ coupon: d.coupon, loading: false, checked: c }))
      .catch(() => !cancelled && setState({ coupon: null, loading: false, checked: c }));
    return () => {
      cancelled = true;
    };
  }, [code]);
  return state;
}

export function CartView({ delivery, taxRate, addons = [] }: { delivery: DeliverySettings & { etaMinutes: [number, number] }; taxRate: number; addons?: Product[] }) {
  const { items, setQuantity, remove } = useCart();
  const { fulfillment, setFulfillment, couponCode, setCoupon } = useCheckoutPrefs();
  const [draft, setDraft] = useState("");
  const { coupon, loading, checked } = useCoupon(couponCode);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(couponCode);
  }, [couponCode]);

  const subtotal = items.reduce((s, i) => s + unitPrice(i) * i.quantity, 0);
  const q = quote({ subtotalCents: subtotal, fulfillment, delivery, taxRate, coupon, couponGiven: Boolean(checked) });
  const extras = addons.filter((a) => !items.some((i) => i.slug === a.slug)).slice(0, 3);
  // Free-delivery progress: measured on what the delivery fee is actually based on (after discount).
  const towardFree = Math.max(0, q.subtotalCents - q.discountCents);
  const freeLeft = delivery.freeOverCents - towardFree;

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-start justify-center">
        <p className="type-annot text-fire">Your order</p>
        <h1 className="type-display mt-4 text-[17vw] text-cream md:text-[8vw]">Nothing in the bag. Yet.</h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/menu" className="rounded-full bg-fire px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-ink hover:bg-cream">See the menu</Link>
          <Link href="/build" className="rounded-full border border-cream/25 px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-cream hover:border-cream">Build one</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
      <section className="min-w-0 lg:col-span-7" aria-labelledby="bag-title">
        <p className="type-annot text-fire">Your order</p>
        <h1 id="bag-title" className="type-display mt-4 text-7xl text-cream md:text-8xl">The bag.</h1>

        <ul className="mt-10 border-t border-cream/15">
          {items.map((i) => {
            const editHref = i.build ? `/build?edit=${i.lineId}` : `/menu/${i.slug}?edit=${i.lineId}`;
            const visible = i.options.filter((o) => !(i.build && o.priceCents === 0 && o.group === "Bun"));
            return (
              <li key={i.lineId} className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-cream/15 py-6 md:grid-cols-[7rem_1fr_auto] md:gap-6">
                <div className="aspect-square overflow-hidden rounded-xl bg-[radial-gradient(60%_55%_at_50%_60%,#ffd98a_0%,#f6b25a_80%)]">
                  <ProductImage product={{ slug: i.build ? "the-classic" : i.slug, name: i.name }} sizes="112px" className="h-full w-full" />
                </div>
                <div className="min-w-0">
                  <h2 className="type-display text-3xl text-cream">{i.name}</h2>
                  {visible.length > 0 && (
                    <p className="mt-1 text-sm leading-snug text-cream/55">
                      {visible.map((o) => o.label + (o.priceCents ? ` (+${formatPrice(o.priceCents)})` : "")).join(" · ")}
                    </p>
                  )}
                  {i.note && <p className="mt-1 text-sm italic text-cream/45">“{i.note}”</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-full border border-cream/20">
                      <button type="button" aria-label={`One fewer ${i.name}`} onClick={() => setQuantity(i.lineId, i.quantity - 1)} className="flex h-9 w-9 items-center justify-center text-cream/75 hover:text-fire">
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums" aria-label={`Quantity ${i.quantity}`}>{i.quantity}</span>
                      <button type="button" aria-label={`One more ${i.name}`} onClick={() => setQuantity(i.lineId, i.quantity + 1)} disabled={i.quantity >= 20} className="flex h-9 w-9 items-center justify-center text-cream/75 hover:text-fire disabled:opacity-30">
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <Link href={editHref} className="type-annot inline-flex items-center gap-1.5 text-cream/55 hover:text-fire">
                      <Pencil className="h-3 w-3" aria-hidden="true" /> Edit
                    </Link>
                    <button type="button" onClick={() => remove(i.lineId)} className="type-annot inline-flex items-center gap-1.5 text-cream/55 hover:text-fire">
                      <Trash2 className="h-3 w-3" aria-hidden="true" /> Remove
                    </button>
                  </div>
                </div>
                <p className="type-display col-start-2 text-2xl text-cream md:col-start-3 md:text-right">{formatPrice(unitPrice(i) * i.quantity)}</p>
              </li>
            );
          })}
        </ul>
        {extras.length > 0 && (
          <div className="mt-10">
            <h2 className="type-annot text-cream/60">Goes well with it</h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {extras.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-char p-3 sm:flex-col sm:items-start">
                  <ProductImage product={a} sizes="96px" className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
                  <div className="min-w-0 flex-1">
                    <p className="type-display truncate text-2xl text-cream">{a.name}</p>
                    <p className="text-sm text-cream/60">+{formatPrice(a.priceCents)}</p>
                  </div>
                  <AddToCart product={a} label="Add" className="shrink-0 !px-4 !py-2" />
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link href="/menu" className="type-annot mt-6 inline-block text-cream/55 hover:text-fire">+ Add something else</Link>
      </section>

      <aside className="min-w-0 lg:col-span-5" aria-labelledby="summary-title">
        <div className="sticky top-28 rounded-2xl border border-cream/12 bg-char/60 p-6 md:p-8">
          <h2 id="summary-title" className="type-display text-4xl text-cream">Summary</h2>

          <div className="mt-6 grid grid-cols-2 rounded-full border border-cream/15 p-1" role="radiogroup" aria-label="Delivery or pickup">
            {(["delivery", "pickup"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={fulfillment === f}
                onClick={() => setFulfillment(f)}
                className={`rounded-full py-2.5 text-sm font-semibold capitalize transition-colors ${fulfillment === f ? "bg-cream text-ink" : "text-cream/70 hover:text-cream"}`}
              >
                {f}
              </button>
            ))}
          </div>
          {fulfillment === "delivery" && delivery.freeOverCents > 0 && (
            <div className="mt-5" aria-live="polite">
              <p className="text-sm text-cream/80">
                {freeLeft > 0 ? (
                  <>Add <strong className="text-fire">{formatPrice(freeLeft)}</strong> more for free delivery.</>
                ) : (
                  <strong className="text-fire">Delivery&apos;s on us.</strong>
                )}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream/10" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-mustard to-fire transition-[width] duration-700 [transition-timing-function:var(--ease-out-expo)]"
                  style={{ width: `${Math.min(100, (towardFree / delivery.freeOverCents) * 100)}%` }}
                />
              </div>
            </div>
          )}
          <p className="type-annot mt-3 text-cream/45">
            {fulfillment === "delivery"
              ? `${delivery.etaMinutes[0]}–${delivery.etaMinutes[1]} min · free over ${formatPrice(delivery.freeOverCents)}`
              : "Ready in about 15 min at the pickup window"}
          </p>

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              setCoupon(draft.trim().toUpperCase());
            }}
          >
            <label htmlFor="coupon" className="type-annot text-cream/50">Promo code</label>
            <div className="mt-2 flex gap-2">
              <input
                id="coupon"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. FIRSTBITE"
                autoCapitalize="characters"
                className="min-w-0 flex-1 rounded-full border border-cream/15 bg-transparent px-4 py-2.5 uppercase text-cream placeholder:normal-case placeholder:text-cream/30 focus:border-fire focus:outline-none"
              />
              <button type="submit" className="rounded-full border border-cream/25 px-5 text-sm font-semibold uppercase text-cream hover:border-fire">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Checking" /> : "Apply"}
              </button>
            </div>
            <p role="status" className={`mt-2 text-sm ${q.couponError ? "text-fire" : "text-cream/60"}`}>
              {checked && !loading ? (q.couponError ?? `${checked} applied.`) : ""}
              {checked && !loading && (
                <button type="button" onClick={() => { setCoupon(""); setDraft(""); }} className="ml-2 text-cream/45 underline-offset-2 hover:underline">
                  Remove
                </button>
              )}
            </p>
          </form>

          <dl className="mt-6 space-y-2 border-t border-dashed border-cream/15 pt-5 text-sm">
            <div className="flex justify-between text-cream/70"><dt>Subtotal</dt><dd className="tabular-nums">{formatPrice(q.subtotalCents)}</dd></div>
            {q.discountCents > 0 && <div className="flex justify-between text-fire"><dt>Discount</dt><dd className="tabular-nums">−{formatPrice(q.discountCents)}</dd></div>}
            {fulfillment === "delivery" && (
              <div className="flex justify-between text-cream/70"><dt>Delivery</dt><dd className="tabular-nums">{q.deliveryFeeCents ? formatPrice(q.deliveryFeeCents) : "Free"}</dd></div>
            )}
            {q.taxCents > 0 && <div className="flex justify-between text-cream/70"><dt>Tax</dt><dd className="tabular-nums">{formatPrice(q.taxCents)}</dd></div>}
            <div className="flex items-baseline justify-between border-t border-cream/15 pt-3">
              <dt className="font-semibold uppercase tracking-wide text-cream">Total</dt>
              <dd className="type-display text-4xl tabular-nums text-cream">{formatPrice(q.totalCents)}</dd>
            </div>
          </dl>

          {q.blocker && <p className="mt-4 text-sm text-fire">{q.blocker}</p>}
          <Link
            href="/checkout"
            aria-disabled={Boolean(q.blocker)}
            onClick={(e) => q.blocker && e.preventDefault()}
            className={`mt-6 flex w-full items-center justify-center rounded-full py-4 text-sm font-semibold uppercase tracking-wide ${q.blocker ? "cursor-not-allowed bg-cream/15 text-cream/40" : "bg-fire text-ink hover:bg-cream"}`}
          >
            Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
