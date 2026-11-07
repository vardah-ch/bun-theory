import type { LayerSpec } from "@/lib/burger/layers";

export type CategorySlug =
  | "signature"
  | "smash"
  | "chicken"
  | "loaded-fries"
  | "sides"
  | "drinks"
  | "desserts"
  | "combos";

export type Category = { slug: CategorySlug; name: string; blurb: string; sort: number };

export type Option = { id: string; label: string; priceCents: number };

/** "single": pick exactly one (size, flavour). "multi": any number of add-ons. */
export type OptionGroup = {
  id: string;
  name: string;
  type: "single" | "multi";
  required?: boolean;
  max?: number;
  options: Option[];
};

/** Visuals for non-burger items, drawn procedurally until real photography is uploaded. */
export type Artwork = "fries" | "loaded-fries" | "rings" | "cup" | "shake" | "cookie" | "softserve" | "combo" | "pickles";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  /** One line for cards. */
  tagline: string;
  /** A short paragraph for the product page. */
  description: string;
  priceCents: number;
  available: boolean;
  featured?: boolean;
  tags?: ("spicy" | "vegetarian" | "new" | "bestseller")[];
  /** Burgers carry their stack, so they render in 3D from the same parts as the homepage. */
  layers?: LayerSpec[];
  artwork?: Artwork;
  /** Optional uploaded photo (Cloudinary or any CDN URL). Takes priority over the artwork. */
  imageUrl?: string;
  optionGroups?: OptionGroup[];
  calories?: number;
};
