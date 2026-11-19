import { chromium } from "playwright";

const casos = [
  { q: "San Francisco de Sales", lat: -16.3192, lon: -71.5671, z: 15 },
  { q: "San Francisco de Sales", lat: -16.3320, lon: -71.5604, z: 15 },
  { q: "colegio San Francisco de Sales Arequipa", lat: -16.3711, lon: -71.6475, z: 14 },
  { q: "colegio", lat: -16.3192, lon: -71.5671, z: 16 },
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

for (const c of casos) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(c.q)}/@${c.lat},${c.lon},${c.z}z?hl=es&gl=pe`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(6500);
  const filas = await page.evaluate(() => {
    const feed = document.querySelector('div[role="feed"]');
    if (!feed) return [];
    return [...feed.querySelectorAll('div[role="article"]')].map((a) => {
      const link = a.querySelector('a[href*="/maps/place/"]');
      const m = link?.href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      return {
        texto: a.innerText.replace(/\s+/g, " ").trim().slice(0, 150),
        lat: m ? m[1] : null,
        lon: m ? m[2] : null,
      };
    });
  });
  console.log(`\n### ${c.q} @ ${c.lat},${c.lon} z${c.z}`);
  for (const f of filas) console.log(`  ${f.lat}, ${f.lon} :: ${f.texto}`);
}
await browser.close();
