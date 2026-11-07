"use server";

import bcrypt from "bcryptjs";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { getSiteContent, TAGS } from "@/lib/data/catalog";
import type { ActionResult } from "@/components/admin/ActionForm";
import { dollarsToCents } from "@/components/admin/ui";

// ── Coupons ─────────────────────────────────────────────────────────────

const CouponInput = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Codes are 3–30 letters, numbers, - or _."),
  description: z.string().trim().max(160),
  kind: z.enum(["percent", "fixed"]),
  value: z.number().int().positive("The discount must be more than zero."),
  minSubtotalCents: z.number().int().min(0).nullable(),
  maxDiscountCents: z.number().int().min(0).nullable(),
  maxUses: z.number().int().min(1).nullable(),
  expiresAt: z.date().nullable(),
  active: z.boolean(),
});

export async function saveCoupon(existing: string | null, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff("MANAGER");
  const kind = form.get("kind") === "fixed" ? "fixed" : "percent";
  const opt = (k: string, money = true) => {
    const v = String(form.get(k) ?? "").trim();
    return v === "" ? null : money ? dollarsToCents(v) : Number(v);
  };
  const exp = String(form.get("expiresAt") ?? "").trim();
  const parsed = CouponInput.safeParse({
    code: existing ?? form.get("code"),
    description: form.get("description") ?? "",
    kind,
    value: kind === "fixed" ? dollarsToCents(form.get("value")) : Number(form.get("value")),
    minSubtotalCents: opt("min"),
    maxDiscountCents: opt("max"),
    maxUses: opt("maxUses", false),
    expiresAt: exp ? new Date(`${exp}T23:59:59`) : null,
    active: form.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.kind === "percent" && parsed.data.value > 100) return { error: "A percentage can't be over 100." };
  const { code, ...data } = parsed.data;
  if (existing) await db.coupon.update({ where: { code }, data });
  else {
    if (await db.coupon.findUnique({ where: { code } })) return { error: "That code already exists." };
    await db.coupon.create({ data: { code, ...data } });
  }
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCoupon(code: string): Promise<ActionResult> {
  await requireStaff("MANAGER");
  await db.coupon.delete({ where: { code } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Deleted" };
}

// ── Website content & business settings ─────────────────────────────────

export async function saveContent(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff("MANAGER");
  const current = await getSiteContent();
  const s = (k: string, max = 300) => String(form.get(k) ?? "").trim().slice(0, max);
  const lines = (k: string) => s(k, 1000).split("\n").map((x) => x.trim()).filter(Boolean);

  const hours = lines("hours").map((l) => {
    const m = l.match(/^(.+?)\s*[|,]\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
    return m ? { days: m[1].trim(), open: m[2], close: m[3] } : null;
  });
  if (hours.some((h) => !h)) return { error: 'Write each opening-hours line like "Mon – Thu | 12:00-22:00".' };
  const socials = lines("socials").map((l) => {
    const [label, url] = l.split("|").map((x) => x.trim());
    return label && url && /^https?:\/\//.test(url) ? { label, url } : null;
  });
  if (socials.some((x) => !x)) return { error: 'Write each social link like "Instagram | https://instagram.com/…".' };
  const tax = Number(s("taxRate")) / 100;
  if (!(tax >= 0 && tax < 0.5)) return { error: "Tax rate should be between 0 and 50%." };
  const eta = [Number(s("etaMin")), Number(s("etaMax"))];
  if (!(eta[0] > 0 && eta[1] >= eta[0])) return { error: "Delivery time: the max can't be less than the min." };
  if (!s("lineBack") || !s("lineFront")) return { error: "Both hero lines need text." };

  const next = {
    ...current,
    hero: { lineBack: s("lineBack", 60), lineFront: s("lineFront", 60), sub: s("sub", 200) },
    finale: { headline: s("finaleHeadline", 60) || current.finale.headline, accent: s("finaleAccent", 60) || current.finale.accent },
    banner: { enabled: form.get("bannerEnabled") === "on", text: s("bannerText", 140), href: s("bannerHref", 200) || "/menu" },
    business: {
      ...current.business,
      name: s("name", 60) || current.business.name,
      addressLines: lines("address"),
      mapsUrl: s("mapsUrl", 500),
      phone: s("phone", 40),
      email: s("email", 120),
      hours: hours as { days: string; open: string; close: string }[],
      socials: socials as { label: string; url: string }[],
    },
    delivery: {
      feeCents: dollarsToCents(form.get("deliveryFee")),
      freeOverCents: dollarsToCents(form.get("freeOver")),
      minOrderCents: dollarsToCents(form.get("minOrder")),
      etaMinutes: eta as [number, number],
    },
    taxRate: tax,
  };
  await db.siteContent.upsert({ where: { id: "default" }, update: { data: next }, create: { id: "default", data: next } });
  updateTag(TAGS.content);
  revalidatePath("/admin/content");
  return { ok: true, message: "Saved. The website is updated" };
}

// ── Branches ────────────────────────────────────────────────────────────

export async function saveBranch(id: string | null, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff("MANAGER");
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Name the branch." };
  const data = {
    name,
    addressLines: String(form.get("address") ?? "").split("\n").map((x) => x.trim()).filter(Boolean),
    phone: String(form.get("phone") ?? "").trim() || null,
    active: form.get("active") === "on",
  };
  if (id) await db.branch.update({ where: { id }, data });
  else await db.branch.create({ data: { ...data, hours: [] } });
  revalidatePath("/admin/branches");
  return { ok: true };
}

// ── Inventory ───────────────────────────────────────────────────────────

export async function saveStock(id: string | null, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff();
  const name = String(form.get("name") ?? "").trim();
  const unit = String(form.get("unit") ?? "").trim() || "pcs";
  const quantity = Number(form.get("quantity"));
  const lowThreshold = Number(form.get("lowThreshold"));
  if (!name) return { error: "Name the item." };
  if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(lowThreshold) || lowThreshold < 0) return { error: "Quantities must be zero or more." };
  if (id) await db.inventoryItem.update({ where: { id }, data: { name, unit, quantity, lowThreshold } });
  else await db.inventoryItem.create({ data: { name, unit, quantity, lowThreshold } });
  revalidatePath("/admin/inventory");
  return { ok: true };
}

// ── Reviews ─────────────────────────────────────────────────────────────

export async function moderateReview(id: string, approve: boolean): Promise<ActionResult> {
  await requireStaff();
  if (approve) await db.review.update({ where: { id }, data: { approved: true } });
  else await db.review.delete({ where: { id } });
  updateTag(TAGS.catalog);
  revalidatePath("/admin/reviews");
  return { ok: true, message: approve ? "Published" : "Deleted" };
}

// ── Team (owner only) ───────────────────────────────────────────────────

export async function addTeamMember(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff("OWNER");
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Add their name."),
      email: z.string().trim().toLowerCase().email("Enter a valid email."),
      role: z.enum(["MANAGER", "STAFF"]),
      password: z.string().min(10, "Temporary password: at least 10 characters."),
    })
    .safeParse({ name: form.get("name"), email: form.get("email"), role: form.get("role"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (await db.user.findUnique({ where: { email: parsed.data.email } })) return { error: "That email already has an account." };
  const { password, ...rest } = parsed.data;
  await db.user.create({ data: { ...rest, passwordHash: await bcrypt.hash(password, 12) } });
  revalidatePath("/admin/team");
  return { ok: true, message: "Account created. Share the temporary password privately" };
}

export async function toggleTeamMember(id: string): Promise<ActionResult> {
  const s = await requireStaff("OWNER");
  if (id === s.userId) return { error: "You can't disable your own account." };
  const u = await db.user.findUniqueOrThrow({ where: { id } });
  if (u.role === "OWNER") return { error: "Owner accounts can't be disabled here." };
  await db.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/admin/team");
  return { ok: true, message: u.active ? "Disabled" : "Enabled" };
}
