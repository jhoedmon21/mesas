import { chromium } from "playwright";
const browser = await chromium.launch({
  executablePath: "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on("response", (r) => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url().slice(0, 150)); });
page.on("requestfailed", (r) => console.log("FAIL", r.url().slice(0, 120), r.failure()?.errorText));
await page.goto("http://127.0.0.1:3100/electoral", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const hojas = await page.evaluate(() => Array.from(document.styleSheets).map(s => s.href || "inline").slice(0, 6));
console.log("stylesheets:", hojas);
console.log("body bg:", await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
await browser.close();
