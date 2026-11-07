import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Card, Field, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import {
  deleteOptionChoice, deleteOptionGroup, deleteProduct, saveOptionChoice, saveOptionGroup, saveProduct,
} from "../../../actions/catalog";

const TAGS = ["spicy", "vegetarian", "new", "bestseller"] as const;
const dollars = (c: number) => (c / 100).toFixed(2);

export default async function ProductEdit({ params }: PageProps<"/admin/products/[id]">) {
  await requireStaff("MANAGER");
  const { id } = await params;
  const isNew = id === "new";
  const [p, categories] = await Promise.all([
    isNew ? null : db.product.findUnique({ where: { id }, include: { optionGroups: { orderBy: { sort: "asc" }, include: { options: { orderBy: { sort: "asc" } } } } } }),
    db.category.findMany({ orderBy: { sort: "asc" } }),
  ]);
  if (!isNew && !p) notFound();

  return (
    <>
      <PageHeader title={p ? p.name : "New product"} kicker="Products">
        {p && <Link href={`/menu/${p.slug}`} target="_blank" className="type-annot text-cream/50 hover:text-fire">View on site ↗</Link>}
        <Link href="/admin/products" className="type-annot text-cream/50 hover:text-fire">← All products</Link>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Details" className="xl:col-span-2">
          <ActionForm action={saveProduct.bind(null, p?.id ?? null)} submitLabel={isNew ? "Create product" : "Save changes"}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name"><input name="name" required defaultValue={p?.name} className="admin-input" /></Field>
              <Field label="URL slug" hint="Leave blank to generate from the name."><input name="slug" defaultValue={p?.slug} className="admin-input" /></Field>
              <Field label="Category">
                <select name="categorySlug" defaultValue={p?.categorySlug ?? categories[0]?.slug} className="admin-input">
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Price ($)"><input name="price" inputMode="decimal" required defaultValue={p ? dollars(p.priceCents) : ""} className="admin-input" /></Field>
              <Field label="Tagline" className="md:col-span-2"><input name="tagline" required defaultValue={p?.tagline} className="admin-input" /></Field>
              <Field label="Description" className="md:col-span-2"><textarea name="description" rows={4} required defaultValue={p?.description} className="admin-input" /></Field>
              <Field label="Photo URL (optional)" hint="Any https image (e.g. Cloudinary). Without one, the studio render of the 3D model is used." className="md:col-span-2">
                <input name="imageUrl" type="url" defaultValue={p?.imageUrl ?? ""} placeholder="https://res.cloudinary.com/…" className="admin-input" />
              </Field>
              <Field label="Calories (optional)"><input name="calories" inputMode="numeric" defaultValue={p?.calories ?? ""} className="admin-input" /></Field>
              <fieldset>
                <legend className="type-annot text-cream/50">Tags</legend>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {TAGS.map((t) => (
                    <label key={t} className="flex items-center gap-1.5">
                      <input type="checkbox" name="tags" value={t} defaultChecked={p?.tags.includes(t)} className="accent-[#ff5722]" /> {t}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="available" defaultChecked={p?.available ?? true} className="accent-[#ff5722]" /> On the menu</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={p?.featured ?? false} className="accent-[#ff5722]" /> Featured on homepage line-up</label>
            </div>
          </ActionForm>
        </Card>

        <div className="space-y-4">
          {p && (
            <Card title="Image">
              <Image unoptimized={Boolean(p.imageUrl && !p.imageUrl.includes("res.cloudinary.com"))} src={p.imageUrl || `/renders/${p.slug}.png`} alt="" width={400} height={400} className="w-full rounded-xl bg-cream/5" />
              <p className="mt-2 text-xs text-cream/45">
                {p.layers ? "This burger renders in 3D from its layer stack." : p.imageUrl ? "Using the uploaded photo." : "Using the studio render."}
              </p>
            </Card>
          )}
          {p && (
            <Card title="Danger zone">
              <ActionForm action={deleteProduct.bind(null, p.id)} submitLabel="Delete product" danger confirm={`Delete ${p.name}? This can't be undone.`} />
              <p className="mt-2 text-xs text-cream/40">Products that appear on past orders are hidden instead of deleted.</p>
            </Card>
          )}
        </div>
      </div>

      {p && (
        <Card title="Options & customisations" className="mt-4">
          <div className="space-y-6">
            {p.optionGroups.map((g) => (
              <div key={g.id} className="rounded-xl border border-cream/10 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <ActionForm action={saveOptionGroup.bind(null, p.id, g.id)} submitLabel="Save group" inline>
                    <input name="name" defaultValue={g.name} className="admin-input w-48" aria-label="Group name" />
                    <select name="type" defaultValue={g.type} className="admin-input w-auto" aria-label="Group type">
                      <option value="single">Pick one</option>
                      <option value="multi">Pick any</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="required" defaultChecked={g.required} className="accent-[#ff5722]" /> Required</label>
                  </ActionForm>
                  <ActionForm action={deleteOptionGroup.bind(null, p.id, g.id)} submitLabel="Remove group" danger inline confirm={`Remove the ${g.name} group?`} />
                </div>
                <ul className="mt-3 space-y-2">
                  {g.options.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center gap-2">
                      <ActionForm action={saveOptionChoice.bind(null, p.id, g.id, o.id)} submitLabel="Save" inline>
                        <input name="label" defaultValue={o.label} className="admin-input w-44" aria-label="Option label" />
                        <input name="price" defaultValue={dollars(o.priceCents)} className="admin-input w-24" aria-label="Extra price in dollars" />
                        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="available" defaultChecked={o.available} className="accent-[#ff5722]" /> Available</label>
                      </ActionForm>
                      <ActionForm action={deleteOptionChoice.bind(null, p.id, o.id)} submitLabel="×" danger inline />
                    </li>
                  ))}
                </ul>
                <ActionForm action={saveOptionChoice.bind(null, p.id, g.id, null)} submitLabel="Add option" inline className="mt-3">
                  <input name="label" placeholder="New option" className="admin-input w-44" aria-label="New option label" />
                  <input name="price" placeholder="0.00" className="admin-input w-24" aria-label="Extra price in dollars" />
                  <input type="hidden" name="available" value="on" />
                </ActionForm>
              </div>
            ))}
            <ActionForm action={saveOptionGroup.bind(null, p.id, null)} submitLabel="Add option group" inline>
              <input name="name" placeholder="e.g. Size, Extras, Sauce" className="admin-input w-56" aria-label="New group name" />
              <select name="type" className="admin-input w-auto" aria-label="New group type">
                <option value="multi">Pick any</option>
                <option value="single">Pick one</option>
              </select>
            </ActionForm>
          </div>
        </Card>
      )}
    </>
  );
}
