# BUN THEORY

Restaurant website with a procedural 3D burger, scroll-driven dissection, a live 3D burger builder, online ordering, and a staff admin.

**Stack:** Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind 4, three.js / React Three Fiber / drei, GSAP + ScrollTrigger, Lenis, Framer Motion, PostgreSQL + Prisma 7, zod, jose (JWT), bcrypt.

---

## 1. Run it locally

Requirements: Node.js 22+ (developed on 24; `package.json` pins `engines.node >=22`).

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then fill in the values (see section 3)

npm run db                  # terminal 1: local PostgreSQL 17 on :54329, no Docker needed
npm run db:migrate          # terminal 2: create tables (first time)
npm run db:seed             #             sample menu, settings and the first admin account
npm run dev                 #             http://localhost:3000
```

`npm run db` stores its data in `.data/pg/` (git-ignored). To use your own PostgreSQL instead, point `DATABASE_URL` at it and skip `npm run db`.

| URL | What |
|---|---|
| `/` | Homepage: 3D hero, scroll dissection and reassembly, line-up, story, visit |
| `/menu`, `/menu/[slug]` | Menu with search and filters; product pages with 3D view, options and reviews |
| `/build` | 3D burger builder |
| `/cart`, `/checkout` | Bag, coupons, delivery or pickup, checkout |
| `/order/[n]?t=…`, `/orders` | Order status (private link) and order history on this device |
| `/admin` | Staff admin. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` |

## 2. Scripts

| Command | Does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / production server |
| `npm run lint` | ESLint |
| `npm run db` | Local embedded PostgreSQL (development only) |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Seed sample catalogue, settings and the first admin (safe to re-run; never overwrites admin edits) |
| `npm run db:reset-test-data -- --yes` | Delete all orders, customers, payments, reviews, notifications and subscribers |
| `npm run renders [slug…]` | Re-photograph menu items from their 3D models into `public/renders/` (dev server must be running) |
| `npm run test:order` / `test:admin` / `test:build` | Browser end-to-end tests (Playwright; run `npx playwright install chromium` once). Set `BASE_URL` to test another server. |

## 3. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string. Use a UTF-8 database (all managed providers are). |
| `AUTH_SECRET` | yes | 32+ random characters; signs admin sessions. `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `NEXT_PUBLIC_SITE_URL` | yes in production | e.g. `https://buntheory.com`. Used for the sitemap and social previews. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for seeding | First owner account. Change the password in Admin → Team & account after signing in. |
| `PAYMENT_MODE` | yes | `test` (built-in simulator, no money moves) or `live` (Stripe). |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | only for `live` | See section 5. |
| `ENABLE_STUDIO` | no | `1` enables `/studio/*` in production (product-render tool; off by default). |

## 4. Deploy

### Option A: Vercel + managed PostgreSQL (Neon, Supabase, Railway…)
1. Create a PostgreSQL database and copy its connection string. On Neon or Supabase use the **pooled** connection string: serverless functions open many short connections.
2. Push this folder to a GitHub repository (`git push`), then import it into Vercel.
3. Set the environment variables from section 3 in Vercel → Project → Settings → Environment Variables.
4. Deploy. `vercel.json` already sets the build command to `npm run db:deploy && npm run build`, so migrations run before each build.
5. After the first deploy, seed once from your machine with production env vars: `DATABASE_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run db:seed`.
6. Sign in at `/admin`, then in **Website & settings** replace the placeholder address, phone, hours and social links.

### Option B: Docker / any Node host
```bash
docker build -t bun-theory .
docker run -p 3000:3000 --env-file .env.production bun-theory
```
The container applies pending migrations on start, then serves the standalone build. Seed once as in step A4.

> The build reads the catalogue to prerender pages. If the database is unreachable at build time, it falls back to the bundled sample menu, and live data takes over once the site is running.

## 5. Payments

- **`PAYMENT_MODE=test`:** "Pay online (test mode)" sends customers to a clearly labelled simulator where you approve or decline. Payments are stored with mode `test`.
- **`PAYMENT_MODE=live`:** uses Stripe Checkout (`src/lib/server/payments.ts`). Add a Stripe webhook to `https://YOUR_DOMAIN/api/webhooks/stripe` for `checkout.session.completed` and `checkout.session.expired`. Orders become **PAID only when the signed webhook confirms it**, and only if the amount matches.
- Cash and card at the window are recorded as paid by staff from the order page. Online payments can't be marked paid by hand.

## 6. How it fits together

- `src/lib/burger/*`: the burger as data (layers, builder options, prices). Shared by the 3D scenes, the cart and the server.
- `src/components/three/*`: procedural geometry, materials, lighting and scenes (no downloaded models). `Appetite.tsx` holds the steam, the sauce splash during the dissection and the background heat glow.
- `src/app/globals.css`: colour tokens plus theme scopes (`theme-light`, `theme-ketchup`, `theme-glow`) that repaint whole sections without touching their markup.
- `src/lib/data/catalog.ts`: cached, tagged reads from PostgreSQL. Admin edits call `updateTag`, so the site updates on the next request.
- `src/lib/server/orders.ts`: re-prices every order from the database; the browser's prices are never trusted.
- `src/proxy.ts` + `src/lib/server/auth.ts`: admin protection (signed httpOnly cookie, role checks in every action, login rate limit).
- `prisma/schema.prisma`: data model. `prisma/seed.ts`: sample data.

See `PROJECT_PROGRESS.md` for status, test results and known limitations.
