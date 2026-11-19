import { chromium } from "playwright";

const puntos = [
  { nombre: "cristo-rey", lat: -16.325508, lon: -71.5485585, z: 15 },
  { nombre: "sales-bedoya", lat: -16.3193579, lon: -71.5670094, z: 15 },
  { nombre: "sales-primavera", lat: -16.3711121, lon: -71.6475011, z: 14 },
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
    `https://www.google.com/maps/@${p.lat},${p.lon},${p.z}z?hl=es&gl=pe`,
    { waitUntil: "domcontentloaded", timeout: 90000 },
  );
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `C:/Users/Usuario/AppData/Local/Temp/opencode/mapa-${p.nombre}.png` });
  console.log("listo", p.nombre);
}
await browser.close();
