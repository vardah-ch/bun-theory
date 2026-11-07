"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** One chosen option on a line, e.g. { group: "Cheese", label: "Swiss", priceCents: 150 }. */
export type CartOption = {
  group: string;
  optionId: string;
  label: string;
  priceCents: number;
};

export type CartItem = {
  /** Unique per line: the same burger built two ways is two lines. */
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  basePriceCents: number;
  quantity: number;
  options: CartOption[];
  /** Built in the configurator: the layer stack that recreates it in 3D. */
  build?: Record<string, string | string[] | null>;
  note?: string;
};

export const unitPrice = (i: Pick<CartItem, "basePriceCents" | "options">) =>
  i.basePriceCents + i.options.reduce((s, o) => s + o.priceCents, 0);

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "lineId">) => string;
  setQuantity: (lineId: string, quantity: number) => void;
  update: (lineId: string, patch: Partial<Omit<CartItem, "lineId">>) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

const sameConfig = (a: Omit<CartItem, "lineId">, b: CartItem) =>
  a.productId === b.productId &&
  JSON.stringify(a.options.map((o) => o.optionId).sort()) === JSON.stringify(b.options.map((o) => o.optionId).sort()) &&
  JSON.stringify(a.build ?? null) === JSON.stringify(b.build ?? null) &&
  (a.note ?? "") === (b.note ?? "");

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        // Identical configuration: bump the quantity instead of a duplicate line.
        const existing = get().items.find((i) => sameConfig(item, i));
        if (existing) {
          get().setQuantity(existing.lineId, Math.min(existing.quantity + item.quantity, 20));
          return existing.lineId;
        }
        const lineId = crypto.randomUUID();
        set((s) => ({ items: [...s.items, { ...item, lineId }] }));
        return lineId;
      },
      setQuantity: (lineId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.lineId !== lineId)
              : s.items.map((i) => (i.lineId === lineId ? { ...i, quantity: Math.min(quantity, 20) } : i)),
        })),
      update: (lineId, patch) =>
        set((s) => ({ items: s.items.map((i) => (i.lineId === lineId ? { ...i, ...patch } : i)) })),
      remove: (lineId) => set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "bun-theory-cart", version: 1 },
  ),
);
