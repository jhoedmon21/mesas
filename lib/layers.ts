export type CapaId =
  | "satelite"
  | "distritos"
  | "mesas"
  | "redes"
  | "empleo";

export type CapasEstado = Record<CapaId, boolean>;

export const CAPAS_INICIALES: CapasEstado = {
  satelite: false,
  distritos: true,
  mesas: true,
  redes: true,
  empleo: true,
};

export const CAPAS_INFO: {
  id: CapaId;
  label: string;
  detalle: string;
  color: string;
}[] = [
  {
    id: "satelite",
    label: "Vista satelital",
    detalle: "Esri World Imagery · mapa claro por defecto",
    color: "#22d3ee",
  },
  {
    id: "distritos",
    label: "Distritos priorizados (15)",
    detalle: "Altura por pozo de otras candidaturas · top 10 en ámbar",
    color: "#22d3ee",
  },
  {
    id: "mesas",
    label: "Mesas de votación (506)",
    detalle: "Actas ONPE · verde gana Zegarra · rojo gana contrincante",
    color: "#22c55e",
  },
  {
    id: "redes",
    label: "Redes de agua y pistas",
    detalle: "Tramos proyectados sobre el territorio",
    color: "#38bdf8",
  },
  {
    id: "empleo",
    label: "Rutas de empleo juvenil",
    detalle: "Conexiones hacia el Parque Industrial Río Seco",
    color: "#34d399",
  },
];
