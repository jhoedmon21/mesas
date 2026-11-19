import { chromium } from "playwright";

const consultas = [
  "IEP San Francisco de Sales Arequipa",
  "Colegio San Francisco de Sales Bedoya Arequipa",
  "IE Cristo Rey Circa El Nazareno Arequipa",
  "Colegio Alexander Friedman Cerro Colorado Arequipa",
  "IEP Talents School Arequipa",
];

const browser = await chromium.launch({
  executablePath:
    "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1400, height: 900 },
  locale: "es-PE",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

for (const q of consultas) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(q)}?hl=es&gl=pe`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(7000);
  const final = page.url();
  let coords = null;
  const m = final.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) coords = [m[1], m[2]];
  const place = final.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const titulo = await page.title();
  const cuerpo = (await page.locator("body").innerText().catch(() => ""))
    .replace(/\s+/g, " ")
    .slice(0, 500);
  console.log(`\n### ${q}`);
  console.log("url:", final.slice(0, 220));
  console.log("centro:", coords, "place:", place);
  console.log("titulo:", titulo.slice(0, 120));
  console.log("texto:", cuerpo);
}
await browser.close();
