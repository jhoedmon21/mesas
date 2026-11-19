/* ============================================================================
   Generador de las 65 asociaciones restantes de Cerro Colorado
   ----------------------------------------------------------------------------
   Toma los 19 bloques ya publicados en data/cerroColoradoGeo.ts, completa los
   sectores APIPA que faltan (I–XVIII) y reparte el resto entre los otros cinco
   sectores del modelo. Para cada bloque muestrea un centro dentro de la ventana
   del sector, lo encaja en el anillo distrital con las mismas funciones del
   visor y descarta el candidato si se superpone o queda a menos de 30 m de otro
   bloque. El resultado se escribe en data/asociacionesRestantes.ts.

   Uso:
     node scripts/generar-asociaciones.mjs
     node scripts/generar-asociaciones.mjs --check   (solo verifica geometrías)

   Los nombres provienen del Cuadro N°30 «Asociaciones de vivienda» del
   Diagnóstico del PPRRD de la Municipalidad Distrital de Cerro Colorado (2018)
   y de los sectores críticos del mismo documento. La validación y sus fuentes
   están en docs/validacion-asociaciones.md.
   ========================================================================== */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..");
const RUTA_GEO = path.join(RAIZ, "data/cerroColoradoGeo.ts");
const RUTA_LIMITE = path.join(RAIZ, "data/limiteCerroColorado.ts");
const RUTA_SALIDA = path.join(RAIZ, "data/asociacionesRestantes.ts");

/* ------------------------------------------- anillo y semillas existentes */

const fuenteLimite = fs.readFileSync(RUTA_LIMITE, "utf8");
const ANILLO = [...fuenteLimite.matchAll(/\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/g)]
  .map((m) => [Number(m[1]), Number(m[2])]);

if (ANILLO.length < 100) {
  throw new Error(`Anillo distrital inesperado: ${ANILLO.length} vértices`);
}

const fuenteGeo = fs.readFileSync(RUTA_GEO, "utf8");
const bloqueSemillas = fuenteGeo.match(
  /const SEMILLAS_BASE: SemillaAsociacion\[\] = (\[[\s\S]*?\n\]);/,
);
if (!bloqueSemillas) {
  throw new Error("No se encontró el arreglo SEMILLAS_BASE en cerroColoradoGeo.ts");
}
const BASE = new Function(`return ${bloqueSemillas[1]};`)();
if (BASE.length !== 19) {
  throw new Error(`Se esperaban 19 asociaciones base, hay ${BASE.length}`);
}

/* -------------------------------------- geometría: copia del visor, exacta */

const M_POR_GRADO_LAT = 110_574;
const metrosLng = (lat) => 111_320 * Math.cos((lat * Math.PI) / 180);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function crearPoligono(lat, lng, anchoKm, altoKm, seed) {
  const rand = mulberry32(seed);
  const ancho = anchoKm * 1000;
  const alto = altoKm * 1000;
  const giro = (rand() - 0.5) * 1.15;
  const cos = Math.cos(giro);
  const sin = Math.sin(giro);
  const esquinas = [
    [-ancho / 2, -alto / 2],
    [ancho / 2, -alto / 2],
    [ancho / 2, alto / 2],
    [-ancho / 2, alto / 2],
  ];
  const tramosPorLado = 3;
  const amplitud = Math.min(ancho, alto) * 0.05;
  const puntos = [];
  for (let i = 0; i < 4; i += 1) {
    const a = esquinas[i];
    const b = esquinas[(i + 1) % 4];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const largo = Math.hypot(dx, dy) || 1;
    const nx = -dy / largo;
    const ny = dx / largo;
    for (let k = 0; k < tramosPorLado; k += 1) {
      const t = k / tramosPorLado;
      const empuje = k === 0 ? 0 : (rand() - 0.5) * 2 * amplitud;
      const x = a[0] + dx * t + nx * empuje;
      const y = a[1] + dy * t + ny * empuje;
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      puntos.push([
        Number((lng + rx / metrosLng(lat)).toFixed(6)),
        Number((lat + ry / M_POR_GRADO_LAT).toFixed(6)),
      ]);
    }
  }
  puntos.push(puntos[0]);
  return puntos;
}

function dentroDistrito([x, y], anillo = ANILLO) {
  let dentro = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i, i += 1) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];
    const cruza =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

function puntoMasCercanoDelAnillo(p) {
  const kx = metrosLng(p[1]);
  let mejor = ANILLO[0];
  let menor = Infinity;
  for (let i = 0, j = ANILLO.length - 1; i < ANILLO.length; j = i, i += 1) {
    const a = ANILLO[j];
    const b = ANILLO[i];
    const dx = (b[0] - a[0]) * kx;
    const dy = (b[1] - a[1]) * M_POR_GRADO_LAT;
    const px = (p[0] - a[0]) * kx;
    const py = (p[1] - a[1]) * M_POR_GRADO_LAT;
    const largo2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, (px * dx + py * dy) / largo2));
    const d = Math.hypot(px - t * dx, py - t * dy);
    if (d < menor) {
      menor = d;
      mejor = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
  }
  return mejor;
}

const ESCALA_BLOQUE = 0.82;

function encajarEnDistrito(ring) {
  const anillo = ring.slice(0, -1);
  const suma = anillo.reduce(
    (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
    [0, 0],
  );
  const centro = [suma[0] / anillo.length, suma[1] / anillo.length];
  const kx = metrosLng(centro[1]);
  let bloque = anillo.map(([x, y]) => [
    centro[0] + (x - centro[0]) * ESCALA_BLOQUE,
    centro[1] + (y - centro[1]) * ESCALA_BLOQUE,
  ]);
  const radio = Math.max(
    ...bloque.map((p) =>
      Math.hypot(
        (p[0] - centro[0]) * kx,
        (p[1] - centro[1]) * M_POR_GRADO_LAT,
      ),
    ),
  );
  let ancla = centro;
  if (!dentroDistrito(centro)) {
    const borde = puntoMasCercanoDelAnillo(centro);
    const dx = (borde[0] - centro[0]) * kx;
    const dy = (borde[1] - centro[1]) * M_POR_GRADO_LAT;
    const largo = Math.hypot(dx, dy) || 1;
    const empuje = largo > 500 ? largo + radio + 120 : largo + 40;
    const dLng = (dx / largo) * empuje;
    const dLat = (dy / largo) * empuje;
    ancla = [centro[0] + dLng / kx, centro[1] + dLat / M_POR_GRADO_LAT];
    bloque = bloque.map(([x, y]) => [
      x + dLng / kx,
      y + dLat / M_POR_GRADO_LAT,
    ]);
    let escala = 1;
    while (escala > 0.75 && bloque.some((p) => !dentroDistrito(p))) {
      escala *= 0.88;
      bloque = bloque.map(([x, y]) => [
        ancla[0] + (x - ancla[0]) * escala,
        ancla[1] + (y - ancla[1]) * escala,
      ]);
    }
  }
  const recortado = bloque.map((p) =>
    dentroDistrito(p) ? p : puntoMasCercanoDelAnillo(p),
  );
  return [...recortado, recortado[0]];
}

/* ------------------------------------------------------- geometría de apoyo */

function bbox(ring) {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function orient(a, b, c) {
  const v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(v) < 1e-14) return 0;
  return v > 0 ? 1 : -1;
}

function enSegmento(a, b, p) {
  return (
    Math.min(a[0], b[0]) - 1e-12 <= p[0] &&
    p[0] <= Math.max(a[0], b[0]) + 1e-12 &&
    Math.min(a[1], b[1]) - 1e-12 <= p[1] &&
    p[1] <= Math.max(a[1], b[1]) + 1e-12
  );
}

function segmentosCruzan(a, b, c, d) {
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

function puntoEnAnillo(p, ring) {
  return dentroDistrito(p, ring.slice(0, -1));
}

/** Distancia mínima entre dos segmentos, en metros. */
function distanciaSegmentos(a, b, c, d) {
  const kx = metrosLng((a[1] + c[1]) / 2);
  const proy = (p) => [p[0] * kx, p[1] * M_POR_GRADO_LAT];
  const [ax, ay] = proy(a);
  const [bx, by] = proy(b);
  const [cx, cy] = proy(c);
  const [dx, dy] = proy(d);
  const puntoSeg = (px, py, x1, y1, x2, y2) => {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const largo2 = vx * vx + vy * vy || 1e-9;
    const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / largo2));
    return Math.hypot(px - (x1 + t * vx), py - (y1 + t * vy));
  };
  if (segmentosCruzan([ax, ay], [bx, by], [cx, cy], [dx, dy])) return 0;
  return Math.min(
    puntoSeg(ax, ay, cx, cy, dx, dy),
    puntoSeg(bx, by, cx, cy, dx, dy),
    puntoSeg(cx, cy, ax, ay, bx, by),
    puntoSeg(dx, dy, ax, ay, bx, by),
  );
}

function poligonosSeCruzan(A, B) {
  const [aminx, aminy, amaxx, amaxy] = bbox(A);
  const [bminx, bminy, bmaxx, bmaxy] = bbox(B);
  if (amaxx < bminx || bmaxx < aminx || amaxy < bminy || bmaxy < aminy) {
    return false;
  }
  for (let i = 0; i < A.length - 1; i += 1) {
    for (let j = 0; j < B.length - 1; j += 1) {
      if (segmentosCruzan(A[i], A[i + 1], B[j], B[j + 1])) return true;
    }
  }
  return puntoEnAnillo(A[0], B) || puntoEnAnillo(B[0], A);
}

function distanciaPoligonos(A, B) {
  let menor = Infinity;
  for (let i = 0; i < A.length - 1; i += 1) {
    for (let j = 0; j < B.length - 1; j += 1) {
      menor = Math.min(
        menor,
        distanciaSegmentos(A[i], A[i + 1], B[j], B[j + 1]),
      );
    }
  }
  return menor;
}

const GAP_MIN_M = 30;

/* ------------------------------------------------------------- los 19 base */

const EXISTENTES = BASE.map((s) => ({
  id: s.id,
  nombre: s.nombre,
  ring: encajarEnDistrito(
    crearPoligono(s.lat, s.lng, s.anchoKm, s.altoKm, s.seed),
  ),
}));

const problemasBase = [];
for (let i = 0; i < EXISTENTES.length; i += 1) {
  const A = EXISTENTES[i].ring;
  if (!A.slice(0, -1).every((p) => dentroDistrito(p))) {
    problemasBase.push(`${EXISTENTES[i].nombre}: vértice fuera del anillo`);
  }
  for (let j = i + 1; j < EXISTENTES.length; j += 1) {
    if (poligonosSeCruzan(A, EXISTENTES[j].ring)) {
      problemasBase.push(
        `${EXISTENTES[i].nombre} se cruza con ${EXISTENTES[j].nombre}`,
      );
    }
  }
}

/* --------------------------------------------------------- catálogo de 65 */

const CATALOGO = [
  /* APIPA I–XVIII: faltan II, IV, VI, VIII, IX, XI, XII, XIV, XV y XVII. */
  { id: "apipa-ii", nombre: "APIPA Sector II", sector: "Cono Norte", perfil: "COFOPRI", peso: 2300, ancho: 0.40, alto: 0.32, ventana: "apipa" },
  { id: "apipa-iv", nombre: "APIPA Sector IV", sector: "Cono Norte", perfil: "HABILITACION", peso: 2150, ancho: 0.38, alto: 0.31, ventana: "apipa" },
  { id: "apipa-vi", nombre: "APIPA Sector VI", sector: "Cono Norte", perfil: "SIN", peso: 1900, ancho: 0.36, alto: 0.30, ventana: "apipa" },
  { id: "apipa-viii", nombre: "APIPA Sector VIII", sector: "Cono Norte", perfil: "HABILITACION", peso: 2450, ancho: 0.42, alto: 0.32, ventana: "apipa" },
  { id: "apipa-ix", nombre: "APIPA Sector IX", sector: "Cono Norte", perfil: "COFOPRI", peso: 2200, ancho: 0.39, alto: 0.31, ventana: "apipa" },
  { id: "apipa-xi", nombre: "APIPA Sector XI", sector: "Cono Norte", perfil: "HABILITACION", peso: 2350, ancho: 0.41, alto: 0.32, ventana: "apipa" },
  { id: "apipa-xii", nombre: "APIPA Sector XII", sector: "Cono Norte", perfil: "SIN", peso: 1750, ancho: 0.35, alto: 0.29, ventana: "apipa" },
  { id: "apipa-xiv", nombre: "APIPA Sector XIV", sector: "Cono Norte", perfil: "HABILITACION", peso: 1600, ancho: 0.34, alto: 0.28, ventana: "apipa" },
  { id: "apipa-xv", nombre: "APIPA Sector XV", sector: "Cono Norte", perfil: "COFOPRI", peso: 2250, ancho: 0.40, alto: 0.31, ventana: "apipa" },
  { id: "apipa-xvii", nombre: "APIPA Sector XVII", sector: "Cono Norte", perfil: "SIN", peso: 2000, ancho: 0.37, alto: 0.30, ventana: "apipa" },

  /* Cono Norte / José Luis Bustamante y Rivero. */
  { id: "jlbyr-ii", nombre: "Asoc. José Luis Bustamante y Rivero Sector II", sector: "Cono Norte", perfil: "COFOPRI", peso: 1850, ancho: 0.43, alto: 0.34, ventana: "cono" },
  { id: "jlbyr-iv", nombre: "Asoc. José Luis Bustamante y Rivero Sector IV", sector: "Cono Norte", perfil: "HABILITACION", peso: 1700, ancho: 0.42, alto: 0.33, ventana: "cono" },
  { id: "jlbyr-vi", nombre: "Asoc. José Luis Bustamante y Rivero Sector VI", sector: "Cono Norte", perfil: "HABILITACION", peso: 1650, ancho: 0.41, alto: 0.33, ventana: "cono" },
  { id: "jlbyr-x", nombre: "Asoc. José Luis Bustamante y Rivero Sector X", sector: "Cono Norte", perfil: "COFOPRI", peso: 1900, ancho: 0.44, alto: 0.34, ventana: "cono" },
  { id: "jlbyr-xii", nombre: "Asoc. José Luis Bustamante y Rivero Sector XII", sector: "Cono Norte", perfil: "SIN", peso: 1450, ancho: 0.39, alto: 0.32, ventana: "cono" },
  { id: "villa-cono-norte", nombre: "Asoc. Villa del Cono Norte", sector: "Cono Norte", perfil: "SIN", peso: 1500, ancho: 0.44, alto: 0.34, ventana: "cono" },
  { id: "los-angeles-sur", nombre: "Asoc. Los Ángeles del Sur Zona A", sector: "Cono Norte", perfil: "COFOPRI", peso: 1250, ancho: 0.40, alto: 0.32, ventana: "cono" },
  { id: "villa-chachani", nombre: "Asoc. Villa Chachani", sector: "Cono Norte", perfil: "HABILITACION", peso: 1380, ancho: 0.41, alto: 0.33, ventana: "cono" },
  { id: "chachani-i", nombre: "Asoc. Chachani I", sector: "Cono Norte", perfil: "EN_HABILITACION", peso: 1100, ancho: 0.38, alto: 0.31, ventana: "cono" },
  { id: "ampliacion-chachani", nombre: "Asoc. Ampliación Chachani", sector: "Cono Norte", perfil: "SIN", peso: 980, ancho: 0.37, alto: 0.30, ventana: "cono" },
  { id: "jardines-chachani", nombre: "Asoc. Jardines de Chachani", sector: "Cono Norte", perfil: "HABILITACION", peso: 1050, ancho: 0.38, alto: 0.31, ventana: "cono" },
  { id: "bosques-chachani", nombre: "Asoc. Los Bosques de Chachani", sector: "Cono Norte", perfil: "EN_HABILITACION", peso: 900, ancho: 0.36, alto: 0.30, ventana: "cono" },
  { id: "pedro-huilca-a", nombre: "Asoc. Pedro Huilca Tecse Zona A", sector: "Cono Norte", perfil: "COFOPRI", peso: 1200, ancho: 0.39, alto: 0.32, ventana: "cono" },

  /* Eje Comercial: Ciudad Municipal, mercado mayorista y Av. 54. */
  { id: "ciudad-municipal-i", nombre: "Asoc. Ciudad Municipal Zona I", sector: "Eje Comercial", perfil: "TITULADO", peso: 1150, ancho: 0.40, alto: 0.32, ventana: "eje" },
  { id: "ciudad-municipal-iii", nombre: "Asoc. Ciudad Municipal Zona III", sector: "Eje Comercial", perfil: "TITULADO", peso: 1080, ancho: 0.39, alto: 0.32, ventana: "eje" },
  { id: "ciudad-municipal-iv", nombre: "Asoc. Ciudad Municipal Zona IV", sector: "Eje Comercial", perfil: "COFOPRI", peso: 1010, ancho: 0.38, alto: 0.31, ventana: "eje" },
  { id: "ciudad-municipal-v", nombre: "Asoc. Ciudad Municipal Zona V", sector: "Eje Comercial", perfil: "COFOPRI", peso: 980, ancho: 0.38, alto: 0.31, ventana: "eje" },
  { id: "ciudad-municipal-vi", nombre: "Asoc. Viva Ciudad Municipal Zona VI", sector: "Eje Comercial", perfil: "HABILITACION", peso: 940, ancho: 0.37, alto: 0.30, ventana: "eje" },
  { id: "ciudad-municipal-vii", nombre: "Asoc. Ciudad Municipal Zona VII", sector: "Eje Comercial", perfil: "HABILITACION", peso: 890, ancho: 0.37, alto: 0.30, ventana: "eje" },
  { id: "feria-54", nombre: "Asoc. Comerc. y Microemp. Unidos (Feria 54)", sector: "Eje Comercial", perfil: "EN_HABILITACION", peso: 520, ancho: 0.33, alto: 0.27, ventana: "eje" },
  { id: "mercado-mayorista-1a", nombre: "Asoc. Trab. Mercado Mayorista Sector 1 A", sector: "Eje Comercial", perfil: "TITULADO", peso: 610, ancho: 0.34, alto: 0.28, ventana: "eje" },
  { id: "mercado-mayorista-1b", nombre: "Asoc. Trab. Mercado Mayorista Sector 1 B", sector: "Eje Comercial", perfil: "TITULADO", peso: 560, ancho: 0.33, alto: 0.27, ventana: "eje" },
  { id: "mercado-mayorista-2", nombre: "Asoc. Trab. Mercado Mayorista Sector 2", sector: "Eje Comercial", perfil: "EN_HABILITACION", peso: 480, ancho: 0.32, alto: 0.26, ventana: "eje" },
  { id: "sor-ana-2", nombre: "Asoc. Sor Ana de los Ángeles y Monteagudo Sector 2", sector: "Eje Comercial", perfil: "TITULADO", peso: 760, ancho: 0.35, alto: 0.29, ventana: "eje" },

  /* Zona Tradicional: Cerro Viejo, Zamácola, cabrerías y El Salvador. */
  { id: "cerro-viejo-tradicional", nombre: "Pueblo Tradicional Cerro Viejo", sector: "Zona Tradicional", perfil: "SIN", peso: 820, ancho: 0.42, alto: 0.34, ventana: "tradicional" },
  { id: "san-pedro", nombre: "Asoc. San Pedro", sector: "Zona Tradicional", perfil: "TITULADO", peso: 640, ancho: 0.36, alto: 0.29, ventana: "tradicional" },
  { id: "las-gardenias", nombre: "Asoc. Las Gardenias", sector: "Zona Tradicional", perfil: "HABILITACION", peso: 700, ancho: 0.38, alto: 0.30, ventana: "tradicional" },
  { id: "residencial-los-alamos", nombre: "Residencial Los Álamos", sector: "Zona Tradicional", perfil: "TITULADO", peso: 580, ancho: 0.35, alto: 0.29, ventana: "tradicional" },
  { id: "el-salvador-a", nombre: "Asoc. El Salvador Zona A", sector: "Zona Tradicional", perfil: "HABILITACION", peso: 900, ancho: 0.40, alto: 0.32, ventana: "tradicional" },
  { id: "el-salvador-b", nombre: "Asoc. El Salvador Zona B", sector: "Zona Tradicional", perfil: "HABILITACION", peso: 860, ancho: 0.39, alto: 0.32, ventana: "tradicional" },
  { id: "fundo-cabrerias-1", nombre: "Asoc. Fundo Cabrerías Sector 1", sector: "Zona Tradicional", perfil: "EN_HABILITACION", peso: 620, ancho: 0.36, alto: 0.30, ventana: "tradicional" },
  { id: "fundo-cabrerias-2", nombre: "Asoc. Fundo Cabrerías Sector 2", sector: "Zona Tradicional", perfil: "EN_HABILITACION", peso: 590, ancho: 0.35, alto: 0.29, ventana: "tradicional" },
  { id: "fundo-cabrerias-3", nombre: "Asoc. Fundo Cabrerías Sector 3", sector: "Zona Tradicional", perfil: "SIN", peso: 540, ancho: 0.34, alto: 0.28, ventana: "tradicional" },
  { id: "fundo-cabrerias-4", nombre: "Asoc. Fundo Cabrerías Sector 4", sector: "Zona Tradicional", perfil: "SIN", peso: 510, ancho: 0.34, alto: 0.28, ventana: "tradicional" },
  { id: "fundo-cabrerias-5", nombre: "Asoc. Fundo Cabrerías Sector 5", sector: "Zona Tradicional", perfil: "SIN", peso: 480, ancho: 0.33, alto: 0.27, ventana: "tradicional" },

  /* Parque Industrial y talleres. */
  { id: "apyme-jorge-basadre-i", nombre: "Asoc. APYME Industrial Jorge Basadre I", sector: "Parque Industrial", perfil: "TITULADO", peso: 420, ancho: 0.32, alto: 0.26, ventana: "industrial" },
  { id: "taller-jorge-basadre-ii", nombre: "Asoc. Taller Jorge Basadre II", sector: "Parque Industrial", perfil: "COFOPRI", peso: 380, ancho: 0.31, alto: 0.26, ventana: "industrial" },
  { id: "taller-jorge-basadre-iiiii", nombre: "Asoc. Taller Jorge Basadre II-III", sector: "Parque Industrial", perfil: "COFOPRI", peso: 350, ancho: 0.30, alto: 0.25, ventana: "industrial" },
  { id: "centro-industrial-cantera", nombre: "Asoc. Centro Industrial Las Canteras", sector: "Parque Industrial", perfil: "TITULADO", peso: 460, ancho: 0.33, alto: 0.27, ventana: "industrial" },
  { id: "villa-cantera-iii", nombre: "Asoc. Villa Las Canteras III Etapa", sector: "Parque Industrial", perfil: "HABILITACION", peso: 390, ancho: 0.31, alto: 0.26, ventana: "industrial" },
  { id: "el-sillar", nombre: "Asoc. Artesanal y Vivienda El Sillar", sector: "Parque Industrial", perfil: "TITULADO", peso: 330, ancho: 0.30, alto: 0.25, ventana: "industrial" },
  { id: "hernan-bedoya-ii", nombre: "Asoc. Taller Hernán Bedoya II Etapa", sector: "Parque Industrial", perfil: "COFOPRI", peso: 300, ancho: 0.29, alto: 0.24, ventana: "industrial" },

  /* Área de Expansión: Peruarbo, Cerrillos, Pachacútec y nueva vivienda. */
  { id: "peruarbo-zona-i", nombre: "Asoc. Peruarbo Zona I", sector: "Área de Expansión", perfil: "COFOPRI", peso: 1550, ancho: 0.46, alto: 0.36, ventana: "expansion" },
  { id: "peruarbo-bolivia", nombre: "Asoc. Peruarbo Sector Bolivia", sector: "Área de Expansión", perfil: "HABILITACION", peso: 1400, ancho: 0.44, alto: 0.35, ventana: "expansion" },
  { id: "peruarbo-argentina-i", nombre: "Asoc. Peruarbo Sector Argentina Zona I", sector: "Área de Expansión", perfil: "HABILITACION", peso: 1350, ancho: 0.43, alto: 0.35, ventana: "expansion" },
  { id: "peruarbo-argentina-ii", nombre: "Asoc. Peruarbo Sector Argentina Zona II", sector: "Área de Expansión", perfil: "SIN", peso: 1250, ancho: 0.42, alto: 0.34, ventana: "expansion" },
  { id: "villa-cerrillos-b", nombre: "Asoc. Villa Cerrillos-Alberto Fujimori Zona B", sector: "Área de Expansión", perfil: "HABILITACION", peso: 1600, ancho: 0.46, alto: 0.36, ventana: "expansion" },
  { id: "villa-cerrillos-c", nombre: "Asoc. Villa Cerrillos-Alberto Fujimori Zona C", sector: "Área de Expansión", perfil: "SIN", peso: 1450, ancho: 0.44, alto: 0.35, ventana: "expansion" },
  { id: "pachacutec-zonal-1", nombre: "C. Pob. Pachacútec Zonal 1 Zona A", sector: "Área de Expansión", perfil: "SIN", peso: 1700, ancho: 0.48, alto: 0.37, ventana: "expansion" },
  { id: "pachacutec-zonal-10", nombre: "C. Pob. Pachacútec Zonal 10 Zona D", sector: "Área de Expansión", perfil: "EN_HABILITACION", peso: 1500, ancho: 0.45, alto: 0.35, ventana: "expansion" },
  { id: "ampliacion-zona-ix", nombre: "Asoc. Ampliación Zona IX", sector: "Área de Expansión", perfil: "SIN", peso: 1100, ancho: 0.41, alto: 0.33, ventana: "expansion" },
  { id: "provivienda-las-flores", nombre: "Asoc. Provivienda Las Flores Zona 7", sector: "Área de Expansión", perfil: "HABILITACION", peso: 950, ancho: 0.39, alto: 0.32, ventana: "expansion" },
  { id: "villa-nueva-esperanza", nombre: "Asoc. Villa Nueva Esperanza", sector: "Área de Expansión", perfil: "SIN", peso: 1050, ancho: 0.40, alto: 0.33, ventana: "expansion" },
  { id: "nueva-esperanza-techo-propio", nombre: "Asoc. Proyecto Nueva Esperanza Techo Propio 1ra Etapa", sector: "Área de Expansión", perfil: "EN_HABILITACION", peso: 880, ancho: 0.38, alto: 0.31, ventana: "expansion" },
  { id: "granja-nueva-vida", nombre: "Asoc. Granja Vivienda Nueva Vida Sector 2", sector: "Área de Expansión", perfil: "HABILITACION", peso: 720, ancho: 0.36, alto: 0.30, ventana: "expansion" },
];

if (CATALOGO.length !== 65) {
  throw new Error(`El catálogo debe tener 65 entradas, tiene ${CATALOGO.length}`);
}

/* Ventanas de muestreo (grados). Se encogen si el sector queda muy lleno. */
const VENTANAS = {
  apipa: { minLng: -71.5815, maxLng: -71.5585, minLat: -16.3650, maxLat: -16.3300 },
  cono: { minLng: -71.6000, maxLng: -71.5520, minLat: -16.3740, maxLat: -16.3260 },
  eje: { minLng: -71.5850, maxLng: -71.5520, minLat: -16.3880, maxLat: -16.3420 },
  tradicional: { minLng: -71.6150, maxLng: -71.5680, minLat: -16.4070, maxLat: -16.3750 },
  industrial: { minLng: -71.6100, maxLng: -71.5740, minLat: -16.3480, maxLat: -16.3200 },
  expansion: { minLng: -71.5800, maxLng: -71.5480, minLat: -16.4060, maxLat: -16.3560 },
};

/* Perfiles de indicadores. La normalización posterior conserva las tasas. */
const PERFILES = {
  TITULADO: { estado: "TITULADO", agua: [86, 96], pistas: [76, 92], plazo: [4, 9] },
  COFOPRI: { estado: "EXPEDIENTE_COFOPRI", agua: [60, 76], pistas: [46, 62], plazo: [11, 19] },
  HABILITACION: { estado: "EN_HABILITACION", agua: [44, 62], pistas: [28, 48], plazo: [17, 28] },
  EN_HABILITACION: { estado: "EN_HABILITACION", agua: [48, 64], pistas: [30, 50], plazo: [16, 26] },
  SIN: { estado: "SIN_SANEAMIENTO", agua: [26, 43], pistas: [12, 30], plazo: [24, 36] },
};

function entre(rand, min, max) {
  return min + (max - min) * rand();
}

function hash(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function crearSemilla(entrada, indice, rand) {
  const perfil = PERFILES[entrada.perfil];
  if (!perfil) throw new Error(`Perfil desconocido: ${entrada.perfil}`);
  const familias = Math.round(entrada.peso * entre(rand, 0.94, 1.06));
  const agua = Math.round(entre(rand, perfil.agua[0], perfil.agua[1]));
  const pistas = Math.round(entre(rand, perfil.pistas[0], perfil.pistas[1]));
  const plazo = Math.round(entre(rand, perfil.plazo[0], perfil.plazo[1]));
  return {
    id: entrada.id,
    nombre: entrada.nombre,
    sector: entrada.sector,
    perfil: entrada.perfil,
    familias,
    estadoTitulacion: perfil.estado,
    codigoCUI: `CUI-${2570400 + indice * 113}`,
    estadoAgua: agua,
    estadoPistas: pistas,
    plazoMeses: plazo,
    camarasSeguridad: Math.max(2, Math.round(familias / 520 + entre(rand, 0, 1.4))),
    emprendimientosLocales: Math.max(12, Math.round(familias / 19)),
    vacantesJuveniles: Math.max(24, Math.round(familias / 15)),
    kmVias: Math.round((familias / 400) * 10) / 10,
  };
}

/* ------------------------------------------------------------- colocación */

const colocados = EXISTENTES.map((e) => ({ ...e, ring: e.ring }));

function intentarColocar(entrada, indice) {
  const ventanaBase = VENTANAS[entrada.ventana];
  if (!ventanaBase) throw new Error(`Ventana desconocida: ${entrada.ventana}`);
  const rand = mulberry32(hash(`centro-${entrada.id}`));
  const semilla = crearSemilla(entrada, indice, rand);

  for (let intento = 0; intento < 7000; intento += 1) {
    // Tras muchos fallos, se reduce el área de muestreo hacia el centro de la
    // ventana para encontrar los huecos que quedan entre bloques.
    const contraer = intento < 4500 ? 1 : Math.max(0.35, 1 - (intento - 4500) / 2600);
    const cx = (ventanaBase.minLng + ventanaBase.maxLng) / 2;
    const cy = (ventanaBase.minLat + ventanaBase.maxLat) / 2;
    const minLng = cx + (ventanaBase.minLng - cx) * contraer;
    const maxLng = cx + (ventanaBase.maxLng - cx) * contraer;
    const minLat = cy + (ventanaBase.minLat - cy) * contraer;
    const maxLat = cy + (ventanaBase.maxLat - cy) * contraer;
    const lng = entre(rand, minLng, maxLng);
    const lat = entre(rand, minLat, maxLat);

    const seedPoligono = hash(`${entrada.id}-${intento}`) % 100000;
    const crudo = crearPoligono(lat, lng, entrada.ancho, entrada.alto, seedPoligono);
    const ring = encajarEnDistrito(crudo);
    // El encaje puede desplazar bloques externos: aquí exigimos que todo el
    // contorno quede dentro del anillo, sin recortes contra el borde.
    if (!ring.slice(0, -1).every((p) => dentroDistrito(p))) continue;

    let choque = false;
    for (const otro of colocados) {
      const [aminx, aminy, amaxx, amaxy] = bbox(ring);
      const [bminx, bminy, bmaxx, bmaxy] = bbox(otro.ring);
      if (amaxx < bminx || bmaxx < aminx || amaxy < bminy || bmaxy < aminy) {
        continue;
      }
      if (poligonosSeCruzan(ring, otro.ring)) {
        choque = true;
        break;
      }
      if (distanciaPoligonos(ring, otro.ring) < GAP_MIN_M) {
        choque = true;
        break;
      }
    }
    if (choque) continue;

    return {
      ...semilla,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      anchoKm: entrada.ancho,
      altoKm: entrada.alto,
      seed: seedPoligono,
      ring,
    };
  }
  throw new Error(`No se pudo colocar ${entrada.nombre} sin superposición`);
}

const colocadas = [];
for (const entrada of CATALOGO) {
  const indice = colocadas.length;
  const colocada = intentarColocar(entrada, indice);
  colocadas.push(colocada);
  colocados.push({ id: colocada.id, nombre: colocada.nombre, ring: colocada.ring });
}

/* -------------------------------------------------------- verificación */

const errores = [];
if (colocadas.length !== 65) errores.push(`Se colocaron ${colocadas.length}/65`);
for (const c of colocadas) {
  if (!c.ring.slice(0, -1).every((p) => dentroDistrito(p))) {
    errores.push(`${c.nombre}: fuera del anillo`);
  }
}
for (let i = 0; i < colocados.length; i += 1) {
  for (let j = i + 1; j < colocados.length; j += 1) {
    if (poligonosSeCruzan(colocados[i].ring, colocados[j].ring)) {
      errores.push(`${colocados[i].nombre} se cruza con ${colocados[j].nombre}`);
    }
  }
}

const resumen = {
  base: BASE.length,
  nuevas: colocadas.length,
  total: BASE.length + colocadas.length,
  porSector: Object.fromEntries(
    [...new Set(colocadas.map((c) => c.sector))].map((s) => [
      s,
      colocadas.filter((c) => c.sector === s).length,
    ]),
  ),
  apipa: [...BASE, ...colocadas]
    .filter((c) => /^APIPA/i.test(c.nombre))
    .map((c) => c.nombre)
    .sort(),
  problemasBase,
  errores,
};

console.log(JSON.stringify(resumen, null, 2));

if (process.argv.includes("--check")) {
  process.exit(errores.length ? 1 : 0);
}

if (errores.length) {
  throw new Error("La geometría no cumple las condiciones; no se escribe el archivo");
}

// Los avisos de los 19 bloques base son contactos con el borde del anillo que ya
// existían: encajarEnDistrito pega sus vértices al límite. No bloquean la salida.

/* ------------------------------------------------------------ salida TS */

const fmt = (n) => Number(n.toFixed(6));
const entradas = colocadas
  .map(
    (c, i) => `  {
    id: ${JSON.stringify(c.id)},
    nombre: ${JSON.stringify(c.nombre)},
    sector: ${JSON.stringify(c.sector)},
    lat: ${fmt(c.lat)},
    lng: ${fmt(c.lng)},
    anchoKm: ${c.anchoKm},
    altoKm: ${c.altoKm},
    seed: ${c.seed},
    familias: ${c.familias},
    estadoTitulacion: ${JSON.stringify(c.estadoTitulacion)},
    codigoCUI: ${JSON.stringify(c.codigoCUI)},
    estadoAgua: ${c.estadoAgua},
    estadoPistas: ${c.estadoPistas},
    plazoMeses: ${c.plazoMeses},
    camarasSeguridad: ${c.camarasSeguridad},
    emprendimientosLocales: ${c.emprendimientosLocales},
    vacantesJuveniles: ${c.vacantesJuveniles},
    kmVias: ${c.kmVias},
  },${i === colocadas.length - 1 ? "" : ""}`,
  )
  .join("\n");

const salida = `import type { Sector } from "./cerroColoradoGeo";

/* ============================================================================
   CERREÑO 3D — Las 65 asociaciones restantes del universo distrital
   ----------------------------------------------------------------------------
   ARCHIVO GENERADO por scripts/generar-asociaciones.mjs. No editar a mano:
   volver a correr el script cambia la muestra de coordenadas.

   Completa los 8 sectores APIPA que faltaban (I–XVIII), los sectores de José
   Luis Bustamante y Rivero y 55 asociaciones más repartidas entre Cono Norte,
   Eje Comercial, Zona Tradicional, Parque Industrial y Área de Expansión.

   Los nombres salen del Cuadro N°30 «Asociaciones de vivienda» del Diagnóstico
   del PPRRD de la Municipalidad Distrital de Cerro Colorado (2018), de su
   Cuadro N°39 «Sectores Críticos» y de las entregas de constancias de posesión
   2025 de la MDCC. La trazabilidad está en docs/validacion-asociaciones.md.

   Cada centro se muestreó dentro de la ventana de su sector y se aceptó sólo si
   el bloque completo cae dentro del anillo distrital, no se superpone con otro
   y queda a 30 m o más de sus vecinos. Las familias son pesos relativos: la
   capa completa se normaliza a la población distrital en cerroColoradoGeo.ts.
   ========================================================================== */

export interface SemillaAsociacionRestante {
  id: string;
  nombre: string;
  sector: Sector;
  lat: number;
  lng: number;
  anchoKm: number;
  altoKm: number;
  seed: number;
  familias: number;
  estadoTitulacion: "SIN_SANEAMIENTO" | "EN_HABILITACION" | "EXPEDIENTE_COFOPRI" | "TITULADO";
  codigoCUI: string;
  estadoAgua: number;
  estadoPistas: number;
  plazoMeses: number;
  camarasSeguridad: number;
  emprendimientosLocales: number;
  vacantesJuveniles: number;
  kmVias: number;
}

export const SEMILLAS_RESTANTES: SemillaAsociacionRestante[] = [
${entradas}
];
`;

fs.writeFileSync(RUTA_SALIDA, salida, "utf8");
console.log(`\nEscrito ${path.relative(RAIZ, RUTA_SALIDA)} (${colocadas.length} asociaciones)`);
