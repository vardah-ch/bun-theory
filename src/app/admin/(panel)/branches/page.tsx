import Link from "next/link";
import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Badge, Card, Field, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { saveBranch } from "../../actions/settings";

export default async function BranchesPage() {
  await requireStaff("MANAGER");
  const branches = await db.branch.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { orders: true } } } });
  return (
    <>
      <PageHeader title="Branches & delivery" kicker="Locations that take orders" />
      <p className="mb-6 max-w-2xl text-sm text-cream/55">
        New orders are assigned to the first active branch. Delivery fee, minimum order, free-delivery threshold and delivery
        times are set in <Link href="/admin/content" className="text-fire hover:underline">Website &amp; settings</Link>.
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        {branches.map((b) => (
          <Card key={b.id}>
            <div className="mb-3 flex items-center gap-3">
              <Badge tone={b.active ? "good" : "neutral"}>{b.active ? "active" : "closed"}</Badge>
              <span className="type-annot text-cream/40">{b._count.orders} orders</span>
            </div>
            <ActionForm action={saveBranch.bind(null, b.id)}>
              <Field label="Name"><input name="name" defaultValue={b.name} className="admin-input" /></Field>
              <Field label="Address (one line per row)"><textarea name="address" rows={2} defaultValue={b.addressLines.join("\n")} className="admin-input" /></Field>
              <Field label="Phone"><input name="phone" defaultValue={b.phone ?? ""} className="admin-input" /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={b.active} className="accent-[#ff5722]" /> Taking orders</label>
            </ActionForm>
          </Card>
        ))}
        <Card title="Add a branch">
          <ActionForm action={saveBranch.bind(null, null)} submitLabel="Add branch">
            <Field label="Name"><input name="name" className="admin-input" /></Field>
            <Field label="Address (one line per row)"><textarea name="address" rows={2} className="admin-input" /></Field>
            <Field label="Phone"><input name="phone" className="admin-input" /></Field>
            <input type="hidden" name="active" value="on" />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
