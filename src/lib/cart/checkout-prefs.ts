"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Fulfillment } from "@/lib/pricing";

/** Choices made in the cart that checkout needs too: fulfilment and coupon. */
type Prefs = {
  fulfillment: Fulfillment;
  couponCode: string;
  setFulfillment: (f: Fulfillment) => void;
  setCoupon: (code: string) => void;
};

export const useCheckoutPrefs = create<Prefs>()(
  persist(
    (set) => ({
      fulfillment: "delivery",
      couponCode: "",
      setFulfillment: (fulfillment) => set({ fulfillment }),
      setCoupon: (couponCode) => set({ couponCode }),
    }),
    { name: "bun-theory-checkout" },
  ),
);
