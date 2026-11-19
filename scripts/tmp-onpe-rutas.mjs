import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath:
    "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto("https://resultadoelectoral.onpe.gob.pe/", {
  waitUntil: "networkidle",
  timeout: 90000,
});
await page.waitForTimeout(5000);

const scripts = await page.evaluate(() =>
  performance
    .getEntriesByType("resource")
    .map((e) => e.name)
    .filter((n) => n.endsWith(".js")),
);
console.log("scripts:", scripts.length);

const rutas = new Set();
for (const src of scripts) {
  const txt = await page.evaluate(async (u) => {
    try {
      const r = await fetch(u);
      return await r.text();
    } catch (e) {
      return "";
    }
  }, src);
  for (const m of txt.matchAll(/presentacion-backend[\\/][A-Za-z0-9{}_\-/.$:]+/g)) {
    rutas.add(m[0]);
  }
}
console.log([...rutas].sort().join("\n"));
await browser.close();
