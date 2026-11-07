import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Card, PageHeader, money } from "@/components/admin/ui";

export default async function CustomersPage() {
  await requireStaff();
  const [customers, totals, subscribers] = await Promise.all([
    db.customer.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { orders: true } } } }),
    db.order.groupBy({ by: ["customerId"], where: { status: { not: "CANCELLED" } }, _sum: { totalCents: true }, _max: { createdAt: true } }),
    db.subscriber.count(),
  ]);
  const spend = new Map(totals.map((t) => [t.customerId, t]));
  return (
    <>
      <PageHeader title="Customers" kicker={`${customers.length} customers · ${subscribers} newsletter subscribers`} />
      <Card>
        {customers.length === 0 ? (
          <p className="py-8 text-center text-cream/45">Customers appear here after their first order.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="type-annot text-left text-cream/40">
                <tr><th className="py-2 pr-4">Name</th><th className="pr-4">Phone</th><th className="pr-4">Email</th><th className="pr-4">Orders</th><th className="pr-4">Last order</th><th className="text-right">Spent</th></tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const t = spend.get(c.id);
                  return (
                    <tr key={c.id} className="border-t border-cream/10">
                      <td className="py-2.5 pr-4">{c.name}</td>
                      <td className="pr-4"><a href={`tel:${c.phone}`} className="hover:text-fire">{c.phone}</a></td>
                      <td className="pr-4 text-cream/60">{c.email ?? "—"}</td>
                      <td className="pr-4">{c._count.orders}</td>
                      <td className="pr-4 text-cream/60">{t?._max.createdAt?.toLocaleDateString() ?? "—"}</td>
                      <td className="text-right tabular-nums">{money(t?._sum.totalCents ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
