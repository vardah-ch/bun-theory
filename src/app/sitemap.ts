import type { MetadataRoute } from "next";
import { getMenu } from "@/lib/data/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { products } = await getMenu();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/menu`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/build`, changeFrequency: "monthly", priority: 0.8 },
    ...products.filter((p) => p.available).map((p) => ({ url: `${base}/menu/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
