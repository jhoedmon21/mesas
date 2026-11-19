// Genera data/localesDistritos.ts a partir del TopoJSON GEO_LOCALES que publica
// ONPE en la presentación de resultados (locales de votación con LATITUD y
// LONGITUD). El archivo fuente se descarga una vez a .tmp-locales.js.
//
//   node scripts/generar-locales-distritos.mjs
//
// La clave de cruce con las actas es el nombre del local dentro del distrito:
// ONPE publica ese mismo nombre en el detalle de cada acta.

import { readFileSync, writeFileSync } from "node:fs";

const FUENTE = ".tmp-locales.js";
const SALIDA = "data/localesDistritos.ts";
const SALIDA_JSON = ".captura/distritos/locales.json";

const DISTRITOS = [
  { id: "cerro-colorado", nombre: "CERRO COLORADO", provincia: "AREQUIPA" },
  { id: "paucarpata", nombre: "PAUCARPATA", provincia: "AREQUIPA" },
  { id: "cayma", nombre: "CAYMA", provincia: "AREQUIPA" },
  { id: "alto-selva-alegre", nombre: "ALTO SELVA ALEGRE", provincia: "AREQUIPA" },
  { id: "majes", nombre: "MAJES", provincia: "CAYLLOMA" },
  { id: "arequipa", nombre: "AREQUIPA", provincia: "AREQUIPA" },
  { id: "mariano-melgar", nombre: "MARIANO MELGAR", provincia: "AREQUIPA" },
  { id: "miraflores", nombre: "MIRAFLORES", provincia: "AREQUIPA" },
  { id: "socabaya", nombre: "SOCABAYA", provincia: "AREQUIPA" },
  {
    id: "jose-luis-bustamante-y-rivero",
    nombre: "JOSE LUIS BUSTAMANTE Y RIVERO",
    provincia: "AREQUIPA",
  },
  { id: "jacobo-hunter", nombre: "JACOBO HUNTER", provincia: "AREQUIPA" },
  { id: "yura", nombre: "YURA", provincia: "AREQUIPA" },
  { id: "mollendo", nombre: "MOLLENDO", provincia: "ISLAY" },
  { id: "yanahuara", nombre: "YANAHUARA", provincia: "AREQUIPA" },
  { id: "la-joya", nombre: "LA JOYA", provincia: "AREQUIPA" },
];

const texto = readFileSync(FUENTE, "utf8");
const topo = JSON.parse(texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1));
const geometrias = topo.objects.data.geometries;

function normalizarNombre(texto) {
  return String(texto ?? "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bI\.?\s*E\.?\b/g, "IE")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(texto, fallback) {
  const base = normalizarNombre(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || fallback;
}

const locales = [];
const resumen = [];

for (const distrito of DISTRITOS) {
  const delDistrito = geometrias.filter((g) => {
    const p = g.properties;
    return (
      String(p["DISTRITO / CIUDAD"] ?? "").toUpperCase().trim() === distrito.nombre &&
      String(p["PROVINCIA / PAÍS"] ?? "").toUpperCase().trim() === distrito.provincia
    );
  });

  const vistos = new Map();
  for (const g of delDistrito) {
    const p = g.properties;
    const lat = Number(p.LATITUD);
    const lon = Number(p.LONGITUD);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const nombre = String(p["NOMBRE DEL LOCAL"] ?? "").trim();
    if (!nombre) continue;

    const clave = normalizarNombre(nombre);
    const id = `${distrito.id}-${slug(nombre, "local")}`;
    // ONPE puede publicar el mismo local dos veces (una por circunscripción).
    // Se conserva la primera aparición y se suman las mesas.
    const previo = vistos.get(clave);
    if (previo) {
      previo.mesas += Number(p.MESAS) || 0;
      continue;
    }

    const local = {
      id: `${id}-${vistos.size + 1}`,
      distritoId: distrito.id,
      nombre,
      direccion: p["DIRECCIÓN DEL LOCAL"] ? String(p["DIRECCIÓN DEL LOCAL"]).trim() : null,
      position: [Number(lon.toFixed(6)), Number(lat.toFixed(6))],
      mesas: Number(p.MESAS) || 0,
      ubigeo: String(p.ubigeo_declarado ?? p.ubigeo_geometrico ?? ""),
      tipoMatch: String(p.TIPO_MATCH ?? ""),
      clave,
    };
    vistos.set(clave, local);
    locales.push(local);
  }

  const delDistritoFinal = [...vistos.values()];
  resumen.push({
    distritoId: distrito.id,
    nombre: distrito.nombre,
    locales: delDistritoFinal.length,
    mesas: delDistritoFinal.reduce((s, l) => s + l.mesas, 0),
  });
}

const porDistrito = {};
for (const local of locales) {
  (porDistrito[local.distritoId] ??= []).push(local);
}

const filas = Object.entries(porDistrito)
  .map(([id, lista]) => {
    const cuerpo = lista
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      .map(
        (l) =>
          `    { id: ${JSON.stringify(l.id)}, distritoId: ${JSON.stringify(l.distritoId)}, nombre: ${JSON.stringify(l.nombre)}, direccion: ${JSON.stringify(l.direccion)}, position: [${l.position[0]}, ${l.position[1]}], mesas: ${l.mesas}, ubigeo: ${JSON.stringify(l.ubigeo)}, tipoMatch: ${JSON.stringify(l.tipoMatch)} },`,
      )
      .join("\n");
    return `  ${JSON.stringify(id)}: [\n${cuerpo}\n  ],`;
  })
  .join("\n");

const contenido = `import type { DistritoId } from "@/data/distritosIds";

/* GENERADO por scripts/generar-locales-distritos.mjs — no editar a mano.
   Locales de votación de los 15 distritos del tablero, con la coordenada que
   publica ONPE en GEO_LOCALES (presentación de resultados ERM 2026).
   ${locales.length} locales · ${locales.reduce((s, l) => s + l.mesas, 0)} mesas.
   El nombre es el mismo que trae el detalle de cada acta: se usa como clave de
   cruce, normalizado, para colocar cada mesa en su local real. */

export interface LocalDistrito {
  id: string;
  distritoId: DistritoId;
  nombre: string;
  direccion: string | null;
  position: [number, number];
  /** Mesas que ONPE reporta en el local para la elección regional. */
  mesas: number;
  ubigeo: string;
  tipoMatch: string;
}

export const LOCALES_DISTRITOS: Record<string, LocalDistrito[]> = {
${filas}
};

export const LOCALES_POR_DISTRITO = new Map<string, LocalDistrito[]>(
  Object.entries(LOCALES_DISTRITOS),
);

export const TOTAL_LOCALES = ${locales.length};
`;

writeFileSync(SALIDA, contenido);
writeFileSync(
  SALIDA_JSON,
  JSON.stringify(
    locales.map(({ clave, ...l }) => l),
    null,
    0,
  ),
);

console.log(resumen.map((r) => `${r.distritoId}: ${r.locales} locales · ${r.mesas} mesas`).join("\n"));
console.log(`\n${locales.length} locales · ${locales.reduce((s, l) => s + l.mesas, 0)} mesas → ${SALIDA}`);
