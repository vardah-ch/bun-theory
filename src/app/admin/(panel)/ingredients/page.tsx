import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Card, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { saveIngredient } from "../../actions/catalog";
import { BUILD_BASE_CENTS, BUILD_GROUPS } from "@/lib/burger/options";

export default async function IngredientsPage() {
  await requireStaff("MANAGER");
  const rows = await db.ingredient.findMany({ orderBy: [{ group: "asc" }, { sort: "asc" }] });
  return (
    <>
      <PageHeader title="Builder ingredients" kicker={`Base burger ${(BUILD_BASE_CENTS / 100).toFixed(2)} + these prices`} />
      <p className="mb-6 max-w-2xl text-sm text-cream/55">
        Prices and availability for /build. Turning an ingredient off removes it from the builder immediately; baskets that
        contain it are asked to edit their burger at checkout. The 3D shape of each ingredient is fixed in code.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {BUILD_GROUPS.map((g) => (
          <Card key={g.id} title={g.name}>
            <ul className="space-y-2">
              {rows.filter((r) => r.group === g.id).map((r) => (
                <li key={r.id}>
                  <ActionForm action={saveIngredient.bind(null, r.id)} inline>
                    <input name="label" defaultValue={r.label} className="admin-input w-36" aria-label="Label" />
                    <input name="note" defaultValue={r.note ?? ""} placeholder="Note" className="admin-input w-44" aria-label="Note" />
                    <input name="price" defaultValue={(r.priceCents / 100).toFixed(2)} className="admin-input w-20" aria-label="Price in dollars" />
                    <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="available" defaultChecked={r.available} className="accent-[#ff5722]" /> On</label>
                  </ActionForm>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
