// Photographs every menu item from the /studio route into public/renders/<slug>.png
// (transparent background). Run with the dev server up:  npm run renders [slug...]
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const source = readFileSync(new URL("../src/lib/catalog/sample.ts", import.meta.url), "utf8");
const all = [...source.matchAll(/id: "p-[^"]+", slug: "([a-z0-9-]+)"/g)].map((m) => m[1]);
const only = process.argv.slice(2);
const slugs = only.length ? all.filter((s) => only.includes(s)) : all;

mkdirSync(new URL("../public/renders/", import.meta.url), { recursive: true });
const browser = await chromium.launch({ channel: "chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("  page error:", String(e).slice(0, 200)));

const failed = [];
for (const slug of slugs) {
  try {
    await page.goto(`${base}/studio/${slug}`, { waitUntil: "networkidle" });
    await page.addStyleTag({
      content: "html,body{background:transparent!important}.grain::after{display:none!important}nextjs-portal{display:none!important}",
    });
    await page.waitForSelector("[data-studio] canvas", { timeout: 60000 });
    await page.waitForTimeout(2500);
    const out = fileURLToPath(new URL(`../public/renders/${slug}.png`, import.meta.url));
    await page.locator("[data-studio]").screenshot({ path: out, omitBackground: true });
    console.log("rendered", slug);
  } catch (e) {
    failed.push(slug);
    console.log("FAILED", slug, String(e).split(/\r?\n/)[0]);
  }
}
if (failed.length) console.log("failed:", failed.join(", "));
await browser.close();
