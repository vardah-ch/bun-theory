import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { saveStock } from "../../actions/settings";

export default async function InventoryPage() {
  await requireStaff();
  const items = await db.inventoryItem.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Inventory" kicker="Stock counts and reorder levels" />
      <Card>
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-2">
              <ActionForm action={saveStock.bind(null, i.id)} inline>
                <input name="name" defaultValue={i.name} className="admin-input w-56" aria-label="Item" />
                <input name="quantity" type="number" step="any" defaultValue={i.quantity} className="admin-input w-24" aria-label="Quantity" />
                <input name="unit" defaultValue={i.unit} className="admin-input w-20" aria-label="Unit" />
                <input name="lowThreshold" type="number" step="any" defaultValue={i.lowThreshold} className="admin-input w-24" aria-label="Reorder at" />
              </ActionForm>
              {i.quantity <= i.lowThreshold && <Badge tone="warn">reorder</Badge>}
              <span className="type-annot text-cream/30">updated {i.updatedAt.toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
        <p className="type-annot mt-3 text-cream/35">Columns: item · quantity · unit · reorder at</p>
        <h2 className="type-annot mb-2 mt-6 text-cream/55">Add an item</h2>
        <ActionForm action={saveStock.bind(null, null)} submitLabel="Add" inline>
          <input name="name" placeholder="Item" className="admin-input w-56" aria-label="Item" />
          <input name="quantity" type="number" step="any" placeholder="Qty" className="admin-input w-24" aria-label="Quantity" />
          <input name="unit" placeholder="kg" className="admin-input w-20" aria-label="Unit" />
          <input name="lowThreshold" type="number" step="any" placeholder="Reorder at" className="admin-input w-24" aria-label="Reorder at" />
        </ActionForm>
      </Card>
    </>
  );
}
