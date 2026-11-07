import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { toCoupon } from "@/lib/server/orders";

/** Look up one code. Only the rules needed to show the discount are returned; nothing to enumerate. */
export async function GET(_req: Request, ctx: RouteContext<"/api/coupons/[code]">) {
  const { code } = await ctx.params;
  const normalized = decodeURIComponent(code).trim().toUpperCase().slice(0, 40);
  const c = await db.coupon.findUnique({ where: { code: normalized } });
  if (!c) return NextResponse.json({ coupon: null });
  const coupon = toCoupon(c);
  if (c.maxUses != null && c.uses >= c.maxUses) coupon.active = false;
  return NextResponse.json({ coupon });
}
