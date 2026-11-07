import { Nav } from "@/components/layout/Nav";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Footer } from "@/components/layout/Footer";
import { HeroBack, HeroFront } from "@/components/home/Hero";
import { StageLayer } from "@/components/home/StageLayer";
import { Dissection } from "@/components/home/Dissection";
import { Lineup } from "@/components/home/Lineup";
import { Sourcing } from "@/components/home/Sourcing";
import { BuildTeaser } from "@/components/home/BuildTeaser";
import { Combos } from "@/components/home/Combos";
import { Story } from "@/components/home/Story";
import { Experience } from "@/components/home/Experience";
import { SizzleStrip } from "@/components/home/SizzleStrip";
import { HungryBar } from "@/components/home/HungryBar";
import { getMenu, getSiteContent } from "@/lib/data/catalog";

export default async function Home() {
  const [{ products }, content] = await Promise.all([getMenu(), getSiteContent()]);
  const signature = products.filter((p) => p.featured && p.category === "signature").slice(0, 4);
  const hero = products.find((p) => p.slug === "the-classic") ?? signature[0];
  return (
    <>
      <SmoothScroll />
      <Nav />
      <StageLayer />
      <main>
        <section data-stage-zone aria-label="Introduction" className="relative h-dvh min-h-[640px] overflow-hidden">
          <HeroBack line={content.hero.lineBack} />
          <HeroFront line={content.hero.lineFront} sub={content.hero.sub} />
        </section>
        <Dissection finale={content.finale} />
        <SizzleStrip />
        <Lineup products={signature} />
        <Sourcing />
        <BuildTeaser />
        <Combos combos={products.filter((p) => p.category === "combos")} products={products} />
        <Story />
        <Experience />
      </main>
      <Footer content={content} />
      {hero && <HungryBar product={hero} />}
    </>
  );
}
