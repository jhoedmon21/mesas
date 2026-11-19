import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import { LIMITE_CERRO_COLORADO } from "@/data/limiteCerroColorado";
import { SEMILLAS_RESTANTES } from "@/data/asociacionesRestantes";

/* ============================================================================
   CERREÑO 3D — Capa de datos territoriales
   ----------------------------------------------------------------------------
   Distrito de Cerro Colorado, Arequipa. Centro de referencia: -16.373, -71.560.
   Los polígonos son representaciones esquemáticas (no catastrales) de las
   asociaciones y urbanizaciones priorizadas del Cono Norte, eje Aviación y
   zona tradicional. Las cifras son estimaciones de trabajo para el simulador:
   universo distrital 262,000 hab. (INEI 2025) y 84 asociaciones. El visor dibuja
   las 84: los 19 bloques priorizados originales más los 65 del archivo
   `asociacionesRestantes.ts`, generado con muestreo dentro del anillo distrital.

   Todas las geometrías usan WGS84 y orden GeoJSON [longitud, latitud].
   ========================================================================== */

export type Sector =
  | "Cono Norte"
  | "Eje Comercial"
  | "Zona Tradicional"
  | "Parque Industrial"
  | "Área de Expansión";

export type EstadoTitulacion =
  | "SIN_SANEAMIENTO"
  | "EN_HABILITACION"
  | "EXPEDIENTE_COFOPRI"
  | "TITULADO";

export interface AsociacionProps {
  id: string;
  nombre: string;
  sector: Sector;
  familias: number;
  lotes: number;
  estadoTitulacion: EstadoTitulacion;
  codigoCUI: string;
  /** Estimación del modelo de cobertura de agua y desagüe (0–100). No es medición de campo. */
  estadoAgua: number;
  /** Estimación del modelo de vías asfaltadas y alumbrado LED (0–100). No es medición de campo. */
  estadoPistas: number;
  /** Plazo referencial de titulación del expediente, en meses (estimación). */
  plazoMeses: number;
  camarasSeguridad: number;
  emprendimientosLocales: number;
  vacantesJuveniles: number;
  kmVias: number;
}

export type AsociacionFeature = Feature<Polygon, AsociacionProps>;
export type AsociacionCollection = FeatureCollection<Polygon, AsociacionProps>;

export interface Tramo {
  id: string;
  nombre: string;
  waypoints: [number, number][];
}

export const CENTRO_DISTRITO: [number, number] = [-71.56, -16.373];

export const POBLACION_DISTRITAL = 262_000;
export const ASOCIACIONES_UNIVERSO = 84;

export const ESTADO_TITULACION: Record<
  EstadoTitulacion,
  { label: string; short: string; color: string; avanceBase: number }
> = {
  SIN_SANEAMIENTO: {
    label: "Sin saneamiento físico-legal",
    short: "Sin saneamiento",
    color: "#ef4444",
    avanceBase: 0.06,
  },
  EN_HABILITACION: {
    label: "En habilitación urbana",
    short: "En habilitación",
    color: "#f59e0b",
    avanceBase: 0.32,
  },
  EXPEDIENTE_COFOPRI: {
    label: "Expediente COFOPRI en curso",
    short: "Expediente COFOPRI",
    color: "#38bdf8",
    avanceBase: 0.64,
  },
  TITULADO: {
    label: "Titulado e inscrito en SUNARP",
    short: "Titulado",
    color: "#10b981",
    avanceBase: 1,
  },
};

/* ----------------------------------------------------------------------------
   Generador determinista de polígonos orgánicos (manzanas agregadas)
   -------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const M_POR_GRADO_LAT = 110_574;

function metrosLng(lat: number) {
  return 111_320 * Math.cos((lat * Math.PI) / 180);
}

/**
 * Construye el contorno de una asociación como un bloque urbano: un
 * rectángulo rotado y subdividido en 12 tramos, con un empuje perpendicular
 * leve por vértice. El resultado conserva aristas rectas (lectura catastral)
 * en lugar de un blob circular, y es determinista por `seed`.
 */
function crearPoligono(
  lat: number,
  lng: number,
  anchoKm: number,
  altoKm: number,
  seed: number,
): [number, number][] {
  const rand = mulberry32(seed);
  const ancho = anchoKm * 1000;
  const alto = altoKm * 1000;
  const giro = (rand() - 0.5) * 1.15;
  const cos = Math.cos(giro);
  const sin = Math.sin(giro);

  // Esquinas del bloque en metros, centradas en el origen.
  const esquinas: [number, number][] = [
    [-ancho / 2, -alto / 2],
    [ancho / 2, -alto / 2],
    [ancho / 2, alto / 2],
    [-ancho / 2, alto / 2],
  ];

  const tramosPorLado = 3;
  const amplitud = Math.min(ancho, alto) * 0.05;
  const puntos: [number, number][] = [];

  for (let i = 0; i < 4; i += 1) {
    const a = esquinas[i];
    const b = esquinas[(i + 1) % 4];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const largo = Math.hypot(dx, dy) || 1;
    // Normal unitaria del lado: el empuje sólo mueve el borde hacia dentro/fuera.
    const nx = -dy / largo;
    const ny = dx / largo;

    for (let k = 0; k < tramosPorLado; k += 1) {
      const t = k / tramosPorLado;
      // Las esquinas (k = 0) quedan exactas: así el bloque conserva ángulos
      // rectos y no degenera en un octágono.
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

/* ----------------------------------------------------------------------------
   Encaje de los bloques en el distrito
   ----------------------------------------------------------------------------
   Los contornos son esquemáticos: varios desbordan el anillo distrital y uno
   (Semi Rural Pachacútec) queda íntegramente afuera. Se reducen un 18% porque
   son desproporcionados frente a las demás manzanas y luego se recortan contra
   el borde, llevando cada vértice externo al punto más cercano del anillo. Si
   el bloque entero está afuera, se traslada hacia el interior.             */

const ANILLO_DISTRITO = LIMITE_CERRO_COLORADO as [number, number][];
const ESCALA_BLOQUE = 0.82;

function dentroDistrito([x, y]: [number, number]): boolean {
  let dentro = false;
  for (let i = 0, j = ANILLO_DISTRITO.length - 1; i < ANILLO_DISTRITO.length; j = i, i += 1) {
    const [xi, yi] = ANILLO_DISTRITO[i];
    const [xj, yj] = ANILLO_DISTRITO[j];
    const cruza =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

/** Punto del anillo más cercano a `p` (en metros, sin proyectar el resultado). */
function puntoMasCercanoDelAnillo(p: [number, number]): [number, number] {
  const kx = metrosLng(p[1]);
  let mejor: [number, number] = ANILLO_DISTRITO[0];
  let menor = Infinity;
  for (let i = 0, j = ANILLO_DISTRITO.length - 1; i < ANILLO_DISTRITO.length; j = i, i += 1) {
    const a = ANILLO_DISTRITO[j];
    const b = ANILLO_DISTRITO[i];
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

function encajarEnDistrito(ring: [number, number][]): [number, number][] {
  const anillo = ring.slice(0, -1);
  const suma = anillo.reduce(
    (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
    [0, 0] as [number, number],
  );
  const centro: [number, number] = [
    suma[0] / anillo.length,
    suma[1] / anillo.length,
  ];
  const kx = metrosLng(centro[1]);
  // 1. Bloque más compacto.
  let bloque: [number, number][] = anillo.map(([x, y]) => [
    centro[0] + (x - centro[0]) * ESCALA_BLOQUE,
    centro[1] + (y - centro[1]) * ESCALA_BLOQUE,
  ]);
  const radio = Math.max(
    ...bloque.map((p) =>
      Math.hypot((p[0] - centro[0]) * kx, (p[1] - centro[1]) * M_POR_GRADO_LAT),
    ),
  );
  // 2. Bloque afuera: si está lejos se traslada entero hacia dentro; si está
  //    al borde se pega a él, se encoge (hasta 0.6) y lo que sobre se recorta.
  let ancla: [number, number] = centro;
  if (!dentroDistrito(centro)) {
    const borde = puntoMasCercanoDelAnillo(centro);
    const dx = (borde[0] - centro[0]) * kx;
    const dy = (borde[1] - centro[1]) * M_POR_GRADO_LAT;
    const largo = Math.hypot(dx, dy) || 1;
    const empuje = largo > 500 ? largo + radio + 120 : largo + 40;
    const dLng = (dx / largo) * empuje;
    const dLat = (dy / largo) * empuje;
    ancla = [centro[0] + dLng / kx, centro[1] + dLat / M_POR_GRADO_LAT];
    bloque = bloque.map(([x, y]) => [x + dLng / kx, y + dLat / M_POR_GRADO_LAT]);
    let escala = 1;
    while (escala > 0.75 && bloque.some((p) => !dentroDistrito(p))) {
      escala *= 0.88;
      bloque = bloque.map(([x, y]) => [
        ancla[0] + (x - ancla[0]) * escala,
        ancla[1] + (y - ancla[1]) * escala,
      ]);
    }
  }
  // 3. Lo que todavía desborde se apoya sobre el borde.
  const recortado: [number, number][] = bloque.map((p) =>
    dentroDistrito(p) ? p : puntoMasCercanoDelAnillo(p),
  );
  return [...recortado, recortado[0]];
}

/* ----------------------------------------------------------------------------
   Fichas base de las asociaciones priorizadas
   -------------------------------------------------------------------------- */

type SemillaAsociacion = Omit<AsociacionProps, "lotes"> & {
  lat: number;
  lng: number;
  anchoKm: number;
  altoKm: number;
  seed: number;
};

const SEMILLAS_BASE: SemillaAsociacion[] = [
  {
    id: "apipa-i",
    nombre: "APIPA Sector I",
    sector: "Cono Norte",
    lat: -16.349,
    lng: -71.5745,
    anchoKm: 0.95,
    altoKm: 0.68,
    seed: 11,
    familias: 3850,
    estadoTitulacion: "TITULADO",
    codigoCUI: "CUI-2548912",
    estadoAgua: 88,
    estadoPistas: 76,
    plazoMeses: 8,
    camarasSeguridad: 8,
    emprendimientosLocales: 214,
    vacantesJuveniles: 268,
    kmVias: 9.4,
  },
  {
    id: "apipa-iii",
    nombre: "APIPA Sector III",
    sector: "Cono Norte",
    lat: -16.352,
    lng: -71.5672,
    anchoKm: 0.72,
    altoKm: 0.62,
    seed: 23,
    familias: 3100,
    estadoTitulacion: "EXPEDIENTE_COFOPRI",
    codigoCUI: "CUI-2550674",
    estadoAgua: 71,
    estadoPistas: 63,
    plazoMeses: 14,
    camarasSeguridad: 6,
    emprendimientosLocales: 168,
    vacantesJuveniles: 214,
    kmVias: 7.6,
  },
  {
    id: "apipa-v",
    nombre: "APIPA Sector V",
    sector: "Cono Norte",
    lat: -16.3555,
    lng: -71.5738,
    anchoKm: 0.82,
    altoKm: 0.58,
    seed: 37,
    familias: 4200,
    estadoTitulacion: "EXPEDIENTE_COFOPRI",
    codigoCUI: "CUI-2551309",
    estadoAgua: 64,
    estadoPistas: 52,
    plazoMeses: 16,
    camarasSeguridad: 7,
    emprendimientosLocales: 196,
    vacantesJuveniles: 241,
    kmVias: 8.8,
  },
  {
    id: "apipa-vii",
    nombre: "APIPA Sector VII",
    sector: "Cono Norte",
    lat: -16.3585,
    lng: -71.5674,
    anchoKm: 0.64,
    altoKm: 0.54,
    seed: 41,
    familias: 2950,
    estadoTitulacion: "EN_HABILITACION",
    codigoCUI: "CUI-2552841",
    estadoAgua: 58,
    estadoPistas: 44,
    plazoMeses: 22,
    camarasSeguridad: 4,
    emprendimientosLocales: 142,
    vacantesJuveniles: 188,
    kmVias: 6.2,
  },
  {
    id: "apipa-x",
    nombre: "APIPA Sector X",
    sector: "Cono Norte",
    lat: -16.3455,
    lng: -71.565,
    anchoKm: 0.7,
    altoKm: 0.58,
    seed: 53,
    familias: 3600,
    estadoTitulacion: "EN_HABILITACION",
    codigoCUI: "CUI-2554177",
    estadoAgua: 61,
    estadoPistas: 48,
    plazoMeses: 19,
    camarasSeguridad: 5,
    emprendimientosLocales: 176,
    vacantesJuveniles: 226,
    kmVias: 7.1,
  },
  {
    id: "apipa-xiii",
    nombre: "APIPA Sector XIII",
    sector: "Cono Norte",
    lat: -16.342,
    lng: -71.5714,
    anchoKm: 0.86,
    altoKm: 0.62,
    seed: 61,
    familias: 4450,
    estadoTitulacion: "EXPEDIENTE_COFOPRI",
    codigoCUI: "CUI-2555638",
    estadoAgua: 56,
    estadoPistas: 46,
    plazoMeses: 15,
    camarasSeguridad: 6,
    emprendimientosLocales: 205,
    vacantesJuveniles: 252,
    kmVias: 9.1,
  },
  {
    id: "apipa-xvi",
    nombre: "APIPA Sector XVI",
    sector: "Cono Norte",
    lat: -16.3385,
    lng: -71.5653,
    anchoKm: 0.72,
    altoKm: 0.56,
    seed: 71,
    familias: 3300,
    estadoTitulacion: "EN_HABILITACION",
    codigoCUI: "CUI-2556802",
    estadoAgua: 49,
    estadoPistas: 38,
    plazoMeses: 21,
    camarasSeguridad: 4,
    emprendimientosLocales: 154,
    vacantesJuveniles: 196,
    kmVias: 6.8,
  },
  {
    id: "apipa-xviii",
    nombre: "APIPA Sector XVIII",
    sector: "Cono Norte",
    lat: -16.3315,
    lng: -71.5735,
    anchoKm: 0.9,
    altoKm: 0.66,
    seed: 83,
    familias: 5100,
    estadoTitulacion: "SIN_SANEAMIENTO",
    codigoCUI: "CUI-2558145",
    estadoAgua: 41,
    estadoPistas: 29,
    plazoMeses: 28,
    camarasSeguridad: 5,
    emprendimientosLocales: 221,
    vacantesJuveniles: 284,
    kmVias: 10.2,
  },
  {
    id: "bustamante-rivero",
    nombre: "Asoc. José Luis Bustamante y Rivero",
    sector: "Cono Norte",
    lat: -16.361,
    lng: -71.5808,
    anchoKm: 0.88,
    altoKm: 0.64,
    seed: 97,
    familias: 4800,
    estadoTitulacion: "EXPEDIENTE_COFOPRI",
    codigoCUI: "CUI-2559420",
    estadoAgua: 68,
    estadoPistas: 57,
    plazoMeses: 13,
    camarasSeguridad: 7,
    emprendimientosLocales: 232,
    vacantesJuveniles: 276,
    kmVias: 9.8,
  },
  {
    id: "ciudad-municipal",
    nombre: "Ciudad Municipal",
    sector: "Eje Comercial",
    lat: -16.3705,
    lng: -71.5632,
    anchoKm: 1.05,
    altoKm: 0.78,
    seed: 101,
    familias: 6200,
    estadoTitulacion: "TITULADO",
    codigoCUI: "CUI-2560381",
    estadoAgua: 92,
    estadoPistas: 81,
    plazoMeses: 6,
    camarasSeguridad: 9,
    emprendimientosLocales: 286,
    vacantesJuveniles: 318,
    kmVias: 11.6,
  },
  {
    id: "villa-cerrillos",
    nombre: "Villa Cerrillos",
    sector: "Área de Expansión",
    lat: -16.3772,
    lng: -71.551,
    anchoKm: 0.96,
    altoKm: 0.7,
    seed: 113,
    familias: 5400,
    estadoTitulacion: "EXPEDIENTE_COFOPRI",
    codigoCUI: "CUI-2561744",
    estadoAgua: 73,
    estadoPistas: 66,
    plazoMeses: 12,
    camarasSeguridad: 7,
    emprendimientosLocales: 198,
    vacantesJuveniles: 258,
    kmVias: 10.8,
  },
  {
    id: "peruarbo",
    nombre: "Asoc. Peruarbo",
    sector: "Área de Expansión",
    lat: -16.3898,
    lng: -71.553,
    anchoKm: 0.84,
    altoKm: 0.6,
    seed: 127,
    familias: 3750,
    estadoTitulacion: "EN_HABILITACION",
    codigoCUI: "CUI-2562987",
    estadoAgua: 52,
    estadoPistas: 41,
    plazoMeses: 20,
    camarasSeguridad: 5,
    emprendimientosLocales: 163,
    vacantesJuveniles: 202,
    kmVias: 7.8,
  },
  {
    id: "sor-ana",
    nombre: "Sor Ana de los Ángeles",
    sector: "Eje Comercial",
    lat: -16.383,
    lng: -71.559,
    anchoKm: 0.68,
    altoKm: 0.56,
    seed: 131,
    familias: 2680,
    estadoTitulacion: "TITULADO",
    codigoCUI: "CUI-2563145",
    estadoAgua: 95,
    estadoPistas: 88,
    plazoMeses: 4,
    camarasSeguridad: 6,
    emprendimientosLocales: 121,
    vacantesJuveniles: 148,
    kmVias: 5.2,
  },
  {
    id: "zamacola",
    nombre: "Asoc. Zamácola",
    sector: "Zona Tradicional",
    lat: -16.3955,
    lng: -71.58,
    anchoKm: 0.98,
    altoKm: 0.72,
    seed: 139,
    familias: 4900,
    estadoTitulacion: "SIN_SANEAMIENTO",
    codigoCUI: "CUI-2564520",
    estadoAgua: 47,
    estadoPistas: 36,
    plazoMeses: 26,
    camarasSeguridad: 4,
    emprendimientosLocales: 244,
    vacantesJuveniles: 232,
    kmVias: 10.4,
  },
  {
    id: "pachacutec",
    nombre: "Semi Rural Pachacútec",
    sector: "Área de Expansión",
    lat: -16.3725,
    lng: -71.5535,
    anchoKm: 0.86,
    altoKm: 0.62,
    seed: 149,
    familias: 3950,
    estadoTitulacion: "EN_HABILITACION",
    codigoCUI: "CUI-2565893",
    estadoAgua: 38,
    estadoPistas: 27,
    plazoMeses: 24,
    camarasSeguridad: 3,
    emprendimientosLocales: 175,
    vacantesJuveniles: 194,
    kmVias: 8.6,
  },
  {
    id: "rio-seco",
    nombre: "Parque Industrial Río Seco",
    sector: "Parque Industrial",
    lat: -16.3305,
    lng: -71.5825,
    anchoKm: 0.9,
    altoKm: 0.66,
    seed: 157,
    familias: 1250,
    estadoTitulacion: "TITULADO",
    codigoCUI: "CUI-2566011",
    estadoAgua: 98,
    estadoPistas: 94,
    plazoMeses: 3,
    camarasSeguridad: 9,
    emprendimientosLocales: 312,
    vacantesJuveniles: 486,
    kmVias: 12.4,
  },
  {
    id: "cerro-viejo",
    nombre: "Cerro Viejo",
    sector: "Zona Tradicional",
    lat: -16.387,
    lng: -71.6,
    anchoKm: 0.9,
    altoKm: 0.72,
    seed: 163,
    familias: 2350,
    estadoTitulacion: "SIN_SANEAMIENTO",
    codigoCUI: "CUI-2567428",
    estadoAgua: 29,
    estadoPistas: 18,
    plazoMeses: 31,
    camarasSeguridad: 2,
    emprendimientosLocales: 132,
    vacantesJuveniles: 126,
    kmVias: 6.4,
  },
  {
    id: "la-libertad",
    nombre: "Asoc. La Libertad",
    sector: "Cono Norte",
    lat: -16.3692,
    lng: -71.577,
    anchoKm: 0.78,
    altoKm: 0.6,
    seed: 173,
    familias: 4150,
    estadoTitulacion: "EXPEDIENTE_COFOPRI",
    codigoCUI: "CUI-2568562",
    estadoAgua: 62,
    estadoPistas: 51,
    plazoMeses: 17,
    camarasSeguridad: 5,
    emprendimientosLocales: 187,
    vacantesJuveniles: 224,
    kmVias: 8.2,
  },
  {
    id: "mariscal-castilla",
    nombre: "Asoc. Mariscal Castilla",
    sector: "Eje Comercial",
    lat: -16.3468,
    lng: -71.5515,
    anchoKm: 0.76,
    altoKm: 0.58,
    seed: 179,
    familias: 3980,
    estadoTitulacion: "EN_HABILITACION",
    codigoCUI: "CUI-2569715",
    estadoAgua: 59,
    estadoPistas: 49,
    plazoMeses: 18,
    camarasSeguridad: 5,
    emprendimientosLocales: 193,
    vacantesJuveniles: 236,
    kmVias: 7.9,
  },
];

/** Los 19 bloques originales más las 65 asociaciones restantes. */
const SEMILLAS: SemillaAsociacion[] = [
  ...SEMILLAS_BASE,
  ...SEMILLAS_RESTANTES,
];

/* ----------------------------------------------------------------------------
   Normalización demográfica
   ----------------------------------------------------------------------------
   Al dibujar sólo 19 polígonos, sus familias sumaban el distrito entero. Con
   las 84 asociaciones la suma daba 2.05 veces la población de INEI. Se conserva
   la proporción de cada semilla y se escala el total a 262,000 habitantes con
   3.64 personas por familia; cámaras y vacantes se escalan igual para que las
   brechas no cambien por el redondeo.                                     */

const PERSONAS_POR_FAMILIA = 3.64;
const FAMILIAS_DISTRITO = Math.round(POBLACION_DISTRITAL / PERSONAS_POR_FAMILIA);
const FAMILIAS_BRUTAS = SEMILLAS.reduce((s, x) => s + x.familias, 0);
const ESCALA_FAMILIAS = FAMILIAS_DISTRITO / FAMILIAS_BRUTAS;

function escalar(n: number): number {
  return Math.max(1, Math.round(n * ESCALA_FAMILIAS));
}

function crearFeature(semilla: SemillaAsociacion): AsociacionFeature {
  const { lat, lng, anchoKm, altoKm, seed, ...props } = semilla;
  const familias = escalar(props.familias);
  return {
    type: "Feature",
    id: props.id,
    properties: {
      ...props,
      familias,
      lotes: Math.round(familias * 1.02),
      camarasSeguridad: Math.max(2, escalar(props.camarasSeguridad)),
      emprendimientosLocales: Math.max(1, escalar(props.emprendimientosLocales)),
      vacantesJuveniles: Math.max(1, escalar(props.vacantesJuveniles)),
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        encajarEnDistrito(
          crearPoligono(lat, lng, anchoKm, altoKm, seed) as [number, number][],
        ),
      ],
    },
  };
}

export const ASOCIACIONES: AsociacionCollection = {
  type: "FeatureCollection",
  features: SEMILLAS.map(crearFeature),
};

export const ASOCIACIONES_POR_ID = new Map(
  ASOCIACIONES.features.map((f) => [f.properties.id, f]),
);

/** Centros de asignación: la semilla original de cada asociación, no el
 *  centroide del bloque recortado. Los locales de ONPE se reparten con estos
 *  puntos para que el recorte de dibujo no mueva la sede de su zona. */
export const CENTROS_ASIGNACION = SEMILLAS_BASE.map((s) => ({
  id: s.id,
  nombre: s.nombre,
  punto: [s.lng, s.lat] as [number, number],
}));

export function centroide(feature: AsociacionFeature): [number, number] {
  const anillo = feature.geometry.coordinates[0];
  const puntos = anillo.slice(0, -1);
  const [sumaLng, sumaLat] = puntos.reduce(
    (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
    [0, 0],
  );
  return [sumaLng / puntos.length, sumaLat / puntos.length];
}

export const CENTROIDES = new Map(
  ASOCIACIONES.features.map((f) => [f.properties.id, centroide(f)]),
);

/* ----------------------------------------------------------------------------
   Vistas de cámara (FlyTo)
   -------------------------------------------------------------------------- */

export interface VistaCamara {
  id: string;
  nombre: string;
  detalle: string;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

export const VISTAS: VistaCamara[] = [
  {
    id: "distrito",
    nombre: "Vista General Distrito",
    detalle: "84 asociaciones · 262,000 hab.",
    center: CENTRO_DISTRITO,
    zoom: 12.45,
    pitch: 55,
    bearing: -16,
  },
  {
    id: "cono-norte",
    nombre: "Cono Norte",
    detalle: "APIPA Sectores I–XVIII / Ciudad Municipal",
    center: [-71.568, -16.3465],
    zoom: 13.6,
    pitch: 61,
    bearing: -24,
  },
  {
    id: "eje-comercial",
    nombre: "Eje Comercial",
    detalle: "Av. Aviación / Río Seco",
    center: [-71.5605, -16.3555],
    zoom: 13.75,
    pitch: 62,
    bearing: 10,
  },
  {
    id: "tradicional",
    nombre: "Zona Tradicional",
    detalle: "Zamácola / Cerro Viejo",
    center: [-71.5885, -16.3895],
    zoom: 13.7,
    pitch: 58,
    bearing: -34,
  },
];

/* ----------------------------------------------------------------------------
   Corredores seguros y rutas de empleo juvenil (TripsLayer)
   -------------------------------------------------------------------------- */

export const CORREDORES_SEGUROS: Tramo[] = [
  {
    id: "av-aviacion",
    nombre: "Av. Aviación",
    waypoints: [
      [-71.545, -16.404],
      [-71.5478, -16.395],
      [-71.5515, -16.386],
      [-71.555, -16.377],
      [-71.559, -16.369],
      [-71.5635, -16.36],
      [-71.568, -16.35],
      [-71.573, -16.34],
      [-71.578, -16.332],
    ],
  },
  {
    id: "via-54",
    nombre: "Vía 54",
    waypoints: [
      [-71.5515, -16.386],
      [-71.56, -16.3835],
      [-71.569, -16.381],
      [-71.5775, -16.3755],
      [-71.586, -16.3705],
      [-71.593, -16.3645],
    ],
  },
  {
    id: "evitamiento",
    nombre: "Evitamiento",
    waypoints: [
      [-71.5585, -16.3995],
      [-71.566, -16.3925],
      [-71.5735, -16.3835],
      [-71.5795, -16.375],
      [-71.5845, -16.3665],
      [-71.59, -16.357],
      [-71.595, -16.348],
    ],
  },
  {
    id: "circuito-municipal",
    nombre: "Circuito Ciudad Municipal",
    waypoints: [
      [-71.569, -16.3775],
      [-71.5645, -16.3725],
      [-71.559, -16.371],
      [-71.554, -16.3745],
      [-71.552, -16.381],
    ],
  },
];

export const RUTAS_EMPLEO: Tramo[] = [
  {
    id: "apipa-xviii-rioseco",
    nombre: "APIPA XVIII → Parque Industrial Río Seco",
    waypoints: [
      [-71.5735, -16.3315],
      [-71.576, -16.3345],
      [-71.58, -16.333],
      [-71.583, -16.3315],
    ],
  },
  {
    id: "apipa-i-rioseco",
    nombre: "APIPA I → Parque Industrial Río Seco",
    waypoints: [
      [-71.5745, -16.349],
      [-71.5775, -16.344],
      [-71.5805, -16.339],
      [-71.5825, -16.332],
    ],
  },
  {
    id: "ciudad-municipal-rioseco",
    nombre: "Ciudad Municipal → Río Seco",
    waypoints: [
      [-71.5632, -16.37],
      [-71.57, -16.365],
      [-71.577, -16.36],
      [-71.581, -16.354],
      [-71.5825, -16.345],
      [-71.5828, -16.336],
    ],
  },
  {
    id: "zamacola-rioseco",
    nombre: "Zamácola → Parque Industrial",
    waypoints: [
      [-71.58, -16.3955],
      [-71.586, -16.388],
      [-71.591, -16.38],
      [-71.594, -16.37],
      [-71.592, -16.36],
      [-71.586, -16.35],
      [-71.583, -16.338],
    ],
  },
  {
    id: "apipa-x-aviacion",
    nombre: "APIPA X → eje Aviación",
    waypoints: [
      [-71.565, -16.3455],
      [-71.561, -16.35],
      [-71.56, -16.357],
      [-71.559, -16.365],
    ],
  },
  {
    id: "pachacutec-cerrillos",
    nombre: "Pachacútec → Villa Cerrillos",
    waypoints: [
      [-71.5535, -16.3725],
      [-71.544, -16.371],
      [-71.548, -16.376],
      [-71.551, -16.381],
      [-71.552, -16.388],
    ],
  },
  {
    id: "mariscal-apipa",
    nombre: "Mariscal Castilla → APIPA III",
    waypoints: [
      [-71.5515, -16.3468],
      [-71.557, -16.349],
      [-71.563, -16.352],
      [-71.5672, -16.352],
    ],
  },
  {
    id: "cerro-viejo-zamacola",
    nombre: "Cerro Viejo → Zamácola",
    waypoints: [
      [-71.6, -16.387],
      [-71.5965, -16.391],
      [-71.59, -16.393],
      [-71.583, -16.3945],
    ],
  },
];

/* ----------------------------------------------------------------------------
   Redes matrices de agua y desagüe
   -------------------------------------------------------------------------- */

export const REDES_AGUA: Tramo[] = [
  {
    id: "matriz-cono-norte",
    nombre: "Matriz Cono Norte",
    waypoints: [
      [-71.5825, -16.3305],
      [-71.578, -16.338],
      [-71.574, -16.345],
      [-71.57, -16.352],
      [-71.566, -16.359],
      [-71.5632, -16.37],
    ],
  },
  {
    id: "ramal-apipa-oriente",
    nombre: "Ramal APIPA Oriente",
    waypoints: [
      [-71.57, -16.352],
      [-71.565, -16.3455],
      [-71.561, -16.339],
      [-71.5653, -16.3385],
    ],
  },
  {
    id: "ramal-apipa-occidente",
    nombre: "Ramal APIPA Occidente",
    waypoints: [
      [-71.574, -16.345],
      [-71.5745, -16.349],
      [-71.5738, -16.3555],
      [-71.5745, -16.36],
      [-71.5808, -16.361],
    ],
  },
  {
    id: "ramal-zamacola",
    nombre: "Ramal Zamácola",
    waypoints: [
      [-71.566, -16.359],
      [-71.5745, -16.365],
      [-71.58, -16.377],
      [-71.583, -16.388],
      [-71.58, -16.3955],
    ],
  },
  {
    id: "ramal-cerrillos-peruarbo",
    nombre: "Ramal Cerrillos – Peruarbo",
    waypoints: [
      [-71.5632, -16.37],
      [-71.556, -16.374],
      [-71.551, -16.3772],
      [-71.553, -16.383],
      [-71.553, -16.3898],
    ],
  },
  {
    id: "ramal-pachacutec",
    nombre: "Ramal Pachacútec",
    waypoints: [
      [-71.5632, -16.37],
      [-71.556, -16.369],
      [-71.548, -16.368],
      [-71.539, -16.367],
    ],
  },
  {
    id: "ramal-cerro-viejo",
    nombre: "Ramal Cerro Viejo",
    waypoints: [
      [-71.583, -16.388],
      [-71.593, -16.3895],
      [-71.6, -16.387],
    ],
  },
  {
    id: "ramal-rioseco",
    nombre: "Ramal Parque Industrial",
    waypoints: [
      [-71.5825, -16.3305],
      [-71.582, -16.336],
      [-71.581, -16.341],
    ],
  },
];
