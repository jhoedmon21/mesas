import { CANDIDATOS, MATRIZ, type DistritoMatriz } from "@/data/candidatosArequipa2026";

/* ============================================================================
   PERFIL PROFUNDO DEL DISTRITO — lo que Cerro Colorado ya tenía, para los 15
   ----------------------------------------------------------------------------
   Cerro Colorado tiene padrón por sección: 84 asociaciones y 506 actas reales.
   Los otros 14 distritos del combo no lo tienen, y aquí no se imputa: no se
   inventan secciones, mesas ni locales donde ONPE no publica el detalle.

   Lo que sí existe, para los 15, es la matriz oficial de la primera vuelta:
   15 candidaturas × 29 distritos. Con ella se responde lo que el panel de
   Cerro responde con mesas, pero en la granularidad que el dato permite:

     · quién tiene el pozo del distrito (las 13 candidaturas que no son
       Zegarra ni Huisa), con votos y peso sobre el pozo;
     · el ranking real de las 15 en ese distrito;
     · el frente a frente contra cada uno de los 14 rivales;
     · el reparto aritmético de la meta de +10 pp en las 19 jornadas que
       quedan hasta el balotaje del 06 dic 2026.

   Ninguna cifra es una proyección: son los votos contados por ONPE, divididos
   entre los válidos del propio distrito.
   ========================================================================== */

/** Jornadas de campo entre el 17 nov 2026 y el balotaje del 06 dic 2026. */
export const JORNADAS_BALOTAJE = 19;

function clave(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const MATRIZ_POR_CLAVE = new Map<string, DistritoMatriz>(
  MATRIZ.map((m) => [clave(m.nombre), m] as const),
);

export interface FilaCandidatura {
  id: string;
  corto: string;
  nombre: string;
  agrupacion: string;
  color: string;
  votos: number;
  /** Porcentaje sobre los válidos del distrito. */
  pct: number;
  /** Puesto 1..15 dentro del distrito. */
  puesto: number;
  /** Porcentaje sobre el pozo (solo filas del pozo). */
  pctPozo: number;
  esZegarra: boolean;
  esHuisa: boolean;
}

export interface FrenteRival {
  id: string;
  corto: string;
  color: string;
  votos: number;
  pct: number;
  /** Zegarra − rival, en puntos porcentuales. */
  margen: number;
  /** Zegarra − rival, en votos. */
  diferencia: number;
  gana: boolean;
}

export interface PerfilDistrito {
  id: string;
  nombre: string;
  /** Válidos según la matriz ONPE de 15 candidaturas. */
  validos: number;
  zegarraVotos: number;
  huisaVotos: number;
  /** Votos de las 13 candidaturas que no son Zegarra ni Huisa. */
  pozo: number;
  /** Peso del pozo sobre los válidos de la matriz. */
  pozoPct: number;
  ranking: FilaCandidatura[];
  /** Solo las candidaturas del pozo, de mayor a menor. */
  pozoFilas: FilaCandidatura[];
  /** Peso de las tres primeras candidaturas del pozo sobre el pozo. */
  concentracionPozo: number;
  frentes: FrenteRival[];
  /** Rival con el margen más corto en este distrito. */
  rivalMasCercano: FrenteRival | null;
}

export function perfilDeDistrito(id: string): PerfilDistrito | null {
  const fila = MATRIZ_POR_CLAVE.get(clave(id));
  if (!fila) return null;

  const validos = fila.validos;
  const zegarraVotos = fila.votos[0] ?? 0;
  const huisaVotos = fila.votos[1] ?? 0;

  const filas: FilaCandidatura[] = CANDIDATOS.map((c, i) => ({
    id: c.id,
    corto: c.corto,
    nombre: c.nombre,
    agrupacion: c.agrupacion,
    color: c.color,
    votos: fila.votos[i] ?? 0,
    pct: validos ? ((fila.votos[i] ?? 0) / validos) * 100 : 0,
    puesto: 0,
    pctPozo: 0,
    esZegarra: c.id === "zegarra",
    esHuisa: c.id === "huisa",
  }));

  const ranking = [...filas].sort((a, b) => b.votos - a.votos);
  ranking.forEach((f, i) => {
    f.puesto = i + 1;
  });

  const pozo = ranking
    .filter((f) => !f.esZegarra && !f.esHuisa)
    .reduce((s, f) => s + f.votos, 0);

  const pozoFilas = ranking
    .filter((f) => !f.esZegarra && !f.esHuisa)
    .map((f) => ({
      ...f,
      pctPozo: pozo ? (f.votos / pozo) * 100 : 0,
    }));

  const concentracionPozo = pozo
    ? (pozoFilas.slice(0, 3).reduce((s, f) => s + f.votos, 0) / pozo) * 100
    : 0;

  const frentes: FrenteRival[] = ranking
    .filter((f) => !f.esZegarra)
    .map((f) => {
      const diferencia = zegarraVotos - f.votos;
      return {
        id: f.id,
        corto: f.corto,
        color: f.color,
        votos: f.votos,
        pct: f.pct,
        margen: validos ? (diferencia / validos) * 100 : 0,
        diferencia,
        gana: diferencia >= 0,
      };
    })
    .sort((a, b) => Math.abs(a.margen) - Math.abs(b.margen));

  return {
    id,
    nombre: fila.nombre,
    validos,
    zegarraVotos,
    huisaVotos,
    pozo,
    pozoPct: validos ? (pozo / validos) * 100 : 0,
    ranking,
    pozoFilas,
    concentracionPozo,
    frentes,
    rivalMasCercano: frentes[0] ?? null,
  };
}

/** Reparto aritmético de la meta entre las jornadas que quedan. */
export function planDeJornadas(
  metaNetos: number,
  jornadas = JORNADAS_BALOTAJE,
): { jornadas: number; porJornada: number; total: number } {
  const total = Math.max(0, Math.round(metaNetos));
  return {
    jornadas,
    porJornada: jornadas > 0 ? Math.ceil(total / jornadas) : total,
    total,
  };
}
