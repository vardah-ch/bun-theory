import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Card, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { deleteCategory, saveCategory } from "../../actions/catalog";

export default async function CategoriesPage() {
  await requireStaff("MANAGER");
  const cats = await db.category.findMany({ orderBy: { sort: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <PageHeader title="Categories" kicker="Menu sections, in display order" />
      <Card>
        <ul className="space-y-3">
          {cats.map((c) => (
            <li key={c.slug} className="flex flex-wrap items-center gap-2 border-b border-cream/10 pb-3">
              <ActionForm action={saveCategory.bind(null, c.slug)} inline>
                <input name="sort" type="number" defaultValue={c.sort} className="admin-input w-16" aria-label="Order" />
                <input name="name" defaultValue={c.name} className="admin-input w-48" aria-label="Name" />
                <input name="blurb" defaultValue={c.blurb} className="admin-input w-80" aria-label="Blurb" />
              </ActionForm>
              <span className="type-annot text-cream/40">{c._count.products} products</span>
              {c._count.products === 0 && <ActionForm action={deleteCategory.bind(null, c.slug)} submitLabel="Delete" danger inline confirm={`Delete ${c.name}?`} />}
            </li>
          ))}
        </ul>
        <h2 className="type-annot mb-2 mt-6 text-cream/55">Add a category</h2>
        <ActionForm action={saveCategory.bind(null, null)} submitLabel="Add" inline>
          <input name="sort" type="number" defaultValue={cats.length + 1} className="admin-input w-16" aria-label="Order" />
          <input name="name" placeholder="Name" className="admin-input w-48" aria-label="Name" />
          <input name="blurb" placeholder="One-line description" className="admin-input w-80" aria-label="Blurb" />
        </ActionForm>
      </Card>
    </>
  );
}
