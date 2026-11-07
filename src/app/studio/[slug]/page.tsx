import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getMenu, getProductBySlug } from "@/lib/data/catalog";
import { StudioView } from "./StudioView";

// The photo studio: renders one menu item alone on a transparent background so
// `npm run renders` can capture it as the product image. Not for customers.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export async function generateStaticParams() {
  const { products } = await getMenu();
  return products.map((p) => ({ slug: p.slug }));
}

async function Studio({ params }: { params: PageProps<"/studio/[slug]">["params"] }) {
  const { slug } = await params;
  // Dev tool only (product photography). Off in production unless explicitly enabled.
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_STUDIO !== "1") notFound();
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  return <StudioView product={{ layers: product.layers, artwork: product.artwork, category: product.category }} />;
}

export default function StudioPage({ params }: PageProps<"/studio/[slug]">) {
  return (
    <Suspense fallback={null}>
      <Studio params={params} />
    </Suspense>
  );
}
