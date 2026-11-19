import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath:
    "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto("https://resultadoelectoral.onpe.gob.pe/", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForTimeout(6000);

const rutas = [
  "/presentacion-backend/actas/buscar/local?codigoLocal=31860",
  "/presentacion-backend/actas/buscar/local?codigoLocalVotacion=31860",
  "/presentacion-backend/locales/buscar/local?codigoLocal=31860",
  "/presentacion-backend/local/buscar?codigoLocal=31860",
  "/presentacion-backend/locales/31860",
  "/presentacion-backend/ubigeo/locales/40103",
  "/presentacion-backend/ubigeo/local/40103",
  "/presentacion-backend/actas/local/31860",
  "/presentacion-backend/locales/local?codigoLocalVotacion=31860",
];

for (const ruta of rutas) {
  const r = await page.evaluate(async (u) => {
    const res = await fetch(u, { headers: { accept: "application/json" } });
    const txt = await res.text();
    return { status: res.status, body: txt.slice(0, 600) };
  }, ruta);
  console.log(`\n${ruta} => ${r.status}\n${r.body}`);
}
await browser.close();
