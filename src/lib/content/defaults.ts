// SAMPLE CONTENT. Default site copy and business details. In Phase 8 these
// become the initial SiteContent record that the admin edits; the public site
// reads from the database and falls back to these values.

export type OpeningHours = { days: string; open: string; close: string }[];

export type SiteContent = {
  hero: { lineBack: string; lineFront: string; sub: string };
  finale: { headline: string; accent: string };
  business: {
    name: string;
    addressLines: string[];
    mapsUrl: string;
    phone: string;
    email: string;
    hours: OpeningHours;
    socials: { label: string; url: string }[];
  };
  banner: { enabled: boolean; text: string; href: string };
  currency: string;
  delivery: { feeCents: number; freeOverCents: number; minOrderCents: number; etaMinutes: [number, number] };
  taxRate: number;
};

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    lineBack: "Not just a burger.",
    lineFront: "An obsession.",
    sub: "Built with fire. Layered with obsession. Made to be remembered.",
  },
  finale: { headline: "The art of a", accent: "perfect bite." },
  business: {
    name: "BUN THEORY",
    addressLines: ["[Street address]", "[City, Postcode]"],
    mapsUrl: "https://maps.google.com",
    phone: "+1 (000) 000-0000",
    email: "hello@buntheory.example",
    hours: [
      { days: "Mon – Thu", open: "12:00", close: "22:00" },
      { days: "Fri – Sat", open: "12:00", close: "00:00" },
      { days: "Sun", open: "12:00", close: "21:00" },
    ],
    socials: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "TikTok", url: "https://tiktok.com" },
    ],
  },
  banner: { enabled: true, text: "New: The Professor. Swiss, mustard, crispy onions.", href: "/menu/the-professor" },
  currency: "USD",
  delivery: { feeCents: 350, freeOverCents: 3500, minOrderCents: 1200, etaMinutes: [25, 40] },
  taxRate: 0,
};
