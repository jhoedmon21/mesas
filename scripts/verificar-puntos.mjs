/* Verificación: ninguna mesa puede quedar fuera del anillo del distrito
   (salvo locales realmente ajenos, hoy ninguno) y los totales no cambian. */
import { MESAS, MESAS_FUERA_LIMITE, RESUMEN_MESAS } from "../data/mesasCerroColorado.ts";
import { LIMITE_CERRO_COLORADO } from "../data/limiteCerroColorado.ts";

const ANILLO = LIMITE_CERRO_COLORADO;

function dentro([x, y], anillo) {
  let d = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i, i += 1) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];
    const cruza = yi > y !== yj > y && x < ((xj - xi) * (y - yi) / (yj - yi || 1e-12)) + xi;
    if (cruza) d = !d;
  }
  return d;
}

const fuera = MESAS.filter((m) => !dentro(m.position, ANILLO));
console.log("mesas totales:", MESAS.length);
console.log("mesas fuera del anillo:", fuera.length, "· marcadas como fuera:", MESAS_FUERA_LIMITE.size);
for (const m of fuera.slice(0, 12)) {
  console.log("  FUERA", m.id, m.localNombre ?? "(sin local)", m.position);
}

const sinLocal = MESAS.filter((m) => !m.localCodigo);
console.log("\nmesas sin local:", sinLocal.length, "· fuera de ellas:", sinLocal.filter((m) => !dentro(m.position, ANILLO)).length);

const ref = { mesas: 506, validos: 107335, zegarra: 23910, huisa: 17545 };
console.log(
  "\ntotales:",
  RESUMEN_MESAS.mesas,
  RESUMEN_MESAS.validos,
  RESUMEN_MESAS.zegarra,
  RESUMEN_MESAS.huisa,
  RESUMEN_MESAS.mesas === ref.mesas &&
    RESUMEN_MESAS.validos === ref.validos &&
    RESUMEN_MESAS.zegarra === ref.zegarra &&
    RESUMEN_MESAS.huisa === ref.huisa
    ? "OK"
    : "CAMBIARON",
);
