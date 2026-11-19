import { chromium } from "playwright";
const browser = await chromium.launch({
  executablePath: "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
page.on("pageerror", (e) => errores.push("PAGEERROR " + e.message));
page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
await page.goto("http://127.0.0.1:3100/electoral", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);
await page.getByRole("button", { name: "Cerro Colorado" }).first().click();
await page.waitForTimeout(5200);
await page.screenshot({ path: "final_distrito.png" });
console.log("errores:", errores.length ? errores.slice(0, 3) : "ninguno");
await browser.close();
