// Admin end-to-end: auth gate, every page, edits reflected on the public site.
import { chromium } from "playwright";
process.loadEnvFile(".env");
const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = process.argv[2] ?? "admin";
const browser = await chromium.launch({ channel: "chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultNavigationTimeout(240000);
page.setDefaultTimeout(90000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const log = (...a) => console.log(...a);

// 1. gate
let r = await page.goto(`${base}/admin/orders`, { waitUntil: "load" });
log("unauthenticated /admin/orders ->", new URL(page.url()).pathname);
const api = await page.request.get(`${base}/api/admin/anything`);
log("unauthenticated /api/admin ->", api.status());

// 2. bad + good login
await page.fill("input[name=email]", process.env.ADMIN_EMAIL);
await page.fill("input[name=password]", "wrong-password");
await page.click("button:has-text('Sign in')");
await page.locator("form [role=alert]").waitFor();
log("bad password:", await page.locator("form [role=alert]").innerText());
await page.fill("input[name=password]", process.env.ADMIN_PASSWORD);
await page.click("button:has-text('Sign in')");
await Promise.race([
  page.locator("main h1", { hasText: "Dashboard" }).waitFor({ timeout: 120000 }),
  page.locator("form [role=alert]", { hasText: "Too many" }).waitFor({ timeout: 120000 }),
]);
if (await page.locator("form [role=alert]", { hasText: "Too many" }).count()) {
  log("RATE LIMITED (expected after repeated wrong passwords):", await page.locator("form [role=alert]").innerText());
  process.exit(2);
}
log("logged in ->", new URL(page.url()).pathname);
const cookie = (await page.context().cookies()).find((c) => c.name === "bt_admin");
log("cookie httpOnly:", cookie?.httpOnly, "sameSite:", cookie?.sameSite);
await page.screenshot({ path: `${out}-dashboard.png`, fullPage: true });

// 3. every page
for (const p of ["orders", "products", "products/new", "categories", "ingredients", "coupons", "customers", "reviews", "inventory", "content", "branches", "team"]) {
  const res = await page.goto(`${base}/admin/${p}`, { waitUntil: "load" });
  const h1 = await page.locator("main h1").first().innerText().catch(() => "?");
  log(`/admin/${p}`, res.status(), "·", h1);
}
await page.goto(`${base}/admin/orders?f=all`);
const firstOrder = (await page.locator("tbody a").count()) ? await page.locator("tbody a").first().getAttribute("href") : null;
if (!firstOrder) log("no orders yet to open");
if (firstOrder) {
  const res = await page.goto(base + firstOrder);
  log(firstOrder, res.status(), "·", await page.locator("main h1").first().innerText());
  await page.screenshot({ path: `${out}-order.png`, fullPage: true });
}

// 4. content edit -> homepage
await page.goto(`${base}/admin/content`);
const original = await page.inputValue("input[name=lineFront]");
await page.fill("input[name=lineFront]", "A test headline.");
await page.click("button:has-text('Save everything')");
await page.waitForSelector("text=The website is updated", { timeout: 60000 });
let html = await (await page.request.get(`${base}/`)).text();
log("homepage shows edited headline:", html.includes("A test headline."));
await page.fill("input[name=lineFront]", original);
await page.click("button:has-text('Save everything')");
await page.waitForSelector("text=The website is updated", { timeout: 60000 });
html = await (await page.request.get(`${base}/`)).text();
log("headline restored:", html.includes(original) && !html.includes("A test headline."));

// 5. sold out toggle -> menu
await page.goto(`${base}/admin/products`);
const row = page.locator("li", { hasText: "/menu/onion-rings" });
await row.locator("button:has-text('Mark sold out')").click();
await row.locator("text=Marked sold out").waitFor({ timeout: 60000 });
const prod = await (await page.request.get(`${base}/menu/onion-rings`)).text();
log("product page says sold out:", prod.includes("Sold out"));
await page.goto(`${base}/admin/products`);
await page.locator("li", { hasText: "/menu/onion-rings" }).locator("button:has-text('Put back on')").click();
await page.locator("li", { hasText: "/menu/onion-rings" }).locator("text=Back on the menu").waitFor({ timeout: 60000 });
log("restored onion rings");

// 6. review: submit publicly, approve in admin, visible publicly
const pub = await browser.newPage();
await pub.goto(`${base}/menu/fries`, { waitUntil: "load" });
await pub.getByRole("radio", { name: "4 stars" }).click();
await pub.fill("input[name=name]", "Test Reviewer");
await pub.fill("textarea[name=body]", "Crisp, salty, exactly right. Test review.");
await pub.click("button:has-text('Post review')");
await Promise.race([
  pub.locator("text=Your review goes up once").waitFor({ timeout: 90000 }),
  pub.locator("text=You've left a few reviews already").waitFor({ timeout: 90000 }),
]);
if (await pub.locator("text=You've left a few reviews already").count()) {
  log("review spam brake engaged (3/hour per IP) - skipping publish step");
  await browser.close();
  process.exit(0);
}
log("review submitted (pending)");
await page.goto(`${base}/admin/reviews`);
const card = page.locator("section", { hasText: "Test Reviewer" }).first();
await card.locator("button:has-text('Publish')").click();
await card.locator("text=Published").waitFor({ timeout: 60000 });
const fries = await (await page.request.get(`${base}/menu/fries`)).text();
log("review visible publicly:", fries.includes("Crisp, salty, exactly right."));

// logout
await page.goto(`${base}/admin`);
await page.click("button:has-text('Sign out')");
await page.waitForURL("**/admin/login", { waitUntil: "commit" });
r = await page.goto(`${base}/admin`);
log("after sign out /admin ->", new URL(page.url()).pathname);
log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no console errors");
await browser.close();
