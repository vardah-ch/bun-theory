// End-to-end: customise a product, build a burger, cart + coupon, checkout
// validation, online test payment, order page. Prints what it sees.
import { chromium } from "playwright";
const out = process.argv[2] ?? "order";
const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultNavigationTimeout(240000);
page.setDefaultTimeout(90000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && !m.text().includes("Download the React DevTools") && errors.push(m.text()));
const opt = (label) => page.locator("[role=radio], [role=checkbox]").filter({ hasText: label }).first();

await page.goto(`${base}/menu/the-classic`, { waitUntil: "load" });
await opt("Extra cheese").click();
await opt("No onion").click();
console.log("product bar:", (await page.locator("button:has-text('Add to order')").innerText()).replace(/\s+/g, " "));
await page.getByRole("button", { name: /Add to order/ }).click();

await page.goto(`${base}/build`, { waitUntil: "load" });
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /Add to order/ }).click();

await page.goto(`${base}/cart`, { waitUntil: "load" });
await page.locator("#coupon").fill("firstbite");
await page.getByRole("button", { name: "Apply" }).click();
await page.locator("text=FIRSTBITE applied.").waitFor();
console.log("cart summary:", (await page.locator("aside dl:visible").first().innerText()).replace(/\s+/g, " "));
await page.screenshot({ path: `${out}-cart.png`, fullPage: true });

await page.getByRole("link", { name: "Checkout" }).click();
await page.waitForURL("**/checkout");
await page.locator("#name").fill("");
await page.locator("#phone").fill("");
await page.getByRole("button", { name: /Continue to payment|Place order/ }).click();
const errs = await page.locator("[id$=-error]").allInnerTexts();
console.log("validation errors:", errs);
await page.locator("#name").fill("Test Customer");
await page.locator("#phone").fill("+1 555 0100");
await page.locator("#email").fill("test@example.com");
await page.locator("#address").fill("12 Test Street, Testville");
await page.getByRole("radio", { name: /Pay online/ }).click();
await page.screenshot({ path: `${out}-checkout.png`, fullPage: true });
await page.getByRole("button", { name: /Continue to payment/ }).click();
await page.waitForURL("**/pay/test/**", { timeout: 60000 });
console.log("on test payment page:", (await page.getByRole("heading", { name: "Payment simulator" }).innerText()));
await page.screenshot({ path: `${out}-pay.png` });
await page.getByRole("button", { name: "Simulate success" }).click();
await page.waitForURL("**/order/**", { timeout: 60000 });
console.log("order page:", (await page.locator("main:visible").first().innerText()).replace(/\s+/g, " ").slice(0, 400));
await page.screenshot({ path: `${out}-confirm.png`, fullPage: true });
const cartAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("bun-theory-cart")).state.items.length);
console.log("cart lines after order:", cartAfter);
console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no console errors");
await browser.close();
