"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { TAGS } from "@/lib/data/catalog";
import type { ActionResult } from "@/components/admin/ActionForm";
import { dollarsToCents } from "@/components/admin/ui";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const ProductInput = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(60),
  slug: z.string().trim().max(60).optional(),
  categorySlug: z.string().min(1, "Pick a category."),
  tagline: z.string().trim().min(2, "Add a one-line tagline.").max(140),
  description: z.string().trim().min(10, "Add a short description.").max(800),
  priceCents: z.number().int().min(0).max(100000),
  imageUrl: z.union([z.literal(""), z.string().url("Image must be a full https:// URL.").max(500)]),
  tags: z.array(z.enum(["spicy", "vegetarian", "new", "bestseller"])),
  calories: z.number().int().min(0).max(5000).nullable(),
  featured: z.boolean(),
  available: z.boolean(),
});

function readProduct(form: FormData) {
  const cal = String(form.get("calories") ?? "").trim();
  return ProductInput.safeParse({
    name: form.get("name"),
    slug: String(form.get("slug") ?? "") || undefined,
    categorySlug: form.get("categorySlug"),
    tagline: form.get("tagline"),
    description: form.get("description"),
    priceCents: dollarsToCents(form.get("price")),
    imageUrl: String(form.get("imageUrl") ?? "").trim(),
    tags: form.getAll("tags").map(String),
    calories: cal ? Number(cal) : null,
    featured: form.get("featured") === "on",
    available: form.get("available") === "on",
  });
}

function refreshCatalog(slug?: string) {
  updateTag(TAGS.catalog);
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/menu/${slug}`);
}

export async function saveProduct(id: string | null, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff("MANAGER");
  const parsed = readProduct(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { slug: rawSlug, ...data } = parsed.data;
  const slug = slugify(rawSlug || data.name);
  if (!slug) return { error: "Add a name with letters or numbers." };
  const clash = await db.product.findUnique({ where: { slug } });
  if (clash && clash.id !== id) return { error: `The address /menu/${slug} is already used by ${clash.name}.` };

  const payload = { ...data, slug, imageUrl: data.imageUrl || null };
  if (id) {
    await db.product.update({ where: { id }, data: payload });
    refreshCatalog(slug);
    return { ok: true };
  }
  const created = await db.product.create({ data: { ...payload, sort: 999 } });
  refreshCatalog(slug);
  redirect(`/admin/products/${created.id}`);
}

export async function toggleProductAvailability(id: string): Promise<ActionResult> {
  await requireStaff();
  const p = await db.product.findUniqueOrThrow({ where: { id } });
  await db.product.update({ where: { id }, data: { available: !p.available } });
  refreshCatalog(p.slug);
  return { ok: true, message: p.available ? "Marked sold out" : "Back on the menu" };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireStaff("MANAGER");
  const used = await db.orderItem.count({ where: { productId: id } });
  if (used > 0) {
    // Keep history intact: products that appear on orders are hidden instead.
    await db.product.update({ where: { id }, data: { available: false } });
    refreshCatalog();
    return { ok: true, message: "It's on past orders, so it was hidden instead of deleted" };
  }
  await db.product.delete({ where: { id } });
  refreshCatalog();
  redirect("/admin/products");
}

// ── Option groups and choices ───────────────────────────────────────────

export async function saveOptionGroup(productId: string, groupId: string | null, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff("MANAGER");
  const name = String(form.get("name") ?? "").trim();
  const type = form.get("type") === "single" ? "single" : "multi";
  if (name.length < 2) return { error: "Give the group a name." };
  const data = { name, type: type as "single" | "multi", required: form.get("required") === "on" && type === "single" };
  if (groupId) await db.optionGroup.update({ where: { id: groupId }, data });
  else await db.optionGroup.create({ data: { ...data, productId, key: slugify(name) || `group-${Date.now()}`, sort: 99 } });
  refreshCatalog();
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function deleteOptionGroup(productId: string, groupId: string): Promise<ActionResult> {
  await requireStaff("MANAGER");
  await db.optionGroup.delete({ where: { id: groupId } });
  refreshCatalog();
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, message: "Removed" };
}

export async function saveOptionChoice(productId: string, groupId: string, choiceId: string | null, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff("MANAGER");
  const label = String(form.get("label") ?? "").trim();
  if (label.length < 1) return { error: "Add a label." };
  const data = { label, priceCents: dollarsToCents(form.get("price")), available: form.get("available") === "on" };
  if (choiceId) await db.optionChoice.update({ where: { id: choiceId }, data });
  else await db.optionChoice.create({ data: { ...data, groupId, key: slugify(label) || `opt-${Date.now()}`, sort: 99 } });
  refreshCatalog();
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function deleteOptionChoice(productId: string, choiceId: string): Promise<ActionResult> {
  await requireStaff("MANAGER");
  await db.optionChoice.delete({ where: { id: choiceId } });
  refreshCatalog();
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, message: "Removed" };
}

// ── Categories ──────────────────────────────────────────────────────────

export async function saveCategory(slug: string | null, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff("MANAGER");
  const name = String(form.get("name") ?? "").trim();
  const blurb = String(form.get("blurb") ?? "").trim().slice(0, 200);
  const sort = Number(form.get("sort") ?? 0) || 0;
  if (name.length < 2) return { error: "Name is too short." };
  if (slug) await db.category.update({ where: { slug }, data: { name, blurb, sort } });
  else {
    const newSlug = slugify(name);
    if (await db.category.findUnique({ where: { slug: newSlug } })) return { error: "A category with that name exists." };
    await db.category.create({ data: { slug: newSlug, name, blurb, sort } });
  }
  updateTag(TAGS.catalog);
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(slug: string): Promise<ActionResult> {
  await requireStaff("MANAGER");
  const n = await db.product.count({ where: { categorySlug: slug } });
  if (n > 0) return { error: `Move its ${n} products to another category first.` };
  await db.category.delete({ where: { slug } });
  updateTag(TAGS.catalog);
  revalidatePath("/admin/categories");
  return { ok: true, message: "Deleted" };
}

// ── Builder ingredients ─────────────────────────────────────────────────

export async function saveIngredient(id: string, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireStaff("MANAGER");
  const label = String(form.get("label") ?? "").trim();
  if (!label) return { error: "Add a label." };
  await db.ingredient.update({
    where: { id },
    data: { label, note: String(form.get("note") ?? "").trim() || null, priceCents: dollarsToCents(form.get("price")), available: form.get("available") === "on" },
  });
  updateTag(TAGS.ingredients);
  revalidatePath("/admin/ingredients");
  return { ok: true };
}
