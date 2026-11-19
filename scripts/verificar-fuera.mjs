/* Diagnóstico: qué mesas caen fuera del anillo de Cerro Colorado y por qué.
   Reproduce el jitter determinista de data/mesasCerroColorado.ts para ubicar
   el punto exacto de cada acta y mide su distancia al borde del distrito. */
import { ACTAS } from "../data/actasCerroColorado.ts";
import { LOCALES_POR_CODIGO } from "../data/localesZona.ts";
import { LIMITE_CERRO_COLORADO } from "../data/limiteCerroColorado.ts";

const ANILLO = LIMITE_CERRO_COLORADO;

const xs = ANILLO.map((p) => p[0]);
const ys = ANILLO.map((p) => p[1]);
console.log(
  `anillo: ${ANILLO.length} vértices · lng ${Math.min(...xs).toFixed(5)}..${Math.max(...xs).toFixed(5)} · lat ${Math.min(...ys).toFixed(5)}..${Math.max(...ys).toFixed(5)}`,
);

function hash(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function entre(rand, min, max) {
  return min + (max - min) * rand();
}

function dentro([x, y], anillo) {
  let d = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i, i += 1) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];
    const cruza = yi > y !== yj > y && x < ((xj - xi) * (y - yi) / (yj - yi || 1e-12)) + xi;
    if (cruza) d = !d;
  }
  return d;
}

function alBorde(p, anillo) {
  let min = Infinity;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i, i += 1) {
    const a = anillo[j];
    const b = anillo[i];
    const kx = 111320 * Math.cos((p[1] * Math.PI) / 180);
    const dx = (b[0] - a[0]) * kx;
    const dy = (b[1] - a[1]) * 110574;
    const px = (p[0] - a[0]) * kx;
    const py = (p[1] - a[1]) * 110574;
    const len2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, (px * dx + py * dy) / len2));
    min = Math.min(min, Math.hypot(px - t * dx, py - t * dy));
  }
  return min;
}

const porLocal = new Map();
let sinLocal = 0;
for (const acta of [...ACTAS].sort((a, b) => a.codigo.localeCompare(b.codigo))) {
  const local = LOCALES_POR_CODIGO.get(acta.localCodigo);
  let punto;
  if (local) {
    const rand = rng(hash(`local-${acta.codigo}`));
    punto = [
      local.position[0] + entre(rand, -1, 1) * 0.00024,
      local.position[1] + entre(rand, -1, 1) * 0.00021,
    ];
  } else {
    sinLocal += 1;
    continue;
  }
  if (!local.dentroDistrito && dentro(punto, ANILLO)) continue;
  const fila = porLocal.get(local.codigo) ?? { local, fuera: 0, detalle: [] };
  fila.fuera += 1;
  fila.detalle.push({ acta: acta.codigo, bordeM: Math.round(alBorde(punto, ANILLO)), punto });
  porLocal.set(local.codigo, fila);
}

const filas = [...porLocal.values()].sort((a, b) => b.fuera - a.fuera);
for (const f of filas) {
  console.log(
    `${f.fuera} mesas · ${f.local.codigo} ${f.local.nombre}${f.local.dentroDistrito ? " (marcado dentroDistrito)" : ""}`,
  );
  console.log(
    `   local ${f.local.position[0].toFixed(6)},${f.local.position[1].toFixed(6)} · borde local ${Math.round(alBorde(f.local.position, ANILLO))} m`,
  );
}
console.log(`\nlocales fuera: ${filas.length} · actas fuera: ${filas.reduce((s, f) => s + f.fuera, 0)} · actas sin local: ${sinLocal}`);
