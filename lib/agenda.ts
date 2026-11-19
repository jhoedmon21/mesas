import {
  ASOCIACIONES,
  ESTADO_TITULACION,
  type AsociacionFeature,
  type AsociacionProps,
  type Sector,
} from "@/data/cerroColoradoGeo";

/* ============================================================================
   Agenda territorial de Cerro Colorado
   ----------------------------------------------------------------------------
   Convierte los indicadores de las asociaciones mapeadas en cinco brechas
   comparables (titulación, agua, pistas, seguridad, empleo) y las agrega a
   nivel distrital y por sector.

   OJO: los indicadores territoriales son estimaciones de trabajo del modelo
   (no registros oficiales). Los votos del panel electoral sí son ONPE.
   ========================================================================== */

export type NecesidadId =
  | "titulacion"
  | "agua"
  | "pistas"
  | "seguridad"
  | "empleo";

export interface NecesidadMeta {
  id: NecesidadId;
  label: string;
  corto: string;
  color: string;
  /** Peso dentro del índice compuesto de necesidad. */
  peso: number;
  /** Qué se pide, en una línea. */
  demanda: string;
}

export const NECESIDADES: NecesidadMeta[] = [
  {
    id: "titulacion",
    label: "Saneamiento físico-legal",
    corto: "Titulación",
    color: "#ef4444",
    peso: 0.26,
    demanda:
      "Culminar habilitación urbana y expedientes COFOPRI; inscripción SUNARP por manzana.",
  },
  {
    id: "agua",
    label: "Agua potable y desagüe",
    corto: "Agua",
    color: "#38bdf8",
    peso: 0.26,
    demanda:
      "Ampliar red matriz y conexiones domiciliarias; planta de tratamiento en el Cono Norte.",
  },
  {
    id: "pistas",
    label: "Pistas asfaltadas y LED",
    corto: "Pistas",
    color: "#fbbf24",
    peso: 0.18,
    demanda:
      "Asfaltado con pavimento rígido y alumbrado LED en vías estructurantes y calles locales.",
  },
  {
    id: "seguridad",
    label: "Seguridad ciudadana",
    corto: "Seguridad",
    color: "#f472b6",
    peso: 0.15,
    demanda:
      "Cámaras con analítica de video, casetas y patrullaje integrado con la PNP.",
  },
  {
    id: "empleo",
    label: "Empleo juvenil y MyPEs",
    corto: "Empleo",
    color: "#34d399",
    peso: 0.15,
    demanda:
      "Vinculación Cono Norte ↔ Parque Industrial Río Seco y formalización de emprendimientos.",
  },
];

export const NECESIDAD_POR_ID = new Map(
  NECESIDADES.map((n) => [n.id, n] as const),
);

export interface AsociacionAgenda {
  props: AsociacionProps;
  /** Brecha 0–100 por dimensión (100 = nada cubierto). */
  brechas: Record<NecesidadId, number>;
  /** Índice compuesto ponderado 0–100. */
  indice: number;
  /** Dimensión más crítica de la asociación. */
  principal: NecesidadId;
  /** Familias × índice: cuánta gente arrastra la brecha. */
  carga: number;
}

function limitar(valor: number): number {
  return Math.max(0, Math.min(100, valor));
}

/** Cámaras objetivo: una por cada 450 familias, mínimo 2. */
export function objetivoCamaras(familias: number): number {
  return Math.max(2, Math.round(familias / 450));
}

/** Vacantes juveniles objetivo: 10% de las familias de la asociación. */
export function objetivoVacantes(familias: number): number {
  return Math.max(10, Math.round(familias * 0.1));
}

export function evaluarAsociacion(
  feature: AsociacionFeature,
): AsociacionAgenda {
  const p = feature.properties;
  const brechas: Record<NecesidadId, number> = {
    titulacion: limitar((1 - ESTADO_TITULACION[p.estadoTitulacion].avanceBase) * 100),
    agua: limitar(100 - p.estadoAgua),
    pistas: limitar(100 - p.estadoPistas),
    seguridad: limitar(
      (1 - p.camarasSeguridad / objetivoCamaras(p.familias)) * 100,
    ),
    empleo: limitar(
      (1 - p.vacantesJuveniles / objetivoVacantes(p.familias)) * 100,
    ),
  };

  const indice = NECESIDADES.reduce(
    (s, n) => s + brechas[n.id] * n.peso,
    0,
  );

  const principal = NECESIDADES.reduce((peor, n) =>
    brechas[n.id] > brechas[peor.id] ? n : peor,
  ).id;

  return {
    props: p,
    brechas,
    indice,
    principal,
    carga: (p.familias * indice) / 100,
  };
}

export const AGENDA_ASOCIACIONES: AsociacionAgenda[] =
  ASOCIACIONES.features.map(evaluarAsociacion).sort(
    (a, b) => b.carga - a.carga,
  );

export interface NecesidadAgregada {
  id: NecesidadId;
  meta: NecesidadMeta;
  /** Brecha media ponderada por familias, 0–100. */
  brecha: number;
  /** Familias del universo mapeado afectadas por esa brecha. */
  familias: number;
  /** Cifra concreta que resume la brecha. */
  cifra: string;
}

export interface AgendaDistrital {
  familias: number;
  asociaciones: number;
  indice: number;
  necesidades: NecesidadAgregada[];
  /** La necesidad más urgente del distrito. */
  critica: NecesidadAgregada;
  /** Asociaciones ordenadas por carga (familias × brecha). */
  ranking: AsociacionAgenda[];
  porSector: {
    sector: Sector;
    familias: number;
    indice: number;
    asociaciones: number;
  }[];
}

export function construirAgendaDistrital(
  lista: AsociacionAgenda[] = AGENDA_ASOCIACIONES,
): AgendaDistrital {
  const familias = lista.reduce((s, a) => s + a.props.familias, 0);

  const ponderado = (id: NecesidadId) =>
    familias
      ? lista.reduce((s, a) => s + a.brechas[id] * a.props.familias, 0) /
        familias
      : 0;

  const sinTitulo = lista.filter(
    (a) => a.props.estadoTitulacion !== "TITULADO",
  );
  const familiasSinTitulo = sinTitulo.reduce(
    (s, a) => s + a.props.familias,
    0,
  );
  const camarasFaltantes = lista.reduce(
    (s, a) =>
      s + Math.max(0, objetivoCamaras(a.props.familias) - a.props.camarasSeguridad),
    0,
  );
  const vacantesFaltantes = lista.reduce(
    (s, a) =>
      s +
      Math.max(0, objetivoVacantes(a.props.familias) - a.props.vacantesJuveniles),
    0,
  );

  const detalle: Record<NecesidadId, { familias: number; cifra: string }> = {
    titulacion: {
      familias: familiasSinTitulo,
      cifra: `${sinTitulo.length} de ${lista.length} sectores sin título inscrito`,
    },
    agua: {
      familias: Math.round(
        lista.reduce((s, a) => s + a.props.familias * (1 - a.props.estadoAgua / 100), 0),
      ),
      cifra: `${Math.round(ponderado("agua"))}% de las familias sin cobertura completa`,
    },
    pistas: {
      familias: Math.round(
        lista.reduce(
          (s, a) => s + a.props.familias * (1 - a.props.estadoPistas / 100),
          0,
        ),
      ),
      cifra: `${Math.round(ponderado("pistas"))}% de las vías sin asfaltar ni LED`,
    },
    seguridad: {
      familias: Math.round(
        lista.reduce((s, a) => s + a.props.familias * (a.brechas.seguridad / 100), 0),
      ),
      cifra: `${camarasFaltantes} cámaras faltantes para el estándar 1/450 familias`,
    },
    empleo: {
      familias: Math.round(
        lista.reduce((s, a) => s + a.props.familias * (a.brechas.empleo / 100), 0),
      ),
      cifra: `${vacantesFaltantes} vacantes juveniles faltantes`,
    },
  };

  const necesidades: NecesidadAgregada[] = NECESIDADES.map((meta) => ({
    id: meta.id,
    meta,
    brecha: ponderado(meta.id),
    familias: detalle[meta.id].familias,
    cifra: detalle[meta.id].cifra,
  }));

  const sectores = new Map<
    Sector,
    { familias: number; carga: number; asociaciones: number }
  >();
  for (const a of lista) {
    const actual = sectores.get(a.props.sector) ?? {
      familias: 0,
      carga: 0,
      asociaciones: 0,
    };
    actual.familias += a.props.familias;
    actual.carga += a.props.familias * a.indice;
    actual.asociaciones += 1;
    sectores.set(a.props.sector, actual);
  }

  return {
    familias,
    asociaciones: lista.length,
    indice: lista.length
      ? lista.reduce((s, a) => s + a.indice, 0) / lista.length
      : 0,
    necesidades,
    critica: [...necesidades].sort((a, b) => b.brecha - a.brecha)[0],
    ranking: [...lista].sort((a, b) => b.carga - a.carga),
    porSector: [...sectores.entries()]
      .map(([sector, v]) => ({
        sector,
        familias: v.familias,
        indice: v.familias ? v.carga / v.familias : 0,
        asociaciones: v.asociaciones,
      }))
      .sort((a, b) => b.indice - a.indice),
  };
}

export const AGENDA = construirAgendaDistrital();

/** Color de la asociación según su índice de necesidad. */
export function colorNecesidad(indice: number, alpha = 220): [number, number, number, number] {
  const t = Math.max(0, Math.min(1, indice / 100));
  // verde (cubierto) → ámbar → rojo (brecha crítica)
  const paradas: [number, [number, number, number]][] = [
    [0, [16, 185, 129]],
    [0.5, [251, 191, 36]],
    [1, [239, 68, 68]],
  ];
  let desde = paradas[0];
  let hasta = paradas[paradas.length - 1];
  for (let i = 0; i < paradas.length - 1; i += 1) {
    if (t >= paradas[i][0] && t <= paradas[i + 1][0]) {
      desde = paradas[i];
      hasta = paradas[i + 1];
      break;
    }
  }
  const span = hasta[0] - desde[0] || 1;
  const k = (t - desde[0]) / span;
  return [
    Math.round(desde[1][0] + (hasta[1][0] - desde[1][0]) * k),
    Math.round(desde[1][1] + (hasta[1][1] - desde[1][1]) * k),
    Math.round(desde[1][2] + (hasta[1][2] - desde[1][2]) * k),
    alpha,
  ];
}

export function colorNecesidadCss(indice: number, alpha = 1): string {
  const [r, g, b] = colorNecesidad(indice, 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
