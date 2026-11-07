import Link from "next/link";
import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Badge, Card, PageHeader, money } from "@/components/admin/ui";
import { STATUS_LABEL, statusTone } from "./status";
import { AutoRefresh } from "./AutoRefresh";

const FILTERS = [
  { key: "open", label: "Open", where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] } } },
  { key: "PENDING", label: "New", where: { status: "PENDING" } },
  { key: "COMPLETED", label: "Completed", where: { status: "COMPLETED" } },
  { key: "CANCELLED", label: "Cancelled", where: { status: "CANCELLED" } },
  { key: "all", label: "All", where: {} },
] as const;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireStaff();
  const sp = await searchParams;
  const key = typeof sp.f === "string" ? sp.f : "open";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const filter = FILTERS.find((f) => f.key === key) ?? FILTERS[0];
  const num = Number(q.replace("#", ""));
  const orders = await db.order.findMany({
    where: {
      ...(filter.where as object),
      ...(q ? { OR: [...(Number.isInteger(num) && num > 0 ? [{ number: num }] : []), { name: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { items: true } } },
  });

  return (
    <>
      <AutoRefresh seconds={20} />
      <PageHeader title="Orders" kicker="Live board · refreshes every 20 s" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2" aria-label="Filter orders">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/orders?f=${f.key}`}
              aria-current={f.key === filter.key ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${f.key === filter.key ? "border-fire bg-fire text-ink" : "border-cream/15 text-cream/70 hover:border-cream/40"}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <form className="flex gap-2">
          <input type="hidden" name="f" value={filter.key} />
          <input name="q" defaultValue={q} placeholder="Order #, name or phone" className="admin-input w-56" />
        </form>
      </div>
      <Card>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-cream/45">No orders here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="type-annot text-left text-cream/40">
                <tr><th className="py-2 pr-4">Nº</th><th className="pr-4">Placed</th><th className="pr-4">Customer</th><th className="pr-4">Type</th><th className="pr-4">Items</th><th className="pr-4">Status</th><th className="pr-4">Payment</th><th className="text-right">Total</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-cream/10 hover:bg-cream/[0.02]">
                    <td className="py-3 pr-4"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-fire hover:underline">#{o.number}</Link></td>
                    <td className="pr-4 text-cream/60">{o.createdAt.toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</td>
                    <td className="pr-4">{o.name}<span className="block text-xs text-cream/40">{o.phone}</span></td>
                    <td className="pr-4 capitalize text-cream/70">{o.fulfillment}</td>
                    <td className="pr-4 text-cream/70">{o._count.items}</td>
                    <td className="pr-4"><Badge tone={statusTone(o.status)}>{STATUS_LABEL[o.status]}</Badge></td>
                    <td className="pr-4 text-cream/70">{o.paymentMethod.replaceAll("_", " ")} · {o.paymentStatus.toLowerCase()}</td>
                    <td className="text-right tabular-nums">{money(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
