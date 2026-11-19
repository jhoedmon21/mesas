// Captura las actas reales de ONPE (ERM 2026, Gobernador Regional de Arequipa)
// para los 15 distritos del tablero. Usa el endpoint por distrito + detalle por
// acta, con reanudación y guardado incremental.
//
//   node scripts/capturar-actas-distritos.mjs
//   SOLO=40109 LIMITE=25 node scripts/capturar-actas-distritos.mjs
//
// Salida: .captura/distritos/<ubigeo>.json
// Fila: { m, id, u, l, c, e, em, va, p, est, v[15] }

import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const BASE = "https://resultadoelectoral.onpe.gob.pe";
const SALIDA = ".captura/distritos";

// Orden de CANDIDATOS en data/candidatosArequipa2026.ts.
const CODIGOS = [143, 123, 144, 95, 145, 137, 142, 94, 93, 135, 112, 107, 111, 124, 117];
const INDICE = new Map(CODIGOS.map((c, i) => [c, i]));

const DISTRITOS = [
  { id: "cerro", nombre: "Cerro Colorado", ubigeo: 40103 },
  { id: "paucarpata", nombre: "Paucarpata", ubigeo: 40109 },
  { id: "cayma", nombre: "Cayma", ubigeo: 40102 },
  { id: "alto-selva-alegre", nombre: "Alto Selva Alegre", ubigeo: 40128 },
  { id: "majes", nombre: "Majes", ubigeo: 40220 },
  { id: "arequipa", nombre: "Arequipa", ubigeo: 40101 },
  { id: "mariano-melgar", nombre: "Mariano Melgar", ubigeo: 40126 },
  { id: "miraflores", nombre: "Miraflores", ubigeo: 40107 },
  { id: "socabaya", nombre: "Socabaya", ubigeo: 40119 },
  { id: "jlbr", nombre: "José Luis Bustamante y Rivero", ubigeo: 40129 },
  { id: "jacobo-hunter", nombre: "Jacobo Hunter", ubigeo: 40127 },
  { id: "yura", nombre: "Yura", ubigeo: 40125 },
  { id: "mollendo", nombre: "Mollendo", ubigeo: 40701 },
  { id: "yanahuara", nombre: "Yanahuara", ubigeo: 40123 },
  { id: "la-joya", nombre: "La Joya", ubigeo: 40106 },
];

const SOLO = process.env.SOLO
  ? new Set(
      process.env.SOLO.split(",")
        .map((x) => Number(x.trim()))
        .filter(Boolean),
    )
  : null;
const LIMITE = process.env.LIMITE ? Number(process.env.LIMITE) : Infinity;
const PAUSA = Number(process.env.PAUSA_MS ?? 140);
// Cerro Colorado ya tiene sus 506 actas capturadas en data/actasCerroColorado.ts.
// Volver a bajarlas duplicaría el trabajo y el dataset.
const YA_CAPTURADOS = new Set([40103]);

mkdirSync(SALIDA, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function guardar(ubigeo, filas) {
  const orden = [...filas.values()].sort((a, b) => a.m.localeCompare(b.m));
  writeFileSync(`${SALIDA}/${ubigeo}.json`, JSON.stringify(orden));
}

function leerFila(d) {
  const votos = new Array(15).fill(0);
  for (const x of d.detalle ?? []) {
    const idx = INDICE.get(Number(x.nAgrupacionPolitica));
    if (idx !== undefined) votos[idx] = Number(x.nVotos) || 0;
  }
  return {
    m: String(d.codigoMesa),
    id: d.id,
    u: d.idUbigeo,
    l: d.nombreLocalVotacion,
    c: d.codigoLocalVotacion ?? null,
    e: d.totalElectoresHabiles,
    em: d.totalVotosEmitidos,
    va: d.totalVotosValidos,
    p: d.porcentajeParticipacionCiudadana,
    est: d.codigoEstadoActa,
    v: votos,
  };
}

const browser = await chromium.launch({
  executablePath:
    "C:/Users/Usuario/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
  headless: true,
});
const VISTA = { width: 1200, height: 800 };
let page = await browser.newPage({ viewport: VISTA });

/* El 405 de ONPE es de la sesión de la página, no del IP: una página nueva
   vuelve a recibir 200. Se usa tanto para el listado como para el detalle. */
async function sesionNueva() {
  await page.close().catch(() => {});
  page = await browser.newPage({ viewport: VISTA });
  await page
    .goto(BASE, { waitUntil: "domcontentloaded", timeout: 120_000 })
    .catch(() => {});
  await dormir(2200);
}

/** Listado completo de actas del distrito, con reintento de sesión. */
async function listarActas(ubigeo) {
  for (let intento = 0; intento < 6; intento += 1) {
    const r = await page.evaluate(async (u) => {
      const out = [];
      let pagina = 0;
      let totalPaginas = 1;
      let totalRegistros = 0;
      while (pagina < totalPaginas) {
        const res = await fetch(
          `/presentacion-backend/actas?pagina=${pagina}&tamanio=100&idAmbitoGeografico=1&idUbigeo=${u}`,
          { headers: { accept: "application/json" } },
        );
        if (!res.ok) return { estado: res.status, pagina };
        const j = await res.json();
        totalPaginas = j?.data?.totalPaginas ?? 0;
        totalRegistros = j?.data?.totalRegistros ?? 0;
        for (const c of j?.data?.content ?? []) {
          if (c.idEleccion === 1) out.push({ id: c.id, mesa: c.codigoMesa });
        }
        pagina += 1;
      }
      return { estado: 200, out, totalPaginas, totalRegistros };
    }, ubigeo);

    if (r.estado === 200) return r;
    console.log(
      `  listado ${ubigeo}: ${r.estado} en página ${r.pagina} · sesión nueva (${intento + 1})`,
    );
    await sesionNueva();
  }
  throw new Error(`No se pudo listar las actas del ubigeo ${ubigeo}`);
}

try {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await dormir(2500);

  for (const distrito of DISTRITOS) {
    if (SOLO && !SOLO.has(distrito.ubigeo)) continue;
    if (YA_CAPTURADOS.has(distrito.ubigeo)) {
      console.log(`\n${distrito.nombre} (${distrito.ubigeo}): ya está en data/actasCerroColorado.ts`);
      continue;
    }
    const archivo = `${SALIDA}/${distrito.ubigeo}.json`;
    const previas = existsSync(archivo)
      ? JSON.parse(readFileSync(archivo, "utf8"))
      : [];
    const hechas = new Map(previas.map((f) => [f.m, f]));

    // 1. Todas las actas del distrito (la lista mezcla las 4 elecciones).
    const lista = await listarActas(distrito.ubigeo);

    const mesas = new Map(lista.out.map((x) => [x.mesa, x]));
    console.log(
      `\n${distrito.nombre} (${distrito.ubigeo}): ${mesas.size} actas regionales · ${lista.totalRegistros} registros · ${lista.totalPaginas} páginas · ${hechas.size} ya capturadas`,
    );

    let nuevas = 0;
    let fallos = 0;
    let i = 0;
    for (const { id, mesa } of mesas.values()) {
      if (hechas.has(mesa)) continue;
      if (nuevas >= LIMITE) break;
      i += 1;

      let fila = null;
      for (let intento = 0; intento < 6 && !fila; intento += 1) {
        const r = await page.evaluate(async (actaId) => {
          try {
            const res = await fetch("/presentacion-backend/actas/" + actaId, {
              headers: { accept: "application/json" },
            });
            const texto = await res.text();
            if (!res.ok || !texto.trim().startsWith("{")) {
              return { estado: res.status };
            }
            return { estado: 200, dato: JSON.parse(texto)?.data };
          } catch {
            return { estado: "red" };
          }
        }, id);

        if (r.estado === 200 && r.dato) {
          fila = leerFila(r.dato);
        } else {
          fallos += 1;
          /* El 405 de ONPE es de la sesión de la página, no del IP: una
             recarga completa obtiene una sesión nueva y sigue devolviendo 200.
             Se recarga en caliente en vez de esperar minutos. */
          if (r.estado === 405) {
            console.log(`  ${mesa}: 405 · sesión nueva`);
            // El bloqueo es de la sesión de la página, no del IP: un contexto
            // nuevo (nueva página) vuelve a recibir 200. Recargar la misma
            // página conserva la cookie bloqueada y no sirve.
            await sesionNueva();
          } else {
            console.log(
              `  ${mesa}: ${r.estado} · reintento ${intento + 1}`,
            );
            await dormir(4_000 * (intento + 1));
          }
        }
      }

      if (!fila) {
        guardar(distrito.ubigeo, hechas);
        throw new Error(`No se pudo capturar el acta ${mesa} (${id})`);
      }
      hechas.set(fila.m, fila);
      nuevas += 1;
      if (nuevas % 25 === 0) {
        guardar(distrito.ubigeo, hechas);
        console.log(`  ${hechas.size}/${mesas.size} · ${fallos} reintentos`);
      }
      await dormir(PAUSA);
    }

    guardar(distrito.ubigeo, hechas);
    const filas = [...hechas.values()];
    const validos = filas.reduce((s, f) => s + (f.va ?? 0), 0);
    const zegarra = filas.reduce((s, f) => s + (f.v?.[0] ?? 0), 0);
    console.log(
      `  guardado ${filas.length} actas · ${validos} válidos · ${zegarra} Zegarra · ${fallos} reintentos`,
    );
  }
} finally {
  await browser.close().catch(() => {});
}
