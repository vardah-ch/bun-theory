// Seeds SAMPLE catalogue and settings. Idempotent: safe to re-run.
// Deliberately creates no orders, payments or customers, so the dashboard
// only ever counts real activity.
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORIES, PRODUCTS } from "../src/lib/catalog/sample";
import { BUILD_GROUPS } from "../src/lib/burger/options";
import { DEFAULT_CONTENT } from "../src/lib/content/defaults";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  for (const c of CATEGORIES) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: { slug: c.slug, name: c.name, blurb: c.blurb, sort: c.sort } });
  }

  for (const [i, p] of PRODUCTS.entries()) {
    const exists = await db.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue; // never overwrite edits made in the admin
    await db.product.create({
      data: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        categorySlug: p.category,
        tagline: p.tagline,
        description: p.description,
        priceCents: p.priceCents,
        available: p.available,
        featured: p.featured ?? false,
        tags: p.tags ?? [],
        layers: p.layers ?? undefined,
        artwork: p.artwork ?? null,
        imageUrl: p.imageUrl ?? null,
        calories: p.calories ?? null,
        sort: i,
        optionGroups: {
          create: (p.optionGroups ?? []).map((g, gi) => ({
            key: g.id,
            name: g.name,
            type: g.type,
            required: g.required ?? false,
            max: g.max ?? null,
            sort: gi,
            options: { create: g.options.map((o, oi) => ({ key: o.id, label: o.label, priceCents: o.priceCents, sort: oi })) },
          })),
        },
      },
    });
  }

  for (const g of BUILD_GROUPS) {
    for (const [i, o] of g.options.entries()) {
      await db.ingredient.upsert({
        where: { group_key: { group: g.id, key: o.id } },
        update: {},
        create: { group: g.id, key: o.id, label: o.label, note: o.note ?? null, priceCents: o.priceCents, sort: i },
      });
    }
  }

  const branch = (await db.branch.findFirst()) ??
    (await db.branch.create({
      data: {
        name: "BUN THEORY (sample branch)",
        addressLines: DEFAULT_CONTENT.business.addressLines,
        phone: DEFAULT_CONTENT.business.phone,
        hours: DEFAULT_CONTENT.business.hours,
      },
    }));

  if (!(await db.deliveryZone.findFirst())) {
    const d = DEFAULT_CONTENT.delivery;
    await db.deliveryZone.create({
      data: { name: "Local", postcodes: [], feeCents: d.feeCents, minOrderCents: d.minOrderCents, freeOverCents: d.freeOverCents, etaMin: d.etaMinutes[0], etaMax: d.etaMinutes[1], branchId: branch.id },
    });
  }

  const coupons = [
    { code: "FIRSTBITE", description: "SAMPLE: 15% off orders over $15 (max $8)", kind: "percent" as const, value: 15, minSubtotalCents: 1500, maxDiscountCents: 800 },
    { code: "LATESHIFT", description: "SAMPLE: $3 off orders over $20", kind: "fixed" as const, value: 300, minSubtotalCents: 2000 },
  ];
  for (const c of coupons) await db.coupon.upsert({ where: { code: c.code }, update: {}, create: c });

  await db.siteContent.upsert({ where: { id: "default" }, update: {}, create: { id: "default", data: DEFAULT_CONTENT } });

  const stock = [
    ["Beef blend (chuck/brisket)", "kg", 18, 5],
    ["Brioche buns", "pcs", 120, 30],
    ["Sesame buns", "pcs", 140, 30],
    ["Potato buns", "pcs", 90, 25],
    ["Aged cheddar", "slices", 300, 60],
    ["Chicken thighs", "kg", 9, 3],
  ] as const;
  for (const [name, unit, quantity, lowThreshold] of stock) {
    await db.inventoryItem.upsert({ where: { name }, update: {}, create: { name, unit, quantity, lowThreshold } });
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const existing = await db.user.findUnique({ where: { email } });
    if (!existing) {
      await db.user.create({ data: { email, name: "Owner", role: "OWNER", passwordHash: await bcrypt.hash(password, 12) } });
      console.log(`Admin account created: ${email}`);
    }
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set: no admin account created.");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
