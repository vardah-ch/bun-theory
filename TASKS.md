# BUN THEORY: Task checklist

## Phase 0: Audit
- [x] Inspect workspace (empty folder, Node 24, npm 11, Docker installed but not running, no PostgreSQL)
- [x] Choose stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4
- [x] Read bundled Next.js 16 docs (cacheComponents, Activity navigation, `ssr:false` rules)

## Phase 1: Foundation
- [x] Scaffold app in `bun-theory/` (the folder name has a space, which npm package names don't allow)
- [x] Install three, R3F, drei, GSAP, Framer Motion, Lenis, zustand, zod, lucide
- [x] Design tokens, fonts (Big Shoulders / Instrument Sans / JetBrains Mono), film grain
- [x] Logo (wordmark with burger cross-section O)
- [x] Nav with live cart count; persistent cart store
- [x] Lenis smooth scroll tied to GSAP ticker
- [x] Dev server on http://localhost:3000

## Phase 2: Cinematic hero
- [x] Procedural geometry: buns (3 variants), sesame seeds, patty (4), cheese (draped + unfold morph), sauce with drips, lettuce, tomato (textured cross-section), onion rings, pickles, jalapeños, crispy onions
- [x] Studio lighting (warm key, orange/amber rims, procedural environment reflections)
- [x] Contact shadows, embers shader, idle turntable, pointer parallax
- [x] Split-plane typography (headline behind and in front of the burger)
- [x] No-WebGL fallback illustration
- [x] Visual QA screenshot pass (desktop + mobile)

## Phase 3: Dissection
- [x] Scroll-scrubbed GSAP timeline driving per-layer explode targets
- [x] Per-ingredient exploded poses + sub-part paths (tomato slices, onion rings)
- [x] Spring physics per layer (overshoot/settle, reversible)
- [x] Camera path: lean in, pull back, orbit
- [x] Projected annotations with leader lines
- [x] Visual QA; layers turn to face the camera when exploded

## Phase 4: Assembly
- [x] Bottom-up reassembly with spring settle
- [x] Hero push-in + "The art of a perfect bite."
- [x] Visual QA

## Phase 5: Homepage sections
- [x] Studio render pipeline: /studio/[slug] + `npm run renders`, 22 product renders from the 3D models
- [x] Signature line-up (editorial rows, cursor-following photo, working add-to-cart)
- [x] Sourcing editorial (cream section, parallax renders, fact numbers)
- [x] Build teaser (196,608 combinations, computed from the builder data)
- [x] Combos as receipts with real à-la-carte maths
- [x] Our story (notebook timeline)
- [x] Restaurant experience (interactive SVG floor plan)
- [x] Visit + footer + newsletter (zod-validated API, dedupe)
- [x] WebGL stage pauses and fades when off-screen
- [x] Mobile hero / chapter layout pass

## Phase 6: Configurator (/build)
- [x] Animated 3D stack: drop-in, slide-out, variant swaps, spring heights
- [x] Bun / patty / cheese / veg / sauce / extras; live price; build numbers
- [x] Orbit, zoom, reset view, inspect (exploded) mode; edit from cart

## Phase 7: Ordering
- [x] Menu (search, category filter, URL state), product pages with live customised 3D
- [x] Cart (quantities, edit, remove, coupons, delivery/pickup), persistent
- [x] Checkout with zod validation (client + server), server-side re-pricing
- [x] Payment adapter: test simulator + Stripe Checkout with signed webhook
- [x] Order status page (private token, auto-refresh), device order history

## Phase 8: Backend & admin
- [x] PostgreSQL + Prisma 7 schema, migrations, idempotent seed (no fake orders)
- [x] Auth: bcrypt, signed httpOnly JWT cookie, proxy gate, role checks, login rate limit
- [x] Dashboard analytics, orders, products/options, categories, ingredients, coupons,
      customers, reviews, inventory, website content & settings, branches, team
- [x] Admin edits update the public site immediately (cache tags)
- [x] Public reviews with moderation; announcement banner

## Phase 9: Testing
- [x] Production build, type-check, lint
- [x] E2E: ordering, admin, builder; API tamper tests; production smoke test
- [x] UTF-8 database fix (Windows code page bug found in testing)

## Phase 10: Delivery
- [x] README (setup, env, scripts, deploy, payments), .env.example, Dockerfile
- [x] robots.txt, sitemap.xml, metadataBase, security headers, branded 404
