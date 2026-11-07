import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import type { SiteContent } from "@/lib/content/defaults";
import { Newsletter } from "./Newsletter";

/** Visit + footer in one: where, when, how to reach us, then the sign-off. */
export function Footer({ content }: { content: SiteContent }) {
  const b = content.business;
  return (
    <footer id="visit" className="relative z-20 bg-ink px-5 pb-10 pt-28 md:px-10 md:pt-40">
      <div className="grid gap-16 md:grid-cols-12">
        <div className="md:col-span-6">
          <p className="type-annot text-fire">Nº 008 · Find us</p>
          <h2 className="type-display mt-6 text-[16vw] text-cream md:text-[7.5vw]">
            Come
            <br />
            hungry.
          </h2>
          <address className="mt-10 not-italic">
            {b.addressLines.map((l) => (
              <p key={l} className="type-display text-3xl !leading-[1.05] text-cream md:text-4xl">
                {l}
              </p>
            ))}
            <a href={b.mapsUrl} target="_blank" rel="noreferrer" className="type-annot mt-4 inline-flex items-center gap-1.5 text-fire hover:text-cream">
              Open in maps <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </address>
        </div>

        <div className="grid gap-12 sm:grid-cols-2 md:col-span-6">
          <div>
            <h3 className="type-annot text-cream/50">Hours</h3>
            <dl className="mt-4 space-y-2">
              {b.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-6 border-b border-cream/10 pb-2">
                  <dt className="text-cream/80">{h.days}</dt>
                  <dd className="tabular-nums text-cream">
                    {h.open}–{h.close}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="type-annot text-cream/50">Talk to us</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href={`tel:${b.phone.replace(/[^+\d]/g, "")}`} className="text-cream hover:text-fire">{b.phone}</a>
              </li>
              <li>
                <a href={`mailto:${b.email}`} className="text-cream [overflow-wrap:anywhere] hover:text-fire">{b.email}</a>
              </li>
              {b.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cream/80 hover:text-fire">
                    {s.label} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2">
            <h3 className="type-annot text-cream/50">New burgers, first</h3>
            <p className="mt-3 max-w-sm text-cream/70">One email when something new hits the grill. That&apos;s it.</p>
            <Newsletter />
          </div>
        </div>
      </div>

      <div className="mt-24 flex flex-col gap-6 border-t border-cream/10 pt-10 md:flex-row md:items-end md:justify-between">
        <Link href="/" className="text-[18vw] leading-none text-cream md:text-[9vw]" aria-label="Bun Theory home">
          <Logo />
        </Link>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <Link href="/menu" className="rounded-full bg-fire px-7 py-4 text-sm font-semibold uppercase tracking-wide text-ink hover:bg-cream">
            Order now
          </Link>
          <p className="type-annot text-cream/40">© {b.name}. Sample content for demo purposes.</p>
        </div>
      </div>
    </footer>
  );
}
