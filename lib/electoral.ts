import { DISTRITOS, type DistritoFeature } from "@/data/electoralArequipa2026";

/* ============================================================================
   Utilidades electorales mínimas — solo Cerro Colorado
   ----------------------------------------------------------------------------
   El visor se limita al distrito de Cerro Colorado con las 506 actas reales
   de ONPE (ver data/mesasCerroColorado.ts). Esto conserva el slug estable
   desde el nombre y la referencia del distrito.
   ========================================================================== */

/** Slug estable a partir del nombre del distrito (sin tildes ni signos). */
export function idDeNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function centroide(feature: DistritoFeature): [number, number] {
  const anillo = feature.geometry.coordinates[0] as [number, number][];
  let sx = 0;
  let sy = 0;
  for (const [x, y] of anillo) {
    sx += x;
    sy += y;
  }
  return [sx / anillo.length, sy / anillo.length];
}

const cerro = DISTRITOS.features.find(
  (f) => idDeNombre(f.properties.nombre) === "cerro-colorado",
);

if (!cerro) {
  throw new Error("electoral: falta el feature de Cerro Colorado");
}

export const CERRO_COLORADO = cerro;
