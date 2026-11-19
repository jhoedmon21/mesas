import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath:
    "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1366, height: 900 },
  locale: "es-PE",
});
await page.goto("https://resultadoelectoral.onpe.gob.pe/", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForTimeout(8000);
console.log("titulo:", await page.title());

const codigos = ["005941", "005942", "006033", "005843", "005998"];
for (const codigo of codigos) {
  const r = await page.evaluate(async (c) => {
    const res = await fetch(
      `/presentacion-backend/actas/buscar/mesa?codigoMesa=${c}`,
      { headers: { accept: "application/json" } },
    );
    const txt = await res.text();
    return { status: res.status, body: txt.slice(0, 4000) };
  }, codigo);
  console.log(`\n=== ${codigo} [${r.status}] ===\n${r.body}`);
}
await browser.close();
