import { readFile, writeFile } from "node:fs/promises";
import { CENTROS_ASIGNACION, ASOCIACIONES } from "../data/cerroColoradoGeo.ts";

/* Asigna cada local de votación de ONPE al polígono de asociación más cercano y
   escribe data/localesZona.ts. Los polígonos son esquemáticos, así que la
   asignación es siempre por centroide; `dentro` sólo informa si además cae en
   el polígono. */

const geo = JSON.parse(await readFile("data/onpe-locales-geo.json", "utf8"));
const actas = JSON.parse(await readFile("data/onpe-actas.json", "utf8"));

function metros(a, b) {
  const dx = (a[0] - b[0]) * 111320 * Math.cos((b[1] * Math.PI) / 180);
  const dy = (a[1] - b[1]) * 110574;
  return Math.hypot(dx, dy);
}

/* Los centros son las semillas del modelo, no el centroide del bloque ya
   recortado: recortar contra el borde distrital no debe cambiar a qué zona
   pertenece un local de ONPE. */
const CENTROS = CENTROS_ASIGNACION;

const actasPorLocal = new Map();
for (const a of actas) {
  const lista = actasPorLocal.get(a.local) ?? [];
  lista.push(a.codigoMesa);
  actasPorLocal.set(a.local, lista);
}

const asignados = [];
for (const local of geo) {
  if (!local.lat || !local.lon) continue;
  const punto = [local.lon, local.lat];
  const zona = [...CENTROS].sort(
    (a, b) => metros(punto, a.punto) - metros(punto, b.punto),
  )[0];
  asignados.push({
    zonaId: zona.id,
    zonaNombre: zona.nombre,
    codigo: local.codigo,
    nombre: local.nombre,
    lat: +(local.lat + 0).toFixed(6),
    lon: +(local.lon + 0).toFixed(6),
    distanciaZonaM: Math.round(metros(punto, zona.punto)),
    actas: (actasPorLocal.get(local.nombre) ?? []).sort(),
    dentroDistrito: local.dentroDistrito === true,
  });
}

asignados.sort((a, b) => a.zonaId.localeCompare(b.zonaId) || a.nombre.localeCompare(b.nombre));

const lineas = asignados.map((l) => {
  const campos = [
    `zonaId: ${JSON.stringify(l.zonaId)}`,
    `codigo: ${l.codigo}`,
    `nombre: ${JSON.stringify(l.nombre)}`,
    `position: [${l.lon}, ${l.lat}]`,
    `actas: [${l.actas.map((c) => JSON.stringify(c)).join(", ")}]`,
  ];
  if (l.dentroDistrito) campos.push("dentroDistrito: true");
  return `  { ${campos.join(", ")} },`;
});

const contenido = `/* GENERADO por scripts/locales-zona.mjs — no editar a mano.
   Locales de votación de Cerro Colorado georreferenciados (OSM) y asignados a la
   asociación más cercana, con los códigos de acta que les corresponden en la
   captura de ONPE. ${asignados.length} locales · ${asignados.reduce((s, l) => s + l.actas.length, 0)} actas.
   Permiten que cada mesa del modelo se apoye en un local real en vez de un
   punto aleatorio dentro del polígono. */

export interface LocalMesa {
  zonaId: string;
  codigo: number;
  nombre: string;
  position: [number, number];
  actas: string[];
  /** ONPE ubica el local en Cerro Colorado aunque el anillo OSM lo deje fuera. */
  dentroDistrito?: boolean;
}

export const LOCALES: LocalMesa[] = [
${lineas.join("\n")}
];

export const LOCALES_POR_CODIGO = new Map<number, LocalMesa>(
  LOCALES.map((local) => [local.codigo, local]),
);

export const LOCALES_POR_ZONA = new Map<string, LocalMesa[]>();
for (const local of LOCALES) {
  const lista = LOCALES_POR_ZONA.get(local.zonaId) ?? [];
  lista.push(local);
  LOCALES_POR_ZONA.set(local.zonaId, lista);
}
`;

await writeFile("data/localesZona.ts", contenido);

for (const l of asignados) {
  console.log(`${String(l.actas.length).padStart(3)} actas | ${l.distanciaZonaM} m | ${l.nombre} => ${l.zonaNombre}`);
}
const zonas = new Set(asignados.map((l) => l.zonaId));
console.log(`\n${zonas.size}/19 zonas con local · ${asignados.length} locales`);
for (const f of ASOCIACIONES.features) {
  if (!zonas.has(f.properties.id)) console.log("SIN LOCAL:", f.properties.nombre);
}
