import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Badge, Card, PageHeader, money } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { markPaidInPerson, setOrderStatus } from "../../../actions/orders";
import { ORDER_FLOW, STATUS_LABEL, statusTone } from "../status";

export default async function OrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  await requireStaff();
  const { id } = await params;
  const o = await db.order.findUnique({
    where: { id },
    include: { items: { include: { customizations: true } }, payments: { orderBy: { createdAt: "desc" } }, customer: { include: { _count: { select: { orders: true } } } } },
  });
  if (!o) notFound();
  const statuses = [...ORDER_FLOW.filter((s) => s !== "OUT_FOR_DELIVERY" || o.fulfillment === "delivery"), "CANCELLED"];

  return (
    <>
      <PageHeader title={`Order #${o.number}`} kicker={o.createdAt.toLocaleString()}>
        <Badge tone={statusTone(o.status)}>{STATUS_LABEL[o.status]}</Badge>
        <Link href="/admin/orders" className="type-annot text-cream/50 hover:text-fire">← All orders</Link>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Items" className="xl:col-span-2">
          <ul className="divide-y divide-cream/10">
            {o.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3">
                <div>
                  <p className="text-lg"><span className="type-display mr-2 text-2xl text-fire">{i.quantity}×</span>{i.name}</p>
                  {i.customizations.length > 0 && <p className="text-sm text-cream/55">{i.customizations.map((c) => c.label).join(" · ")}</p>}
                  {i.note && <p className="mt-1 text-sm italic text-amber-300">Note: {i.note}</p>}
                </div>
                <p className="tabular-nums">{money(i.unitPriceCents * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-dashed border-cream/15 pt-3 text-sm">
            <div className="flex justify-between text-cream/60"><dt>Subtotal</dt><dd>{money(o.subtotalCents)}</dd></div>
            {o.discountCents > 0 && <div className="flex justify-between text-fire"><dt>Discount {o.couponCode}</dt><dd>−{money(o.discountCents)}</dd></div>}
            {o.deliveryFeeCents > 0 && <div className="flex justify-between text-cream/60"><dt>Delivery</dt><dd>{money(o.deliveryFeeCents)}</dd></div>}
            {o.taxCents > 0 && <div className="flex justify-between text-cream/60"><dt>Tax</dt><dd>{money(o.taxCents)}</dd></div>}
            <div className="flex justify-between text-base"><dt className="font-semibold">Total</dt><dd className="type-display text-3xl">{money(o.totalCents)}</dd></div>
          </dl>
        </Card>

        <div className="space-y-4">
          <Card title="Update status">
            <ActionForm action={setOrderStatus.bind(null, o.id)} submitLabel="Update" inline>
              <select name="status" defaultValue={o.status} className="admin-input w-auto">
                {statuses.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </ActionForm>
          </Card>

          <Card title="Customer">
            <p className="text-lg">{o.name}</p>
            <p><a href={`tel:${o.phone}`} className="text-fire hover:underline">{o.phone}</a></p>
            {o.email && <p className="text-cream/70">{o.email}</p>}
            <p className="mt-3 text-sm capitalize text-cream/55">{o.fulfillment}</p>
            {o.address && <p className="text-cream/80">{o.address}</p>}
            {o.notes && <p className="mt-3 rounded-lg border border-amber-400/30 p-2 text-sm text-amber-200">{o.notes}</p>}
            {o.customer && <p className="type-annot mt-3 text-cream/40">{o.customer._count.orders} orders from this number</p>}
          </Card>

          <Card title="Payment">
            <p className="capitalize">{o.paymentMethod.replaceAll("_", " ")} · <span className={o.paymentStatus === "PAID" ? "text-emerald-300" : "text-amber-300"}>{o.paymentStatus.toLowerCase()}</span></p>
            <ul className="mt-2 space-y-1 text-xs text-cream/50">
              {o.payments.map((p) => (
                <li key={p.id}>{p.provider} ({p.mode}) · {p.status.toLowerCase()} · {money(p.amountCents)} · {p.createdAt.toLocaleString()}</li>
              ))}
            </ul>
            {o.paymentMethod !== "online" && o.paymentStatus !== "PAID" && (
              <ActionForm action={markPaidInPerson.bind(null, o.id)} submitLabel="Mark paid (taken in person)" className="mt-4" confirm={`Confirm you received ${money(o.totalCents)}?`} />
            )}
            {o.paymentMethod === "online" && o.paymentStatus !== "PAID" && (
              <p className="mt-3 text-xs text-cream/45">Online payments are confirmed by the payment gateway only.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
