import { chromium } from "playwright";
const browser = await chromium.launch({
  executablePath: "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
page.on("pageerror", (e) => errores.push("PAGEERROR " + e.message));
page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });

await page.goto("http://127.0.0.1:3100/electoral?mesa=040103-03-016", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);
await page.screenshot({ path: "shot_mesa.png" });

const panel = page.locator('aside[aria-label^="Ficha de la mesa"]');
console.log("abierto por enlace:", await panel.count(), "|", await panel.locator("h2").textContent().catch(() => "—"));

await page.keyboard.press("Escape");
await page.waitForTimeout(1500);

let abierto = 0;
for (const [dx, dy] of [[0,0],[0,-4],[0,4],[-4,0],[4,0],[0,-8],[0,8]]) {
  await page.mouse.click(800 + dx, 475 + dy);
  await page.waitForTimeout(900);
  abierto = await panel.count();
  if (abierto) { console.log("clic acertado en offset", dx, dy); break; }
}
console.log("abierto por clic:", abierto, "|", await panel.locator("h2").textContent().catch(() => "—"));
await page.screenshot({ path: "shot_mesa_click.png" });
console.log("errores:", errores.length ? errores.slice(0, 4) : "ninguno");
await browser.close();
