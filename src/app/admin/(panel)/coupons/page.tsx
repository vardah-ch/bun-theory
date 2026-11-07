import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Badge, Card, Field, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { deleteCoupon, saveCoupon } from "../../actions/settings";

const d = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2));

function CouponFields({ c }: { c?: Awaited<ReturnType<typeof db.coupon.findMany>>[number] }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {!c && <Field label="Code"><input name="code" placeholder="SUMMER10" className="admin-input uppercase" /></Field>}
      <Field label="Type">
        <select name="kind" defaultValue={c?.kind ?? "percent"} className="admin-input">
          <option value="percent">% off</option>
          <option value="fixed">$ off</option>
        </select>
      </Field>
      <Field label="Value" hint="Percent, or dollars for $ off"><input name="value" defaultValue={c ? (c.kind === "fixed" ? d(c.value) : c.value) : ""} className="admin-input" /></Field>
      <Field label="Min order ($)"><input name="min" defaultValue={d(c?.minSubtotalCents ?? null)} className="admin-input" /></Field>
      <Field label="Max discount ($)"><input name="max" defaultValue={d(c?.maxDiscountCents ?? null)} className="admin-input" /></Field>
      <Field label="Max uses"><input name="maxUses" defaultValue={c?.maxUses ?? ""} className="admin-input" /></Field>
      <Field label="Expires"><input name="expiresAt" type="date" defaultValue={c?.expiresAt?.toISOString().slice(0, 10) ?? ""} className="admin-input" /></Field>
      <Field label="Description" className="md:col-span-2"><input name="description" defaultValue={c?.description} className="admin-input" /></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} className="accent-[#ff5722]" /> Active</label>
    </div>
  );
}

export default async function CouponsPage() {
  await requireStaff("MANAGER");
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Coupons & promotions" kicker="Codes customers type in the bag" />
      <div className="space-y-4">
        {coupons.map((c) => (
          <Card key={c.code}>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="type-display text-3xl">{c.code}</span>
              <Badge tone={c.active ? "good" : "neutral"}>{c.active ? "active" : "off"}</Badge>
              <span className="type-annot text-cream/40">used {c.uses}{c.maxUses ? ` / ${c.maxUses}` : ""} times</span>
            </div>
            <ActionForm action={saveCoupon.bind(null, c.code)}>
              <CouponFields c={c} />
            </ActionForm>
            <ActionForm action={deleteCoupon.bind(null, c.code)} submitLabel="Delete code" danger className="mt-3" confirm={`Delete ${c.code}?`} />
          </Card>
        ))}
        <Card title="New coupon">
          <ActionForm action={saveCoupon.bind(null, null)} submitLabel="Create coupon">
            <CouponFields />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
