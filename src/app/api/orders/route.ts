import { NextResponse } from "next/server";
import { OrderRequestSchema } from "@/lib/validation/checkout";
import { createOrder, OrderError } from "@/lib/server/orders";
import { paymentAdapter } from "@/lib/server/payments";
import { db } from "@/lib/server/db";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = OrderRequestSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Please check your details.", field: first?.path.join(".") }, { status: 422 });
  }

  // If online payment isn't configured, say so before an order is created.
  let adapter: ReturnType<typeof paymentAdapter> | null = null;
  if (parsed.data.customer.paymentMethod === "online") {
    try {
      adapter = paymentAdapter();
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Online payment is unavailable." }, { status: 503 });
    }
  }

  try {
    const order = await createOrder(parsed.data);
    let redirectUrl = `/order/${order.number}?t=${order.publicToken}`;
    if (adapter) {
      const origin = new URL(req.url).origin;
      const started = await adapter.start({
        orderId: order.id,
        orderNumber: order.number,
        amountCents: order.totalCents,
        publicToken: order.publicToken,
        origin,
      });
      redirectUrl = started.redirectUrl;
    }
    return NextResponse.json({ number: order.number, token: order.publicToken, totalCents: order.totalCents, redirectUrl }, { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Order failed", e);
    // If the order was saved but payment couldn't start, it stays visible to staff as "payment pending".
    return NextResponse.json({ error: "We couldn't place your order. Nothing has been charged. Please try again." }, { status: 500 });
  }
}

/** Order status for the customer's own link (requires the order's secret token). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const number = Number(url.searchParams.get("n"));
  const token = url.searchParams.get("t") ?? "";
  if (!Number.isInteger(number) || !token) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const order = await db.order.findUnique({
    where: { number },
    select: { number: true, publicToken: true, status: true, paymentStatus: true, totalCents: true, fulfillment: true, createdAt: true },
  });
  if (!order || order.publicToken !== token) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const safe = Object.fromEntries(Object.entries(order).filter(([key]) => key !== "publicToken"));
  return NextResponse.json(safe);
}
