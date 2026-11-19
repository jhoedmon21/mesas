/* Diagnóstico: posiciones de las asociaciones frente al anillo distrital.
   ¿Qué polígonos esquemáticos caen fuera del límite o lo desbordan? */
import { ASOCIACIONES } from "../data/cerroColoradoGeo.ts";
import { LIMITE_CERRO_COLORADO } from "../data/limiteCerroColorado.ts";

const ANILLO = LIMITE_CERRO_COLORADO;

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
  const kx = 111320 * Math.cos((p[1] * Math.PI) / 180);
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i, i += 1) {
    const a = anillo[j];
    const b = anillo[i];
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

function centroide(ring) {
  const pts = ring.slice(0, -1);
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

const filas = ASOCIACIONES.features.map((f) => {
  const ring = f.geometry.coordinates[0];
  const c = centroide(ring);
  const fuera = ring.slice(0, -1).filter((p) => !dentro(p, ANILLO) && alBorde(p, ANILLO) > 1).length;
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  const anchoM = Math.round(
    (Math.max(...xs) - Math.min(...xs)) *
      111320 *
      Math.cos((c[1] * Math.PI) / 180),
  );
  const altoM = Math.round((Math.max(...ys) - Math.min(...ys)) * 110574);
  return {
    nombre: f.properties.nombre,
    centro: dentro(c, ANILLO),
    bordeM: Math.round(alBorde(c, ANILLO)),
    verticesFuera: fuera,
    vertices: ring.length - 1,
    anchoM,
    altoM,
    c,
  };
});

filas.sort((a, b) => b.bordeM - a.bordeM);
for (const f of filas) {
  const marca = !f.centro ? "CENTRO FUERA" : f.verticesFuera ? "desborda" : "ok";
  console.log(
    `${marca.padEnd(12)} borde ${String(f.bordeM).padStart(5)} m · ${f.verticesFuera}/${f.vertices} vértices fuera · ${f.anchoM}×${f.altoM} m · ${f.nombre} @ ${f.c[0].toFixed(5)},${f.c[1].toFixed(5)}`,
  );
}
console.log(
  `\ncentros fuera: ${filas.filter((f) => !f.centro).length}/${filas.length} · desbordan: ${filas.filter((f) => f.verticesFuera).length}`,
);
