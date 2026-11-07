import Link from "next/link";
import { ArrowDownRight } from "lucide-react";

/**
 * The hero is split into two typographic planes around the burger:
 * "NOT JUST A BURGER." sits behind the 3D canvas so the burger overlaps it,
 * "AN OBSESSION." sits in front. The depth comes from layering, not effects.
 */
export function HeroBack({ line }: { line: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-start px-5 pt-32 md:px-10 md:pt-36" aria-hidden="true">
      <p className="type-display max-w-[11ch] text-[22vw] text-cream/[0.92] md:text-[13.5vw]">{line}</p>
    </div>
  );
}

export function HeroFront({ line, sub }: { line: string; sub: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end px-5 pb-8 md:px-10 md:pb-10">
      <h1 className="sr-only">BUN THEORY: {line}</h1>

      {/* Specimen tag: the brand's lab-notebook voice, top right */}
      <div className="absolute right-5 top-36 hidden text-right md:right-10 md:block" aria-hidden="true">
        <p className="type-annot text-mustard">Specimen Nº 001</p>
        <p className="type-annot mt-1 text-cream/60">The Classic · 9 layers</p>
        <div className="ml-auto mt-3 h-px w-28 bg-cream/25" />
      </div>

      <div className="flex flex-col-reverse gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="pointer-events-auto max-w-md">
          <p className="max-w-sm text-base leading-snug text-cream/90 md:text-xl">
            {sub}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 md:mt-6 md:gap-3">
            <Link
              href="/menu"
              className="group inline-flex items-center gap-2 rounded-full bg-mustard px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink shadow-[0_10px_30px_-8px_rgba(255,180,40,0.6)] transition-transform duration-300 hover:-translate-y-0.5 md:gap-3 md:px-6 md:py-3.5 md:text-sm"
            >
              Explore the menu
              <ArrowDownRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-45deg]" aria-hidden="true" />
            </Link>
            <Link
              href="/build"
              className="inline-flex items-center rounded-full border border-cream/50 bg-ink/20 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-cream backdrop-blur-sm transition-colors hover:border-cream md:px-6 md:py-3.5 md:text-sm"
            >
              Build your burger
            </Link>
          </div>
        </div>

        <p className="type-display text-right text-[22vw] text-mustard drop-shadow-[0_6px_30px_rgba(120,20,0,0.45)] md:text-[13.5vw]" aria-hidden="true">
          {line}
        </p>
      </div>

      {/* Scroll cue: a vertical rule on the right edge, clear of the headline */}
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 md:right-10 md:flex" aria-hidden="true">
        <span className="type-annot text-cream/50 [writing-mode:vertical-rl]">Scroll to dissect</span>
        <span className="relative block h-12 w-px overflow-hidden bg-cream/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_1.8s_var(--ease-in-out-quint)_infinite] bg-mustard" />
        </span>
      </div>
    </div>
  );
}
