import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { db } from "@/lib/server/db";
import { formatPrice } from "@/lib/format";
import { StatusRefresher } from "./StatusRefresher";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"] as const;
const LABEL: Record<string, string> = {
  PENDING: "Received",
  CONFIRMED: "Confirmed",
  PREPARING: "On the grill",
  READY: "Ready",
  OUT_FOR_DELIVERY: "On its way",
  COMPLETED: "Done",
  CANCELLED: "Cancelled",
};
const PAYMENT: Record<string, string> = {
  UNPAID: "To pay on collection or delivery",
  PENDING: "Payment not completed yet",
  PAID: "Paid",
  FAILED: "Payment failed: nothing was charged",
  REFUNDED: "Refunded",
};

async function OrderView({ params, searchParams }: PageProps<"/order/[number]">) {
  const [{ number }, sp] = await Promise.all([params, searchParams]);
  const token = typeof sp.t === "string" ? sp.t : "";
  const n = Number(number);
  if (!Number.isInteger(n) || !token) notFound();
  const order = await db.order.findUnique({
    where: { number: n },
    include: { items: { include: { customizations: true } }, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order || order.publicToken !== token) notFound();

  const steps = STEPS.filter((s) => s !== "OUT_FOR_DELIVERY" || order.fulfillment === "delivery");
  const current = steps.indexOf(order.status as (typeof STEPS)[number]);
  const lastPayment = order.payments[0];
  const testMode = lastPayment?.mode === "test";
  const awaitingOnline = order.paymentMethod === "online" && (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED");
  const live = !["COMPLETED", "CANCELLED"].includes(order.status);

  return (
    <div className="mx-auto max-w-4xl">
      {live && <StatusRefresher />}
      <p className="type-annot text-fire">Order Nº {order.number}</p>
      <h1 className="type-display mt-4 text-[15vw] text-cream md:text-8xl">
        {order.status === "CANCELLED" ? "Order cancelled." : awaitingOnline ? "Almost done." : "We've got it."}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-cream/70">
        {order.status === "CANCELLED"
          ? "This order was cancelled. If that's a surprise, call us."
          : awaitingOnline
            ? "Your order is saved, but the payment hasn't gone through. Finish paying below, or call us to switch to cash."
            : order.fulfillment === "delivery"
              ? "It's on our screen in the kitchen. This page updates by itself."
              : "It's on our screen in the kitchen. We'll have it at the pickup window under your name."}
      </p>

      {order.status !== "CANCELLED" && (
        <ol className="mt-12 grid gap-2 md:grid-flow-col md:auto-cols-fr" aria-label="Order progress">
          {steps.map((s, i) => (
            <li key={s} className={`border-t-2 pt-3 ${i <= current ? "border-fire" : "border-cream/15"}`} aria-current={i === current ? "step" : undefined}>
              <p className={`type-annot ${i <= current ? "text-fire" : "text-cream/35"}`}>{String(i + 1).padStart(2, "0")}</p>
              <p className={`type-display mt-1 text-2xl ${i <= current ? "text-cream" : "text-cream/35"}`}>{LABEL[s]}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <section aria-labelledby="pay-title" className="rounded-2xl border border-cream/12 p-6">
          <h2 id="pay-title" className="type-annot text-cream/50">Payment</h2>
          <p className="type-display mt-2 text-3xl text-cream">{PAYMENT[order.paymentStatus]}</p>
          {testMode && <p className="type-annot mt-2 text-fire">Test mode: no real money moved</p>}
          {awaitingOnline && lastPayment?.mode === "test" && (
            <Link href={`/pay/test/${lastPayment.id}?t=${order.publicToken}`} className="mt-4 inline-block rounded-full bg-fire px-5 py-3 text-sm font-semibold uppercase text-ink">
              Complete payment
            </Link>
          )}
          <p className="mt-4 text-sm text-cream/55">
            {order.fulfillment === "delivery" ? `Delivering to: ${order.address}` : "Pickup at the window"}
          </p>
        </section>

        <section aria-labelledby="items-title" className="rounded-2xl border border-cream/12 p-6">
          <h2 id="items-title" className="type-annot text-cream/50">Receipt</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4">
                <span className="text-cream/80">
                  {i.quantity}× {i.name}
                  {i.customizations.length > 0 && <span className="block text-cream/45">{i.customizations.map((c) => c.label).join(", ")}</span>}
                </span>
                <span className="tabular-nums">{formatPrice(i.unitPriceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-dashed border-cream/15 pt-3 text-sm">
            <div className="flex justify-between text-cream/60"><dt>Subtotal</dt><dd>{formatPrice(order.subtotalCents)}</dd></div>
            {order.discountCents > 0 && <div className="flex justify-between text-fire"><dt>Discount {order.couponCode}</dt><dd>−{formatPrice(order.discountCents)}</dd></div>}
            {order.deliveryFeeCents > 0 && <div className="flex justify-between text-cream/60"><dt>Delivery</dt><dd>{formatPrice(order.deliveryFeeCents)}</dd></div>}
            {order.taxCents > 0 && <div className="flex justify-between text-cream/60"><dt>Tax</dt><dd>{formatPrice(order.taxCents)}</dd></div>}
            <div className="flex justify-between pt-2 text-cream"><dt className="font-semibold uppercase">Total</dt><dd className="type-display text-3xl">{formatPrice(order.totalCents)}</dd></div>
          </dl>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/menu" className="rounded-full border border-cream/25 px-6 py-3.5 text-sm font-semibold uppercase text-cream hover:border-cream">Back to the menu</Link>
        <Link href="/orders" className="type-annot self-center px-2 text-cream/55 hover:text-fire">My orders</Link>
      </div>
    </div>
  );
}

export default function OrderPage(props: PageProps<"/order/[number]">) {
  return (
    <div className="theme-light min-h-dvh bg-ink">
      <Nav />
      <main className="relative z-20 min-h-dvh bg-ink px-5 pb-24 pt-36 md:px-10 md:pt-40">
        <Suspense fallback={<p className="type-annot text-cream/40">Finding your order…</p>}>
          <OrderView {...props} />
        </Suspense>
      </main>
    </div>
  );
}
