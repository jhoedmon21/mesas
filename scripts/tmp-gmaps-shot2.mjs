import { chromium } from "playwright";

const puntos = [
  { nombre: "cristo-rey-z13", lat: -16.3255, lon: -71.5486, z: 13 },
  { nombre: "cristo-rey-z12", lat: -16.3255, lon: -71.5486, z: 12 },
  { nombre: "bedoya-z13", lat: -16.3194, lon: -71.567, z: 13 },
];

const browser = await chromium.launch({
  executablePath:
    "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1000, height: 700 },
  locale: "es-PE",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

for (const p of puntos) {
  await page.goto(
    `https://www.google.com/maps/@${p.lat},${p.lon},${p.z}z?hl=es&gl=pe&layer=c`,
    { waitUntil: "domcontentloaded", timeout: 90000 },
  );
  await page.waitForTimeout(1000);
  await page.goto(
    `https://www.google.com/maps/@${p.lat},${p.lon},${p.z}z?hl=es&gl=pe`,
    { waitUntil: "domcontentloaded", timeout: 90000 },
  );
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `C:/Users/Usuario/AppData/Local/Temp/opencode/mapa-${p.nombre}.png` });
  console.log("listo", p.nombre);
}
await browser.close();
