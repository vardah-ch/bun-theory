// The burger as data. The hero, the scroll dissection and the configurator
// all render from a list of LayerSpecs, so a burger someone builds and the
// one on the homepage are made of exactly the same parts.

export type BunVariant = "brioche" | "sesame" | "potato";
export type PattyVariant = "beef" | "smash" | "chicken" | "veg";
export type CheeseVariant = "cheddar" | "american" | "swiss";
export type SauceVariant = "signature" | "bbq" | "spicy" | "mustard";

export type LayerSpec =
  | { kind: "bunBottom"; variant: BunVariant }
  | { kind: "bunTop"; variant: BunVariant }
  | { kind: "patty"; variant: PattyVariant }
  | { kind: "cheese"; variant: CheeseVariant }
  | { kind: "sauce"; variant: SauceVariant }
  | { kind: "lettuce" }
  | { kind: "tomato" }
  | { kind: "onion" }
  | { kind: "pickles" }
  | { kind: "crispyOnion" }
  | { kind: "jalapeno" };

export type LayerKind = LayerSpec["kind"];

/** Vertical space each layer occupies in the stack (world units; bun radius ≈ 1). */
export function thickness(spec: LayerSpec): number {
  switch (spec.kind) {
    case "bunBottom": return spec.variant === "potato" ? 0.36 : 0.4;
    case "bunTop": return spec.variant === "potato" ? 0.74 : 0.86;
    case "patty": return { beef: 0.3, smash: 0.17, chicken: 0.32, veg: 0.28 }[spec.variant];
    case "cheese": return 0.035;
    case "sauce": return 0.022;
    case "lettuce": return 0.09;
    case "tomato": return 0.1;
    case "onion": return 0.055;
    case "pickles": return 0.045;
    case "crispyOnion": return 0.08;
    case "jalapeno": return 0.04;
  }
}

/**
 * Some layers settle into the one below: cheese melts over the patty edge,
 * sauce soaks into the crumb. A small negative gap keeps the stack from
 * looking like a pile of coasters.
 */
function settle(spec: LayerSpec): number {
  switch (spec.kind) {
    case "cheese": return -0.012;
    case "sauce": return -0.008;
    case "lettuce": return -0.02;
    default: return 0;
  }
}

export type PlacedLayer = { key: string; spec: LayerSpec; y: number; height: number; index: number };

/** Stack layers bottom-up. Keys are stable per kind+occurrence so React can animate entries/exits. */
export function stackLayers(specs: LayerSpec[]): { layers: PlacedLayer[]; height: number } {
  let y = 0;
  const seen: Record<string, number> = {};
  const layers = specs.map((spec, index) => {
    const n = (seen[spec.kind] = (seen[spec.kind] ?? 0) + 1);
    y += index === 0 ? 0 : settle(spec);
    const placed = { key: `${spec.kind}-${n}`, spec, y, height: thickness(spec), index };
    y += placed.height;
    return placed;
  });
  return { layers, height: y };
}

/** Specimen Nº 001, The Classic: the burger the homepage dissects. */
export const CLASSIC: LayerSpec[] = [
  { kind: "bunBottom", variant: "sesame" },
  { kind: "sauce", variant: "signature" },
  { kind: "patty", variant: "beef" },
  { kind: "cheese", variant: "cheddar" },
  { kind: "onion" },
  { kind: "tomato" },
  { kind: "lettuce" },
  { kind: "sauce", variant: "signature" },
  { kind: "bunTop", variant: "sesame" },
];

/**
 * Apply menu customisations (option ids from the product's "Extras" and
 * "Hold the…" groups) to a burger's stack, so the 3D model shows what was ordered.
 */
export function customiseLayers(base: LayerSpec[], optionIds: string[]): LayerSpec[] {
  const has = (id: string) => optionIds.includes(id);
  const drop = new Set<LayerSpec["kind"]>([
    ...(has("no-onion") ? (["onion"] as const) : []),
    ...(has("no-tomato") ? (["tomato"] as const) : []),
    ...(has("no-lettuce") ? (["lettuce"] as const) : []),
    ...(has("no-sauce") ? (["sauce"] as const) : []),
  ]);
  let out = base.filter((l) => !drop.has(l.kind));
  const insertAfterLast = (kind: LayerSpec["kind"], spec: LayerSpec) => {
    const i = out.map((l) => l.kind).lastIndexOf(kind);
    if (i >= 0) out = [...out.slice(0, i + 1), spec, ...out.slice(i + 1)];
  };
  if (has("extra-patty")) {
    const patty = out.find((l) => l.kind === "patty");
    if (patty) insertAfterLast("patty", patty);
  }
  if (has("extra-cheese")) {
    const cheese = out.find((l) => l.kind === "cheese") ?? ({ kind: "cheese", variant: "cheddar" } as LayerSpec);
    const lastPatty = out.map((l) => l.kind).lastIndexOf("patty");
    out = [...out.slice(0, lastPatty + 1), cheese, ...out.slice(lastPatty + 1)];
  }
  const beforeVeg = (spec: LayerSpec) => {
    // Hot toppings sit on the cheese, under the cold vegetables.
    const kinds = out.map((l) => l.kind);
    const lastHot = Math.max(kinds.lastIndexOf("cheese"), kinds.lastIndexOf("patty"));
    out = [...out.slice(0, lastHot + 1), spec, ...out.slice(lastHot + 1)];
  };
  if (has("crispy-onions") && !out.some((l) => l.kind === "crispyOnion")) beforeVeg({ kind: "crispyOnion" });
  if (has("jalapenos") && !out.some((l) => l.kind === "jalapeno")) beforeVeg({ kind: "jalapeno" });
  return out;
}
