import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { getSiteContent } from "@/lib/data/catalog";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const content = await getSiteContent();
  const paymentMode = process.env.PAYMENT_MODE === "live" ? "live" : "test";
  return (
    <div className="theme-light min-h-dvh bg-ink">
      <Nav />
      <main className="relative z-20 min-h-dvh bg-ink px-5 pb-24 pt-36 md:px-10 md:pt-40">
        <CheckoutForm delivery={content.delivery} taxRate={content.taxRate} paymentMode={paymentMode} />
      </main>
    </div>
  );
}
