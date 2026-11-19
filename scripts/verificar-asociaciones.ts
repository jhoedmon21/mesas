import { ASOCIACIONES, POBLACION_DISTRITAL } from "@/data/cerroColoradoGeo";
import { LIMITE_CERRO_COLORADO } from "@/data/limiteCerroColorado";

/* Verificación de la capa completa de 84 asociaciones. */

const ANILLO = LIMITE_CERRO_COLORADO as [number, number][];

function dentro([x, y]: [number, number]): boolean {
  let dentro = false;
  for (let i = 0, j = ANILLO.length - 1; i < ANILLO.length; j = i, i += 1) {
    const [xi, yi] = ANILLO[i];
    const [xj, yj] = ANILLO[j];
    const cruza =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

function orient(
  a: [number, number],
  b: [number, number],
  c: [number, number],
): number {
  const v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return Math.abs(v) < 1e-14 ? 0 : v > 0 ? 1 : -1;
}

function enSegmento(
  a: [number, number],
  b: [number, number],
  p: [number, number],
): boolean {
  return (
    Math.min(a[0], b[0]) - 1e-12 <= p[0] &&
    p[0] <= Math.max(a[0], b[0]) + 1e-12 &&
    Math.min(a[1], b[1]) - 1e-12 <= p[1] &&
    p[1] <= Math.max(a[1], b[1]) + 1e-12
  );
}

function segmentosCruzan(
  a: [number, number],
  b: [number, number],
  c: [number, number],
  d: [number, number],
): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && enSegmento(a, b, c)) return true;
  if (o2 === 0 && enSegmento(a, b, d)) return true;
  if (o3 === 0 && enSegmento(c, d, a)) return true;
  if (o4 === 0 && enSegmento(c, d, b)) return true;
  return false;
}

function caja(ring: [number, number][]): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

function puntoEnRing(p: [number, number], ring: [number, number][]): boolean {
  let d = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > p[1] !== yj > p[1] &&
      p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || 1e-12) + xi
    ) {
      d = !d;
    }
  }
  return d;
}

function seCruzan(
  A: [number, number][],
  B: [number, number][],
): boolean {
  const [aminx, aminy, amaxx, amaxy] = caja(A);
  const [bminx, bminy, bmaxx, bmaxy] = caja(B);
  if (amaxx < bminx || bmaxx < aminx || amaxy < bminy || bmaxy < aminy) {
    return false;
  }
  for (let i = 0; i < A.length - 1; i += 1) {
    for (let j = 0; j < B.length - 1; j += 1) {
      if (segmentosCruzan(A[i], A[i + 1], B[j], B[j + 1])) return true;
    }
  }
  return puntoEnRing(A[0], B) || puntoEnRing(B[0], A);
}

let errores = 0;
const fallo = (texto: string) => {
  errores += 1;
  console.log(`  ✗ ${texto}`);
};

// 1. Conteo e ids únicos
const ids = new Set(ASOCIACIONES.features.map((f) => f.properties.id));
console.log(`Asociaciones: ${ASOCIACIONES.features.length} · ids únicos: ${ids.size}`);
if (ASOCIACIONES.features.length !== 84) fallo("no hay 84 asociaciones");
if (ids.size !== ASOCIACIONES.features.length) fallo("hay ids repetidos");

// 2. APIPA I–XVIII completo
const romanos = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"];
const apipa = new Set(
  ASOCIACIONES.features
    .filter((f) => /^APIPA Sector /i.test(f.properties.nombre))
    .map((f) => f.properties.nombre.replace(/^APIPA Sector /i, "")),
);
const faltan = romanos.filter((r) => !apipa.has(r));
console.log(`APIPA: ${apipa.size}/18 sectores${faltan.length ? ` · faltan ${faltan.join(", ")}` : " · I–XVIII completos"}`);
if (faltan.length) fallo(`faltan APIPA ${faltan.join(", ")}`);

// 3. Todos los vértices dentro del anillo (los base pueden tocar el borde)
let fuera = 0;
for (const f of ASOCIACIONES.features) {
  const ring = f.geometry.coordinates[0] as [number, number][];
  for (const p of ring.slice(0, -1)) {
    if (!dentro(p)) {
      fuera += 1;
      break;
    }
  }
}
console.log(`Polígonos con algún vértice fuera del anillo: ${fuera}`);
if (fuera > 4) fallo("más polígonos que los 4 base que tocan el borde");

// 4. Sin superposiciones
let cruces = 0;
for (let i = 0; i < ASOCIACIONES.features.length; i += 1) {
  const A = ASOCIACIONES.features[i].geometry.coordinates[0] as [number, number][];
  for (let j = i + 1; j < ASOCIACIONES.features.length; j += 1) {
    const B = ASOCIACIONES.features[j].geometry.coordinates[0] as [number, number][];
    if (seCruzan(A, B)) {
      cruces += 1;
      if (cruces <= 5) {
        console.log(
          `  cruce: ${ASOCIACIONES.features[i].properties.nombre} ↔ ${ASOCIACIONES.features[j].properties.nombre}`,
        );
      }
    }
  }
}
console.log(`Pares de polígonos superpuestos: ${cruces}`);
if (cruces) fallo("hay polígonos encimados");

// 5. Reparto por sector y demografía
const porSector = new Map<string, number>();
let familias = 0;
let lotes = 0;
for (const f of ASOCIACIONES.features) {
  porSector.set(
    f.properties.sector,
    (porSector.get(f.properties.sector) ?? 0) + 1,
  );
  familias += f.properties.familias;
  lotes += f.properties.lotes;
}
console.log(`Sectores: ${[...porSector.entries()].map(([s, n]) => `${s} ${n}`).join(" · ")}`);
console.log(
  `Familias: ${familias.toLocaleString("es-PE")} · lotes: ${lotes.toLocaleString("es-PE")} · habitantes estimados: ${Math.round(familias * 3.64).toLocaleString("es-PE")} (INEI ${POBLACION_DISTRITAL.toLocaleString("es-PE")})`,
);
if (Math.abs(familias * 3.64 - POBLACION_DISTRITAL) > POBLACION_DISTRITAL * 0.02) {
  fallo("la suma de familias no cuadra con la población distrital");
}

// 6. Todos los CUI únicos
const cuis = new Set(ASOCIACIONES.features.map((f) => f.properties.codigoCUI));
console.log(`CUI únicos: ${cuis.size}/${ASOCIACIONES.features.length}`);
if (cuis.size !== ASOCIACIONES.features.length) fallo("hay CUI repetidos");

console.log(errores ? `\n${errores} error(es)` : "\nCapa de 84 asociaciones verificada.");
process.exit(errores ? 1 : 0);
