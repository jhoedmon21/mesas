import {
  CANDIDATOS,
  IDX_ZEGARRA,
} from "@/data/candidatosArequipa2026";
import { DISTRITOS_PRIORIDAD_POR_ID } from "@/data/distritosPrioridad";
import type { DistritoId } from "@/data/distritosIds";
import { ACTAS_DISTRITOS } from "@/data/actasDistritosJson";
import { LOCALES_DISTRITOS, type LocalDistrito } from "@/data/localesDistritos";
import {
  MESAS as MESAS_CERRO,
  MESAS_FUERA_LIMITE as FUERA_LIMITE_CERRO,
  type MesaCerroColorado,
} from "@/data/mesasCerroColorado";

/* ============================================================================
   MESAS DE LOS 15 DISTRITOS — actas ONPE y local georreferenciado
   ----------------------------------------------------------------------------
   Cerro Colorado conserva su modelo de 506 mesas (data/mesasCerroColorado.ts).
   Los otros 14 distritos se construyen con las actas reales capturadas en
   .captura/distritos y los locales de GEO_LOCALES de ONPE, que traen latitud
   y longitud de cada sede. El nombre del local es la clave de cruce.

   Cada mesa se dibuja a unos metros del local (temblor determinista) para que
   varias actas de la misma sede no queden una encima de otra. Si un local no
   aparece en el catálogo, la mesa cae en el centro del distrito y se marca
   como aproximada; no se inventa una dirección.
   ========================================================================== */

export interface MesaDistrito {
  id: string;
  distritoId: DistritoId;
  /** Número de mesa, sin ceros a la izquierda. */
  numero: number;
  /** Código de acta ONPE. */
  codigo: string;
  position: [number, number];
  electores: number;
  emitidos: number;
  participacion: number;
  validos: number;
  votos: number[];
  zegarra: number;
  huisa: number;
  otros: number;
  margen: number;
  gana: "ZEGARRA" | "RIVAL";
  ganadorId: string;
  segundoId: string;
  puestoZegarra: number;
  /** Local georreferenciado donde se votó. */
  localId: string;
  localNombre: string;
  localCodigo?: number;
  actaCodigo: string;
  distanciaLocalM: number;
  /** true si el local no se pudo cruzar con GEO_LOCALES. */
  aproximada: boolean;
  /** El nombre del acta no coincide, pero el local tiene el mismo n.º de mesas. */
  coincidenciaMesas?: boolean;
  /* Campos que solo existen en las mesas de Cerro Colorado. */
  zonaId?: string;
  zonaNombre?: string;
  sector?: string;
  cuadrante?: string;
  distanciaCentroM?: number;
  referencia?: string;
}

export interface ResumenMesas {
  mesas: number;
  locales: number;
  electores: number;
  emitidos: number;
  participacion: number;
  validos: number;
  zegarra: number;
  huisa: number;
  otros: number;
  margen: number;
  zegarraPct: number;
  ganadas: number;
  perdidas: number;
}

const IDX_HUISA = CANDIDATOS.findIndex((c) => c.id === "huisa");

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

function normalizarLocal(texto: string): string {
  return String(texto ?? "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bI\.?\s*E\.?\b/g, "IE")
    .replace(/\bN\s*[°º]\s*/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distanciaMetros(
  a: [number, number],
  b: [number, number],
): number {
  const dx = (a[0] - b[0]) * 111_320 * Math.cos((b[1] * Math.PI) / 180);
  const dy = (a[1] - b[1]) * 110_574;
  return Math.round(Math.hypot(dx, dy));
}

/** Cruce tolerante para nombres que ONPE abrevia distinto entre listados. */
function buscarLocal(
  nombre: string,
  locales: LocalDistrito[],
  porClave: Map<string, LocalDistrito>,
): LocalDistrito | null {
  const clave = normalizarLocal(nombre);
  const exacto = porClave.get(clave);
  if (exacto) return exacto;

  const tokens = new Set(clave.split(" ").filter((t) => t.length > 2));
  if (tokens.size === 0) return null;

  let mejor: LocalDistrito | null = null;
  let mejorPuntaje = 0;
  for (const local of locales) {
    const otros = new Set(
      normalizarLocal(local.nombre)
        .split(" ")
        .filter((t) => t.length > 2),
    );
    if (otros.size === 0) continue;
    let comunes = 0;
    for (const token of tokens) if (otros.has(token)) comunes += 1;
    const puntaje = comunes / Math.max(tokens.size, otros.size);
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejor = local;
    }
  }
  return mejorPuntaje >= 0.6 ? mejor : null;
}

function mesasDeCerro(): MesaDistrito[] {
  return MESAS_CERRO.map((m: MesaCerroColorado) => ({
    id: m.id,
    distritoId: "cerro-colorado",
    numero: m.numero,
    codigo: m.actaCodigo ?? String(m.numero).padStart(6, "0"),
    position: m.position,
    electores: m.electores,
    emitidos: Math.round((m.participacion / 100) * m.electores),
    participacion: m.participacion,
    validos: m.validos,
    votos: m.votos,
    zegarra: m.zegarra,
    huisa: m.huisa,
    otros: m.otros,
    margen: m.margen,
    gana: m.gana === "ZEGARRA" ? "ZEGARRA" : "RIVAL",
    ganadorId: m.ganadorId,
    segundoId: m.segundoId,
    puestoZegarra: m.puestoZegarra,
    localId: m.zonaId,
    localNombre: m.localNombre ?? m.zonaNombre,
    localCodigo: m.localCodigo,
    actaCodigo: m.actaCodigo ?? String(m.numero).padStart(6, "0"),
    distanciaLocalM: m.distanciaLocalM ?? 0,
    aproximada: !m.localNombre,
    zonaId: m.zonaId,
    zonaNombre: m.zonaNombre,
    sector: m.sector,
    cuadrante: m.cuadrante,
    distanciaCentroM: m.distanciaCentroM,
    referencia: m.referencia,
  }));
}

function mesasGenericas(distritoId: DistritoId): MesaDistrito[] {
  const filas = ACTAS_DISTRITOS[distritoId];
  if (!filas || filas.length === 0) return [];

  const distrito = DISTRITOS_PRIORIDAD_POR_ID.get(distritoId);
  const locales = LOCALES_DISTRITOS[distritoId] ?? [];
  const porClave = new Map(
    locales.map((local) => [normalizarLocal(local.nombre), local] as const),
  );

  /* El catálogo GEO_LOCALES y el detalle del acta no siempre publican el
     mismo nombre para la misma sede (cambios de nombre del local). Si el
     nombre no cruza, se usa el único local libre del catálogo con el mismo
     número de mesas: es una equivalencia verificable, no una coordenada
     inventada. */
  const actasPorClave = new Map<string, { nombre: string; mesas: number }>();
  for (const acta of filas) {
    const clave = normalizarLocal(acta.l);
    const previo = actasPorClave.get(clave);
    if (previo) previo.mesas += 1;
    else actasPorClave.set(clave, { nombre: acta.l, mesas: 1 });
  }
  const cacheLocal = new Map<string, LocalDistrito | null>();
  const resolverLocal = (clave: string, nombre: string) => {
    if (!cacheLocal.has(clave)) {
      cacheLocal.set(
        clave,
        porClave.get(clave) ?? buscarLocal(nombre, locales, porClave),
      );
    }
    return cacheLocal.get(clave) ?? null;
  };
  const usados = new Set<string>();
  for (const [clave, acta] of actasPorClave) {
    const local = resolverLocal(clave, acta.nombre);
    if (local) usados.add(local.id);
  }
  const libresPorMesas = new Map<number, LocalDistrito[]>();
  for (const local of locales) {
    if (usados.has(local.id)) continue;
    const lista = libresPorMesas.get(local.mesas);
    if (lista) lista.push(local);
    else libresPorMesas.set(local.mesas, [local]);
  }
  const equivalencias = new Map<string, LocalDistrito>();
  for (const [clave, acta] of actasPorClave) {
    if (resolverLocal(clave, acta.nombre)) continue;
    const candidatos = (libresPorMesas.get(acta.mesas) ?? []).filter(
      (local) => !usados.has(local.id),
    );
    if (candidatos.length === 1) {
      equivalencias.set(clave, candidatos[0]);
      usados.add(candidatos[0].id);
    }
  }

  const centro: [number, number] = distrito?.centro ?? [
    locales.reduce((s, l) => s + l.position[0], 0) / Math.max(1, locales.length),
    locales.reduce((s, l) => s + l.position[1], 0) / Math.max(1, locales.length),
  ];

  return filas.map((acta) => {
    const clave = normalizarLocal(acta.l);
    const localExacto = resolverLocal(clave, acta.l);
    const local = localExacto ?? equivalencias.get(clave) ?? null;
    const coincidenciaMesas = !localExacto && Boolean(local);
    const rand = rng(hash(`mesa-${distritoId}-${acta.m}`));
    const dLng = (rand() * 2 - 1) * 0.00012;
    const dLat = (rand() * 2 - 1) * 0.0001;
    const position: [number, number] = local
      ? [local.position[0] + dLng, local.position[1] + dLat]
      : centro;

    const votos = acta.v;
    const zegarra = votos[IDX_ZEGARRA] ?? 0;
    const huisa = votos[IDX_HUISA] ?? 0;
    const validos = acta.va || votos.reduce((s, v) => s + v, 0);
    const orden = votos
      .map((v, j) => ({ v, j }))
      .sort((a, b) => b.v - a.v);
    const ganador = orden[0];
    const segundo = orden[1];
    const ganadorId = CANDIDATOS[ganador?.j ?? 0]?.id ?? "zegarra";
    const margen = validos ? ((zegarra - huisa) / validos) * 100 : 0;

    return {
      id: `${distritoId}-${acta.m}`,
      distritoId,
      numero: Number.parseInt(acta.m, 10) || 0,
      codigo: acta.m,
      position,
      electores: acta.e,
      emitidos: acta.em,
      participacion: acta.p,
      validos,
      votos,
      zegarra,
      huisa,
      otros: Math.max(0, validos - zegarra - huisa),
      margen,
      gana: ganadorId === "zegarra" ? "ZEGARRA" : "RIVAL",
      ganadorId,
      segundoId: CANDIDATOS[segundo?.j ?? 1]?.id ?? "huisa",
      puestoZegarra:
        orden.findIndex((o) => o.j === IDX_ZEGARRA) + 1 || CANDIDATOS.length,
      localId: local?.id ?? `${distritoId}-sin-local`,
      localNombre: acta.l,
      actaCodigo: acta.m,
      distanciaLocalM: local ? distanciaMetros(position, local.position) : 0,
      aproximada: !local,
      coincidenciaMesas,
      zonaId: local?.id,
      zonaNombre: acta.l,
      sector: "Local de votación",
      cuadrante: "centro",
      distanciaCentroM: 0,
      referencia: local
        ? `${local.nombre}${local.direccion ? ` · ${local.direccion}` : ""}${
            coincidenciaMesas ? " · misma cantidad de mesas que el acta" : ""
          }`
        : `${acta.l} · local sin georreferencia`,
    };
  });
}

const CERRO = mesasDeCerro();

export const MESAS_DISTRITOS: Record<string, MesaDistrito[]> = {
  "cerro-colorado": CERRO,
  paucarpata: mesasGenericas("paucarpata"),
  cayma: mesasGenericas("cayma"),
  "alto-selva-alegre": mesasGenericas("alto-selva-alegre"),
  majes: mesasGenericas("majes"),
  arequipa: mesasGenericas("arequipa"),
  "mariano-melgar": mesasGenericas("mariano-melgar"),
  miraflores: mesasGenericas("miraflores"),
  socabaya: mesasGenericas("socabaya"),
  "jose-luis-bustamante-y-rivero": mesasGenericas(
    "jose-luis-bustamante-y-rivero",
  ),
  "jacobo-hunter": mesasGenericas("jacobo-hunter"),
  yura: mesasGenericas("yura"),
  mollendo: mesasGenericas("mollendo"),
  yanahuara: mesasGenericas("yanahuara"),
  "la-joya": mesasGenericas("la-joya"),
};

export const MESAS_POR_DISTRITO = new Map<string, MesaDistrito[]>(
  Object.entries(MESAS_DISTRITOS),
);

export const MESAS_POR_ID = new Map(
  Object.values(MESAS_DISTRITOS)
    .flat()
    .map((m) => [m.id, m] as const),
);

export const FUERA_LIMITE_POR_DISTRITO = new Map<string, ReadonlySet<string>>([
  ["cerro-colorado", FUERA_LIMITE_CERRO],
]);

export function mesasDeDistrito(id: string): MesaDistrito[] {
  return MESAS_POR_DISTRITO.get(id) ?? [];
}

export function resumenMesas(mesas: MesaDistrito[]): ResumenMesas {
  let electores = 0;
  let emitidos = 0;
  let validos = 0;
  let zegarra = 0;
  let huisa = 0;
  let ganadas = 0;
  const locales = new Set<string>();
  for (const mesa of mesas) {
    electores += mesa.electores;
    emitidos += mesa.emitidos;
    validos += mesa.validos;
    zegarra += mesa.zegarra;
    huisa += mesa.huisa;
    if (mesa.gana === "ZEGARRA") ganadas += 1;
    if (!mesa.aproximada) locales.add(mesa.localId);
  }
  return {
    mesas: mesas.length,
    locales: locales.size,
    electores,
    emitidos,
    participacion: electores ? (emitidos / electores) * 100 : 0,
    validos,
    zegarra,
    huisa,
    otros: Math.max(0, validos - zegarra - huisa),
    margen: validos ? ((zegarra - huisa) / validos) * 100 : 0,
    zegarraPct: validos ? (zegarra / validos) * 100 : 0,
    ganadas,
    perdidas: mesas.length - ganadas,
  };
}

export function localesDeDistrito(id: string): LocalDistrito[] {
  return LOCALES_DISTRITOS[id] ?? [];
}
