import {
  CANDIDATOS,
  IDX_ZEGARRA,
  MATRIZ,
} from "@/data/candidatosArequipa2026";
import {
  ASOCIACIONES_POR_ID,
  type Sector,
} from "@/data/cerroColoradoGeo";
import { AGENDA_ASOCIACIONES, type AsociacionAgenda } from "@/lib/agenda";
import {
  LOCALES,
  LOCALES_POR_CODIGO,
  LOCALES_POR_ZONA,
} from "@/data/localesZona";
import { LIMITE_CERRO_COLORADO } from "@/data/limiteCerroColorado";
import { ACTAS, type ActaCerroColorado } from "@/data/actasCerroColorado";

/* ============================================================================
   MESAS DE CERRO COLORADO — actas reales de ONPE
   ----------------------------------------------------------------------------
   Datos oficiales: las 506 actas del distrito (ubigeo 040103), con el detalle
   de votos de las 15 candidaturas por mesa y el local de votación que publica
   cada acta. La captura y su verificación están documentadas en
   data/actasCerroColorado.ts.

   Lo único estimado es la geolocalización: cada mesa se apoya en el local de
   votación georreferenciado de su acta (OSM) cuando existe; los locales sin
   coordenada se reparten entre las asociaciones y quedan como punto aproximado
   del polígono, rotulados como «sin local georreferenciado» en la ficha.
   ========================================================================== */

export const TOTAL_MESAS = 506;
export const VALIDOS_DISTRITO = 107_335;
export const ZEGARRA_DISTRITO = 23_910;
export const HUISA_DISTRITO = 17_545;

export const FUENTE_MESAS = {
  tipo: "actas" as const,
  etiqueta: "Actas ONPE",
  nota:
    "Votos por mesa tomados del detalle de actas de ONPE (ERM 2026, Gobernador Regional, primera vuelta del 4 de octubre de 2026, actas 100% contabilizadas). Cada acta conserva su código oficial.",
  notaUbicacion:
    "El punto se apoya en el local de votación real del acta (georreferenciado con OpenStreetMap) cuando la sede tiene coordenada; los locales sin georreferencia caen en un punto aproximado de la asociación asignada.",
} as const;

/** Fila ONPE del distrito de Cerro Colorado (29 distritos, 15 candidaturas). */
const FILA_CC = MATRIZ.find((m) => m.nombre === "CERRO COLORADO");

if (!FILA_CC) {
  throw new Error("mesasCerroColorado: falta la fila ONPE de Cerro Colorado");
}

export const VOTOS_DISTRITO: number[] = FILA_CC.votos;

export const INDICE_CANDIDATO = new Map(
  CANDIDATOS.map((c, i) => [c.id, i]),
);

const IDX_HUISA = INDICE_CANDIDATO.get("huisa") ?? 1;

export type Cuadrante =
  | "centro"
  | "noreste"
  | "noroeste"
  | "sureste"
  | "suroeste";

export interface MesaCerroColorado {
  id: string;
  numero: number;
  zonaId: string;
  zonaNombre: string;
  sector: Sector;
  position: [number, number];
  electores: number;
  participacion: number;
  validos: number;
  /** Votos de las 15 candidaturas, alineados a CANDIDATOS. Suma = validos. */
  votos: number[];
  /** Accesos rápidos a las dos candidaturas de referencia. */
  zegarra: number;
  huisa: number;
  otros: number;
  /** zegarra − huisa en puntos porcentuales de los válidos de la mesa. */
  margen: number;
  gana: "ZEGARRA" | "RIVAL";
  /** Candidatura más votada de la mesa. */
  ganadorId: string;
  segundoId: string;
  puestoZegarra: number;
  /* ------------------------------------------------------------ ubicación */
  /** Local de votación real del que se tomó el punto, si tiene coordenada. */
  localNombre?: string;
  localCodigo?: number;
  /** Código de acta de ONPE de la mesa. */
  actaCodigo?: string;
  /** Metros del punto a la sede del local de votación. */
  distanciaLocalM?: number;
  /** Cuadrante del polígono de la asociación donde cae el punto. */
  cuadrante: Cuadrante;
  /** Distancia al centroide de la asociación, en metros. */
  distanciaCentroM: number;
  /** Referencia legible: «Local · Cuadrante noreste · Asociación X». */
  referencia: string;
}

/* --------------------------------------------------- utilidades de montaje */

function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function entre(rand: () => number, min: number, max: number): number {
  return min + (max - min) * rand();
}

/**
 * Redondea un vector de pesos a enteros que suman exactamente `total`
 * (método del mayor residuo).
 */
function repartir(valores: number[], total: number): number[] {
  const suma = valores.reduce((s, v) => s + v, 0) || 1;
  const crudos = valores.map((v) => (v / suma) * total);
  const base = crudos.map((v) => Math.floor(v));
  let resto = total - base.reduce((s, v) => s + v, 0);
  const orden = crudos
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  let k = 0;
  while (resto > 0) {
    base[orden[k % orden.length].i] += 1;
    resto -= 1;
    k += 1;
  }
  return base;
}

/* ------------------------------------------------------ geometría y puntos */

interface CajaZona {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  cx: number;
  cy: number;
}

function puntoEnAnillo(
  punto: [number, number],
  anillo: [number, number][],
): boolean {
  const [x, y] = punto;
  let dentro = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i, i += 1) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];
    const cruza =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

const ANILLO_CERRO: [number, number][] = LIMITE_CERRO_COLORADO as [number, number][];

/**
 * Acerca un punto al ancla hasta que caiga dentro del distrito. El ancla debe
 * estar dentro; se usa para el temblor alrededor de un local pegado al borde.
 */
function acercarAlAncla(
  punto: [number, number],
  ancla: [number, number],
): [number, number] {
  if (puntoEnAnillo(punto, ANILLO_CERRO)) return punto;
  let escala = 0.85;
  let propuesta = punto;
  for (let i = 0; i < 24; i += 1) {
    propuesta = [
      ancla[0] + (punto[0] - ancla[0]) * escala,
      ancla[1] + (punto[1] - ancla[1]) * escala,
    ];
    if (puntoEnAnillo(propuesta, ANILLO_CERRO)) return propuesta;
    escala *= 0.72;
  }
  return ancla;
}

function cajaDeZona(zonaId: string): CajaZona | null {
  const feature = ASOCIACIONES_POR_ID.get(zonaId);
  if (!feature) return null;
  const anillo = feature.geometry.coordinates[0] as [number, number][];
  const xs = anillo.map((p) => p[0]);
  const ys = anillo.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

/**
 * Punto determinista dentro del polígono de la zona (mesas sin georef).
 * Los bloques son esquemáticos y varios desbordan el distrito, así que el
 * punto debe caer además dentro del anillo de Cerro Colorado: toda mesa es
 * del distrito y tiene que verse en el mapa. Si la zona no logra un punto
 * útil, se sortea en su porción que sí está dentro del distrito.
 */
function puntoEnZona(zonaId: string, semilla: string): [number, number] {
  const feature = ASOCIACIONES_POR_ID.get(zonaId);
  if (!feature) return [-71.56, -16.373];
  const anillo = feature.geometry.coordinates[0] as [number, number][];
  const caja = cajaDeZona(zonaId);
  if (!caja) return [-71.56, -16.373];
  const rand = rng(hash(semilla));
  let ultimo: [number, number] = [caja.cx, caja.cy];
  for (let intento = 0; intento < 600; intento += 1) {
    const punto: [number, number] = [
      entre(rand, caja.minX, caja.maxX),
      entre(rand, caja.minY, caja.maxY),
    ];
    if (!puntoEnAnillo(punto, anillo)) continue;
    if (puntoEnAnillo(punto, ANILLO_CERRO)) return punto;
    ultimo = punto;
  }
  // La zona no alcanza el distrito con sus puntos: se lleva el último
  // candidato hacia el centro del distrito hasta entrar en el anillo.
  return acercarAlAncla(ultimo, [-71.5632, -16.357]);
}

function distanciaMetros(
  a: [number, number],
  b: [number, number],
): number {
  const dx = (a[0] - b[0]) * 111_320 * Math.cos((b[1] * Math.PI) / 180);
  const dy = (a[1] - b[1]) * 110_574;
  return Math.round(Math.hypot(dx, dy));
}

function cuadranteDe(
  punto: [number, number],
  caja: CajaZona,
): Cuadrante {
  const rx = (punto[0] - caja.cx) / ((caja.maxX - caja.minX) / 2 || 1e-9);
  const ry = (punto[1] - caja.cy) / ((caja.maxY - caja.minY) / 2 || 1e-9);
  if (Math.abs(rx) < 0.24 && Math.abs(ry) < 0.24) return "centro";
  if (ry >= 0) return rx >= 0 ? "noreste" : "noroeste";
  return rx >= 0 ? "sureste" : "suroeste";
}

/* --------------------------------------------------------------- montaje */

/**
 * Las actas cuyo local no tiene georreferencia (7 sedes) se reparten entre las
 * asociaciones proporcionalmente a sus familias, con orden determinista. La
 * ficha las rotula «sin local georreferenciado».
 */
function zonasDeActasSinLocal(cantidad: number): string[] {
  const pesos = AGENDA_ASOCIACIONES.map((a) => a.props.familias);
  const cuotas = repartir(pesos, cantidad);
  const salida: string[] = [];
  AGENDA_ASOCIACIONES.forEach((agenda, i) => {
    for (let k = 0; k < cuotas[i]; k += 1) salida.push(agenda.props.id);
  });
  return salida;
}

interface MesaReal extends MesaCerroColorado {}

function construirMesas(): MesaCerroColorado[] {
  const resultado: MesaCerroColorado[] = [];
  const orden = [...ACTAS].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const indiceZona = new Map(
    AGENDA_ASOCIACIONES.map((a, i) => [a.props.id, i]),
  );
  const sinLocal = orden.filter((a) => !LOCALES_POR_CODIGO.has(a.localCodigo));
  const zonasSinLocal = zonasDeActasSinLocal(sinLocal.length);
  const zonaSinLocalPorActa = new Map<string, string>();
  sinLocal.forEach((a, i) => zonaSinLocalPorActa.set(a.codigo, zonasSinLocal[i]));

  let numeroGlobal = 0;

  const conteoPorZona = new Map<string, number>();

  for (const acta of orden) {
    numeroGlobal += 1;
    const local = LOCALES_POR_CODIGO.get(acta.localCodigo);
    const zonaId =
      local?.zonaId ?? zonaSinLocalPorActa.get(acta.codigo) ?? "cerro-viejo";
    const zona = AGENDA_ASOCIACIONES[indiceZona.get(zonaId) ?? 0];
    const caja =
      cajaDeZona(zonaId) ?? {
        minX: -71.58,
        maxX: -71.54,
        minY: -16.4,
        maxY: -16.35,
        cx: -71.56,
        cy: -16.375,
      };

    let punto: [number, number];
    let distanciaLocalM: number | undefined;
    if (local) {
      const rand = rng(hash(`local-${acta.codigo}`));
      const dLng = entre(rand, -1, 1) * 0.00024;
      const dLat = entre(rand, -1, 1) * 0.00021;
      const temblor: [number, number] = [
        local.position[0] + dLng,
        local.position[1] + dLat,
      ];
      // El temblor no debe sacar del distrito una mesa de una sede interna.
      const sedeFuera = !puntoEnAnillo(local.position, ANILLO_CERRO);
      punto =
        !sedeFuera && !local.dentroDistrito
          ? acercarAlAncla(temblor, local.position)
          : temblor;
      distanciaLocalM = distanciaMetros(punto, local.position);
    } else {
      punto = puntoEnZona(zonaId, `real-${acta.codigo}`);
    }

    const cuadrante = cuadranteDe(punto, caja);
    const referencia = local
      ? `${local.nombre} · Cuadrante ${cuadrante} · ${zona.props.nombre}`
      : `Cuadrante ${cuadrante} · ${zona.props.nombre}`;

    const votos = acta.votos;
    const z = votos[IDX_ZEGARRA];
    const h = votos[IDX_HUISA];
    const validosMesa = acta.validos;
    const margen = validosMesa ? ((z - h) / validosMesa) * 100 : 0;
    const ordenVotos = votos
      .map((v, j) => ({ v, j }))
      .sort((a, b) => b.v - a.v);

    const primeroId = CANDIDATOS[ordenVotos[0].j].id;
    const enZona = (conteoPorZona.get(zonaId) ?? 0) + 1;
    conteoPorZona.set(zonaId, enZona);

    resultado.push({
      id: `040103-${String((indiceZona.get(zonaId) ?? 0) + 1).padStart(2, "0")}-${String(
        enZona,
      ).padStart(3, "0")}`,
      numero: numeroGlobal,
      zonaId,
      zonaNombre: zona.props.nombre,
      sector: zona.props.sector,
      position: punto,
      electores: acta.electores,
      participacion: acta.participacion,
      validos: validosMesa,
      votos,
      zegarra: z,
      huisa: h,
      otros: Math.max(0, validosMesa - z - h),
      margen,
      // Una sola regla en toda la app: «gana» es quién quedó primero en la
      // mesa, no quién va por delante en el balotaje. Antes esto comparaba
      // Zegarra con Huisa mientras la ficha comparaba con las quince
      // candidaturas: 164 de 506 mesas salían verdes y perdidas a la vez.
      gana: primeroId === "zegarra" ? "ZEGARRA" : "RIVAL",
      ganadorId: primeroId,
      segundoId: CANDIDATOS[ordenVotos[1].j].id,
      puestoZegarra: ordenVotos.findIndex((o) => o.j === IDX_ZEGARRA) + 1,
      localNombre: local?.nombre,
      localCodigo: local?.codigo,
      actaCodigo: acta.codigo,
      distanciaLocalM,
      cuadrante,
      distanciaCentroM: distanciaMetros(punto, [caja.cx, caja.cy]),
      referencia,
    });
  }

  return resultado;
}

export const MESAS: MesaCerroColorado[] = construirMesas();

export const MESAS_POR_ID = new Map(MESAS.map((m) => [m.id, m]));

/* --------------------------------- locales fuera del límite distrital *
 * ONPE asigna mesas de Cerro Colorado a locales de votación que a veces
 * quedan físicamente en distritos vecinos. El acta es de Cerro Colorado; el
 * edificio no. Se marcan para dibujarlas con estilo distinto en el visor.
 * Algunos locales tienen dirección oficial en Cerro Colorado aunque el anillo
 * OSM los deje unos metros afuera (p. ej. IE Cristo Rey – CIRCA): esos se
 * respetan con `dentroDistrito` y no cuentan como externos.
 * Se evalúa la SEDE, no el punto: el temblor de la mesa ya se corrige para
 * que no salga del distrito.                                          */

export const MESAS_FUERA_LIMITE: ReadonlySet<string> = new Set(
  MESAS.filter((m) => {
    const local = m.localCodigo
      ? LOCALES_POR_CODIGO.get(m.localCodigo)
      : undefined;
    if (!local || local.dentroDistrito) return false;
    return !puntoEnAnillo(local.position, ANILLO_CERRO);
  }).map((m) => m.id),
);

/* --------------------------------------------------------------- resumen */

export const RESUMEN_MESAS = (() => {
  const validos = MESAS.reduce((s, m) => s + m.validos, 0);
  const zegarra = MESAS.reduce((s, m) => s + m.zegarra, 0);
  const huisa = MESAS.reduce((s, m) => s + m.huisa, 0);
  return {
    mesas: MESAS.length,
    validos,
    zegarra,
    huisa,
    /** Participación de Zegarra en los válidos del distrito. */
    zegarraPct: validos ? (zegarra / validos) * 100 : 0,
    /** Mesas donde Zegarra es la candidatura más votada. */
    ganadas: MESAS.filter((m) => m.gana === "ZEGARRA").length,
    margen: validos ? ((zegarra - huisa) / validos) * 100 : 0,
    perdidas: MESAS.filter((m) => m.gana !== "ZEGARRA").length,
  };
})();

export function mesasDeZona(zonaId: string): MesaCerroColorado[] {
  return MESAS.filter((m) => m.zonaId === zonaId);
}

/* -------------------------------------------------- lectura contra un rival */

export interface RankingMesa {
  candidatoId: string;
  corto: string;
  nombre: string;
  agrupacion: string;
  color: string;
  votos: number;
  pct: number;
}

export function rankingMesa(
  mesa: Pick<MesaCerroColorado, "votos" | "validos">,
): RankingMesa[] {
  return mesa.votos
    .map((votos, j) => {
      const c = CANDIDATOS[j];
      return {
        candidatoId: c.id,
        corto: c.corto,
        nombre: c.nombre,
        agrupacion: c.agrupacion,
        color: c.color,
        votos,
        pct: mesa.validos ? (votos / mesa.validos) * 100 : 0,
      };
    })
    .sort((a, b) => b.votos - a.votos);
}

export interface MesaFrente {
  rivalId: string;
  rivalCorto: string;
  rivalColor: string;
  rivalVotos: number;
  brecha: number;
  margen: number;
  ganaZegarra: boolean;
  puestoRival: number;
}

/** Lectura de la mesa frente a una candidatura concreta. */
export function mesaFrenteA(
  mesa: MesaCerroColorado,
  rivalId: string,
): MesaFrente | null {
  const ir = INDICE_CANDIDATO.get(rivalId);
  if (ir === undefined) return null;
  const rival = CANDIDATOS[ir];
  const rivalVotos = mesa.votos[ir];
  const brecha = mesa.zegarra - rivalVotos;
  const orden = mesa.votos
    .map((v, j) => ({ v, j }))
    .sort((a, b) => b.v - a.v);
  return {
    rivalId,
    rivalCorto: rival.corto,
    rivalColor: rival.color,
    rivalVotos,
    brecha,
    margen: mesa.validos ? (brecha / mesa.validos) * 100 : 0,
    ganaZegarra: brecha >= 0,
    puestoRival: orden.findIndex((o) => o.j === ir) + 1,
  };
}

export interface ResumenMesasFrente {
  rivalId: string;
  mesas: number;
  perdidas: number;
  ganadas: number;
  validos: number;
  zegarra: number;
  rival: number;
  margen: number;
  /** Mesas perdidas ordenadas del margen más adverso. */
  peores: MesaCerroColorado[];
  /** Zonas donde se concentran las mesas perdidas. */
  zonas: { zonaId: string; nombre: string; perdidas: number; brecha: number }[];
}

const CACHE_FRENTE = new Map<string, ResumenMesasFrente>();

export function resumenMesasFrenteA(rivalId: string): ResumenMesasFrente {
  const cacheado = CACHE_FRENTE.get(rivalId);
  if (cacheado) return cacheado;

  const ir = INDICE_CANDIDATO.get(rivalId);
  const idx = ir ?? IDX_HUISA;
  const rival = CANDIDATOS[idx];

  const perdidas = MESAS.filter((m) => m.votos[idx] > m.zegarra);
  const validos = MESAS.reduce((s, m) => s + m.validos, 0);
  const zegarra = MESAS.reduce((s, m) => s + m.zegarra, 0);
  const rivalTotal = MESAS.reduce((s, m) => s + m.votos[idx], 0);

  const porZona = new Map<
    string,
    { zonaId: string; nombre: string; perdidas: number; brecha: number }
  >();
  for (const m of MESAS) {
    const actual = porZona.get(m.zonaId) ?? {
      zonaId: m.zonaId,
      nombre: m.zonaNombre,
      perdidas: 0,
      brecha: 0,
    };
    actual.brecha += m.zegarra - m.votos[idx];
    if (m.votos[idx] > m.zegarra) actual.perdidas += 1;
    porZona.set(m.zonaId, actual);
  }

  const resumen: ResumenMesasFrente = {
    rivalId,
    mesas: MESAS.length,
    perdidas: perdidas.length,
    ganadas: MESAS.length - perdidas.length,
    validos,
    zegarra,
    rival: rivalTotal,
    margen: validos ? ((zegarra - rivalTotal) / validos) * 100 : 0,
    peores: [...perdidas]
      .sort(
        (a, b) =>
          (a.zegarra - a.votos[idx]) / (a.validos || 1) -
          (b.zegarra - b.votos[idx]) / (b.validos || 1),
      )
      .slice(0, 12),
    zonas: [...porZona.values()]
      .filter((z) => z.perdidas > 0)
      .sort((a, b) => b.perdidas - a.perdidas),
  };

  CACHE_FRENTE.set(rivalId, resumen);
  return resumen;
}

/** Margen (pp) de la mesa frente al rival elegido; lo usa el mapa. */
export function margenMesaFrenteA(
  mesa: MesaCerroColorado,
  rivalId: string,
): number {
  const ir = INDICE_CANDIDATO.get(rivalId) ?? IDX_HUISA;
  return mesa.validos
    ? ((mesa.zegarra - mesa.votos[ir]) / mesa.validos) * 100
    : 0;
}
