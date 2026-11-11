import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Badge, ButtonLink, Card, PageHeader, money } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { toggleProductAvailability } from "../../actions/catalog";

export default async function ProductsPage() {
  await requireStaff();
  const [products, categories] = await Promise.all([
    db.product.findMany({ orderBy: [{ categorySlug: "asc" }, { sort: "asc" }] }),
    db.category.findMany({ orderBy: { sort: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Products" kicker={`${products.length} on file`}>
        <ButtonLink href="/admin/products/new">+ New product</ButtonLink>
      </PageHeader>
      <div className="space-y-6">
        {categories.map((c) => {
          const list = products.filter((p) => p.categorySlug === c.slug);
          if (!list.length) return null;
          return (
            <Card key={c.slug} title={c.name}>
              <ul className="divide-y divide-cream/10">
                {list.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-4 py-3">
                    <Image unoptimized={Boolean(p.imageUrl && !p.imageUrl.includes("res.cloudinary.com"))} src={p.imageUrl || `/photos/${p.slug}.jpg`} alt="" width={56} height={56} className="h-14 w-14 rounded-lg bg-cream/5 object-cover" />
                    <div className="min-w-48 flex-1">
                      <Link href={`/admin/products/${p.id}`} className="text-lg hover:text-fire">{p.name}</Link>
                      <p className="text-xs text-cream/45">/menu/{p.slug}</p>
                    </div>
                    <span className="tabular-nums">{money(p.priceCents)}</span>
                    {p.featured && <Badge tone="fire">featured</Badge>}
                    <Badge tone={p.available ? "good" : "neutral"}>{p.available ? "on menu" : "sold out / hidden"}</Badge>
                    <ActionForm action={toggleProductAvailability.bind(null, p.id)} submitLabel={p.available ? "Mark sold out" : "Put back on"} inline />
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
