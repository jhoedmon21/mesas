import { CANDIDATOS, MATRIZ } from "../data/candidatosArequipa2026";
import { MESAS, RESUMEN_MESAS, rankingMesa, resumenMesasFrenteA } from "../data/mesasCerroColorado";

const CC = MATRIZ.find((m) => m.nombre === "CERRO COLORADO")!;
let ok = true;

// 1. cada mesa suma exactamente sus válidos
let malas = 0;
for (const m of MESAS) {
  const s = m.votos.reduce((a, b) => a + b, 0);
  if (s !== m.validos) { malas += 1; if (malas < 4) console.log("MESA MAL", m.id, s, m.validos); }
}
console.log("mesas:", MESAS.length, "| mesas con suma distinta:", malas);

// 2. totales por candidatura vs ONPE
console.log("\ncandidato            modelo    onpe    diff");
CANDIDATOS.forEach((c, j) => {
  const tot = MESAS.reduce((s, m) => s + m.votos[j], 0);
  const diff = tot - CC.votos[j];
  if (diff !== 0) ok = false;
  console.log(c.corto.padEnd(14), String(tot).padStart(8), String(CC.votos[j]).padStart(8), String(diff).padStart(6));
});
console.log("válidos:", RESUMEN_MESAS.validos, "| onpe:", CC.validos);
console.log("TOTALES EXACTOS:", ok);

// 3. ranking de la mesa más reñida y una perdida contra Cornejo
const cornejo = resumenMesasFrenteA("cornejo");
console.log("\nvs Cornejo → mesas perdidas:", cornejo.perdidas, "/", cornejo.mesas, "| margen", cornejo.margen.toFixed(2));
console.log("peor mesa:", cornejo.peores[0]?.id, cornejo.peores[0]?.zonaNombre);
if (cornejo.peores[0]) {
  console.log(rankingMesa(cornejo.peores[0]).slice(0, 4).map(r => `${r.corto} ${r.votos} (${r.pct.toFixed(1)}%)`).join(" · "));
}
const h = resumenMesasFrenteA("huisa");
console.log("vs Huisa → perdidas:", h.perdidas, "| margen", h.margen.toFixed(2));
const m0 = MESAS[0];
console.log("\nejemplo:", m0.id, m0.referencia, "|", m0.cuadrante, m0.distanciaCentroM + "m", "| ganador", m0.ganadorId, "| zegarra puesto", m0.puestoZegarra);
