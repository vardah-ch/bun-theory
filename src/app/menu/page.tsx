import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { getMenu, getSiteContent } from "@/lib/data/catalog";
import { MenuBrowser } from "./MenuBrowser";

export const metadata: Metadata = {
  title: "Menu",
  description: "Signature, smash and chicken burgers, loaded fries, sides, shakes and combos. Order for delivery or pickup.",
};

export default async function MenuPage() {
  const [{ categories, products }, content] = await Promise.all([getMenu(), getSiteContent()]);
  return (
    <>
      <div className="theme-light bg-ink">
      <Nav />
      <main className="relative z-20 min-h-dvh bg-ink px-5 pb-24 pt-36 md:px-10 md:pt-40">
        <header className="grid gap-6 md:grid-cols-12">
          <p className="type-annot text-fire md:col-span-3">The board</p>
          <h1 className="type-display text-[18vw] text-cream md:col-span-9 md:text-[9vw]">
            Everything
            <br />
            we make.
          </h1>
        </header>
        {/* Reads ?c= and ?q= from the URL, so it sits in a Suspense boundary. */}
        <Suspense fallback={<div className="mt-16 h-96" />}>
          <MenuBrowser categories={categories} products={products} />
        </Suspense>
      </main>
      </div>
      <Footer content={content} />
    </>
  );
}
