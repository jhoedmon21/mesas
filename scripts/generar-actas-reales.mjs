/* Genera data/actasCerroColorado.ts desde la captura completa de ONPE.
   Entrada: data/onpe-actas-full.json (filas {m,l,c,e,em,va,p,v[15]}).
   Validación: 506 actas · suma de vector = válidos por acta ·
   totales del distrito exactos contra la fila ONPE de Cerro Colorado. */
import { readFileSync, writeFileSync } from "node:fs";

const filas = JSON.parse(readFileSync("data/onpe-actas-full.json", "utf8"));

/* ------- fila ONPE del distrito (data/candidatosArequipa2026.ts) ------- */
const src = readFileSync("data/candidatosArequipa2026.ts", "utf8");
const filaCc = src.match(/\{ nombre: "CERRO COLORADO",[^}]*\}/);
if (!filaCc) throw new Error("no se encontro la fila CERRO COLORADO");
const bloqueCc = filaCc[0];
const votosDistrito = [...bloqueCc.matchAll(/votos:\s*\[([^\]]*)\]/g)].flatMap((m) => m[1].split(",").map(Number));
const validosDistrito = Number(bloqueCc.match(/validos:\s*(\d+)/)?.[1]);
const agrupaciones = [...src.matchAll(/agrupacion:\s*"([^"]+)"/g)].map((m) => m[1]);

if (votosDistrito.length !== 15) throw new Error("no se leyeron 15 candidaturas");
if (agrupaciones.length !== 15) throw new Error("no se leyeron 15 agrupaciones");

console.log("actas recibidas:", filas.length);

/* -------------------------------------------------------------- control */
const codigos = new Set();
let malas = 0;
for (const f of filas) {
  if (codigos.has(f.m)) throw new Error("código duplicado " + f.m);
  codigos.add(f.m);
  const suma = f.v.reduce((a, b) => a + b, 0);
  if (suma !== f.va) {
    malas += 1;
    if (malas < 5) console.log("SUMA MALA", f.m, "vector", suma, "acta", f.va);
  }
}
const tot = filas.reduce(
  (s, f) => ({
    va: s.va + f.va,
    v: s.v.map((x, j) => x + f.v[j]),
  }),
  { va: 0, v: new Array(15).fill(0) },
);
console.log("mesas:", filas.length, "| filas con suma mala:", malas);
console.log("validos capturados:", tot.va, "| ONPE:", validosDistrito);
console.log("zegarra:", tot.v[0], "| huisa:", tot.v[1]);
votosDistrito.forEach((v, j) => {
  if (tot.v[j] !== v) console.log("DESVÍO", agrupaciones[j], tot.v[j], "≠", v);
});
if (tot.va !== validosDistrito) throw new Error("válidos no cierran");
votosDistrito.forEach((v, j) => {
  if (tot.v[j] !== v) throw new Error("votos no cierran en " + agrupaciones[j]);
});
console.log("TOTALES EXACTOS contra ONPE ✔");

/* ------------------------------------------------------------- archivo */
const orden = [...filas].sort((a, b) => a.m.localeCompare(b.m));
const lineas = orden.map((f) =>
  `  { codigo: "${f.m}", local: ${JSON.stringify(f.l)}, localCodigo: ${Number(f.c)}, electores: ${f.e}, emitidos: ${f.em}, validos: ${f.va}, participacion: ${f.p}, votos: [${f.v.join(", ")}] },`,
);

const contenido = `/* ============================================================================
   ACTAS REALES DE ONPE — Cerro Colorado (ubigeo 040103)
   ----------------------------------------------------------------------------
   Fuente: ONPE, Presentación de Resultados ERM 2026, Gobernador Regional de
   Arequipa, primera vuelta del 4 de octubre de 2026, actas 100% contabilizadas.
   Captura del 16/11/2026 desde resultadoelectoral.onpe.gob.pe
   (endpoint /presentacion-backend/actas/buscar/mesa, 506 mesas del distrito).

   \`votos\` va alineado al orden de CANDIDATOS (data/candidatosArequipa2026.ts).
   La suma del vector coincide con los válidos de cada acta y los totales del
   distrito cierran exactos: 107,335 válidos · Zegarra 23,910 · Huisa 17,545.

   El local de votación (nombre y código) es el que publica el acta. Las mesas
   de locales sin georreferencia se posicionan de forma aproximada.
   ========================================================================== */

export interface ActaCerroColorado {
  /** Código oficial del acta (número de mesa). */
  codigo: string;
  local: string;
  localCodigo: number;
  electores: number;
  emitidos: number;
  validos: number;
  /** Participación ciudadana en %, tal como la publica ONPE. */
  participacion: number;
  /** Votos de las 15 candidaturas, alineados a CANDIDATOS. */
  votos: number[];
}

export const ACTAS: ActaCerroColorado[] = [
${lineas.join("\n")}
];
`;

writeFileSync("data/actasCerroColorado.ts", contenido);
console.log("escrito: data/actasCerroColorado.ts ·", orden.length, "actas");
