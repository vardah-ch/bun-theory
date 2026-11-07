import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/server/db";
import { settleTestPayment } from "@/lib/server/payments";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Test payment", robots: { index: false } };

/**
 * TEST MODE payment simulator. Lets you exercise the paid / failed paths of
 * checkout without a gateway. It is unmistakably labelled and can only settle
 * payments that were created in test mode.
 */
async function TestPayment({ params, searchParams }: PageProps<"/pay/test/[paymentId]">) {
  const [{ paymentId }, sp] = await Promise.all([params, searchParams]);
  const token = typeof sp.t === "string" ? sp.t : "";
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment || payment.mode !== "test" || payment.order.publicToken !== token) notFound();
  const back = `/order/${payment.order.number}?t=${token}`;
  if (payment.status !== "PENDING") redirect(back);

  async function settle(formData: FormData) {
    "use server";
    const outcome = formData.get("outcome") === "approve" ? "approve" : "decline";
    const p = await db.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
    if (!p || p.order.publicToken !== token) return;
    await settleTestPayment(paymentId, outcome);
    redirect(back);
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border-2 border-dashed border-fire p-8 text-center">
      <p className="type-annot rounded-full bg-fire px-3 py-1.5 text-ink">Test mode · no real payment</p>
      <h1 className="type-display mt-6 text-6xl text-cream">Payment simulator</h1>
      <p className="mt-3 text-cream/70">
        Order Nº {payment.order.number} · <span className="text-cream">{formatPrice(payment.amountCents)}</span>
      </p>
      <p className="mt-4 text-sm text-cream/55">
        This page stands in for a card gateway while the site runs with <code>PAYMENT_MODE=test</code>. Choose an outcome to see how
        the order behaves. No card details are collected and no money moves.
      </p>
      <form action={settle} className="mt-8 grid grid-cols-2 gap-3">
        <button name="outcome" value="decline" className="rounded-full border border-cream/25 py-3.5 text-sm font-semibold uppercase text-cream hover:border-cream">
          Simulate decline
        </button>
        <button name="outcome" value="approve" className="rounded-full bg-fire py-3.5 text-sm font-semibold uppercase text-ink hover:bg-cream">
          Simulate success
        </button>
      </form>
    </div>
  );
}

export default function TestPaymentPage(props: PageProps<"/pay/test/[paymentId]">) {
  return (
    <main className="relative z-20 flex min-h-dvh items-center justify-center bg-ink px-5">
      <Suspense fallback={null}>
        <TestPayment {...props} />
      </Suspense>
    </main>
  );
}
