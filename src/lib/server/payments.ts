import "server-only";
import { db } from "./db";

// Payment adapters. An order is only ever marked PAID by an adapter that has
// received confirmation from its gateway; nothing in the storefront can mark
// one paid by itself.
//
//   PAYMENT_MODE=test  → TestAdapter: a clearly labelled simulator. No money
//                        moves; payments are stored with mode "test".
//   PAYMENT_MODE=live  → StripeAdapter: integration-ready, needs
//                        STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET and a
//                        webhook route to confirm payments. Refuses to run
//                        without them.

export type StartPayment = { orderId: string; orderNumber: number; amountCents: number; publicToken: string; origin: string };
export type StartResult = { paymentId: string; redirectUrl: string };

export interface PaymentAdapter {
  readonly name: string;
  readonly mode: "test" | "live";
  start(input: StartPayment): Promise<StartResult>;
}

class TestAdapter implements PaymentAdapter {
  readonly name = "test-simulator";
  readonly mode = "test" as const;
  async start(input: StartPayment): Promise<StartResult> {
    const p = await db.payment.create({
      data: { orderId: input.orderId, provider: this.name, mode: this.mode, amountCents: input.amountCents, status: "PENDING" },
    });
    return { paymentId: p.id, redirectUrl: `/pay/test/${p.id}?t=${input.publicToken}` };
  }
}

class StripeAdapter implements PaymentAdapter {
  readonly name = "stripe";
  readonly mode = "live" as const;
  constructor(private secretKey: string) {}
  async start(input: StartPayment): Promise<StartResult> {
    // Stripe Checkout Session via the REST API (no SDK dependency).
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(input.amountCents),
      "line_items[0][price_data][product_data][name]": `BUN THEORY order #${input.orderNumber}`,
      "line_items[0][quantity]": "1",
      success_url: `${input.origin}/order/${input.orderNumber}?t=${input.publicToken}`,
      cancel_url: `${input.origin}/order/${input.orderNumber}?t=${input.publicToken}&cancelled=1`,
      "metadata[orderId]": input.orderId,
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error(`Stripe error ${res.status}`);
    const session = (await res.json()) as { id: string; url: string };
    const p = await db.payment.create({
      data: { orderId: input.orderId, provider: this.name, mode: this.mode, providerRef: session.id, amountCents: input.amountCents, status: "PENDING" },
    });
    // The order becomes PAID only when Stripe's webhook (checkout.session.completed) confirms it.
    return { paymentId: p.id, redirectUrl: session.url };
  }
}

export function paymentAdapter(): PaymentAdapter {
  const mode = process.env.PAYMENT_MODE ?? "test";
  if (mode === "live") {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("PAYMENT_MODE=live needs STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET. Online payment is unavailable.");
    }
    return new StripeAdapter(key);
  }
  return new TestAdapter();
}

/** Settle a test payment. Only valid for test-mode payments. */
export async function settleTestPayment(paymentId: string, outcome: "approve" | "decline") {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.mode !== "test") throw new Error("Not a test payment.");
  if (payment.status !== "PENDING") return payment;
  const status = outcome === "approve" ? "PAID" : "FAILED";
  return db.$transaction(async (tx) => {
    const p = await tx.payment.update({ where: { id: paymentId }, data: { status, raw: { simulated: true, outcome, at: new Date().toISOString() } } });
    await tx.order.update({
      where: { id: payment.orderId },
      data: outcome === "approve" ? { paymentStatus: "PAID", status: "CONFIRMED" } : { paymentStatus: "FAILED" },
    });
    return p;
  });
}
