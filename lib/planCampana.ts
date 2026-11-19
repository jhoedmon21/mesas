import { mesasDeDistrito, type MesaDistrito } from "@/data/mesasDistritos";
import { CANDIDATOS } from "@/data/candidatosArequipa2026";

/* ============================================================================
   PLAN DE CAMPAÑA — BALOTAJE ZEGARRA vs HUISA · 6 de diciembre de 2026
   ----------------------------------------------------------------------------
   En la segunda vuelta solo quedan dos. Los votos de las trece candidaturas
   eliminadas ya no son «otros»: son EL PREMIO. Gana quien se lleve la mayoría
   de ese pozo.

   La aritmética, explícita. Con Z = votos de Zegarra, H = de Huisa y O = pozo:

       si el pozo se reparte oZ + oH = O, Zegarra gana la mesa cuando
       Z + oZ > H + (O − oZ)   →   oZ > (O + H − Z) / 2

   De ahí sale `cuota`: la fracción del pozo que Zegarra necesita para pasar a
   Huisa. 0,50 es la mitad exacta; por debajo de 0,50 la mesa ya está ganada
   incluso perdiendo el pozo en proporción a la fuerza de cada uno.

   DOS REDISEÑOS QUE COSTARON CARO, anotados para no repetirlos:

   1. Contar «actas que cambian» no sirve: en Paucarpata Huisa no gana ni una
      mesa (0 de 388). El indicador da cero y no decide nada.
   2. Fijar una meta absoluta de pozo tampoco sirve: en Paucarpata Zegarra ya
      captaría el 76,5% del pozo con reparto natural, así que una meta del 55%
      no exige ningún voto.

   Por eso la moneda del tablero es una sola, y siempre tiene signo:

       colchón = (cuota natural − 0,50) × pozo      (en votos)

   Positivo: votos de ventaja sobre el umbral donde Huisa lo pasa. Negativo:
   votos de déficit. Es la misma unidad en cualquier distrito, se suma, se
   resta y se ordena. Donde Zegarra arrasa el plan es de defensa; donde va
   abajo, de captación. El tablero no elige por él: muestra el signo.

   La unidad de trabajo es el LOCAL DE VOTACIÓN, no la mesa: es el punto donde
   se planta la carpa y se hace el puerta a puerta. Un local con 8 mesas es una
   sola visita que mueve 8 actas.

   Nada de esto es proyección de voto ni compra de voluntades: es aritmética
   sobre actas ya contadas, ordenada por esfuerzo.
   ========================================================================== */

/** Contactos efectivos necesarios por cada voto adicional (1 de cada 8,3). */
export const CONTACTOS_POR_VOTO = 8.3;

/** Días de campaña hasta el balotaje del domingo 6 de diciembre de 2026. */
export const DIAS_DE_CAMPAÑA = 18;

/** Minutos operativos por parada (carpa, caminata, medición). */
export const MINUTOS_POR_PARADA = 40;

/** Velocidad media de traslado en trama urbana, km/h. */
export const VELOCIDAD_KMH = 22;

/** Tope de paradas por jornada: una jornada es una mañana o una tarde. */
export const PARADAS_POR_JORNADA = 5;

/** Colchón por debajo del cual una mesa se considera en riesgo (votos). */
export const COLCHON_MINIMO = 20;

export type ViaFoco = "captar-pozo" | "cuidar-base";

export type TipoFoco = "quiebre" | "remontar" | "defender" | "descartar";

export interface MesaPlan {
  id: string;
  numero: number;
  validos: number;
  zegarra: number;
  huisa: number;
  /** Votos de las trece candidaturas eliminadas: el premio del balotaje. */
  pozo: number;
  /** Huisa − Zegarra en la primera vuelta (negativo = Zegarra adelante). */
  dif: number;
  /** Fracción del pozo que Zegarra necesita para pasar a Huisa. */
  cuota: number;
  /** Votos de ventaja (+) o déficit (−) sobre el umbral del 50% del pozo. */
  colchon: number;
  /** La gana con reparto proporcional del pozo. */
  ganaHoy: boolean;
  /** La gana, pero con un colchón tan delgado que se puede perder. */
  enRiesgo: boolean;
  position: [number, number];
}

export interface FocoCampana {
  id: string;
  nombre: string;
  position: [number, number];
  mesas: number;
  electores: number;
  emitidos: number;
  participacion: number;
  validos: number;
  zegarra: number;
  huisa: number;
  pozo: number;
  /** Margen Zegarra − Huisa en puntos (primera vuelta). */
  margen: number;
  /** Cuota natural del pozo si se reparte según la fuerza de cada uno. */
  cuotaActual: number;
  /** Votos de ventaja sobre el umbral del 50% del pozo. */
  colchon: number;
  /** Votos de déficit si está por debajo del umbral (0 si va arriba). */
  deficit: number;
  mesasGanadas: number;
  mesasEnRiesgo: number;
  mesasPerdidas: number;
  via: ViaFoco;
  tipo: TipoFoco;
  contactos: number;
  kmAlHub: number;
  indice: number;
  puesto: number;
  lectura: string;
  mensaje: string;
}

export interface Jornada {
  dia: number;
  paradas: FocoCampana[];
  km: number;
  minutos: number;
  votos: number;
}

export interface Escalon {
  cuota: number;
  actas: number;
  /** Actas que añade este peldaño. 0 en la fila base (no hay anterior). */
  actasNuevas: number;
  /** Votos que Zegarra suma al pozo capturado (cuota × pozo). */
  votos: number;
  margenPp: number;
  /** Primera fila de la tabla: es el punto de partida, no un incremento. */
  esBase: boolean;
  /** Peldaño en el que se cierra el distrito (todas las actas por primera vez). */
  esTecho: boolean;
  /** Por encima del techo y sin actas nuevas: el pozo extra ya no compra nada. */
  sinRetorno: boolean;
}

export interface CandidatoTraspaso {
  id: string;
  corto: string;
  agrupacion: string;
  color: string;
  votos: number;
  /** % de sus votos en mesas donde Zegarra superó a Huisa. */
  enTerritorioZegarra: number;
  /** % de sus votos en mesas donde Zegarra todavía va abajo. */
  enMesasEnDeficit: number;
  /** Correlación de Pearson entre su cuota y la de Zegarra (entre mesas). */
  afinidad: number;
}

export interface PlanCampana {
  distritoId: string;
  /** Rango útil del simulador de pozo, en puntos porcentuales enteros. */
  rango: [number, number];
  mesasPlan: MesaPlan[];
  focos: FocoCampana[];
  ruta: FocoCampana[];
  jornadas: Jornada[];
  traspaso: CandidatoTraspaso[];
  escalones: Escalon[];
  resumen: {
    mesas: number;
    locales: number;
    focos: number;
    /** Focos que aportan colchón o que hay que recuperar. */
    focosConTrabajo: number;
    pozo: number;
    zegarra: number;
    huisa: number;
    /** Cuota natural del pozo en todo el distrito. */
    cuotaActual: number;
    /** Votos de ventaja del distrito sobre el umbral (0 si va abajo). */
    colchon: number;
    /** Votos de déficit del distrito (0 si va arriba). */
    deficit: number;
    actasGanadas: number;
    actasEnRiesgo: number;
    actasPerdidas: number;
    /**
     * Cuota del pozo que hace falta para llevarse TODAS las actas del distrito
     * (el máximo de las cuotas-mesa). Es el punto donde el distrito se cierra.
     */
    techo: number;
    /** Cuota de la mesa más fácil: el mínimo para empezar a ganar algo. */
    piso: number;
    /** Actas que gana Zegarra con el reparto natural del pozo. */
    actasNatural: number;
    /** Actas que gana capturando el techo (siempre el total). */
    actasTecho: number;
    /**
     * Holgura en puntos de pozo: cuánto puede ceder Zegarra por debajo del
     * reparto natural y seguir llevándose todas las actas. Positiva = distrito
     * asegurado; negativa = aquí hay que subir la captación.
     */
    holgura: number;
    contactos: number;
    /** Cuota del trabajo que concentran los 10 primeros focos. */
    concentracion: number;
    kmRuta: number;
    horasRuta: number;
    votosPorJornada: number;
  };
}

/* ------------------------------------------------------------------ geo */

function km(a: [number, number], b: [number, number]): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * 111.32;
  const dLng = (b[0] - a[0]) * 111.32 * Math.cos(((a[1] + b[1]) / 2) * rad);
  return Math.hypot(dLat, dLng);
}

/* --------------------------------------------------------------- mesas */

function planDeMesa(mesa: MesaDistrito): MesaPlan {
  const Z = mesa.zegarra;
  const H = mesa.huisa;
  const O = Math.max(0, mesa.validos - Z - H);
  const dif = H - Z;

  // Cuota del pozo que hace falta para pasar a Huisa. Sin pozo, la mesa solo
  // se da vuelta quitándole votantes al rival: se marca como imposible (1).
  const cuota = O > 0 ? Math.max(0, (O + dif) / (2 * O)) : Z >= H ? 0 : 1;
  const ganaHoy = cuota < 0.5;
  // Colchón en votos: cuánto separa a Zegarra del punto donde Huisa lo pasa.
  const colchon = Math.round((0.5 - cuota) * O);

  return {
    id: mesa.id,
    numero: mesa.numero,
    validos: mesa.validos,
    zegarra: Z,
    huisa: H,
    pozo: O,
    dif,
    cuota,
    colchon,
    ganaHoy,
    // Gana, pero con menos de COLCHON_MINIMO votos de ventaja sobre el umbral:
    // cualquier captación del rival se la lleva.
    enRiesgo: ganaHoy && colchon < COLCHON_MINIMO,
    position: mesa.position,
  };
}

/* --------------------------------------------------------------- focos */

function agruparPorLocal(mesas: MesaDistrito[]): Map<string, MesaDistrito[]> {
  const mapa = new Map<string, MesaDistrito[]>();
  for (const mesa of mesas) {
    const clave = mesa.localId || mesa.localNombre || `sin-local-${mesa.numero}`;
    const lista = mapa.get(clave);
    if (lista) lista.push(mesa);
    else mapa.set(clave, [mesa]);
  }
  return mapa;
}

type FocoBase = Omit<
  FocoCampana,
  | "tipo"
  | "indice"
  | "puesto"
  | "kmAlHub"
  | "lectura"
  | "mensaje"
  | "contactos"
>;

function construirFoco(nombre: string, mesas: MesaDistrito[]): FocoBase {
  const planes = mesas.map(planDeMesa);

  const electores = mesas.reduce((s, m) => s + m.electores, 0);
  const emitidos = mesas.reduce((s, m) => s + m.emitidos, 0);
  const validos = mesas.reduce((s, m) => s + m.validos, 0);
  const zegarra = mesas.reduce((s, m) => s + m.zegarra, 0);
  const huisa = mesas.reduce((s, m) => s + m.huisa, 0);
  const pozo = planes.reduce((s, m) => s + m.pozo, 0);
  const colchonTotal = planes.reduce((s, m) => s + m.colchon, 0);

  // Centro ponderado por válidos: un local con mesas dispersas no se arrastra.
  let lng = 0;
  let lat = 0;
  let peso = 0;
  for (const mesa of mesas) {
    const p = Math.max(1, mesa.validos);
    lng += mesa.position[0] * p;
    lat += mesa.position[1] * p;
    peso += p;
  }

  const cuotaActual = zegarra + huisa > 0 ? zegarra / (zegarra + huisa) : 0;

  return {
    id: mesas[0].localId || nombre,
    nombre,
    position: peso ? [lng / peso, lat / peso] : mesas[0].position,
    mesas: mesas.length,
    electores,
    emitidos,
    participacion: electores ? (emitidos / electores) * 100 : 0,
    validos,
    zegarra,
    huisa,
    pozo,
    margen: validos ? ((zegarra - huisa) / validos) * 100 : 0,
    cuotaActual,
    colchon: Math.max(0, colchonTotal),
    deficit: Math.max(0, -colchonTotal),
    mesasGanadas: planes.filter((m) => m.ganaHoy).length,
    mesasEnRiesgo: planes.filter((m) => m.enRiesgo).length,
    mesasPerdidas: planes.filter((m) => !m.ganaHoy).length,
    via: colchonTotal >= 0 ? "cuidar-base" : "captar-pozo",
  };
}

function clasificar(foco: FocoBase): TipoFoco {
  if (foco.pozo < 15) return "descartar";
  if (foco.deficit > 0) {
    // Déficit chico frente a un pozo grande: el mejor uso del tiempo.
    return foco.deficit <= foco.pozo * 0.08 ? "quiebre" : "remontar";
  }
  // Gana el local, pero tiene mesas con colchón delgado: eso también es
  // trabajo, y del urgente. Un foco no se salva por promedio.
  return foco.mesasEnRiesgo > 0 ? "quiebre" : "defender";
}

function lecturaDe(foco: FocoCampana): string {
  switch (foco.tipo) {
    case "quiebre":
      return foco.deficit > 0
        ? `Déficit de ${foco.deficit} votos sobre un pozo de ${Math.round(
            foco.pozo,
          )}: ${foco.mesasPerdidas} mesa(s) se dan vuelta con poco.`
        : `${foco.mesasEnRiesgo} de sus ${foco.mesas} mesas tienen colchón de menos de ${COLCHON_MINIMO} votos: hoy gana, pero se pierden con nada.`;
    case "remontar":
      return `Déficit de ${foco.deficit} votos: hay que captar el ${Math.round(
        (foco.deficit / Math.max(1, foco.pozo)) * 100,
      )}% del pozo del local para pasarlo.`;
    case "defender":
      return `Colchón de ${foco.colchon} votos (${Math.round(
        foco.cuotaActual * 100,
      )}% del pozo). Sólido: no gastar aquí.`;
    default:
      return `Pozo de ${Math.round(foco.pozo)} votos: demasiado pequeño para mover la aguja.`;
  }
}

function mensajeDe(foco: FocoCampana): string {
  if (foco.tipo === "descartar") {
    return "No es objetivo del balotaje. Si un dirigente local lo pide, se le da material y se le deja trabajar solo.";
  }
  if (foco.tipo === "defender") {
    return `Consolidado: ${Math.round(foco.cuotaActual * 100)}% del pozo y ${foco.colchon} votos de colchón. Visita corta, agradecimiento y foto. Cero inversión en persuasión.`;
  }
  if (foco.deficit > 0) {
    return `Captar pozo: hacen falta ${foco.deficit} votos de ${Math.round(
      foco.pozo,
    )} disponibles. Puerta a puerta con la pregunta «¿por quién votó y por qué?», no con el discurso general.`;
  }
  return `Defender: ${foco.mesasEnRiesgo} mesa(s) con colchón de menos de ${COLCHON_MINIMO} votos. Aquí no hay que convencer a nadie nuevo: hay que asegurar que el votante propio vuelva el 6 de diciembre.`;
}

/* ---------------------------------------------------------------- ruta */

function optimizarRuta(focos: FocoCampana[]): FocoCampana[] {
  if (focos.length <= 2) return [...focos];
  const pesoDe = (f: FocoCampana) => f.deficit + f.mesasEnRiesgo * 10;
  const inicio = [...focos].sort((a, b) => pesoDe(b) - pesoDe(a))[0];
  const restantes = focos.filter((f) => f.id !== inicio.id);
  const ruta = [inicio];
  while (restantes.length) {
    const ultimo = ruta[ruta.length - 1];
    let mejor = 0;
    let mejorD = Infinity;
    restantes.forEach((f, i) => {
      const d = km(ultimo.position, f.position);
      if (d < mejorD) {
        mejorD = d;
        mejor = i;
      }
    });
    ruta.push(restantes.splice(mejor, 1)[0]);
  }

  const largo = (r: FocoCampana[]) => {
    let total = 0;
    for (let i = 0; i < r.length - 1; i += 1) total += km(r[i].position, r[i + 1].position);
    return total;
  };
  let actual = largo(ruta);
  let mejora = true;
  let vueltas = 0;
  while (mejora && vueltas < 40) {
    mejora = false;
    vueltas += 1;
    for (let i = 1; i < ruta.length - 1; i += 1) {
      for (let j = i + 1; j < ruta.length; j += 1) {
        const prueba = [
          ...ruta.slice(0, i),
          ...ruta.slice(i, j + 1).reverse(),
          ...ruta.slice(j + 1),
        ];
        const nuevo = largo(prueba);
        if (nuevo < actual - 0.01) {
          ruta.splice(0, ruta.length, ...prueba);
          actual = nuevo;
          mejora = true;
        }
      }
    }
  }
  return ruta;
}

function armarJornadas(ruta: FocoCampana[]): Jornada[] {
  const jornadas: Jornada[] = [];
  let paradas: FocoCampana[] = [];
  let distancia = 0;
  let dia = 1;
  const cerrar = () => {
    if (!paradas.length) return;
    jornadas.push({
      dia,
      paradas,
      km: Math.round(distancia * 10) / 10,
      minutos: Math.round(
        paradas.length * MINUTOS_POR_PARADA + (distancia / VELOCIDAD_KMH) * 60,
      ),
      votos: paradas.reduce((s, f) => s + f.deficit, 0),
    });
    dia += 1;
    paradas = [];
    distancia = 0;
  };
  ruta.forEach((foco, i) => {
    if (i > 0) distancia += km(ruta[i - 1].position, foco.position);
    paradas.push(foco);
    if (paradas.length >= PARADAS_POR_JORNADA) cerrar();
  });
  cerrar();
  return jornadas;
}

/* ------------------------------------------------------------- traspaso */

const IDX_ZEGARRA = CANDIDATOS.findIndex((c) => c.id === "zegarra");
const IDX_HUISA = CANDIDATOS.findIndex((c) => c.id === "huisa");

function correlacion(pares: [number, number][]): number {
  const n = pares.length;
  if (n < 8) return 0;
  const mx = pares.reduce((s, p) => s + p[0], 0) / n;
  const my = pares.reduce((s, p) => s + p[1], 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const [x, y] of pares) {
    const a = x - mx;
    const b = y - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den ? num / den : 0;
}

function construirTraspaso(
  mesas: MesaDistrito[],
  planes: MesaPlan[],
): CandidatoTraspaso[] {
  const salida: CandidatoTraspaso[] = [];

  CANDIDATOS.forEach((cand, k) => {
    if (k === IDX_ZEGARRA || k === IDX_HUISA) return;

    let votos = 0;
    let enZegarra = 0;
    let enDeficit = 0;
    const pares: [number, number][] = [];

    mesas.forEach((mesa, i) => {
      if (!mesa.validos) return;
      const suyos = mesa.votos[k] ?? 0;
      votos += suyos;
      if (mesa.zegarra > mesa.huisa) enZegarra += suyos;
      if (!planes[i].ganaHoy) enDeficit += suyos;
      pares.push([suyos / mesa.validos, mesa.zegarra / mesa.validos]);
    });

    salida.push({
      id: cand.id,
      corto: cand.corto,
      agrupacion: cand.agrupacion,
      color: cand.color,
      votos,
      enTerritorioZegarra: votos ? (enZegarra / votos) * 100 : 0,
      enMesasEnDeficit: votos ? (enDeficit / votos) * 100 : 0,
      afinidad: correlacion(pares),
    });
  });

  return salida.sort((a, b) => b.votos - a.votos);
}

/* -------------------------------------------------------------- escalera */

/**
 * Rango del simulador, anclado al TECHO del distrito y no al reparto natural.
 * El techo es el único punto de decisión: por debajo se compran actas, por
 * encima ya no. Con la ventana anterior (±20 pp sobre el natural) en Paucarpata
 * el techo caía fuera y el simulador no enseñaba nunca dónde se para.
 */
function rangoDe(techo: number): [number, number] {
  const base = Math.round(techo * 100);
  return [Math.max(0, base - 15), Math.min(100, base + 10)];
}

function escalonesDe(mesasPlan: MesaPlan[], rango: [number, number]): Escalon[] {
  const validos = mesasPlan.reduce((s, m) => s + m.validos, 0);
  const z = mesasPlan.reduce((s, m) => s + m.zegarra, 0);
  const h = mesasPlan.reduce((s, m) => s + m.huisa, 0);
  const pozo = mesasPlan.reduce((s, m) => s + m.pozo, 0);
  const techo = mesasPlan.reduce((s, m) => Math.max(s, m.cuota), 0);
  const total = mesasPlan.length;

  // Peldaños de 5 en 5, más el punto exacto de cierre: la ventana está anclada
  // al techo pero el techo rara vez cae en un múltiplo de 5.
  const pcts = new Set<number>();
  for (let p = rango[0]; p <= rango[1]; p += 5) pcts.add(p);
  pcts.add(Math.min(rango[1], Math.max(rango[0], Math.ceil(techo * 100))));
  const pasos = [...pcts].sort((a, b) => a - b);

  const actasEn = (t: number) => mesasPlan.filter((m) => m.cuota <= t).length;
  const salida: Escalon[] = [];
  let previas = 0;
  let cerrado = false;

  for (const pct of pasos) {
    const t = pct / 100;
    const actas = actasEn(t);
    const esBase = salida.length === 0;
    const esTecho = !cerrado && actas === total;
    if (esTecho) cerrado = true;

    salida.push({
      cuota: t,
      actas,
      actasNuevas: esBase ? 0 : actas - previas,
      // Votos que Zegarra suma: el pozo no es suyo hoy, lo reparte en el balotaje.
      votos: Math.round(t * pozo),
      // Margen Zegarra − Huisa sobre válidos, con el pozo ya repartido.
      margenPp: validos ? ((z - h + (2 * t - 1) * pozo) / validos) * 100 : 0,
      esBase,
      esTecho,
      sinRetorno: !esBase && !esTecho && actas - previas === 0 && t > techo,
    });
    previas = actas;
  }
  return salida;
}

/** Actas, votos y margen si Zegarra capta `cuota` del pozo en el distrito. */
export function escenarioDe(
  plan: PlanCampana,
  cuota: number,
): { actas: number; votos: number; margenPp: number; natural: number } {
  const validos = plan.mesasPlan.reduce((s, m) => s + m.validos, 0);
  const z = plan.mesasPlan.reduce((s, m) => s + m.zegarra, 0);
  const h = plan.mesasPlan.reduce((s, m) => s + m.huisa, 0);
  const pozo = plan.mesasPlan.reduce((s, m) => s + m.pozo, 0);
  const natural = z + h > 0 ? z / (z + h) : 0;
  return {
    actas: plan.mesasPlan.filter((m) => m.cuota <= cuota).length,
    // El pozo hoy no está en manos de Zegarra: todo lo que capture es ganancia.
    votos: Math.round(cuota * pozo),
    margenPp: validos ? ((z - h + (2 * cuota - 1) * pozo) / validos) * 100 : 0,
    natural,
  };
}

/* ------------------------------------------------------------------ plan */

const CACHE = new Map<string, PlanCampana>();

export function planDeDistrito(distritoId: string): PlanCampana {
  const enCache = CACHE.get(distritoId);
  if (enCache) return enCache;

  const mesas = mesasDeDistrito(distritoId);
  const mesasPlan = mesas.map(planDeMesa);
  const grupos = agruparPorLocal(mesas);

  const bases: FocoBase[] = [];
  for (const [claveLocal, lista] of grupos) {
    bases.push(construirFoco(lista[0].localNombre || claveLocal, lista));
  }

  // Peso de trabajo del foco: déficit a recuperar más riesgo a defender.
  const pesoDe = (f: FocoBase) => f.deficit + f.mesasEnRiesgo * 10;
  const orden = bases.map(pesoDe).sort((a, b) => a - b);
  const umbralQuiebre = orden.length ? orden[Math.floor(orden.length * 0.6)] : 0;

  const hub = [...bases].sort((a, b) => pesoDe(b) - pesoDe(a))[0];
  const hubPos: [number, number] = hub?.position ?? bases[0]?.position ?? [0, 0];

  const focos: FocoCampana[] = bases
    .map((base) => {
      const distancia = km(base.position, hubPos);
      const foco: FocoCampana = {
        ...base,
        contactos: Math.round((base.deficit + base.mesasEnRiesgo * 12) * CONTACTOS_POR_VOTO),
        tipo: "defender",
        // Peso de trabajo con castigo por lejanía: el mismo puñado de votos no
        // cuesta lo mismo a 2 km que a 14.
        indice: Math.min(
          100,
          Math.round(
            (pesoDe(base) / (1 + distancia / 12) /
              Math.max(1, umbralQuiebre * 1.4)) *
              100,
          ),
        ),
        puesto: 0,
        kmAlHub: Math.round(distancia * 10) / 10,
        lectura: "",
        mensaje: "",
      };
      foco.tipo = clasificar(base);
      foco.lectura = lecturaDe(foco);
      foco.mensaje = mensajeDe(foco);
      return foco;
    })
    .sort(
      (a, b) =>
        pesoDe(b) - pesoDe(a) ||
        b.pozo - a.pozo ||
        b.mesas - a.mesas,
    )
    .map((f, i) => ({ ...f, puesto: i + 1 }));

  const conTrabajo = focos.filter(
    (f) => f.tipo === "quiebre" || f.tipo === "remontar",
  );
  const ruta = optimizarRuta(conTrabajo.slice(0, 12));

  const pozo = focos.reduce((s, f) => s + f.pozo, 0);
  const zegarra = focos.reduce((s, f) => s + f.zegarra, 0);
  const huisa = focos.reduce((s, f) => s + f.huisa, 0);
  const colchonTotal = mesasPlan.reduce((s, m) => s + m.colchon, 0);
  const deficitTotal = mesasPlan.reduce((s, m) => s + Math.max(0, -m.colchon), 0);
  const trabajoTotal = focos.reduce((s, f) => s + pesoDe(f), 0);
  const top10 = focos.slice(0, 10).reduce((s, f) => s + pesoDe(f), 0);
  const kmRuta = ruta.reduce(
    (s, f, i) => (i === 0 ? 0 : s + km(ruta[i - 1].position, f.position)),
    0,
  );
  const jornadas = armarJornadas(ruta);

  const natural = zegarra + huisa > 0 ? zegarra / (zegarra + huisa) : 0;
  const techo = mesasPlan.reduce((s, m) => Math.max(s, m.cuota), 0);
  const piso = mesasPlan.reduce((s, m) => Math.min(s, m.cuota), 1);
  const rango = rangoDe(techo);

  const plan: PlanCampana = {
    distritoId,
    rango,
    mesasPlan,
    focos,
    ruta,
    jornadas,
    traspaso: construirTraspaso(mesas, mesasPlan),
    escalones: escalonesDe(mesasPlan, rango),
    resumen: {
      mesas: mesas.length,
      locales: focos.length,
      focos: focos.length,
      focosConTrabajo: conTrabajo.length,
      pozo,
      zegarra,
      huisa,
      cuotaActual: zegarra + huisa > 0 ? zegarra / (zegarra + huisa) : 0,
      colchon: Math.max(0, colchonTotal),
      deficit: deficitTotal,
      actasGanadas: mesasPlan.filter((m) => m.ganaHoy).length,
      actasEnRiesgo: mesasPlan.filter((m) => m.enRiesgo).length,
      actasPerdidas: mesasPlan.filter((m) => !m.ganaHoy).length,
      techo,
      piso,
      actasNatural: mesasPlan.filter((m) => m.cuota < natural).length,
      actasTecho: mesasPlan.filter((m) => m.cuota <= techo).length,
      holgura: natural - techo,
      contactos: Math.round(
        (deficitTotal + mesasPlan.filter((m) => m.enRiesgo).length * 12) *
          CONTACTOS_POR_VOTO,
      ),
      concentracion: trabajoTotal ? (top10 / trabajoTotal) * 100 : 0,
      kmRuta: Math.round(kmRuta * 10) / 10,
      horasRuta:
        Math.round(
          (kmRuta / VELOCIDAD_KMH + ruta.length * (MINUTOS_POR_PARADA / 60)) * 10,
        ) / 10,
      votosPorJornada: jornadas.length
        ? Math.round(deficitTotal / jornadas.length)
        : 0,
    },
  };

  CACHE.set(distritoId, plan);
  return plan;
}

/** Ruta lista para el mapa: una polilínea y sus paradas numeradas. */
export function polilineaDeRuta(plan: PlanCampana): [number, number][] {
  return plan.ruta.map((f) => f.position);
}

export const ETIQUETA_TIPO: Record<TipoFoco, string> = {
  quiebre: "Punto de quiebre",
  remontar: "Recuperar",
  defender: "Defender",
  descartar: "No asignar",
};

export const HEX_TIPO: Record<TipoFoco, string> = {
  quiebre: "#fbbf24",
  remontar: "#f97316",
  defender: "#22c55e",
  descartar: "#64748b",
};

export const ETIQUETA_VIA: Record<ViaFoco, string> = {
  "captar-pozo": "Captar pozo",
  "cuidar-base": "Cuidar base",
};

/* -------------------------------------------------------------- veredicto */

export type TonoVeredicto = "asegurado" | "casi" | "justo" | "pelea";

export interface Veredicto {
  tono: TonoVeredicto;
  titulo: string;
  detalle: string;
}

/**
 * Lectura del distrito en una línea: ¿cuánto pozo puede ceder Zegarra antes de
 * perder actas? La respuesta no es la misma en los quince distritos, y ahí está
 * el reparto de esfuerzo. En Paucarpata sobran 30 puntos; en Cayma faltan 17.
 */
export function veredictoDe(plan: PlanCampana): Veredicto {
  const { holgura, techo, cuotaActual, actasNatural, mesas } = plan.resumen;
  const sobran = holgura * 100;
  const cierre = (techo * 100).toFixed(1);
  const natural = (cuotaActual * 100).toFixed(1);
  const faltan = mesas - actasNatural;
  const cobertura = mesas ? actasNatural / mesas : 1;

  if (sobran >= 10) {
    return {
      tono: "asegurado",
      titulo: "Distrito asegurado · no gastar aquí",
      detalle: `Con el reparto natural (${natural}%) gana ${fmt(actasNatural)} de ${fmt(mesas)} actas. Podría ceder ${fmtDec1(sobran)} puntos de pozo y aun así se llevaría el distrito entero: el cierre está en ${cierre}%. Cada punto extra que se capture aquí no compra ninguna acta.`,
    };
  }
  if (sobran >= 0) {
    return {
      tono: "justo",
      titulo: "Asegurado, pero sin margen",
      detalle: `Con el reparto natural (${natural}%) gana ${fmt(actasNatural)} de ${fmt(mesas)} actas y el cierre está en ${cierre}%: solo ${fmtDec1(sobran)} puntos por debajo. Un trasvase flojo de las trece eliminadas lo pone en disputa.`,
    };
  }
  // Cerro Colorado pierde 4 de 506 actas: es un cierre fino, no una batalla.
  if (cobertura >= 0.95) {
    return {
      tono: "casi",
      titulo: `Casi cerrado · faltan ${fmt(faltan)} actas`,
      detalle: `Con el reparto natural (${natural}%) gana ${fmt(actasNatural)} de ${fmt(mesas)} actas: solo ${fmt(faltan)} se le escapan, y para recuperarlas necesita ${fmtDec1(-sobran)} puntos más de pozo (cierre en ${cierre}%). Trabajo quirúrgico en pocos locales, no una campaña de distrito.`,
    };
  }
  return {
    tono: "pelea",
    titulo: "Aquí se pelea el distrito",
    detalle: `Con el reparto natural (${natural}%) gana solo ${fmt(actasNatural)} de ${fmt(mesas)} actas. Para llevarse las ${fmt(mesas)} necesita captar el ${cierre}% del pozo: ${fmtDec1(-sobran)} puntos más de los que le tocan. Es el distrito donde cada jornada rinde.`,
  };
}

const fmt = (n: number) => Math.round(n).toLocaleString("es-PE");
const fmtDec1 = (n: number) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

