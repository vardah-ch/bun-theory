import Link from "next/link";
import { Nav } from "@/components/layout/Nav";

export default function NotFound() {
  return (
    <div className="theme-light min-h-dvh bg-ink">
      <Nav />
      <main className="relative z-20 flex min-h-dvh flex-col items-start justify-center bg-ink px-5 md:px-10">
        <p className="type-annot text-fire">Error 404 · Specimen missing</p>
        <h1 className="type-display mt-4 text-[20vw] leading-[0.8] text-cream md:text-[11vw]">Not on<br />the board.</h1>
        <p className="mt-6 max-w-md text-lg text-cream/65">That page isn&apos;t here. It may have sold out, moved, or never existed.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/menu" className="rounded-full bg-fire px-6 py-3.5 text-sm font-semibold uppercase text-ink hover:bg-cream">See the menu</Link>
          <Link href="/" className="rounded-full border border-cream/25 px-6 py-3.5 text-sm font-semibold uppercase text-cream hover:border-cream">Home</Link>
        </div>
      </main>
    </div>
  );
}
