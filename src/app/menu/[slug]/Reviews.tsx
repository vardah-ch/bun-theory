"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import type { PublicReview } from "@/lib/data/catalog";
import { submitReview, type ReviewState } from "./review-action";

export function Reviews({ productId, productName, reviews }: { productId: string; productName: string; reviews: PublicReview[] }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview.bind(null, productId), {});
  const [rating, setRating] = useState(0);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section aria-labelledby="reviews-title" className="border-t border-cream/10 px-5 pb-40 pt-16 md:px-10 md:pb-24">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="type-annot text-fire">Field notes</p>
          <h2 id="reviews-title" className="type-display mt-3 text-6xl text-cream">What people said.</h2>
          {reviews.length > 0 ? (
            <p className="mt-3 text-cream/60">{avg.toFixed(1)} out of 5 from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
          ) : (
            <p className="mt-3 text-cream/60">No reviews of {productName} yet. Be the first.</p>
          )}

          {state.ok ? (
            <p role="status" className="mt-8 rounded-xl border border-emerald-400/30 p-4 text-cream/85">Thanks! Your review goes up once the kitchen has read it.</p>
          ) : (
            <form action={action} className="mt-8 space-y-4">
              <fieldset>
                <legend className="type-annot text-cream/55">Your rating</legend>
                <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}>
                      <Star className={`h-7 w-7 ${n <= rating ? "fill-fire text-fire" : "text-cream/25"}`} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <input type="hidden" name="rating" value={rating} />
              </fieldset>
              <input name="name" placeholder="Your name" maxLength={60} className="w-full rounded-xl border border-cream/15 bg-transparent px-4 py-3 text-cream placeholder:text-cream/30 focus:border-fire focus:outline-none" />
              <textarea name="body" rows={3} maxLength={800} placeholder={`How was the ${productName}?`} className="w-full resize-none rounded-xl border border-cream/15 bg-transparent px-4 py-3 text-cream placeholder:text-cream/30 focus:border-fire focus:outline-none" />
              {/* Honeypot: hidden from people, irresistible to bots */}
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              {state.error && <p role="alert" className="text-sm text-fire">{state.error}</p>}
              <button disabled={pending} className="rounded-full bg-fire px-6 py-3 text-sm font-semibold uppercase text-ink hover:bg-cream disabled:opacity-60">
                {pending ? "Sending…" : "Post review"}
              </button>
            </form>
          )}
        </div>

        <ul className="space-y-8 md:col-span-6 md:col-start-7">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-cream/10 pb-6">
              <p className="text-fire" aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}<span className="text-cream/20">{"★".repeat(5 - r.rating)}</span></p>
              <p className="mt-2 text-lg leading-relaxed text-cream/85">“{r.body}”</p>
              <p className="type-annot mt-3 text-cream/45">{r.name} · {new Date(r.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
