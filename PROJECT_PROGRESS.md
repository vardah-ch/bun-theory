# BUN THEORY: Project progress

**Dev URL:** http://localhost:3000. Setup, scripts and deployment are in `README.md`.

## Status
| Phase | State |
|---|---|
| 0 Audit · 1 Foundation | Done |
| 2 Cinematic 3D hero | Done |
| 3 Scroll dissection · 4 Reassembly | Done |
| 5 Homepage sections | Done |
| 6 3D burger builder | Done |
| 7 Menu, product, cart, checkout, payments, order status/history | Done |
| 8 PostgreSQL + Prisma, admin auth, admin dashboard and CMS | Done |
| 9 Testing | Done (see results below) |
| 10 Delivery docs, deployment setup | Done (README, Dockerfile, .env.example) |

## Appetite pass (latest)
- **Colour:** black replaced by warm espresso; sections alternate cream, mustard, ketchup red and warm brown. Menu, cart,
  checkout, product, builder and order pages are light (cream). The 3D stages sit in an amber grill glow.
- **Burger:** golden lighting, egg-wash bun, seared and glossy patty, cheese with rounded corners that melts down the
  sides with drips, sauce with drips and beads, fresher lettuce. Product photos re-rendered from the new model.
- **Drama:** steam rises off the assembled burger; during the dissection sauce and cheese spray off the patty, and the
  background heat flares while it's apart (and plays back as it slams together).
- **Appetite and conversion, all from real data:** sensory word tickers; a "Hungry yet?" one-tap add bar on the homepage
  after the dissection; mustard calls to action; free-delivery progress bar in the bag (uses the real threshold);
  "Goes well with it" add-ons in the bag. No fake countdowns, stock levels or reviews.

## Art direction
The burger is a **specimen**: figure numbers, leader-line annotations and measured copy, like a cookbook crossed with a
technical drawing, lit like a food commercial (warm golden key and rims, rich brown shadow, amber glow).
Big Shoulders / Instrument Sans / JetBrains Mono. Appetite palette: ketchup, mustard, toasted-bun cream, warm espresso.

## Admin (/admin)
Dashboard (real orders only: revenue paid/unpaid, 14-day chart, bestsellers, statuses, low stock, notifications) ·
Orders (live board, status changes, record in-person payments) · Products (edit everything, sold-out toggle, option groups
and prices, photo URL) · Categories · Builder ingredients · Coupons · Customers · Reviews (moderation) · Inventory ·
Website & settings (hero copy, banner, address, hours, socials, delivery fees, tax) · Branches · Team & password.
Roles: OWNER > MANAGER (menu, settings) > STAFF (orders, stock, reviews).

## Test results (latest run)
- `next build`: passes (77 routes); `tsc` clean; ESLint clean.
- Production server smoke test: all public routes 200 in ~50 ms; `/admin` → 307 to login; security headers present;
  `/studio` 404 in production; robots.txt and sitemap.xml (25 URLs) served; unknown product shows the branded 404 page with `noindex`.
- `test:order` (dev and production): customised product $14.70 + custom build $9.50, FIRSTBITE −$3.63, delivery $3.50 =
  **$24.07**, matching the hand calculation; validation messages; test payment → order PAID/CONFIRMED; cart cleared.
- Order API tampering: forged prices ignored (server re-prices), unknown products, foreign options, fake builder
  ingredients, quantity 500 and below-minimum delivery all rejected; order status requires the secret token.
- `test:admin`: login gate (page redirect, API 401), wrong password rejected, httpOnly/SameSite cookie, all 13 admin pages
  render; editing the hero headline shows on the homepage; sold-out toggle shows on the product page; review submit →
  moderation → public; sign-out.
- `test:build`: builder price maths ($9.50 → $13.80) and cart line contents.
- Desktop (1440×900) and mobile (390×844) screenshots reviewed for hero, dissection, sections and builder.
- All test orders/reviews were deleted afterwards (`db:reset-test-data`); order numbers start at 1001.

## Known limitations
- **Placeholder business details:** address, phone, hours and socials are sample values until edited in Admin → Website & settings.
- **Product imagery** is rendered from the 3D models (no photography supplied). Upload real photos via each product's Photo URL.
- **Live card payments** need Stripe keys plus the webhook (README §5). Until then use test mode, cash or card at the window.
- **Rate limits** (login 5/15 min, reviews 3/h, per IP) are in-memory per server instance. For multi-instance hosting,
  move them to Redis or the database.
- **Order history** is per device (no customer accounts); every order has a private status link.
- **Dockerfile** is written but untested here (Docker Desktop wasn't running). Vercel + managed PostgreSQL is the tested path.
- Headless tests use software WebGL; frame-rate on real devices should be checked on target phones.
- The local DB runner (`npm run db`) is for development only.

## Environment notes
- Project lives in OneDrive: installs are slow and the dev file-watcher occasionally misses edits (restart `npm run dev` if
  a change doesn't appear). Moving the folder out of OneDrive avoids both.
