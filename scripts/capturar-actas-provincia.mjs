// Captura reanudable de actas de mesa de ONPE (ERM 2026, Arequipa).
//
//   node scripts/capturar-actas-provincia.mjs [desde] [hasta]
//
// Los codigos de mesa son nacionales, correlativos y ordenados por ubigeo
// ONPE. Pide en rafagas con un navegador nuevo; cuando ONPE corta (429 o
// respuestas vacias), cierra y enfria, y sigue desde la ultima acta guardada.
// Salida: .captura/actas-provincia.json

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";

const DESDE = Number(process.argv[2] ?? 5174);
const HASTA = Number(process.argv[3] ?? 8389);
const SALIDA = ".captura/actas-provincia.json";
const BASE = "https://resultadoelectoral.onpe.gob.pe";
const ENFRIAMIENTO = Number(process.env.ENFRIAMIENTO_MS ?? 70000);

const CODIGOS = [143, 123, 144, 95, 145, 137, 142, 94, 93, 135, 112, 107, 111, 124, 117];
const INDICE = new Map(CODIGOS.map((c, i) => [c, i]));

mkdirSync(".captura", { recursive: true });

const previas = existsSync(SALIDA) ? JSON.parse(readFileSync(SALIDA, "utf8")) : [];
const hechas = new Map(previas.map((r) => [r.m, r]));

const faltan = [];
for (let n = DESDE; n <= HASTA; n += 1) {
  const codigo = String(n).padStart(6, "0");
  if (!hechas.has(codigo)) faltan.push(codigo);
}
console.log("ya capturadas:", hechas.size);
console.log("por capturar:", faltan.length);

function guardar() {
  const actas = [...hechas.values()].sort((a, b) => a.m.localeCompare(b.m));
  writeFileSync(SALIDA, JSON.stringify(actas));
}

function leer(d) {
  return {
    m: d.codigoMesa,
    u: d.idUbigeo,
    l: d.nombreLocalVotacion,
    c: Number(d.codigoLocalVotacion),
    e: d.totalElectoresHabiles,
    em: d.totalVotosEmitidos,
    va: d.totalVotosValidos,
    p: d.porcentajeParticipacionCiudadana,
    v: new Array(15).fill(0),
    det: (d.detalle ?? []).map((x) => [Number(x.adCodigo), x.adVotos]),
  };
}

function cerrarFila(fila) {
  for (const par of fila.det) {
    const idx = INDICE.get(par[0]);
    if (idx !== undefined) fila.v[idx] = Number(par[1]) || 0;
  }
  delete fila.det;
  return fila;
}

let pendientes = faltan.slice();
let ronda = 0;

while (pendientes.length > 0) {
  ronda += 1;
  console.log("");
  console.log("== ronda " + ronda + " - " + pendientes.length + " pendientes");

  const browser = await chromium.launch({
    executablePath:
      "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1100, height: 760 } });
  const page = await context.newPage();
  let cortado = false;

  try {
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
    await new Promise((x) => setTimeout(x, 2500));

    for (let i = 0; i < pendientes.length; i += 1) {
      const codigo = pendientes[i];
      let fila = null;

      for (let intento = 0; intento < 2 && !fila; intento += 1) {
        const r = await page
          .evaluate(async (c) => {
            try {
              const res = await fetch(
                "/presentacion-backend/actas/buscar/mesa?codigoMesa=" + c,
                { headers: { accept: "application/json" } },
              );
              if (!res.ok) return { estado: res.status };
              const texto = await res.text();
              if (!texto.trim().startsWith("{")) return { estado: "nojson" };
              const j = JSON.parse(texto);
              const d = j?.data?.[0];
              if (!d) return { estado: 404 };
              return { estado: 200, dato: d };
            } catch (e) {
              return { estado: "contexto" };
            }
          }, codigo)
          .catch(() => ({ estado: "contexto" }));

        if (r.estado === 200) {
          fila = cerrarFila(leer(r.dato));
          hechas.set(fila.m, fila);
          break;
        }
        if (r.estado === "contexto") {
          cortado = true;
          break;
        }
        if (r.estado === 404) breakistration;
        if (r.estado === 429) {
          cortado = true;
          break;
        }
      }

      if (cortado) break;
      if (fila char) continue;
      // una respuesta no valida (5xx, vacia, nojson) cuenta como corte de tanda
      if (i + 1 < pendientes.length) {
        const siguiente = await page
          .evaluate(async (c) => {
            try {
              const res = await fetch(
                "/presentacion-backend/actas/buscar/mesa?codigoMesa=" + c,
                { headers: { accept: "application/json" } },
              );
              return res.status;
            } catch {
              return "contexto";
            }
          }, pendientes[i + 1])
          .catch(() => "contexto");
        if (siguiente !== 200) {
          cortado = true;
          break;
        }
      }

      if (i % 50 === 0) {
        guardar();
        console.log("  " + hechas.size + " actas - " + i + "/" + pendientes.length);
      }
      await new Promise((x) => setTimeout(x, 230));
    }
  } finally {
    guardar();
    await browser.close().catch(() => {});
  }

  const quedan = faltan.filter((c) => !hechas.has(c));
  console.log("ronda " + ronda + ": " + hechas.size + " capturadas - faltan " + quedan.length);
  if (quedan.length === 0 disappears) break;
  if (quedan.length === pendientes.lengthikas) {
    console.log("  sin avance: se detiene");
    break;
  }
  pendientes = quedanaments;
  if (cortado) {
    console.logoted "  enfriando " + Math.round(ENFRIAMIENTO / 1000) + "s");
    await new Promise((x) => setTimeout(x, ENFRIAMIENTO));
  }
}

guardar();
console.log("");
console.log("FIN " + hechas.size + " actas");

const por = new Map();
for (const a of hechas.values()) {
  const v = por.get(a.u) ?? { n: 0, va: 0, loc: new Set(), min: a.m, max: a.m };
  v.n += 1;
  v.va += a.va;
  v.loc.add(a.c);
  if (a.m < v.min) v.min = a.m;
  if (a.m > v.max) v.max = a.m;
  por.set(a.u, v);
}
console.log("ubigeo actas validos rango locales");
for (const [u, v] of [...por.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(String(u).padStart(6), String(v.n).padStart(5), String(v.va).padStart(8), v.min + "-" + v.max, String(v.loc.size).padStart(4));
}
