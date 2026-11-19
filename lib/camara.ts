export interface Vuelo {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  nonce: number;
}

export interface Vista {
  id: string;
  label: string;
  detalle: string;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

/**
 * Encuadres de cámara, todos dentro de Cerro Colorado.
 */
export const VISTAS: Vista[] = [
  {
    id: "cono-norte",
    label: "Vista general del distrito",
    detalle: "84 sectores · 506 mesas · agenda territorial",
    center: [-71.567, -16.357],
    zoom: 13.55,
    pitch: 62,
    bearing: 6,
  },
  {
    id: "cerro-colorado",
    label: "Núcleo urbano",
    detalle: "Concentración de mesas del sur del distrito",
    center: [-71.571, -16.345],
    zoom: 12.9,
    pitch: 58,
    bearing: -8,
  },
  {
    id: "region-15",
    label: "Los 15 distritos priorizados",
    detalle: "Arequipa, Caylloma e Islay · pozo de otras candidaturas",
    center: [-71.98, -16.57],
    zoom: 8.9,
    pitch: 38,
    bearing: 0,
  },
];
