import { chromium } from "playwright";
const browser = await chromium.launch({
  executablePath: "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
page.on("pageerror", (e) => errores.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });

await page.goto("http://127.0.0.1:3100/electoral", { waitUntil: "networkidle" });
await page.waitForTimeout(6000);
await page.getByRole("button", { name: "Cerro Colorado" }).first().click();
await page.waitForTimeout(4000);
// acercar
for (let i = 0; i < 3; i++) { await page.getByRole("button", { name: "Acercar" }).click(); await page.waitForTimeout(900); }
await page.waitForTimeout(2500);
await page.screenshot({ path: "shot_zoom.png" });
console.log("zoom listo | errores:", errores.slice(0, 3));
await browser.close();
