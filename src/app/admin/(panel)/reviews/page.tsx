import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { moderateReview } from "../../actions/settings";

export default async function ReviewsPage() {
  await requireStaff();
  const reviews = await db.review.findMany({ orderBy: [{ approved: "asc" }, { createdAt: "desc" }], include: { product: { select: { name: true } } }, take: 200 });
  return (
    <>
      <PageHeader title="Reviews" kicker="Reviews from product pages wait here until approved" />
      {reviews.length === 0 ? (
        <Card><p className="py-8 text-center text-cream/45">No reviews yet.</p></Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-amber-300" aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}<span className="text-cream/20">{"★".repeat(5 - r.rating)}</span></span>
                <span>{r.name}</span>
                {r.product && <span className="type-annot text-cream/45">on {r.product.name}</span>}
                <Badge tone={r.approved ? "good" : "fire"}>{r.approved ? "published" : "waiting"}</Badge>
                <span className="text-xs text-cream/35">{r.createdAt.toLocaleString()}</span>
              </div>
              <p className="mt-2 max-w-3xl text-cream/80">{r.body}</p>
              <div className="mt-3 flex gap-2">
                {!r.approved && <ActionForm action={moderateReview.bind(null, r.id, true)} submitLabel="Publish" inline />}
                <ActionForm action={moderateReview.bind(null, r.id, false)} submitLabel="Delete" danger inline confirm="Delete this review?" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
