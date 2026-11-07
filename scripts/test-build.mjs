// Interaction test for /build: choose options, check price and cart contents.
import { chromium } from "playwright";
const out = process.argv[2] ?? "build";
const browser = await chromium.launch({ channel: "chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultNavigationTimeout(240000);
page.setDefaultTimeout(90000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto("http://localhost:3000/build", { waitUntil: "load" });
await page.waitForSelector("canvas", { timeout: 90000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: `${out}-0.png` });

const total = async () => (await page.locator("button:has-text('Add to order') span.type-display").innerText()).trim();
console.log("default total:", await total());
for (const label of ["Double beef", "Swiss", "Pickles", "Jalapeños", "Tomato"]) {
  await page.locator("[role=radio], [role=checkbox]").filter({ hasText: label }).first().click();
  await page.waitForTimeout(250);
}
await page.waitForTimeout(3500);
console.log("after changes total:", await total());
await page.screenshot({ path: `${out}-1.png` });
await page.getByRole("button", { name: /Inspect/ }).click();
await page.waitForTimeout(3500);
await page.screenshot({ path: `${out}-2.png` });
await page.getByRole("button", { name: /Stack it/ }).click();
await page.getByRole("button", { name: /Add to order/ }).click();
await page.waitForTimeout(500);
const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("bun-theory-cart") ?? "{}"));
const line = cart.state?.items?.[0];
console.log("cart line:", line && { name: line.name, base: line.basePriceCents, opts: line.options.map((o) => `${o.label}:${o.priceCents}`), build: line.build });
console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no console errors");
await browser.close();
