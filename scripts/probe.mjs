// Dev helper: scroll to a fraction of the page and dump story state over time.
import { chromium } from "playwright";
const frac = Number(process.argv[2] ?? 1);
const browser = await chromium.launch({ channel: "chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), frac);
for (const ms of [500, 1500, 4000]) {
  await page.waitForTimeout(ms);
  console.log(ms, JSON.stringify(await page.evaluate(() => ({
    y: scrollY, max: document.documentElement.scrollHeight - innerHeight,
    t: Object.fromEntries(Object.entries(window.__story.targets).filter(([, v]) => typeof v === "number").map(([k, v]) => [k, +v.toFixed(2)])),
    cam: { ...window.__story.camera, _gsap: undefined },
  }))));
}
await browser.close();
