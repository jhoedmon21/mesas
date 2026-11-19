import { MESAS, rankingMesa } from "../data/mesasCerroColorado";

// mesa roja contra Huisa (pierde) pero cuyo ganador real es Cornejo
const ejemplos = MESAS.filter(
  (m) => m.huisa > m.zegarra && m.ganadorId === "cornejo",
).sort((a, b) => (b.huisa - b.zegarra) - (a.huisa - a.zegarra));

console.log("mesas rojas vs Huisa con Cornejo ganador:", ejemplos.length);
for (const m of ejemplos.slice(0, 5)) {
  const r = rankingMesa(m).slice(0, 3).map((x) => `${x.corto} ${x.votos}`).join(" · ");
  console.log(m.id, "|", m.zonaNombre, "|", m.referencia, "|", r);
}

const conteo: Record<string, number> = {};
for (const m of MESAS) conteo[m.ganadorId] = (conteo[m.ganadorId] ?? 0) + 1;
console.log("\nmesas ganadas por candidatura:", conteo);
