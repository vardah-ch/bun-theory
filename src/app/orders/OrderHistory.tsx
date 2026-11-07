"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { savedOrders, type SavedOrder } from "@/lib/cart/history";
import { formatPrice } from "@/lib/format";

type Status = { status: string; paymentStatus: string };

const STATUS: Record<string, string> = {
  PENDING: "Received", CONFIRMED: "Confirmed", PREPARING: "On the grill", READY: "Ready",
  OUT_FOR_DELIVERY: "On its way", COMPLETED: "Done", CANCELLED: "Cancelled",
};

export function OrderHistory() {
  const [orders, setOrders] = useState<SavedOrder[] | null>(null);
  const [status, setStatus] = useState<Record<number, Status>>({});

  useEffect(() => {
    const list = savedOrders();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrders(list);
    list.forEach((o) =>
      fetch(`/api/orders?n=${o.number}&t=${encodeURIComponent(o.token)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((s: Status | null) => s && setStatus((x) => ({ ...x, [o.number]: s }))),
    );
  }, []);

  if (orders === null) return <div className="h-40" />;
  if (orders.length === 0) {
    return (
      <div className="mt-12">
        <p className="text-cream/70">No orders from this device yet.</p>
        <Link href="/menu" className="mt-5 inline-block rounded-full bg-fire px-6 py-3.5 text-sm font-semibold uppercase text-ink">See the menu</Link>
      </div>
    );
  }
  return (
    <ul className="mt-12 border-t border-cream/15">
      {orders.map((o) => (
        <li key={o.number}>
          <Link href={`/order/${o.number}?t=${o.token}`} className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-cream/15 py-5 md:grid-cols-[8rem_1fr_auto_auto]">
            <span className="type-display text-3xl text-cream group-hover:text-fire">Nº {o.number}</span>
            <span className="text-sm text-cream/50">{new Date(o.at).toLocaleString()}</span>
            <span className="type-annot text-fire">{status[o.number] ? STATUS[status[o.number].status] : "…"}</span>
            <span className="tabular-nums text-cream">{formatPrice(o.totalCents)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
