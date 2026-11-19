import { MESAS_DISTRITOS, resumenMesas } from "@/data/mesasDistritos";
import { MATRIZ } from "@/data/candidatosArequipa2026";
import { DISTRITOS_PRIORIDAD } from "@/data/distritosPrioridad";

const matriz = new Map(MATRIZ.map((m) => [m.nombre, m]));
const tabla = new Map(DISTRITOS_PRIORIDAD.map((d) => [d.id, d]));

let total = 0;
let totalAprox = 0;

console.log(
  "distrito".padEnd(34),
  "mesas".padStart(6),
  "locales".padStart(8),
  "aprox".padStart(6),
  "equiv".padStart(6),
  "válidos".padStart(9),
  "ONPE".padStart(9),
  "diff".padStart(6),
);

for (const [id, mesas] of Object.entries(MESAS_DISTRITOS)) {
  const r = resumenMesas(mesas);
  const nombre = tabla.get(id)?.nombre?.toUpperCase() ?? "";
  const onpe = matriz.get(nombre)?.validos ?? tabla.get(id)?.validos ?? null;
  const aprox = mesas.filter((m) => m.aproximada).length;
  const equiv = mesas.filter((m) => m.coincidenciaMesas).length;
  total += mesas.length;
  totalAprox += aprox;
  console.log(
    id.padEnd(34),
    String(r.mesas).padStart(6),
    String(r.locales).padStart(8),
    String(aprox).padStart(6),
    String(equiv).padStart(6),
    String(r.validos).padStart(9),
    String(onpe ?? "—").padStart(9),
    String(onpe === null ? "—" : r.validos - onpe).padStart(6),
  );
}

console.log(`\nTOTAL ${total} mesas · ${totalAprox} sin local georreferenciado`);
