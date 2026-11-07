import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { OrderHistory } from "./OrderHistory";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default function OrdersPage() {
  return (
    <div className="theme-light min-h-dvh bg-ink">
      <Nav />
      <main className="relative z-20 min-h-dvh bg-ink px-5 pb-24 pt-36 md:px-10 md:pt-40">
        <p className="type-annot text-fire">Order history</p>
        <h1 className="type-display mt-4 text-7xl text-cream md:text-8xl">Your orders.</h1>
        <p className="mt-3 max-w-lg text-cream/60">Orders placed from this device. Each one has a private link; nobody else can see them.</p>
        <OrderHistory />
      </main>
    </div>
  );
}
