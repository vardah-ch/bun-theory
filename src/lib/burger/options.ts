// The configurator's ingredient catalogue (SAMPLE prices). Each option knows
// how it changes the 3D stack, so the price, the cart line and the model on
// screen always come from the same selection.
import type { BunVariant, CheeseVariant, LayerSpec, PattyVariant, SauceVariant } from "./layers";

export type BuildOption = { id: string; label: string; priceCents: number; note?: string };
export type BuildGroup = {
  id: "bun" | "patty" | "cheese" | "veg" | "sauce" | "extras";
  name: string;
  type: "single" | "multi";
  /** Single groups that may be left empty ("No cheese"). */
  optional?: boolean;
  options: BuildOption[];
};

export const BUILD_BASE_CENTS = 800;

/** Cart/order identity for configurator burgers. */
export const CUSTOM_BUILD_PRODUCT = { id: "p-build", slug: "build", name: "Your build" };

export const BUILD_GROUPS: BuildGroup[] = [
  {
    id: "bun", name: "Bun", type: "single",
    options: [
      { id: "brioche", label: "Brioche", priceCents: 0, note: "Glossy, buttery, a bit sweet" },
      { id: "sesame", label: "Sesame", priceCents: 0, note: "The classic crown" },
      { id: "potato", label: "Potato", priceCents: 0, note: "Soft, squashable, smash-friendly" },
    ],
  },
  {
    id: "patty", name: "Patty", type: "single",
    options: [
      { id: "single", label: "Single beef", priceCents: 0, note: "180 g chuck & brisket" },
      { id: "double", label: "Double beef", priceCents: 350, note: "Two smashed, lacy edges" },
      { id: "chicken", label: "Fried chicken", priceCents: 50, note: "Buttermilk thigh" },
      { id: "veg", label: "Vegetarian", priceCents: 0, note: "Black bean & beet" },
    ],
  },
  {
    id: "cheese", name: "Cheese", type: "single", optional: true,
    options: [
      { id: "cheddar", label: "Cheddar", priceCents: 100 },
      { id: "american", label: "American", priceCents: 100 },
      { id: "swiss", label: "Swiss", priceCents: 120 },
    ],
  },
  {
    id: "veg", name: "Vegetables", type: "multi",
    options: [
      { id: "lettuce", label: "Lettuce", priceCents: 0 },
      { id: "tomato", label: "Tomato", priceCents: 50 },
      { id: "onion", label: "Red onion", priceCents: 0 },
      { id: "pickles", label: "Pickles", priceCents: 30 },
    ],
  },
  {
    id: "sauce", name: "Sauce", type: "multi",
    options: [
      { id: "signature", label: "House sauce", priceCents: 0 },
      { id: "bbq", label: "BBQ", priceCents: 30 },
      { id: "spicy", label: "Spicy mayo", priceCents: 30 },
      { id: "mustard", label: "Mustard", priceCents: 0 },
    ],
  },
  {
    id: "extras", name: "Extras", type: "multi",
    options: [
      { id: "extra-cheese", label: "Extra cheese", priceCents: 120 },
      { id: "extra-patty", label: "Extra patty", priceCents: 350 },
      { id: "crispy-onions", label: "Crispy onions", priceCents: 90 },
      { id: "jalapenos", label: "Jalapeños", priceCents: 80 },
    ],
  },
];

export type Build = {
  bun: BunVariant;
  patty: "single" | "double" | "chicken" | "veg";
  cheese: CheeseVariant | null;
  veg: ("lettuce" | "tomato" | "onion" | "pickles")[];
  sauce: SauceVariant[];
  extras: ("extra-cheese" | "extra-patty" | "crispy-onions" | "jalapenos")[];
};

export const DEFAULT_BUILD: Build = {
  bun: "sesame",
  patty: "single",
  cheese: "cheddar",
  veg: ["lettuce", "tomato", "onion"],
  sauce: ["signature"],
  extras: [],
};

/** Every distinct burger the builder can make. */
export const BUILD_COMBINATIONS = BUILD_GROUPS.reduce(
  (n, g) => n * (g.type === "multi" ? 2 ** g.options.length : g.options.length + (g.optional ? 1 : 0)),
  1,
);

/** Options for a selection. `groups` lets the server and the live builder use admin-edited prices. */
export function selectedOptions(b: Build, groups: BuildGroup[] = BUILD_GROUPS) {
  const opt = (group: BuildGroup["id"], id: string) => {
    const o = groups.find((g) => g.id === group)?.options.find((x) => x.id === id);
    if (!o) throw new Error(`Unavailable ingredient: ${group}/${id}`);
    return o;
  };
  const out: { group: string; option: BuildOption }[] = [
    { group: "Bun", option: opt("bun", b.bun) },
    { group: "Patty", option: opt("patty", b.patty) },
  ];
  if (b.cheese) out.push({ group: "Cheese", option: opt("cheese", b.cheese) });
  b.veg.forEach((v) => out.push({ group: "Vegetables", option: opt("veg", v) }));
  b.sauce.forEach((s) => out.push({ group: "Sauce", option: opt("sauce", s) }));
  b.extras.forEach((e) => out.push({ group: "Extras", option: opt("extras", e) }));
  return out;
}

export const buildPrice = (b: Build, groups: BuildGroup[] = BUILD_GROUPS) =>
  BUILD_BASE_CENTS + selectedOptions(b, groups).reduce((s, o) => s + o.option.priceCents, 0);

/** Drop any choice that isn't on offer (e.g. an ingredient the admin marked unavailable). */
export function sanitizeBuild(b: Build, groups: BuildGroup[]): Build {
  const ids = (g: BuildGroup["id"]) => groups.find((x) => x.id === g)?.options.map((o) => o.id) ?? [];
  const first = (g: BuildGroup["id"]) => ids(g)[0];
  return {
    bun: (ids("bun").includes(b.bun) ? b.bun : first("bun")) as Build["bun"],
    patty: (ids("patty").includes(b.patty) ? b.patty : first("patty")) as Build["patty"],
    cheese: b.cheese && ids("cheese").includes(b.cheese) ? b.cheese : null,
    veg: b.veg.filter((v) => ids("veg").includes(v)),
    sauce: b.sauce.filter((v) => ids("sauce").includes(v)),
    extras: b.extras.filter((v) => ids("extras").includes(v)),
  };
}

/**
 * Turn a selection into a physical stack, in the order a cook would build it:
 * heel, sauce, patty (cheese melted on each), extras that cook with the patty,
 * cold vegetables, top sauce, crown.
 */
export function buildLayers(b: Build): LayerSpec[] {
  const pattyVariant: PattyVariant = b.patty === "double" ? "smash" : b.patty === "single" ? "beef" : b.patty;
  const patties = (b.patty === "double" ? 2 : 1) + (b.extras.includes("extra-patty") ? 1 : 0);
  const cheeseSlices = b.cheese ? 1 + (b.extras.includes("extra-cheese") ? 1 : 0) : 0;
  const [bottomSauce, ...topSauces] = b.sauce;

  const layers: LayerSpec[] = [{ kind: "bunBottom", variant: b.bun }];
  if (bottomSauce) layers.push({ kind: "sauce", variant: bottomSauce });
  for (let i = 0; i < patties; i++) {
    layers.push({ kind: "patty", variant: pattyVariant });
    // Cheese goes on the patties from the top down, so a single slice sits on the top patty.
    if (b.cheese && i >= patties - cheeseSlices) layers.push({ kind: "cheese", variant: b.cheese });
  }
  if (b.extras.includes("crispy-onions")) layers.push({ kind: "crispyOnion" });
  if (b.extras.includes("jalapenos")) layers.push({ kind: "jalapeno" });
  if (b.veg.includes("pickles")) layers.push({ kind: "pickles" });
  if (b.veg.includes("onion")) layers.push({ kind: "onion" });
  if (b.veg.includes("tomato")) layers.push({ kind: "tomato" });
  if (b.veg.includes("lettuce")) layers.push({ kind: "lettuce" });
  topSauces.forEach((s) => layers.push({ kind: "sauce", variant: s }));
  layers.push({ kind: "bunTop", variant: b.bun });
  return layers;
}

/** Position of this exact configuration among all BUILD_COMBINATIONS: a stable, shareable "build number". */
export function buildNumber(b: Build): number {
  let n = 0;
  for (const g of BUILD_GROUPS) {
    if (g.type === "multi") {
      const chosen = (b[g.id] as string[]) ?? [];
      const mask = g.options.reduce((m, o, i) => (chosen.includes(o.id) ? m | (1 << i) : m), 0);
      n = n * 2 ** g.options.length + mask;
    } else {
      const v = b[g.id] as string | null;
      const idx = v === null ? 0 : g.options.findIndex((o) => o.id === v) + (g.optional ? 1 : 0);
      n = n * (g.options.length + (g.optional ? 1 : 0)) + Math.max(idx, 0);
    }
  }
  return n;
}

/** Validate an unknown object (e.g. from a cart line) back into a Build. */
export function parseBuild(raw: unknown): Build | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const ids = (g: BuildGroup["id"]) => BUILD_GROUPS.find((x) => x.id === g)!.options.map((o) => o.id);
  const one = (g: BuildGroup["id"], v: unknown) => (typeof v === "string" && ids(g).includes(v) ? v : null);
  const many = (g: BuildGroup["id"], v: unknown) => (Array.isArray(v) ? v.filter((x) => ids(g).includes(x)) : []);
  const bun = one("bun", r.bun), patty = one("patty", r.patty);
  if (!bun || !patty) return null;
  return {
    bun: bun as Build["bun"],
    patty: patty as Build["patty"],
    cheese: one("cheese", r.cheese) as Build["cheese"],
    veg: many("veg", r.veg) as Build["veg"],
    sauce: many("sauce", r.sauce) as Build["sauce"],
    extras: many("extras", r.extras) as Build["extras"],
  };
}
