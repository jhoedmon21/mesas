import { chromium } from "playwright";
const browser = await chromium.launch({
  executablePath: "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto("http://127.0.0.1:3100/electoral", { waitUntil: "networkidle" });
await page.waitForTimeout(6000);
console.log("canvas:", await page.evaluate(() => document.querySelectorAll("canvas").length));
console.log("maplibregl canvas:", await page.evaluate(() => !!document.querySelector(".maplibregl-canvas")));
const etiqueta = page.locator("span.tabular.min-w-\\[3\\.6rem\\]").first();
console.log("z antes:", await etiqueta.textContent().catch(() => "n/a"));
await page.getByRole("button", { name: "Acercar" }).click();
await page.waitForTimeout(2000);
console.log("z después:", await etiqueta.textContent().catch(() => "n/a"));
const btns = await page.getByRole("button", { name: "Cerro Colorado" }).count();
console.log("botones Cerro Colorado:", btns);
await browser.close();
