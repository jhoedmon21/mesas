import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";
import { MATRIZ } from "@/data/candidatosArequipa2026";
import { DISTRITOS } from "@/data/electoralArequipa2026";
import { ACTAS_DISTRITOS } from "@/data/actasDistritosJson";
import { LIMITES_DISTRITALES } from "@/data/limitesDistritalesReales";

/* ============================================================================
   DISTRITOS PRIORIZADOS — el pozo de votos que no son de Zegarra ni Huisa
   ----------------------------------------------------------------------------
   La tabla de trabajo que alimenta este módulo ordena los distritos por el
   volumen absoluto de votos de las demás candidaturas (el «pozo»), no por
   votos válidos. Es la lectura correcta para el balotaje: los válidos dicen
   dónde hay electorado; el pozo dice cuánto de ese electorado todavía puede
   moverse.

   Los contornos salen de `limitesDistritalesReales.ts` (cartografía INEI): son
   los límites distritales reales, no polígonos esquemáticos. La tabla de
   priorización fija el orden (puesto 1..15) y aporta el padrón; los votos,
   válidos y el pozo de los 13 distritos de la provincia de Arequipa salen de
   `candidatosArequipa2026.ts` (matriz ONPE de 15 candidaturas, actas al 100%),
   y `electoralArequipa2026.ts` aporta actas y participación. Majes (Caylloma)
   y Mollendo (Islay) no están en esa matriz provincial: sus totales se suman
   de las actas por mesa de `actasDistritosJson.ts`, que es el mismo conteo que
   dibuja la capa de mesas. La tabla solo fija su puesto.

   `pozoPct` es el peso del pozo sobre el padrón que reporta la tabla, no sobre
   los válidos: son denominadores distintos y por eso no coincide con
   `pozo / válidos`.
   ========================================================================== */

export type GeometriaDistrito = Polygon | MultiPolygon;

export interface DistritoPropiedades {
  id: string;
  nombre: string;
  provincia: string;
  /** Puesto 1..15 por volumen de pozo (votos de otras candidaturas). */
  puesto: number;
  validos: number;
  /** Votos de las candidaturas distintas de Zegarra y Huisa. */
  pozo: number;
  /** Porcentaje de Zegarra sobre los válidos. */
  zegarraPct: number;
  /** Peso del pozo sobre el electorado, según la tabla de priorización. */
  pozoPct: number | null;
  /** 5% del pozo: la porción mínima que se trabaja por distrito. */
  pozo5: number;
  zegarraVotos: number;
  /** Voto residual de Huisa tras descontar válidos, Zegarra y pozo. */
  huisaVotos: number;
  /** zegarra − huisa, en puntos porcentuales. */
  margen: number;
  /** Netos que faltan para que el margen local llegue a +10 pp. */
  meta10: number;
  actas: number | null;
  totalActas: number | null;
  participacion: number | null;
  fuente: "ONPE" | "tabla";
}

export interface DistritoPrioridad extends DistritoPropiedades {
  geometry: GeometriaDistrito;
  centro: [number, number];
  /** [oeste, sur, este, norte] del límite real. */
  bbox: [number, number, number, number];
  /** Zoom de referencia; el encuadre final se calcula con el tamaño del mapa. */
  zoom: number;
  esCerro: boolean;
}

export type DistritoFeaturePrioridad = Feature<
  GeometriaDistrito,
  DistritoPropiedades
>;

interface FilaTabla {
  puesto: number;
  nombre: string;
  provincia: string;
  validos: number | null;
  pozo: number | null;
  zegarraPct: number;
  pozoPct: number | null;
  pozo5: number | null;
}

const FILAS: FilaTabla[] = [
  {
    puesto: 1,
    nombre: "Cerro Colorado",
    provincia: "Arequipa",
    validos: 107_144,
    pozo: 65_753,
    zegarraPct: 22.3,
    pozoPct: 45.4,
    pozo5: 3_288,
  },
  {
    puesto: 2,
    nombre: "Paucarpata",
    provincia: "Arequipa",
    validos: 82_018,
    pozo: 50_327,
    zegarraPct: 29.6,
    pozoPct: 53.2,
    pozo5: 2_516,
  },
  {
    puesto: 3,
    nombre: "Cayma",
    provincia: "Arequipa",
    validos: 57_364,
    pozo: 33_104,
    zegarraPct: 21.1,
    pozoPct: 43.6,
    pozo5: 1_655,
  },
  {
    puesto: 4,
    nombre: "Alto Selva Alegre",
    provincia: "Arequipa",
    validos: 50_463,
    pozo: 27_100,
    zegarraPct: 27.3,
    pozoPct: 48.3,
    pozo5: 1_355,
  },
  {
    puesto: 5,
    nombre: "Majes",
    provincia: "Caylloma",
    validos: 36_427,
    pozo: 26_638,
    zegarraPct: 14.1,
    pozoPct: 33.7,
    pozo5: 1_332,
  },
  {
    puesto: 6,
    nombre: "Arequipa",
    provincia: "Arequipa",
    validos: 46_288,
    pozo: 25_460,
    zegarraPct: 35.6,
    pozoPct: 57.8,
    pozo5: 1_273,
  },
  {
    puesto: 7,
    nombre: "Mariano Melgar",
    provincia: "Arequipa",
    validos: 38_564,
    pozo: 23_055,
    zegarraPct: 26.5,
    pozoPct: 49.5,
    pozo5: 1_153,
  },
  {
    puesto: 8,
    nombre: "Miraflores",
    provincia: "Arequipa",
    validos: 37_102,
    pozo: 22_500,
    zegarraPct: 26.5,
    pozoPct: 49.2,
    pozo5: 1_125,
  },
  {
    puesto: 9,
    nombre: "Socabaya",
    provincia: "Arequipa",
    validos: 40_064,
    pozo: 21_069,
    zegarraPct: 31.1,
    pozoPct: 51.3,
    pozo5: 1_053,
  },
  {
    puesto: 10,
    nombre: "José Luis Bustamante y Rivero",
    provincia: "Arequipa",
    validos: 46_261,
    pozo: 19_169,
    zegarraPct: 45.1,
    pozoPct: 60.6,
    pozo5: 958,
  },
  {
    puesto: 11,
    nombre: "Jacobo Hunter",
    provincia: "Arequipa",
    validos: 30_362,
    pozo: 18_107,
    zegarraPct: 23.0,
    pozoPct: 45.9,
    pozo5: 905,
  },
  {
    puesto: 12,
    nombre: "Yura",
    provincia: "Arequipa",
    validos: 19_959,
    pozo: 14_034,
    zegarraPct: 17.1,
    pozoPct: 41.7,
    pozo5: 702,
  },
  {
    puesto: 13,
    nombre: "Mollendo",
    provincia: "Islay",
    validos: 15_247,
    pozo: 12_787,
    zegarraPct: 11.8,
    pozoPct: 46.7,
    pozo5: 639,
  },
  {
    puesto: 14,
    nombre: "Yanahuara",
    provincia: "Arequipa",
    validos: 20_432,
    pozo: 12_093,
    zegarraPct: 32.8,
    pozoPct: 56.8,
    pozo5: 605,
  },
  {
    puesto: 15,
    nombre: "La Joya",
    provincia: "Arequipa",
    validos: null,
    pozo: null,
    zegarraPct: 21.46,
    pozoPct: null,
    pozo5: null,
  },
];

/** Límite real de cada distrito por id, listo para el mapa. */
const LIMITES_REALES = new Map<string, GeometriaDistrito>(
  LIMITES_DISTRITALES.features.map(
    (f) => [f.properties.id, f.geometry] as const,
  ),
);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const FEATURES_ONPE = new Map(
  DISTRITOS.features.map((f) => [
    normalizar(f.properties.nombre),
    f,
  ] as const),
);

/** Matriz ONPE de 15 candidaturas, por distrito normalizado. */
const MATRIZ_POR_CLAVE = new Map(
  MATRIZ.map((m) => [normalizar(m.nombre), m] as const),
);

/* Majes y Mollendo no están en la matriz provincial (Caylloma e Islay), pero
   sí tienen actas por mesa capturadas. Sumarlas evita que el panel muestre un
   total distinto del que suman sus propias mesas. */
const ACTAS_POR_CLAVE = new Map(
  Object.entries(ACTAS_DISTRITOS).map(([id, filas]) => {
    const votos = new Array(15).fill(0);
    let validos = 0;
    for (const fila of filas) {
      validos += fila.va;
      for (let j = 0; j < votos.length; j += 1) votos[j] += fila.v[j] ?? 0;
    }
    return [id, { validos, votos }] as const;
  }),
);

/** Centroide de área del anillo exterior (no el promedio de vértices). */
function centroDe(geometria: GeometriaDistrito): [number, number] {
  const anillo =
    geometria.type === "Polygon"
      ? geometria.coordinates[0]
      : geometria.coordinates[0][0];
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < anillo.length - 1; i++) {
    const [x0, y0] = anillo[i];
    const [x1, y1] = anillo[i + 1];
    const cruz = x0 * y1 - x1 * y0;
    area += cruz;
    cx += (x0 + x1) * cruz;
    cy += (y0 + y1) * cruz;
  }
  area *= 0.5;
  if (Math.abs(area) > 1e-12) return [cx / (6 * area), cy / (6 * area)];

  // Respaldo: centro del rectángulo envolvente.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of anillo) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

/** Rectángulo envolvente [oeste, sur, este, norte] de todos los anillos. */
function bboxDe(geometria: GeometriaDistrito): [number, number, number, number] {
  const anillos =
    geometria.type === "Polygon"
      ? geometria.coordinates
      : geometria.coordinates.flat();
  let oeste = Infinity;
  let sur = Infinity;
  let este = -Infinity;
  let norte = -Infinity;
  for (const anillo of anillos) {
    for (const [x, y] of anillo) {
      oeste = Math.min(oeste, x);
      sur = Math.min(sur, y);
      este = Math.max(este, x);
      norte = Math.max(norte, y);
    }
  }
  return [oeste, sur, este, norte];
}

function zoomDe(geometria: GeometriaDistrito): number {
  const puntos =
    geometria.type === "Polygon"
      ? geometria.coordinates.flat()
      : geometria.coordinates.flat(2);
  const xs = puntos.map((p) => p[0]);
  const ys = puntos.map((p) => p[1]);
  const span = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  );
  // Encuadre con los límites reales: el distrito ocupa ~50-70% del mapa útil.
  const zoom = Math.log2(1_100 / Math.max(span, 0.01)) - 0.35;
  return Math.min(14.2, Math.max(9.2, zoom));
}

function construirDistrito(fila: FilaTabla): DistritoPrioridad {
  const id = normalizar(fila.nombre);
  const feature = FEATURES_ONPE.get(id);
  const matriz = MATRIZ_POR_CLAVE.get(id);
  /* Fuera de la matriz provincial, las actas por mesa del distrito son la
     única fuente contada: se usan antes que la tabla redondeada. */
  const actas = matriz ? undefined : ACTAS_POR_CLAVE.get(id);
  const fuente: "ONPE" | "tabla" = matriz || actas ? "ONPE" : "tabla";

  /* La tabla de priorización fija el orden y redondea; la matriz de 15
     candidaturas trae el conteo final de actas. Cuando el distrito está en la
     matriz, mandan los votos contados: así el panel y la ficha no muestran dos
     pozos distintos para el mismo distrito. Majes y Mollendo, que quedan fuera
     de la matriz provincial, usan la suma de sus propias actas; la tabla solo
     fija su puesto. */
  const validos =
    matriz?.validos ??
    actas?.validos ??
    fila.validos ??
    feature?.properties.validos ??
    0;
  const zegarraVotos =
    matriz?.votos[0] ??
    actas?.votos[0] ??
    Math.round((validos * fila.zegarraPct) / 100);
  const huisaVotos =
    matriz?.votos[1] ??
    actas?.votos[1] ??
    Math.max(
      0,
      validos -
        (fila.pozo ??
          Math.max(
            0,
            validos -
              (feature?.properties.zegarraVotos ?? 0) -
              (feature?.properties.huisaVotos ?? 0),
          )) -
        zegarraVotos,
    );
  const pozo =
    matriz || actas
      ? Math.max(0, validos - zegarraVotos - huisaVotos)
      : (fila.pozo ??
        Math.max(
          0,
          validos -
            (feature?.properties.zegarraVotos ?? 0) -
            (feature?.properties.huisaVotos ?? 0),
        ));
  const zegarraPct = validos ? (zegarraVotos / validos) * 100 : fila.zegarraPct;
  const margen = validos
    ? ((zegarraVotos - huisaVotos) / validos) * 100
    : 0;
  const meta10 = Math.max(
    0,
    Math.ceil(0.1 * validos - (zegarraVotos - huisaVotos)),
  );
  const pozo5 = Math.round(pozo * 0.05);
  /* `pozoPct` se mide sobre el padrón que reporta la tabla, no sobre los
     válidos. Al reemplazar el pozo por el conteo de la matriz se reescala con
     el mismo padrón implícito para no cambiar el denominador. */
  const pozoPct =
    fila.pozoPct !== null && fila.pozo
      ? (pozo / (fila.pozo / (fila.pozoPct / 100))) * 100
      : null;

  const geometry = LIMITES_REALES.get(id) ?? feature?.geometry;

  if (!geometry) {
    throw new Error(`distritosPrioridad: falta el límite de ${fila.nombre}`);
  }

  return {
    id,
    nombre: fila.nombre,
    provincia: fila.provincia,
    puesto: fila.puesto,
    validos,
    pozo,
    zegarraPct,
    pozoPct,
    pozo5,
    zegarraVotos,
    huisaVotos,
    margen,
    meta10,
    actas: feature?.properties.actas ?? null,
    totalActas: feature?.properties.totalActas ?? null,
    participacion: feature?.properties.participacion ?? null,
    fuente,
    geometry,
    centro: centroDe(geometry),
    bbox: bboxDe(geometry),
    zoom: id === "cerro-colorado" ? 13.55 : zoomDe(geometry),
    esCerro: id === "cerro-colorado",
  };
}

export const DISTRITOS_PRIORIDAD: DistritoPrioridad[] = FILAS.map(
  construirDistrito,
).sort((a, b) => a.puesto - b.puesto);

export const DISTRITOS_PRIORIDAD_POR_ID = new Map(
  DISTRITOS_PRIORIDAD.map((d) => [d.id, d] as const),
);

export const DISTRITOS_POR_POZO = [...DISTRITOS_PRIORIDAD].sort(
  (a, b) => b.pozo - a.pozo,
);

export const TOP_DISTRITOS = DISTRITOS_POR_POZO.slice(0, 10);

export const TOP_DISTRITOS_IDS = new Set(TOP_DISTRITOS.map((d) => d.id));

export const MAX_POZO_DISTRITAL = DISTRITOS_POR_POZO[0]?.pozo ?? 1;

export const CERRO_COLORADO_DISTRITO =
  DISTRITOS_PRIORIDAD_POR_ID.get("cerro-colorado") ?? DISTRITOS_PRIORIDAD[0];

export const FEATURES_DISTRITOS: FeatureCollection<
  GeometriaDistrito,
  DistritoPropiedades
> = {
  type: "FeatureCollection",
  features: DISTRITOS_PRIORIDAD.map((d) => ({
    type: "Feature",
    properties: {
      id: d.id,
      nombre: d.nombre,
      provincia: d.provincia,
      puesto: d.puesto,
      validos: d.validos,
      pozo: d.pozo,
      zegarraPct: d.zegarraPct,
      pozoPct: d.pozoPct,
      pozo5: d.pozo5,
      zegarraVotos: d.zegarraVotos,
      huisaVotos: d.huisaVotos,
      margen: d.margen,
      meta10: d.meta10,
      actas: d.actas,
      totalActas: d.totalActas,
      participacion: d.participacion,
      fuente: d.fuente,
    },
    geometry: d.geometry,
  })),
};

export const RESUMEN_DISTRITOS = (() => {
  const validos = DISTRITOS_PRIORIDAD.reduce((s, d) => s + d.validos, 0);
  const pozo = DISTRITOS_PRIORIDAD.reduce((s, d) => s + d.pozo, 0);
  const pozoTop10 = TOP_DISTRITOS.reduce((s, d) => s + d.pozo, 0);
  return {
    distritos: DISTRITOS_PRIORIDAD.length,
    validos,
    pozo,
    pozo5: DISTRITOS_PRIORIDAD.reduce((s, d) => s + d.pozo5, 0),
    coberturaTop10: pozo ? (pozoTop10 / pozo) * 100 : 0,
    conMeta: DISTRITOS_PRIORIDAD.filter((d) => d.meta10 > 0).length,
  };
})();
