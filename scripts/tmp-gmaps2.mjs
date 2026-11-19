import { chromium } from "playwright";

const consultas = [
  "IEP San Francisco de Sales Arequipa",
  "San Francisco de Sales secundaria Arequipa",
  "Alexander Friedman Ciudad Municipal Arequipa",
  "IEP Talents School José María Arguedas Arequipa",
  "IE Cristo Rey Circa Arequipa",
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
  await page.waitForTimeout(7000);
  const resultados = await page.evaluate(() => {
    const vistos = new Set();
    const salida = [];
    for (const a of document.querySelectorAll('a[href*="/maps/place/"]')) {
      const href = a.href;
      if (vistos.has(href)) continue;
      vistos.add(href);
      const m = href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      salida.push({
        texto: (a.getAttribute("aria-label") || a.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 90),
        lat: m ? m[1] : null,
        lon: m ? m[2] : null,
      });
    }
    return salida.slice(0, 8);
  });
  console.log(`\n### ${q}`);
  for (const r of resultados) console.log(`  ${r.texto} => ${r.lat}, ${r.lon}`);
}
await browser.close();
