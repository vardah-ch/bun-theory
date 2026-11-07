import Link from "next/link";
import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Badge, Card, PageHeader, money } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { markNotificationsRead } from "../actions/misc";
import { STATUS_LABEL, statusTone } from "./orders/status";

export default async function Dashboard() {
  await requireStaff();
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const since = new Date(startToday.getTime() - 13 * 86400000);
  const live = { status: { not: "CANCELLED" as const } };

  const [totals, paid, today, recent, byStatus, best, lowStock, notes, window] = await Promise.all([
    db.order.aggregate({ where: live, _count: true, _sum: { totalCents: true } }),
    db.order.aggregate({ where: { ...live, paymentStatus: "PAID" }, _sum: { totalCents: true } }),
    db.order.aggregate({ where: { ...live, createdAt: { gte: startToday } }, _count: true, _sum: { totalCents: true } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.orderItem.groupBy({ by: ["name"], where: { order: live }, _sum: { quantity: true, unitPriceCents: true }, orderBy: { _sum: { quantity: "desc" } }, take: 6 }),
    db.inventoryItem.findMany({ orderBy: { name: "asc" } }),
    db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.order.findMany({ where: { ...live, createdAt: { gte: since } }, select: { createdAt: true, totalCents: true } }),
  ]);

  const count = totals._count;
  const revenue = totals._sum.totalCents ?? 0;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since.getTime() + i * 86400000);
    const next = d.getTime() + 86400000;
    const cents = window.filter((o) => o.createdAt.getTime() >= d.getTime() && o.createdAt.getTime() < next).reduce((s, o) => s + o.totalCents, 0);
    return { d, cents };
  });
  const peak = Math.max(1, ...days.map((x) => x.cents));
  const low = lowStock.filter((i) => i.quantity <= i.lowThreshold);

  return (
    <>
      <PageHeader title="Dashboard" kicker={now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "Orders (all time)", v: String(count), s: `${today._count} today` },
          { k: "Revenue (all time)", v: money(revenue), s: `${money(paid._sum.totalCents ?? 0)} paid · ${money(revenue - (paid._sum.totalCents ?? 0))} unpaid or on delivery` },
          { k: "Today", v: money(today._sum.totalCents ?? 0), s: `${today._count} orders` },
          { k: "Average order", v: count ? money(Math.round(revenue / count)) : "—", s: "excluding cancelled" },
        ].map((x) => (
          <Card key={x.k}>
            <p className="type-annot text-cream/50">{x.k}</p>
            <p className="type-display mt-2 text-5xl text-cream">{x.v}</p>
            <p className="mt-1 text-xs text-cream/45">{x.s}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Revenue, last 14 days" className="xl:col-span-2">
          {count === 0 ? (
            <p className="py-10 text-center text-cream/45">No orders yet. The chart fills in as real orders arrive.</p>
          ) : (
            <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Revenue per day for the last 14 days">
              {days.map(({ d, cents }) => (
                <div key={d.toISOString()} className="group flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-cream/0 group-hover:text-cream/70">{money(cents)}</span>
                  <div className="w-full rounded-t bg-fire/80 transition-colors group-hover:bg-fire" style={{ height: `${Math.max(2, (cents / peak) * 150)}px` }} />
                  <span className="text-[10px] text-cream/40">{d.getDate()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Orders by status">
          <ul className="space-y-2 text-sm">
            {byStatus.length === 0 && <li className="text-cream/45">Nothing yet.</li>}
            {byStatus.map((s) => (
              <li key={s.status} className="flex items-center justify-between">
                <Badge tone={statusTone(s.status)}>{STATUS_LABEL[s.status]}</Badge>
                <span className="tabular-nums">{s._count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Bestsellers" className="xl:col-span-1">
          <ol className="space-y-2 text-sm">
            {best.length === 0 && <li className="text-cream/45">No sales yet.</li>}
            {best.map((b, i) => (
              <li key={b.name} className="flex justify-between gap-3">
                <span className="text-cream/80"><span className="type-annot mr-2 text-cream/35">{i + 1}</span>{b.name}</span>
                <span className="tabular-nums text-cream/60">{b._sum.quantity} sold</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Low stock">
          {low.length === 0 ? (
            <p className="text-sm text-cream/45">Everything is above its reorder level.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {low.map((i) => (
                <li key={i.id} className="flex justify-between"><span>{i.name}</span><Badge tone="warn">{i.quantity} {i.unit}</Badge></li>
              ))}
            </ul>
          )}
          <Link href="/admin/inventory" className="type-annot mt-4 inline-block text-cream/50 hover:text-fire">Manage inventory →</Link>
        </Card>
        <Card title="Notifications">
          <ul className="space-y-2 text-sm">
            {notes.length === 0 && <li className="text-cream/45">All quiet.</li>}
            {notes.map((n) => (
              <li key={n.id} className={n.read ? "text-cream/45" : "text-cream"}>
                {n.link ? <Link href={n.link} className="hover:text-fire">{n.message}</Link> : n.message}
                <span className="block text-xs text-cream/35">{n.createdAt.toLocaleString()}</span>
              </li>
            ))}
          </ul>
          {notes.some((n) => !n.read) && (
            <ActionForm action={markNotificationsRead} submitLabel="Mark all read" className="mt-4" />
          )}
        </Card>
      </div>

      <Card title="Latest orders" className="mt-4">
        {recent.length === 0 ? (
          <p className="text-sm text-cream/45">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="type-annot text-left text-cream/40">
                <tr><th className="py-2 pr-4">Nº</th><th className="pr-4">Customer</th><th className="pr-4">Type</th><th className="pr-4">Status</th><th className="pr-4">Payment</th><th className="text-right">Total</th></tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-cream/10">
                    <td className="py-2.5 pr-4"><Link href={`/admin/orders/${o.id}`} className="text-fire hover:underline">#{o.number}</Link></td>
                    <td className="pr-4">{o.name}</td>
                    <td className="pr-4 capitalize text-cream/70">{o.fulfillment}</td>
                    <td className="pr-4"><Badge tone={statusTone(o.status)}>{STATUS_LABEL[o.status]}</Badge></td>
                    <td className="pr-4 text-cream/70">{o.paymentStatus.toLowerCase()}</td>
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
