"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import type { ActionResult } from "@/components/admin/ActionForm";

const Status = z.enum(["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"]);

export async function setOrderStatus(orderId: string, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff();
  const parsed = Status.safeParse(form.get("status"));
  if (!parsed.success) return { error: "Pick a status." };
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };
  if (parsed.data === "OUT_FOR_DELIVERY" && order.fulfillment !== "delivery") return { error: "Pickup orders don't go out for delivery." };
  await db.order.update({ where: { id: orderId }, data: { status: parsed.data } });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: "Status updated" };
}

/**
 * Staff record money they took in person (cash, card at the window).
 * Online payments can only be confirmed by the payment gateway, never by hand.
 */
export async function markPaidInPerson(orderId: string): Promise<ActionResult> {
  const s = await requireStaff();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };
  if (order.paymentMethod === "online") return { error: "Online payments are confirmed by the gateway, not by hand." };
  if (order.paymentStatus === "PAID") return { ok: true, message: "Already paid" };
  await db.$transaction([
    db.payment.create({
      data: {
        orderId,
        provider: order.paymentMethod === "cash" ? "cash" : "card-terminal",
        mode: "in_person",
        amountCents: order.totalCents,
        status: "PAID",
        raw: { recordedBy: s.email, at: new Date().toISOString() },
      },
    }),
    db.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID" } }),
  ]);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Marked as paid" };
}
