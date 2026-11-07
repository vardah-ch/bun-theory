import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { getBuildGroups, getMenu, getSiteContent } from "@/lib/data/catalog";
import { BUILD_BASE_CENTS, CUSTOM_BUILD_PRODUCT, buildNumber, parseBuild, sanitizeBuild, selectedOptions } from "@/lib/burger/options";
import { quote, type Coupon } from "@/lib/pricing";
import type { OrderRequest } from "@/lib/validation/checkout";

export class OrderError extends Error {
  constructor(message: string, public status = 422) {
    super(message);
  }
}

type PricedItem = {
  productId: string | null;
  productSlug: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  note?: string;
  build?: object;
  customizations: { group: string; label: string; priceCents: number }[];
};

/**
 * Price every line from the database. The browser sends only what was chosen
 * (product ids, option ids, quantities); every price comes from here.
 */
async function priceItems(items: OrderRequest["items"]): Promise<PricedItem[]> {
  const [{ products }, groups] = await Promise.all([getMenu(), getBuildGroups()]);
  return items.map((item) => {
    if (item.productId === CUSTOM_BUILD_PRODUCT.id) {
      const parsed = parseBuild(item.build);
      if (!parsed) throw new OrderError("One of your custom burgers couldn't be read. Please rebuild it.");
      const clean = sanitizeBuild(parsed, groups);
      if (JSON.stringify(clean) !== JSON.stringify(parsed)) {
        throw new OrderError("An ingredient in your custom burger is no longer available. Please edit it in your bag.");
      }
      const opts = selectedOptions(clean, groups);
      return {
        productId: null,
        productSlug: CUSTOM_BUILD_PRODUCT.slug,
        name: `Build Nº ${String(buildNumber(clean)).padStart(6, "0")}`,
        unitPriceCents: BUILD_BASE_CENTS + opts.reduce((s, o) => s + o.option.priceCents, 0),
        quantity: item.quantity,
        note: item.note,
        build: clean,
        customizations: opts.map((o) => ({ group: o.group, label: o.option.label, priceCents: o.option.priceCents })),
      };
    }

    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new OrderError("Something in your bag is no longer on the menu.");
    if (!product.available) throw new OrderError(`${product.name} is sold out right now. Please remove it from your bag.`);

    const customizations: PricedItem["customizations"] = [];
    for (const g of product.optionGroups ?? []) {
      const picked = item.options.filter((o) => o.group === g.name);
      if (g.type === "single" && picked.length > 1) throw new OrderError(`Pick one ${g.name.toLowerCase()} for ${product.name}.`);
      if (g.type === "single" && g.required && picked.length === 0) throw new OrderError(`Choose a ${g.name.toLowerCase()} for ${product.name}.`);
      if (g.max && picked.length > g.max) throw new OrderError(`Too many ${g.name.toLowerCase()} for ${product.name}.`);
      for (const p of picked) {
        const o = g.options.find((x) => x.id === p.optionId);
        if (!o) throw new OrderError(`An option on ${product.name} is no longer available. Please edit it in your bag.`);
        customizations.push({ group: g.name, label: o.label, priceCents: o.priceCents });
      }
    }
    const known = new Set((product.optionGroups ?? []).map((g) => g.name));
    if (item.options.some((o) => !known.has(o.group))) throw new OrderError(`An option on ${product.name} is no longer available.`);

    return {
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      unitPriceCents: product.priceCents + customizations.reduce((s, c) => s + c.priceCents, 0),
      quantity: item.quantity,
      note: item.note,
      customizations,
    };
  });
}

async function findCoupon(code?: string): Promise<Coupon | null> {
  if (!code) return null;
  const c = await db.coupon.findUnique({ where: { code } });
  if (!c) return null;
  if (c.maxUses != null && c.uses >= c.maxUses) return { ...toCoupon(c), active: false };
  return toCoupon(c);
}

export function toCoupon(c: { code: string; kind: "percent" | "fixed"; value: number; minSubtotalCents: number | null; maxDiscountCents: number | null; active: boolean; expiresAt: Date | null }): Coupon {
  return {
    code: c.code,
    kind: c.kind,
    value: c.value,
    minSubtotalCents: c.minSubtotalCents ?? undefined,
    maxDiscountCents: c.maxDiscountCents ?? undefined,
    active: c.active,
    expiresAt: c.expiresAt?.toISOString() ?? null,
  };
}

export async function createOrder(req: OrderRequest) {
  const items = await priceItems(req.items);
  const content = await getSiteContent();
  const coupon = await findCoupon(req.couponCode);
  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const q = quote({
    subtotalCents,
    fulfillment: req.customer.fulfillment,
    delivery: content.delivery,
    taxRate: content.taxRate,
    coupon,
    couponGiven: Boolean(req.couponCode),
  });
  if (q.couponError) throw new OrderError(q.couponError);
  if (q.blocker) throw new OrderError(q.blocker);

  const c = req.customer;
  const publicToken = randomBytes(18).toString("base64url");

  const order = await db.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { phone: c.phone.replace(/[^\d+]/g, "") },
      update: { name: c.name, email: c.email || undefined },
      create: { name: c.name, phone: c.phone.replace(/[^\d+]/g, ""), email: c.email || null },
    });
    const branch = await tx.branch.findFirst({ where: { active: true } });
    const created = await tx.order.create({
      data: {
        publicToken,
        fulfillment: c.fulfillment,
        customerId: customer.id,
        branchId: branch?.id,
        name: c.name,
        phone: c.phone,
        email: c.email || null,
        address: c.fulfillment === "delivery" ? c.address : null,
        notes: c.notes || null,
        subtotalCents: q.subtotalCents,
        discountCents: q.discountCents,
        deliveryFeeCents: q.deliveryFeeCents,
        taxCents: q.taxCents,
        totalCents: q.totalCents,
        couponCode: coupon && !q.couponError ? coupon.code : null,
        paymentMethod: c.paymentMethod,
        paymentStatus: c.paymentMethod === "online" ? "PENDING" : "UNPAID",
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            productSlug: i.productSlug,
            name: i.name,
            unitPriceCents: i.unitPriceCents,
            quantity: i.quantity,
            note: i.note || null,
            build: i.build ?? undefined,
            customizations: { create: i.customizations },
          })),
        },
      },
    });
    if (created.couponCode) await tx.coupon.update({ where: { code: created.couponCode }, data: { uses: { increment: 1 } } });
    await tx.notification.create({
      data: { kind: "order", message: `New ${c.fulfillment} order #${created.number} · ${c.name}`, link: `/admin/orders/${created.id}` },
    });
    return created;
  });

  return order;
}
