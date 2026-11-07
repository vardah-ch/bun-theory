/**
 * Two crossing tickers of sensory words between the dissection and the menu.
 * Taste words ("dripping", "crackling", "toasted") make people hungrier than
 * descriptions of quality do, and the crossing bands echo the stacked layers.
 * Every claim here matches the recipe notes above: nothing invented.
 */
const TOP = ["Smashed to order", "Cheddar, melting", "Toasted brioche", "House sauce", "Lacy, crackling edges"];
const BOTTOM = ["Hot off the grill", "Salt & pepper only", "Pickle-brine tang", "Baked at 5 a.m.", "Juice on the paper"];

function Row({ words, className, reverse }: { words: string[]; className: string; reverse?: boolean }) {
  const run = [...words, ...words];
  return (
    <div className={`flex overflow-hidden whitespace-nowrap py-3 md:py-4 ${className}`}>
      {[0, 1].map((copy) => (
        <ul
          key={copy}
          aria-hidden={copy === 1}
          className={`flex shrink-0 items-center gap-6 pr-6 motion-reduce:animate-none md:gap-10 md:pr-10 ${reverse ? "animate-[marquee_38s_linear_infinite_reverse]" : "animate-[marquee_32s_linear_infinite]"}`}
        >
          {run.map((w, i) => (
            <li key={i} className="type-display flex items-center gap-6 text-[11vw] leading-none md:gap-10 md:text-[5.5vw]">
              {w}
              <span className="inline-block h-[0.5em] w-[0.5em] rounded-full bg-current opacity-60" aria-hidden="true" />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

export function SizzleStrip() {
  return (
    <section aria-label="What you're about to eat" className="relative z-20 overflow-hidden bg-ink py-10 md:py-16">
      <p className="sr-only">{[...TOP, ...BOTTOM].join(". ")}.</p>
      <div className="-rotate-2 scale-105">
        <Row words={TOP} className="bg-mustard text-ink" />
      </div>
      <div className="-mt-2 rotate-1 scale-105">
        <Row words={BOTTOM} reverse className="bg-ketchup text-cream" />
      </div>
    </section>
  );
}
