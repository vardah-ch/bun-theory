"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/server/db";

export type ReviewState = { ok?: boolean; error?: string };

const Review = z.object({
  name: z.string().trim().min(2, "Add your name.").max(60),
  rating: z.coerce.number().int().min(1, "Pick a rating.").max(5),
  body: z.string().trim().min(10, "Tell us a little more (10+ characters).").max(800),
});

// Light spam brake: 3 reviews per IP per hour (in memory; per server instance).
const recent = new Map<string, number[]>();

export async function submitReview(productId: string, _prev: ReviewState, form: FormData): Promise<ReviewState> {
  if (form.get("website")) return { ok: true }; // honeypot field: bots fill it, people don't see it
  const parsed = Review.safeParse({ name: form.get("name"), rating: form.get("rating"), body: form.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (times.length >= 3) return { error: "You've left a few reviews already. Try again later." };
  recent.set(ip, [...times, now]);
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return { error: "That product no longer exists." };
  await db.review.create({ data: { ...parsed.data, productId, approved: false } });
  await db.notification.create({ data: { kind: "review", message: `New review waiting (${parsed.data.rating}★)`, link: "/admin/reviews" } });
  return { ok: true };
}
