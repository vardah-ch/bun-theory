"use client";

// Orders placed on this device (number + secret status token), so customers
// can find them again without an account.
export type SavedOrder = { number: number; token: string; at: string; totalCents: number };
const KEY = "bun-theory-orders";

export function savedOrders(): SavedOrder[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function rememberOrder(o: SavedOrder) {
  const list = [o, ...savedOrders().filter((x) => x.number !== o.number)].slice(0, 30);
  localStorage.setItem(KEY, JSON.stringify(list));
}

const DETAILS = "bun-theory-details";
export type SavedDetails = { name: string; phone: string; email: string; address: string };
export const savedDetails = (): Partial<SavedDetails> => {
  try {
    return JSON.parse(localStorage.getItem(DETAILS) ?? "{}");
  } catch {
    return {};
  }
};
export const rememberDetails = (d: SavedDetails) => localStorage.setItem(DETAILS, JSON.stringify(d));
