// SAMPLE CONTENT. Demo menu for development and the initial database seed.
// Names, prices and descriptions are placeholders for the restaurant to
// replace in the admin. Nothing here describes real orders or customers.
import { CLASSIC, type LayerSpec } from "@/lib/burger/layers";
import type { Category, OptionGroup, Product } from "./types";

export const CATEGORIES: Category[] = [
  { slug: "signature", name: "Signature Burgers", blurb: "The ones we'd put our name on. We did.", sort: 1 },
  { slug: "smash", name: "Smash Burgers", blurb: "Thin, lacy edges. Smashed on a screaming-hot plate.", sort: 2 },
  { slug: "chicken", name: "Chicken Burgers", blurb: "Buttermilk-brined, double-dredged, loud crunch.", sort: 3 },
  { slug: "loaded-fries", name: "Loaded Fries", blurb: "Fries that turned into a meal.", sort: 4 },
  { slug: "sides", name: "Sides", blurb: "For the table. Or not.", sort: 5 },
  { slug: "drinks", name: "Drinks", blurb: "Cold, fizzy, or thick enough to need a spoon.", sort: 6 },
  { slug: "desserts", name: "Desserts", blurb: "Small, sweet, non-negotiable.", sort: 7 },
  { slug: "combos", name: "Combos", blurb: "Burger, fries, drink. The maths works out.", sort: 8 },
];

const burgerExtras: OptionGroup = {
  id: "extras",
  name: "Extras",
  type: "multi",
  options: [
    { id: "extra-cheese", label: "Extra cheese", priceCents: 120 },
    { id: "extra-patty", label: "Extra patty", priceCents: 350 },
    { id: "crispy-onions", label: "Crispy onions", priceCents: 90 },
    { id: "jalapenos", label: "Jalapeños", priceCents: 80 },
  ],
};

const burgerRemovals: OptionGroup = {
  id: "hold",
  name: "Hold the…",
  type: "multi",
  options: [
    { id: "no-onion", label: "No onion", priceCents: 0 },
    { id: "no-tomato", label: "No tomato", priceCents: 0 },
    { id: "no-lettuce", label: "No lettuce", priceCents: 0 },
    { id: "no-sauce", label: "No sauce", priceCents: 0 },
  ],
};

const friesSize: OptionGroup = {
  id: "size",
  name: "Size",
  type: "single",
  required: true,
  options: [
    { id: "regular", label: "Regular", priceCents: 0 },
    { id: "large", label: "Large", priceCents: 150 },
  ],
};

const drinkChoice: OptionGroup = {
  id: "drink",
  name: "Drink",
  type: "single",
  required: true,
  options: [
    { id: "cola", label: "Cola", priceCents: 0 },
    { id: "lemonade", label: "Smoked lemonade", priceCents: 0 },
    { id: "shake", label: "Upgrade to a shake", priceCents: 300 },
  ],
};

const L = {
  emberDouble: [
    { kind: "bunBottom", variant: "brioche" },
    { kind: "sauce", variant: "bbq" },
    { kind: "patty", variant: "smash" },
    { kind: "cheese", variant: "american" },
    { kind: "patty", variant: "smash" },
    { kind: "cheese", variant: "american" },
    { kind: "crispyOnion" },
    { kind: "bunTop", variant: "brioche" },
  ],
  hotTheory: [
    { kind: "bunBottom", variant: "potato" },
    { kind: "sauce", variant: "spicy" },
    { kind: "patty", variant: "beef" },
    { kind: "cheese", variant: "cheddar" },
    { kind: "jalapeno" },
    { kind: "onion" },
    { kind: "lettuce" },
    { kind: "sauce", variant: "spicy" },
    { kind: "bunTop", variant: "potato" },
  ],
  professor: [
    { kind: "bunBottom", variant: "brioche" },
    { kind: "sauce", variant: "mustard" },
    { kind: "patty", variant: "beef" },
    { kind: "cheese", variant: "swiss" },
    { kind: "crispyOnion" },
    { kind: "pickles" },
    { kind: "bunTop", variant: "brioche" },
  ],
  singleSmash: [
    { kind: "bunBottom", variant: "potato" },
    { kind: "sauce", variant: "signature" },
    { kind: "patty", variant: "smash" },
    { kind: "cheese", variant: "american" },
    { kind: "pickles" },
    { kind: "onion" },
    { kind: "bunTop", variant: "potato" },
  ],
  doubleSmash: [
    { kind: "bunBottom", variant: "potato" },
    { kind: "sauce", variant: "signature" },
    { kind: "patty", variant: "smash" },
    { kind: "cheese", variant: "american" },
    { kind: "patty", variant: "smash" },
    { kind: "cheese", variant: "american" },
    { kind: "pickles" },
    { kind: "bunTop", variant: "potato" },
  ],
  fireBird: [
    { kind: "bunBottom", variant: "brioche" },
    { kind: "sauce", variant: "spicy" },
    { kind: "patty", variant: "chicken" },
    { kind: "pickles" },
    { kind: "lettuce" },
    { kind: "bunTop", variant: "brioche" },
  ],
  buttermilk: [
    { kind: "bunBottom", variant: "sesame" },
    { kind: "sauce", variant: "signature" },
    { kind: "patty", variant: "chicken" },
    { kind: "cheese", variant: "cheddar" },
    { kind: "tomato" },
    { kind: "lettuce" },
    { kind: "bunTop", variant: "sesame" },
  ],
  greenhouse: [
    { kind: "bunBottom", variant: "sesame" },
    { kind: "sauce", variant: "mustard" },
    { kind: "patty", variant: "veg" },
    { kind: "cheese", variant: "swiss" },
    { kind: "tomato" },
    { kind: "onion" },
    { kind: "lettuce" },
    { kind: "bunTop", variant: "sesame" },
  ],
} satisfies Record<string, LayerSpec[]>;

const burger = (p: Omit<Product, "optionGroups" | "available"> & { available?: boolean }): Product => ({
  available: true,
  optionGroups: [burgerExtras, burgerRemovals],
  ...p,
});

export const PRODUCTS: Product[] = [
  burger({
    id: "p-classic", slug: "the-classic", name: "The Classic", category: "signature", priceCents: 1350, featured: true,
    tags: ["bestseller"], layers: CLASSIC, calories: 820,
    tagline: "The one on the homepage. Nine layers in the right order.",
    description: "180 g chuck-and-brisket patty, aged cheddar, beefsteak tomato, shaved red onion, iceberg and house sauce on a sesame brioche. This is the burger the rest of the menu is measured against.",
  }),
  burger({
    id: "p-ember", slug: "ember-double", name: "Ember Double", category: "signature", priceCents: 1650, featured: true,
    layers: L.emberDouble, calories: 1090,
    tagline: "Two smashed patties, American cheese, crispy onions, BBQ.",
    description: "Two thin patties smashed hard enough to lace at the edges, two slices of American melted between them, crispy onions for crunch and a smoky BBQ glaze. Brioche, because it can take it.",
  }),
  burger({
    id: "p-hot", slug: "hot-theory", name: "Hot Theory", category: "signature", priceCents: 1500, featured: true,
    tags: ["spicy"], layers: L.hotTheory, calories: 880,
    tagline: "Jalapeños, spicy mayo top and bottom. Not for the polite.",
    description: "Our Classic patty under cheddar and pickled jalapeños, with spicy mayo on both buns so there's no escaping it. Red onion and iceberg to cool it down a bit, not a lot.",
  }),
  burger({
    id: "p-prof", slug: "the-professor", name: "The Professor", category: "signature", priceCents: 1700, featured: true,
    tags: ["new"], layers: L.professor, calories: 940,
    tagline: "Swiss, mustard, crispy onions, pickles. Sharp and nutty.",
    description: "A patty with Swiss cheese melted on, grainy mustard, a heap of crispy onions and our dill pickles. It's the most grown-up thing on the menu, and it knows.",
  }),
  burger({
    id: "p-ss", slug: "single-smash", name: "Single Smash", category: "smash", priceCents: 950, layers: L.singleSmash, calories: 560,
    tagline: "One lacy patty, American, pickles, onion. Quick and right.",
    description: "A single 100 g ball smashed thin on the plate, American cheese, pickles, onion and house sauce on a soft potato bun.",
  }),
  burger({
    id: "p-ds", slug: "double-smash", name: "Double Smash", category: "smash", priceCents: 1250, tags: ["bestseller"], layers: L.doubleSmash, calories: 830,
    tagline: "The single, twice. The cheese does the gluing.",
    description: "Two smashed patties, two slices of American, pickles and house sauce on a potato bun. Most of our regulars end up here.",
  }),
  burger({
    id: "p-fire", slug: "fire-bird", name: "Fire Bird", category: "chicken", priceCents: 1250, tags: ["spicy"], layers: L.fireBird, calories: 760,
    tagline: "Hot-oil-brushed fried thigh, pickles, slaw-cold lettuce.",
    description: "A buttermilk-brined thigh, fried twice and brushed with chilli oil while it's still crackling. Pickles, lettuce and spicy mayo on brioche.",
  }),
  burger({
    id: "p-butter", slug: "buttermilk-classic", name: "Buttermilk Classic", category: "chicken", priceCents: 1150, layers: L.buttermilk, calories: 720,
    tagline: "Crisp chicken, cheddar, tomato, house sauce. No heat.",
    description: "The same brined and double-dredged thigh, no chilli. Cheddar, tomato, lettuce and house sauce on a sesame bun.",
  }),
  burger({
    id: "p-green", slug: "greenhouse", name: "Greenhouse", category: "signature", priceCents: 1300, tags: ["vegetarian"], layers: L.greenhouse, calories: 640,
    tagline: "Black bean and beet patty, Swiss, the full garden.",
    description: "A black bean, beetroot and smoked mushroom patty seared on the same plate for the same crust. Swiss, tomato, onion, lettuce and mustard. Ask us to cook it on a separate plate.",
  }),
  {
    id: "p-tf", slug: "theory-fries", name: "Theory Fries", category: "loaded-fries", priceCents: 750, available: true, artwork: "loaded-fries",
    tagline: "House sauce, melted cheddar, crispy onions, chives.",
    description: "Skin-on fries, double-cooked, buried under cheddar sauce, house sauce and crispy onions.", optionGroups: [friesSize],
  },
  {
    id: "p-jf", slug: "dirty-jalapeno-fries", name: "Dirty Jalapeño Fries", category: "loaded-fries", priceCents: 800, available: true, artwork: "loaded-fries", tags: ["spicy"],
    tagline: "Pickled jalapeños, spicy mayo, beef crumbs.",
    description: "Our fries with smashed-patty crumbs, pickled jalapeños and a lot of spicy mayo.", optionGroups: [friesSize],
  },
  {
    id: "p-fries", slug: "fries", name: "Fries", category: "sides", priceCents: 400, available: true, artwork: "fries", tags: ["vegetarian"],
    tagline: "Skin-on, double-cooked, sea salt.", description: "Cut in-house, blanched, rested, then fried to order.", optionGroups: [friesSize],
  },
  {
    id: "p-rings", slug: "onion-rings", name: "Onion Rings", category: "sides", priceCents: 500, available: true, artwork: "rings", tags: ["vegetarian"],
    tagline: "Beer-battered, thick-cut, with house sauce.", description: "Thick sweet-onion rings in a lager batter, with a pot of house sauce.",
  },
  {
    id: "p-pick", slug: "fried-pickles", name: "Fried Pickles", category: "sides", priceCents: 450, available: true, artwork: "pickles", tags: ["vegetarian"],
    tagline: "Dill chips in cornmeal, ranch for dipping.", description: "Our own dill pickles, cornmeal-crusted and fried.",
  },
  {
    id: "p-cola", slug: "cola", name: "Cola", category: "drinks", priceCents: 300, available: true, artwork: "cup",
    tagline: "Ice cold. Free refills in-house.", description: "A big cup of cola over plenty of ice.",
  },
  {
    id: "p-lem", slug: "smoked-lemonade", name: "Smoked Lemonade", category: "drinks", priceCents: 450, available: true, artwork: "cup", tags: ["new"],
    tagline: "Lemons charred on the grill, then squeezed.", description: "Grill-charred lemons, cane sugar and a pinch of salt. Tart, a little smoky.",
  },
  {
    id: "p-shake", slug: "thick-shake", name: "Thick Shake", category: "drinks", priceCents: 650, available: true, artwork: "shake",
    tagline: "Spoon recommended.", description: "Frozen custard blended thick.",
    optionGroups: [{ id: "flavour", name: "Flavour", type: "single", required: true, options: [
      { id: "vanilla", label: "Vanilla bean", priceCents: 0 },
      { id: "chocolate", label: "Dark chocolate", priceCents: 0 },
      { id: "caramel", label: "Salted caramel", priceCents: 50 },
    ] }],
  },
  {
    id: "p-cookie", slug: "brown-butter-cookie", name: "Brown Butter Cookie", category: "desserts", priceCents: 350, available: true, artwork: "cookie",
    tagline: "Crisp edge, soft middle, flaky salt.", description: "Brown butter, two kinds of chocolate, baked through the day.",
  },
  {
    id: "p-soft", slug: "soft-serve", name: "Soft Serve", category: "desserts", priceCents: 450, available: true, artwork: "softserve",
    tagline: "Vanilla custard swirl, burnt-honey drizzle.", description: "Vanilla frozen custard with a burnt-honey drizzle and cookie crumb.",
  },
  {
    id: "p-combo1", slug: "classic-combo", name: "Classic Combo", category: "combos", priceCents: 1900, available: true, artwork: "combo", featured: true, tags: ["bestseller"],
    tagline: "The Classic, regular fries and a drink.", description: "Our flagship with fries and a cola or lemonade. $1.50 less than buying them separately.",
    layers: CLASSIC, optionGroups: [drinkChoice, burgerExtras],
  },
  {
    id: "p-combo2", slug: "double-date", name: "Double Date", category: "combos", priceCents: 3900, available: true, artwork: "combo",
    tagline: "Any two signatures, two fries, two drinks.", description: "Two signature burgers (tell us which in the notes), two regular fries and two drinks.",
    optionGroups: [drinkChoice],
  },
  {
    id: "p-combo3", slug: "smash-and-shake", name: "Smash & Shake", category: "combos", priceCents: 2050, available: true, artwork: "combo",
    tagline: "Double Smash, fries, thick shake.", description: "A Double Smash, regular fries and a thick shake in any flavour.",
    layers: L.doubleSmash,
  },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const byCategory = (slug: string) => PRODUCTS.filter((p) => p.category === slug);
export const featured = () => PRODUCTS.filter((p) => p.featured && p.category === "signature");

export { formatPrice } from "@/lib/format";
