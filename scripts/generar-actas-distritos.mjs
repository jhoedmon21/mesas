// Convierte la captura de actas de ONPE (.captura/distritos/<ubigeo>.json) en
// data/actasDistritosJson.ts. Cerro Colorado no entra: ya tiene sus 506 actas
// tipadas en data/actasCerroColorado.ts.
//
//   node scripts/generar-actas-distritos.mjs

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const DISTRITOS = [
  { id: "paucarpata", ubigeo: 40109 },
  { id: "cayma", ubigeo: 40102 },
  { id: "alto-selva-alegre", ubigeo: 40128 },
  { id: "majes", ubigeo: 40220 },
  { id: "arequipa", ubigeo: 40101 },
  { id: "mariano-melgar", ubigeo: 40126 },
  { id: "miraflores", ubigeo: 40107 },
  { id: "socabaya", ubigeo: 40119 },
  { id: "jose-luis-bustamante-y-rivero", ubigeo: 40129 },
  { id: "jacobo-hunter", ubigeo: 40127 },
  { id: "yura", ubigeo: 40125 },
  { id: "mollendo", ubigeo: 40701 },
  { id: "yanahuara", ubigeo: 40123 },
  { id: "la-joya", ubigeo: 40106 },
];

const SALIDA = "data/actasDistritosJson.ts";
const resumen = [];
const bloques = [];

for (const distrito of DISTRITOS) {
  const ruta = `.captura/distritos/${distrito.ubigeo}.json`;
  if (!existsSync(ruta)) {
    console.warn(`Falta ${ruta}; se omite ${distrito.id}`);
    continue;
  }

  const crudas = JSON.parse(readFileSync(ruta, "utf8"));
  const filas = crudas
    .map((r) => {
      const votos = (r.v ?? []).map((n) => Number(n) || 0);
      // ONPE publica 15 agrupaciones; si la captura trae menos, se completa.
      while (votos.length < 15) votos.push(0);
      return {
        m: String(r.m),
        l: String(r.l ?? "Local sin nombre"),
        e: Number(r.e) || 0,
        em: Number(r.em) || 0,
        va: Number(r.va) || 0,
        p: Number(r.p) || 0,
        v: votos.slice(0, 15),
      };
    })
    .sort((a, b) => a.m.localeCompare(b.m));

  let validosOficiales = 0;
  let validosVotos = 0;
  let descuadres = 0;
  for (const f of filas) {
    validosOficiales += f.va;
    validosVotos += f.v.reduce((s, v) => s + v, 0);
    if (f.va !== f.v.reduce((s, v) => s + v, 0)) descuadres += 1;
  }

  resumen.push({
    distritoId: distrito.id,
    ubigeo: distrito.ubigeo,
    actas: filas.length,
    validosOficiales,
    validosVotos,
    descuadres,
    locales: new Set(filas.map((f) => f.l)).size,
  });

  const cuerpo = filas
    .map(
      (f) =>
        `    { m: ${JSON.stringify(f.m)}, l: ${JSON.stringify(f.l)}, e: ${f.e}, em: ${f.em}, va: ${f.va}, p: ${Number(f.p.toFixed(3))}, v: [${f.v.join(", ")}] },`,
    )
    .join("\n");

  bloques.push(`  ${JSON.stringify(distrito.id)}: [\n${cuerpo}\n  ],`);
}

const contenido = `/* GENERADO por scripts/generar-actas-distritos.mjs — no editar a mano.
   Actas reales de ONPE (ERM 2026, Gobernador Regional de Arequipa) de los 14
   distritos del tablero distintos de Cerro Colorado. Cerro vive en
   data/actasCerroColorado.ts con el mismo formato de votos.
   ${resumen.reduce((s, r) => s + r.actas, 0)} actas · ${resumen.reduce((s, r) => s + r.validosOficiales, 0)} válidos.
   \`v\` va alineado al orden de CANDIDATOS (data/candidatosArequipa2026.ts). */

export interface ActaDistritoJson {
  /** Código de mesa / acta. */
  m: string;
  /** Nombre del local de votación tal como lo publica ONPE. */
  l: string;
  /** Electores hábiles. */
  e: number;
  /** Votos emitidos. */
  em: number;
  /** Votos válidos. */
  va: number;
  /** Participación ciudadana, en %. */
  p: number;
  /** 15 candidaturas, alineadas a CANDIDATOS. */
  v: number[];
}

export const ACTAS_DISTRITOS: Record<string, ActaDistritoJson[]> = {
${bloques.join("\n")}
};
`;

writeFileSync(SALIDA, contenido);
writeFileSync(
  ".captura/distritos/resumen-actas.json",
  JSON.stringify(resumen, null, 2),
);

for (const r of resumen) {
  console.log(
    `${r.distritoId}: ${r.actas} actas · ${r.locales} locales · ${r.validosOficiales} válidos (${r.validosVotos} en votos) · ${r.descuadres} descuadres`,
  );
}
console.log(`\n${resumen.reduce((s, r) => s + r.actas, 0)} actas → ${SALIDA}`);
