import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

// Stripe → us: the only place a live online payment becomes PAID.
// Verifies Stripe's signature (Stripe-Signature: t=…,v1=…) against
// STRIPE_WEBHOOK_SECRET before trusting anything in the body.
// Point a Stripe webhook at /api/webhooks/stripe for checkout.session.completed
// and checkout.session.expired.

const TOLERANCE_SECONDS = 300;

function verify(payload: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = Number(parts.t);
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const payload = await req.text();
  if (!verify(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as {
    type: string;
    data: { object: { id: string; payment_status?: string; amount_total?: number; metadata?: { orderId?: string } } };
  };
  const session = event.data.object;
  const payment = await db.payment.findFirst({ where: { provider: "stripe", providerRef: session.id }, include: { order: true } });
  if (!payment) return NextResponse.json({ received: true, note: "unknown session" });

  if (event.type === "checkout.session.completed" && session.payment_status === "paid") {
    if (session.amount_total !== payment.amountCents) {
      // Never mark paid if the amount doesn't match what the order costs.
      await db.notification.create({ data: { kind: "payment", message: `Payment amount mismatch on order #${payment.order.number}`, link: `/admin/orders/${payment.orderId}` } });
      return NextResponse.json({ received: true, note: "amount mismatch" });
    }
    await db.$transaction([
      db.payment.update({ where: { id: payment.id }, data: { status: "PAID", raw: event as object } }),
      db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "PAID", status: payment.order.status === "PENDING" ? "CONFIRMED" : payment.order.status } }),
    ]);
  } else if (event.type === "checkout.session.expired") {
    await db.$transaction([
      db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", raw: event as object } }),
      db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "FAILED" } }),
    ]);
  }
  return NextResponse.json({ received: true });
}
