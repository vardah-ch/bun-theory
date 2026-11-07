// One pricing function for the whole app. The cart shows its result; the
// server recomputes it from the catalogue when an order is placed, so a
// tampered browser can never change what an order costs.

export type Fulfillment = "delivery" | "pickup";

export type Coupon = {
  code: string;
  kind: "percent" | "fixed";
  /** Percent (0–100) or cents, depending on kind. */
  value: number;
  minSubtotalCents?: number;
  /** Cap for percent coupons. */
  maxDiscountCents?: number;
  active: boolean;
  expiresAt?: string | null;
};

export type DeliverySettings = { feeCents: number; freeOverCents: number; minOrderCents: number };

export type Quote = {
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  /** Why a coupon didn't apply, if one was given. */
  couponError?: string;
  /** Why the order can't be placed yet (e.g. below delivery minimum). */
  blocker?: string;
};

export function couponProblem(c: Coupon | null | undefined, subtotalCents: number, now = new Date()): string | undefined {
  if (!c) return "We don't recognise that code.";
  if (!c.active) return "That code isn't active.";
  if (c.expiresAt && new Date(c.expiresAt) < now) return "That code has expired.";
  if (c.minSubtotalCents && subtotalCents < c.minSubtotalCents) {
    return `That code needs an order of at least $${(c.minSubtotalCents / 100).toFixed(2)}.`;
  }
  return undefined;
}

export function quote(args: {
  subtotalCents: number;
  fulfillment: Fulfillment;
  delivery: DeliverySettings;
  taxRate: number;
  coupon?: Coupon | null;
  couponGiven?: boolean;
}): Quote {
  const { subtotalCents, fulfillment, delivery, taxRate, coupon, couponGiven } = args;
  let discountCents = 0;
  let couponError: string | undefined;
  if (couponGiven) {
    couponError = couponProblem(coupon, subtotalCents);
    if (!couponError && coupon) {
      discountCents =
        coupon.kind === "percent"
          ? Math.round((subtotalCents * coupon.value) / 100)
          : coupon.value;
      if (coupon.maxDiscountCents) discountCents = Math.min(discountCents, coupon.maxDiscountCents);
      discountCents = Math.min(discountCents, subtotalCents);
    }
  }
  const afterDiscount = subtotalCents - discountCents;
  const deliveryFeeCents =
    fulfillment === "delivery" && afterDiscount > 0 && afterDiscount < delivery.freeOverCents ? delivery.feeCents : 0;
  const taxCents = Math.round(afterDiscount * taxRate);
  let blocker: string | undefined;
  if (subtotalCents === 0) blocker = "Your bag is empty.";
  else if (fulfillment === "delivery" && subtotalCents < delivery.minOrderCents) {
    blocker = `Delivery starts at $${(delivery.minOrderCents / 100).toFixed(2)}. Add a little more, or pick it up.`;
  }
  return {
    subtotalCents,
    discountCents,
    deliveryFeeCents,
    taxCents,
    totalCents: afterDiscount + deliveryFeeCents + taxCents,
    couponError,
    blocker,
  };
}
