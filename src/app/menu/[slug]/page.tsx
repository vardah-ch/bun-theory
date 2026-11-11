import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { getApprovedReviews, getMenu, getProductBySlug } from "@/lib/data/catalog";
import { ProductDetail } from "./ProductDetail";
import { Reviews } from "./Reviews";

export async function generateStaticParams() {
  const { products } = await getMenu();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/menu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Not on the menu" };
  return { title: p.name, description: `${p.tagline} ${p.description}`.slice(0, 160), openGraph: { images: [p.imageUrl || `/photos/${p.slug}.jpg`] } };
}

async function Product({ params }: { params: PageProps<"/menu/[slug]">["params"] }) {
  const { slug } = await params;
  const [product, { products, categories }] = await Promise.all([getProductBySlug(slug), getMenu()]);
  if (!product) notFound();
  const category = categories.find((c) => c.slug === product.category);
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);
  const reviews = await getApprovedReviews(product.id);
  return (
    <>
      <ProductDetail product={product} categoryName={category?.name ?? ""} related={related} />
      <Reviews productId={product.id} productName={product.name} reviews={reviews} />
    </>
  );
}

export default function ProductPage({ params }: PageProps<"/menu/[slug]">) {
  return (
    <div className="theme-light min-h-dvh bg-ink">
      <Nav />
      <main className="relative z-20 min-h-dvh bg-ink">
        <Suspense fallback={<div className="min-h-dvh" />}>
          <Product params={params} />
        </Suspense>
      </main>
    </div>
  );
}
