import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
page.on("pageerror", (e) => errores.push("PAGEERROR " + e.message));

await page.goto("http://127.0.0.1:3100/electoral", { waitUntil: "networkidle" });
await page.waitForTimeout(6500);
await page.screenshot({ path: "shot_provincia.png" });

// pasar a escala distrito
const boton = page.getByRole("button", { name: /Distrito|Cerro Colorado/i }).first();
if (await boton.count()) { await boton.click(); await page.waitForTimeout(5200); }
await page.screenshot({ path: "shot_distrito.png" });

console.log("errores:", errores.length ? errores.slice(0, 6) : "ninguno");
await browser.close();
