import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { getMenu, getSiteContent } from "@/lib/data/catalog";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function CartPage() {
  const [content, { products }] = await Promise.all([getSiteContent(), getMenu()]);
  // Small, cheap add-ons: the classic "fries with that?", shown only if not already in the bag.
  const addons = ["fries", "thick-shake", "onion-rings", "cola", "brown-butter-cookie"]
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p?.available));
  return (
    <div className="theme-light min-h-dvh bg-ink">
      <Nav />
      <main className="relative z-20 min-h-dvh bg-ink px-5 pb-24 pt-36 md:px-10 md:pt-40">
        <CartView delivery={content.delivery} taxRate={content.taxRate} addons={addons} />
      </main>
    </div>
  );
}
