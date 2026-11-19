import { chromium } from "playwright";
const browser = await chromium.launch({
  executablePath: "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
page.on("pageerror", (e) => errores.push("PAGEERROR " + e.message));
page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });

await page.goto("http://127.0.0.1:3001/electoral", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(9000);
await page.screenshot({ path: "final_electoral.png" });

// Leyenda de mesas (verde/rojo)
const leyenda = await page.locator("text=506 mesas · actas ONPE").count();
console.log("leyenda 506 mesas:", leyenda > 0);

// Toggle 2D y nombres de calles
await page.getByTitle(/Ver en 2D/).click();
await page.waitForTimeout(3500);
await page.screenshot({ path: "final_electoral_2d.png" });

// Abrir ficha de una mesa: clic al centro-izquierda del mapa
let ficha = null;
outer: for (let y = 350; y <= 700; y += 24) {
  for (let x = 480; x <= 1000; x += 24) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(280);
    const dialogo = page.locator("[aria-label^='Ficha de la mesa']");
    if (await dialogo.count()) { ficha = { x, y }; break outer; }
  }
}
console.log("ficha de mesa abierta:", !!ficha);
if (ficha) {
  const acta = await page.locator("text=Acta ONPE").first().textContent().catch(() => null);
  console.log("acta en ficha:", acta);
  await page.screenshot({ path: "final_mesa.png" });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
}

// Secciones en el panel
const secciones = await page.locator("text=Secciones del distrito").count();
console.log("panel secciones:", secciones > 0);

console.log("errores:", errores.slice(0, 8));
await browser.close();
