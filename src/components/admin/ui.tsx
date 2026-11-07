import Link from "next/link";

export function PageHeader({ title, kicker, children }: { title: string; kicker?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <p className="type-annot text-fire">{kicker}</p>}
        <h1 className="type-display mt-1 text-5xl text-cream md:text-6xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-cream/10 bg-cream/[0.02] p-5 ${className}`}>
      {title && <h2 className="type-annot mb-4 text-cream/55">{title}</h2>}
      {children}
    </section>
  );
}

export function ButtonLink({ href, children, variant = "solid" }: { href: string; children: React.ReactNode; variant?: "solid" | "ghost" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${variant === "solid" ? "bg-fire text-ink hover:bg-cream" : "border border-cream/20 text-cream hover:border-cream"}`}
    >
      {children}
    </Link>
  );
}

export function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="type-annot text-cream/50">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-cream/35">{hint}</span>}
    </label>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "fire" | "good" | "warn" }) {
  const t = {
    neutral: "border-cream/20 text-cream/70",
    fire: "border-fire/50 text-fire",
    good: "border-emerald-400/40 text-emerald-300",
    warn: "border-amber-400/40 text-amber-300",
  }[tone];
  return <span className={`type-annot inline-flex items-center rounded-full border px-2 py-0.5 ${t}`}>{children}</span>;
}

export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export const dollarsToCents = (v: FormDataEntryValue | null) => Math.round(Number(String(v ?? "0").replace(/[^0-9.]/g, "")) * 100);
