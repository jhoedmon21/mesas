import { chromium } from "playwright";

const consultas = [
  "Asoc. Bedoya II Etapa Arequipa",
  "Colegio San Francisco de Sales Primavera Arequipa",
  "I.E.P. San Francisco de Sales Primaria Arequipa",
  "Alexander Friedman Ciudad Municipal",
  "I.E.P Talents School Arequipa",
  "I.E. Cristo Rey Circa Arequipa",
];

const browser = await chromium.launch({
  executablePath:
    "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1400, height: 950 },
  locale: "es-PE",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

for (const q of consultas) {
  await page.goto(
    `https://www.google.com/maps/search/${encodeURIComponent(q)}?hl=es&gl=pe`,
    { waitUntil: "domcontentloaded", timeout: 90000 },
  );
  await page.waitForTimeout(6000);
  const url = page.url();
  const m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const titulo = (await page.title()).replace(" - Google Maps", "");
  let direccion = "—";
  let plus = "—";
  if (m) {
    direccion = await page
      .locator('[data-item-id="address"]')
      .innerText()
      .catch(() => "—");
    const txt = await page.locator("body").innerText().catch(() => "");
    const pm = txt.match(/[2-9CFGHJMPQRVWX]{4,8}\+[2-9CFGHJMPQRVWX]{2,3}/);
    const lm = txt.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*), [A-Z][a-z]+ \d{5}/);
    if (pm) plus = pm[0];
    if (lm) plus += " | " + lm[0];
  }
  console.log(`\n### ${q}`);
  console.log(`  ${titulo} => ${m ? m[1] + ", " + m[2] : "sin ficha"}`);
  console.log(`  dir: ${direccion.replace(/\n/g, " ")}`);
  console.log(`  plus: ${plus}`);
}
await browser.close();
