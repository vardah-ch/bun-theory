// Dev helper: screenshot a route (optionally at several scroll positions) and
// report console errors. Usage:
//   node scripts/shot.mjs <path> <outPrefix> [width] [height] [scrollFractions...]
// e.g. node scripts/shot.mjs / shots/home 1440 900 0 0.2 0.5
import { chromium } from "playwright";

const [path = "/", out = "shot", w = "1440", h = "900", ...fractions] = process.argv.slice(2);
const stops = fractions.length ? fractions : ["0"];

const browser = await chromium.launch({
  channel: "chromium",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
page.setDefaultTimeout(150000);
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`http://localhost:3000${path}`, { waitUntil: "load", timeout: 180000 });
await page.waitForTimeout(3500);

for (const f of stops) {
  // A stop is either a page fraction ("0.4") or a CSS selector ("#lineup", "footer").
  await page.evaluate((stop) => {
    if (/^[\d.]+$/.test(stop)) {
      const max = document.documentElement.scrollHeight - innerHeight;
      window.scrollTo(0, max * Number(stop));
    } else {
      const el = document.querySelector(stop);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY);
    }
  }, f);
  await page.waitForTimeout(+(process.env.SETTLE ?? 2200));
  const file = `${out}-${String(f).replace(/[^a-z0-9]+/gi, "_")}.png`;
  await page.screenshot({ path: file });
  console.log("saved", file);
}

console.log(errors.length ? `CONSOLE ERRORS (${errors.length}):\n` + [...new Set(errors)].join("\n") : "no console errors");
await browser.close();
