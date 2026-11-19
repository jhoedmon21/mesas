import type { MesaDistrito } from "@/data/mesasDistritos";

/* ============================================================================
   TONO DE UNA MESA — dónde se define la campaña
   ----------------------------------------------------------------------------
   Verde y rojo dicen quién ganó; el naranja dice dónde todavía no está
   decidido. Una mesa con el primero y el segundo a menos de
   `UMBRAL_DISPUTA_PP` puntos se pinta naranja gane quien gane: es una victoria
   frágil o una derrota remontable, y ese es el universo donde se trabaja.

   El margen se mide entre el primero y el segundo, no entre Zegarra y Huisa:
   una mesa donde gana un tercero por dos puntos no está ganada ni perdida
   frente a Zegarra, está en disputa. El umbral es el único número que hay que
   tocar para abrir o cerrar el foco.
   ========================================================================== */

export const UMBRAL_DISPUTA_PP = 5;

export type TonoMesa = "disputada" | "ganada" | "perdida";

/** Diferencia en puntos porcentuales entre el 1.º y el 2.º de la mesa. */
export function margenPrimeroSegundo(mesa: {
  votos: number[];
  validos: number;
}): number {
  if (!mesa.validos) return 0;
  const orden = [...mesa.votos].sort((a, b) => b - a);
  const primero = orden[0] ?? 0;
  const segundo = orden[1] ?? 0;
  return ((primero - segundo) / mesa.validos) * 100;
}

/** Lo mínimo que necesita el tono: votos por candidatura y el ganador. */
export interface MesaTono {
  votos: number[];
  validos: number;
  /** "ZEGARRA" o cualquier etiqueta de contrincante ("RIVAL", "HUISA", …). */
  gana: string;
}

export function tonoMesa(mesa: MesaTono): TonoMesa {
  if (margenPrimeroSegundo(mesa) < UMBRAL_DISPUTA_PP) return "disputada";
  return mesa.gana === "ZEGARRA" ? "ganada" : "perdida";
}

export const COLOR_TONO: Record<TonoMesa, [number, number, number]> = {
  disputada: [245, 158, 11], // ámbar: se define aquí
  ganada: [34, 197, 94], // verde: gana Zegarra con margen
  perdida: [239, 68, 68], // rojo: gana un contrincante con margen
};

export const HEX_TONO: Record<TonoMesa, string> = {
  disputada: "#f59e0b",
  ganada: "#22c55e",
  perdida: "#ef4444",
};

export const ETIQUETA_TONO: Record<TonoMesa, string> = {
  disputada: "En disputa",
  ganada: "Gana Zegarra",
  perdida: "Gana contrincante",
};

export interface ConteoTonos {
  total: number;
  disputada: number;
  ganada: number;
  perdida: number;
}

export function contarTonos(mesas: MesaTono[]): ConteoTonos {
  const conteo: ConteoTonos = {
    total: mesas.length,
    disputada: 0,
    ganada: 0,
    perdida: 0,
  };
  for (const mesa of mesas) conteo[tonoMesa(mesa)] += 1;
  return conteo;
}
