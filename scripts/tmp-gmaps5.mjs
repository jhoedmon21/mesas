import { chromium } from "playwright";

const consultas = [
  "Asoc. Bedoya II Etapa Arequipa",
  "Asociación Bedoya Arequipa",
  "Bedoya II Etapa Mz D",
  "Hernán Bedoya Forga II Etapa",
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
  const datos = await page.evaluate(() => {
    const feed = document.querySelector('div[role="feed"]');
    const filas = feed
      ? [...feed.querySelectorAll('div[role="article"]')].map((a) => {
          const link = a.querySelector('a[href*="/maps/place/"]');
          const m = link?.href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
          return {
            texto: a.innerText.replace(/\s+/g, " ").trim().slice(0, 140),
            lat: m ? m[1] : null,
            lon: m ? m[2] : null,
          };
        })
      : [];
    const centro = location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    return { filas, centro: centro ? [centro[1], centro[2]] : null };
  });
  console.log(`\n### ${q}  centro=${datos.centro}`);
  for (const f of datos.filas) console.log(`  ${f.lat}, ${f.lon} :: ${f.texto}`);
}
await browser.close();
