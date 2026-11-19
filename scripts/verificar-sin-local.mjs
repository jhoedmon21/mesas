import { chromium } from "playwright";
const browser = await chromium.launch({
  executablePath: "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
page.on("pageerror", (e) => errores.push("PAGEERROR " + e.message));
page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
await page.goto("http://127.0.0.1:3100/electoral?mesa=040103-03-001", { waitUntil: "networkidle" });
await page.waitForTimeout(8000);
const panel = page.locator('aside[aria-label^="Ficha de la mesa"]');
console.log("modal:", await panel.count());
if (await panel.count()) console.log("texto:", (await panel.innerText()).replace(/\s+/g, " ").slice(0, 450));
await page.screenshot({ path: "verif_sin_local.png" });
console.log("errores:", errores.length ? errores.slice(0, 3) : "ninguno");
await browser.close();
