import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/server/db";
import type { LayerSpec } from "@/lib/burger/layers";
import { BUILD_GROUPS, type BuildGroup } from "@/lib/burger/options";
import type { Artwork, Category, CategorySlug, Product } from "@/lib/catalog/types";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog/sample";
import { DEFAULT_CONTENT, type SiteContent } from "@/lib/content/defaults";

// Read side of the catalogue, from PostgreSQL. Each read is cached and tagged;
// admin edits call updateTag() with the same tag, so the public site shows a
// change on the very next request without rebuilding.

export const TAGS = { catalog: "catalog", content: "content", ingredients: "ingredients" } as const;

type ProductRow = Awaited<ReturnType<typeof loadProducts>>[number];

async function withFallback<T>(task: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await task();
  } catch (error) {
    console.warn("Database unavailable; using local fallback content.", error);
    return fallback;
  }
}

async function loadProducts() {
  return db.product.findMany({
    orderBy: [{ sort: "asc" }, { name: "asc" }],
    include: { optionGroups: { orderBy: { sort: "asc" }, include: { options: { where: { available: true }, orderBy: { sort: "asc" } } } } },
  });
}

function toProduct(p: ProductRow): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.categorySlug as CategorySlug,
    tagline: p.tagline,
    description: p.description,
    priceCents: p.priceCents,
    available: p.available,
    featured: p.featured,
    tags: p.tags as Product["tags"],
    layers: (p.layers as LayerSpec[] | null) ?? undefined,
    artwork: (p.artwork as Artwork | null) ?? undefined,
    imageUrl: p.imageUrl ?? undefined,
    calories: p.calories ?? undefined,
    optionGroups: p.optionGroups
      .filter((g) => g.options.length > 0)
      .map((g) => ({
        id: g.key,
        name: g.name,
        type: g.type,
        required: g.required,
        max: g.max ?? undefined,
        options: g.options.map((o) => ({ id: o.key, label: o.label, priceCents: o.priceCents })),
      })),
  };
}

export async function getMenu(): Promise<{ categories: Category[]; products: Product[] }> {
  "use cache";
  cacheTag(TAGS.catalog);
  cacheLife("hours");
  const fallbackProducts = PRODUCTS as unknown as ProductRow[];
  const fallback = {
    categories: CATEGORIES.map((c) => ({ slug: c.slug as CategorySlug, name: c.name, blurb: c.blurb, sort: c.sort })),
    products: PRODUCTS.map((p) => ({ ...p, optionGroups: p.optionGroups ?? [] })),
  };
  const [categories, products] = await Promise.all([
    withFallback(() => db.category.findMany({ orderBy: { sort: "asc" } }), CATEGORIES.map((c) => ({ ...c, id: c.slug }))),
    withFallback(() => loadProducts(), fallbackProducts),
  ]);

  const hasDatabaseProducts = Array.isArray(products) && products.length > 0 && "categorySlug" in products[0];

  if (Array.isArray(categories) && categories[0] && "slug" in categories[0] && hasDatabaseProducts) {
    return {
      categories: categories.map((c) => ({ slug: c.slug as CategorySlug, name: c.name, blurb: c.blurb, sort: c.sort })),
      products: products.map(toProduct),
    };
  }

  return fallback;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { products } = await getMenu();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheTag(TAGS.content);
  cacheLife("hours");
  const row = await withFallback(
    () => db.siteContent.findUnique({ where: { id: "default" } }),
    null,
  );
  // Merge over defaults so newly added fields always have a value.
  const data = (row?.data ?? {}) as Partial<SiteContent>;
  return {
    ...DEFAULT_CONTENT,
    ...data,
    hero: { ...DEFAULT_CONTENT.hero, ...data.hero },
    finale: { ...DEFAULT_CONTENT.finale, ...data.finale },
    business: { ...DEFAULT_CONTENT.business, ...data.business },
    banner: { ...DEFAULT_CONTENT.banner, ...data.banner },
    delivery: { ...DEFAULT_CONTENT.delivery, ...data.delivery },
  };
}

/** Configurator options as stored (prices and availability editable in the admin). */
export async function getBuildGroups(): Promise<BuildGroup[]> {
  "use cache";
  cacheTag(TAGS.ingredients);
  cacheLife("hours");
  const rows = await withFallback(() => db.ingredient.findMany({ orderBy: { sort: "asc" } }), []);
  if (!rows.length) return BUILD_GROUPS;
  return BUILD_GROUPS.map((g) => ({
    ...g,
    options: g.options
      .map((o) => {
        const r = rows.find((x) => x.group === g.id && x.key === o.id);
        return r ? { ...o, label: r.label, note: r.note ?? o.note, priceCents: r.priceCents, available: r.available } : { ...o, available: true };
      })
      .filter((o) => o.available)
      .map((o) => {
        const { available, ...rest } = o;
        void available;
        return rest;
      }),
  }));
}

export type PublicReview = { id: string; name: string; rating: number; body: string; createdAt: string };

/** Approved reviews only. Cached with the catalogue; approving one refreshes it. */
export async function getApprovedReviews(productId: string): Promise<PublicReview[]> {
  "use cache";
  cacheTag(TAGS.catalog);
  cacheLife("hours");
  const rows = await withFallback(
    () => db.review.findMany({ where: { productId, approved: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    [],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, rating: r.rating, body: r.body, createdAt: r.createdAt.toISOString() }));
}
