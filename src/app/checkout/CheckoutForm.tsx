"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useCart, unitPrice } from "@/lib/cart/store";
import { useCheckoutPrefs } from "@/lib/cart/checkout-prefs";
import { rememberDetails, rememberOrder, savedDetails } from "@/lib/cart/history";
import { formatPrice } from "@/lib/format";
import { quote, type DeliverySettings } from "@/lib/pricing";
import { CustomerSchema, type CustomerInput } from "@/lib/validation/checkout";
import { useCoupon, useHydrated } from "@/app/cart/CartView";

type Errors = Partial<Record<keyof CustomerInput | "form", string>>;

const Field = ({ id, label, error, children, hint }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label htmlFor={id} className="type-annot text-cream/55">{label}</label>
    <div className="mt-2">{children}</div>
    {error ? (
      <p id={`${id}-error`} className="mt-1.5 text-sm text-fire">{error}</p>
    ) : hint ? (
      <p className="mt-1.5 text-sm text-cream/40">{hint}</p>
    ) : null}
  </div>
);

const input = (err?: string) =>
  `w-full rounded-xl border bg-transparent px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none ${err ? "border-fire" : "border-cream/15 focus:border-cream/60"}`;

export function CheckoutForm({
  delivery,
  taxRate,
  paymentMode,
}: {
  delivery: DeliverySettings & { etaMinutes: [number, number] };
  taxRate: number;
  paymentMode: "test" | "live";
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { items, clear } = useCart();
  const { fulfillment, setFulfillment, couponCode } = useCheckoutPrefs();
  const { coupon, checked } = useCoupon(couponCode);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "", paymentMethod: "cash" as CustomerInput["paymentMethod"] });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const d = savedDetails();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((f) => ({ ...f, name: d.name ?? "", phone: d.phone ?? "", email: d.email ?? "", address: d.address ?? "" }));
  }, []);
  // Card at the window only exists for pickup.
  useEffect(() => {
    if (fulfillment === "delivery" && form.paymentMethod === "card_on_pickup") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((f) => ({ ...f, paymentMethod: "cash" }));
    }
  }, [fulfillment, form.paymentMethod]);

  if (!hydrated) return <div className="min-h-[50vh]" />;
  if (items.length === 0 && !submitting) {
    return (
      <div className="flex min-h-[50vh] flex-col items-start justify-center">
        <h1 className="type-display text-7xl text-cream">Your bag is empty.</h1>
        <Link href="/menu" className="mt-6 rounded-full bg-fire px-6 py-3.5 text-sm font-semibold uppercase text-ink">See the menu</Link>
      </div>
    );
  }

  const subtotal = items.reduce((s, i) => s + unitPrice(i) * i.quantity, 0);
  const q = quote({ subtotalCents: subtotal, fulfillment, delivery, taxRate, coupon, couponGiven: Boolean(checked) });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k as keyof Errors]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = { ...form, fulfillment };
    const parsed = CustomerSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const i of parsed.error.issues) next[(i.path[0] as keyof Errors) ?? "form"] ??= i.message;
      setErrors(next);
      document.getElementById(String(parsed.error.issues[0]?.path[0]))?.focus();
      return;
    }
    if (q.blocker) {
      setErrors({ form: q.blocker });
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: parsed.data,
          couponCode: checked || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            options: i.options.map((o) => ({ group: o.group, optionId: o.optionId.includes(":") ? o.optionId.split(":")[1] : o.optionId })),
            build: i.build,
            note: i.note,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.field ? { [String(data.field).split(".").pop() as keyof Errors]: data.error } : { form: data.error });
        setSubmitting(false);
        return;
      }
      rememberDetails({ name: form.name, phone: form.phone, email: form.email, address: form.address });
      rememberOrder({ number: data.number, token: data.token, at: new Date().toISOString(), totalCents: data.totalCents });
      clear();
      router.push(data.redirectUrl);
    } catch {
      setErrors({ form: "We couldn't reach the kitchen. Check your connection and try again. Nothing has been charged." });
      setSubmitting(false);
    }
  };

  const methods: { id: CustomerInput["paymentMethod"]; label: string; hint: string; hidden?: boolean }[] = [
    { id: "cash", label: fulfillment === "delivery" ? "Cash on delivery" : "Cash at the window", hint: "Pay when you get it." },
    { id: "card_on_pickup", label: "Card at the window", hint: "Tap or chip when you collect.", hidden: fulfillment === "delivery" },
    {
      id: "online",
      label: paymentMode === "test" ? "Pay online (test mode)" : "Pay online by card",
      hint: paymentMode === "test" ? "Simulated payment for testing. No real card is charged." : "Secure card payment on the next page.",
    },
  ];

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-14 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
        <p className="type-annot text-fire">Checkout</p>
        <h1 className="type-display mt-4 text-7xl text-cream md:text-8xl">Almost there.</h1>

        <fieldset className="mt-10">
          <legend className="type-display text-3xl text-cream">How do you want it?</legend>
          <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Delivery or pickup">
            {(["delivery", "pickup"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={fulfillment === f}
                onClick={() => setFulfillment(f)}
                className={`rounded-xl border p-4 text-left transition-colors ${fulfillment === f ? "border-fire bg-fire/10" : "border-cream/15 hover:border-cream/40"}`}
              >
                <span className="type-display block text-2xl capitalize text-cream">{f}</span>
                <span className="text-sm text-cream/55">
                  {f === "delivery" ? `${delivery.etaMinutes[0]}–${delivery.etaMinutes[1]} min to your door` : "About 15 min, at the window"}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-10 grid gap-5 md:grid-cols-2">
          <legend className="type-display mb-4 text-3xl text-cream">Your details</legend>
          <Field id="name" label="Name" error={errors.name}>
            <input id="name" autoComplete="name" value={form.name} onChange={set("name")} className={input(errors.name)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
          </Field>
          <Field id="phone" label="Phone" error={errors.phone} hint="So the kitchen can call if something's up.">
            <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} className={input(errors.phone)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} />
          </Field>
          <div className="md:col-span-2">
            <Field id="email" label="Email (optional)" error={errors.email} hint="For your receipt.">
              <input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} className={input(errors.email)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />
            </Field>
          </div>
          {fulfillment === "delivery" && (
            <div className="md:col-span-2">
              <Field id="address" label="Delivery address" error={errors.address}>
                <textarea id="address" rows={2} autoComplete="street-address" value={form.address} onChange={set("address")} className={`${input(errors.address)} resize-none`} aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? "address-error" : undefined} />
              </Field>
            </div>
          )}
          <div className="md:col-span-2">
            <Field id="notes" label="Order notes (optional)" error={errors.notes} hint="Gate code, allergies, ring the bell twice…">
              <textarea id="notes" rows={2} value={form.notes} onChange={set("notes")} className={`${input(errors.notes)} resize-none`} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="mt-10">
          <legend className="type-display text-3xl text-cream">Payment</legend>
          <div className="mt-4 space-y-2" role="radiogroup" aria-label="Payment method">
            {methods.filter((m) => !m.hidden).map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={form.paymentMethod === m.id}
                onClick={() => setForm((f) => ({ ...f, paymentMethod: m.id }))}
                className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors ${form.paymentMethod === m.id ? "border-fire bg-fire/10" : "border-cream/15 hover:border-cream/40"}`}
              >
                <span>
                  <span className="block font-medium text-cream">{m.label}</span>
                  <span className="text-sm text-cream/55">{m.hint}</span>
                </span>
                <span className={`h-5 w-5 shrink-0 rounded-full border-2 ${form.paymentMethod === m.id ? "border-fire bg-fire" : "border-cream/30"}`} aria-hidden="true" />
              </button>
            ))}
          </div>
          {errors.paymentMethod && <p className="mt-2 text-sm text-fire">{errors.paymentMethod}</p>}
        </fieldset>
      </div>

      <aside className="min-w-0 lg:col-span-5">
        <div className="sticky top-28 rounded-2xl border border-cream/12 p-6 md:p-8">
          <h2 className="type-display text-4xl text-cream">Your order</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.lineId} className="flex justify-between gap-4">
                <span className="text-cream/80">
                  {i.quantity}× {i.name}
                  {i.options.length > 0 && <span className="block text-cream/45">{i.options.map((o) => o.label).join(", ")}</span>}
                </span>
                <span className="tabular-nums text-cream">{formatPrice(unitPrice(i) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-dashed border-cream/15 pt-4 text-sm">
            <div className="flex justify-between text-cream/70"><dt>Subtotal</dt><dd className="tabular-nums">{formatPrice(q.subtotalCents)}</dd></div>
            {q.discountCents > 0 && <div className="flex justify-between text-fire"><dt>Discount ({checked})</dt><dd className="tabular-nums">−{formatPrice(q.discountCents)}</dd></div>}
            {fulfillment === "delivery" && <div className="flex justify-between text-cream/70"><dt>Delivery</dt><dd className="tabular-nums">{q.deliveryFeeCents ? formatPrice(q.deliveryFeeCents) : "Free"}</dd></div>}
            {q.taxCents > 0 && <div className="flex justify-between text-cream/70"><dt>Tax</dt><dd className="tabular-nums">{formatPrice(q.taxCents)}</dd></div>}
            <div className="flex items-baseline justify-between border-t border-cream/15 pt-3">
              <dt className="font-semibold uppercase text-cream">Total</dt>
              <dd className="type-display text-4xl tabular-nums text-cream">{formatPrice(q.totalCents)}</dd>
            </div>
          </dl>
          {(errors.form || q.blocker) && (
            <p role="alert" className="mt-4 rounded-lg border border-fire/40 p-3 text-sm text-cream">{errors.form ?? q.blocker}</p>
          )}
          <button
            type="submit"
            disabled={submitting || Boolean(q.blocker)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-fire py-4 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:bg-cream/20 disabled:text-cream/50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Sending to the kitchen…" : form.paymentMethod === "online" ? `Continue to payment · ${formatPrice(q.totalCents)}` : `Place order · ${formatPrice(q.totalCents)}`}
          </button>
          <Link href="/cart" className="type-annot mt-4 block text-center text-cream/50 hover:text-fire">← Back to the bag</Link>
        </div>
      </aside>
    </form>
  );
}
