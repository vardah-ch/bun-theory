import { Reveal } from "./Reveal";

// SAMPLE CONTENT: brand story placeholder in the brand's voice, for the owner to rewrite.
const ENTRIES = [
  { when: "Entry 01", title: "A question at 2 a.m.", body: "Why does the third bite of a good burger always beat the first? We wrote it on a napkin. The napkin is framed by the till." },
  { when: "Entry 14", title: "Forty-one buns later", body: "Brioche held up. Potato squashed beautifully. Sesame looked the part. We kept all three and stopped arguing." },
  { when: "Entry 37", title: "The order matters", body: "Sauce on the heel, cheese on the hot patty, lettuce against the crown. Swap any two and it's worse. We tested that too." },
  { when: "Entry 52", title: "Doors open", body: "One grill, one plate for veg, thirty-four seats. The notebook is still on the pass. Ask to see it." },
];

/** The story as excerpts from a kitchen notebook, matching the specimen voice of the homepage. */
export function Story() {
  return (
    <section id="story" aria-labelledby="story-title" className="theme-light relative z-20 bg-ink px-5 py-24 md:px-10 md:py-40">
      <div className="grid gap-16 md:grid-cols-12">
        <div className="md:sticky md:top-32 md:col-span-5 md:self-start">
          <p className="type-annot text-fire">Nº 006 · Our story</p>
          <h2 id="story-title" className="type-display mt-6 text-[16vw] text-cream md:text-[7.5vw]">
            It started
            <br />
            as a theory.
          </h2>
          <p className="mt-8 max-w-sm text-lg leading-relaxed text-cream/70">
            The hypothesis: a burger is only as good as the order you build it in. Fifty-two notebook entries later, we opened a restaurant to test it in public.
          </p>
        </div>

        <ol className="relative md:col-span-6 md:col-start-7">
          <span className="absolute bottom-0 left-[7px] top-2 w-px bg-cream/15" aria-hidden="true" />
          {ENTRIES.map((e, i) => (
            <Reveal as="li" key={e.when} delay={i * 0.05} className="relative pb-16 pl-10 last:pb-0">
              <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border border-fire bg-ink" aria-hidden="true" />
              <p className="type-annot text-cream/45">{e.when}</p>
              <h3 className="type-display mt-2 text-5xl text-cream md:text-6xl">{e.title}</h3>
              <p className="mt-3 max-w-md leading-relaxed text-cream/70">{e.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
