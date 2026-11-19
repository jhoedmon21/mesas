import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

/* ============================================================================
   CERREÑO 3D — Matriz completa de la primera vuelta regional Arequipa 2026
   ----------------------------------------------------------------------------
   Fuente: ONPE, Presentación de Resultados ERM 2026 (proceso id 4).
   Elección: Gobernador Regional de Arequipa · 15 candidaturas · 29 distritos
   de la provincia de Arequipa · actas 100% contabilizadas.

   Matriz verificada: la suma de las 15 candidaturas por distrito coincide
   exactamente con los votos válidos de cada distrito (676,523 en total).

   El arreglo `votos` va alineado al orden de CANDIDATOS. No reordenar sin
   regenerar el archivo.
   ========================================================================== */

export interface CandidatoArequipa {
  id: string;
  /** Apellido para etiquetas compactas. */
  corto: string;
  nombre: string;
  agrupacion: string;
  codigoAgrupacion: number;
  /** Votos provinciales. */
  votos: number;
  color: string;
}

export interface DistritoMatriz {
  nombre: string;
  /** Código ONPE (no coincide con INEI: no unir por ubigeo). */
  ubigeo: string;
  validos: number;
  /** Votos por candidato, alineado a CANDIDATOS. */
  votos: number[];
}

export const CANDIDATOS: CandidatoArequipa[] = [
  {
    id: "zegarra",
    corto: "Zegarra",
    nombre: "FLORENTINO ALFREDO ZEGARRA TEJADA",
    agrupacion: "FUERZA AREQUIPEÑA",
    codigoAgrupacion: 143,
    votos: 187965,
    color: "#22d3ee",
  },
  {
    id: "huisa",
    corto: "Huisa",
    nombre: "JENRY FEDERICO HUISA CALAPUJA",
    agrupacion: "AHORA NACIÓN - AN",
    codigoAgrupacion: 123,
    votos: 98425,
    color: "#f43f5e",
  },
  {
    id: "cornejo",
    corto: "Cornejo",
    nombre: "BENIGNO TEOFILO CORNEJO VALENCIA",
    agrupacion: "MOVIMIENTO REGIONAL AREQUIPA AVANCEMOS",
    codigoAgrupacion: 144,
    votos: 90196,
    color: "#f59e0b",
  },
  {
    id: "caceres",
    corto: "Cáceres",
    nombre: "ELMER CACERES LLICA",
    agrupacion: "ALIANZA PARA EL PROGRESO",
    codigoAgrupacion: 95,
    votos: 69736,
    color: "#a78bfa",
  },
  {
    id: "gonzales",
    corto: "Gonzales",
    nombre: "BERLY JOSE GONZALES ARIAS",
    agrupacion: "YO AREQUIPA",
    codigoAgrupacion: 145,
    votos: 43664,
    color: "#34d399",
  },
  {
    id: "rodriguez",
    corto: "Rodríguez",
    nombre: "HAROLD EDGARD RODRIGUEZ QUISPE",
    agrupacion: "RENOVACIÓN POPULAR PERÚ",
    codigoAgrupacion: 137,
    votos: 39306,
    color: "#38bdf8",
  },
  {
    id: "huamantuma",
    corto: "Huamantuma",
    nombre: "CESAR ANGEL HUAMANTUMA ALARCON",
    agrupacion: "AREQUIPA, TRADICIÓN Y FUTURO",
    codigoAgrupacion: 142,
    votos: 32277,
    color: "#fb923c",
  },
  {
    id: "herrera",
    corto: "Herrera",
    nombre: "HECTOR HUGO HERRERA HERRERA",
    agrupacion: "PARTIDO DEMOCRÁTICO SOMOS PERÚ",
    codigoAgrupacion: 94,
    votos: 27289,
    color: "#2dd4bf",
  },
  {
    id: "martinez",
    corto: "Martínez",
    nombre: "PEDRO EDWIN MARTINEZ TALAVERA",
    agrupacion: "ACCIÓN POPULAR",
    codigoAgrupacion: 93,
    votos: 22959,
    color: "#a3e635",
  },
  {
    id: "ancalle",
    corto: "Ancalle",
    nombre: "JOSE LUIS ANCALLE GUTIERREZ",
    agrupacion: "ALIANZA ELECTORAL VENCEREMOS",
    codigoAgrupacion: 135,
    votos: 22851,
    color: "#e879f9",
  },
  {
    id: "aguilar",
    corto: "Aguilar",
    nombre: "HUGO EFRAIN AGUILAR GONZALES",
    agrupacion: "PARTIDO APRISTA PERUANO",
    codigoAgrupacion: 112,
    votos: 16513,
    color: "#818cf8",
  },
  {
    id: "huarsaya",
    corto: "Huarsaya",
    nombre: "YACKELIN LOURDES HUARSAYA CALIZAYA DE LLACCHUA",
    agrupacion: "FRENTE POPULAR AGRÍCOLA FÍA DEL PERÚ",
    codigoAgrupacion: 107,
    votos: 11128,
    color: "#facc15",
  },
  {
    id: "ardiles",
    corto: "Ardiles",
    nombre: "DAVID CESAR ARDILES SARAVIA",
    agrupacion: "SALVEMOS AL PERÚ",
    codigoAgrupacion: 111,
    votos: 4939,
    color: "#94a3b8",
  },
  {
    id: "torres",
    corto: "Torres",
    nombre: "MILCO TORRES BARRIONUEVO",
    agrupacion: "COALICIÓN TRANSFORMADORA TIERRA VERDE",
    codigoAgrupacion: 124,
    votos: 4767,
    color: "#f472b6",
  },
  {
    id: "coronado",
    corto: "Coronado",
    nombre: "MIGUEL CORONADO ZARATE FLORES",
    agrupacion: "PARTIDO CÍVICO OBRAS",
    codigoAgrupacion: 117,
    votos: 4508,
    color: "#64748b",
  },
];

export const IDX_ZEGARRA = CANDIDATOS.findIndex((c) => c.id === "zegarra");

export const MATRIZ: DistritoMatriz[] = [
  { nombre: "AREQUIPA", ubigeo: "040101", validos: 46643, votos: [16579, 4407, 4320, 2779, 4471, 5322, 1773, 1425, 1391, 990, 1829, 473, 342, 250, 292] },
  { nombre: "CAYMA", ubigeo: "040102", validos: 57785, votos: [12201, 12257, 8331, 5536, 3832, 5308, 2140, 1931, 945, 1804, 1227, 1134, 342, 437, 360] },
  { nombre: "CERRO COLORADO", ubigeo: "040103", validos: 107335, votos: [23910, 17545, 23681, 11543, 6454, 5124, 3571, 4136, 1725, 2949, 1965, 2099, 751, 903, 979] },
  { nombre: "CHARACATO", ubigeo: "040104", validos: 7605, votos: [2370, 897, 1565, 695, 522, 208, 307, 254, 145, 270, 126, 103, 38, 52, 53] },
  { nombre: "CHIGUATA", ubigeo: "040105", validos: 2997, votos: [696, 508, 355, 404, 331, 75, 83, 126, 94, 181, 28, 51, 12, 19, 34] },
  { nombre: "LA JOYA", ubigeo: "040106", validos: 20405, votos: [4379, 4322, 2849, 4755, 948, 305, 380, 1148, 187, 308, 116, 363, 105, 130, 110] },
  { nombre: "MIRAFLORES", ubigeo: "040107", validos: 37102, votos: [9821, 4781, 3173, 5758, 2434, 1958, 1663, 1486, 1848, 1124, 1692, 562, 247, 291, 264] },
  { nombre: "MOLLEBAYA", ubigeo: "040108", validos: 2741, votos: [858, 452, 427, 335, 103, 44, 60, 85, 197, 61, 25, 56, 13, 10, 15] },
  { nombre: "PAUCARPATA", ubigeo: "040109", validos: 82824, votos: [24479, 7514, 9607, 6096, 5404, 4047, 5187, 3477, 6860, 5390, 1402, 1413, 780, 670, 498] },
  { nombre: "POCSI", ubigeo: "040110", validos: 726, votos: [128, 39, 74, 308, 78, 7, 6, 52, 6, 14, 4, 2, 3, 4, 1] },
  { nombre: "POLOBAYA", ubigeo: "040111", validos: 1015, votos: [227, 47, 291, 294, 33, 12, 46, 23, 7, 13, 2, 11, 2, 4, 3] },
  { nombre: "QUEQUEÑA", ubigeo: "040112", validos: 2191, votos: [670, 481, 129, 595, 53, 31, 26, 52, 24, 56, 12, 29, 12, 8, 13] },
  { nombre: "SABANDIA", ubigeo: "040113", validos: 3418, votos: [1005, 212, 445, 854, 143, 122, 88, 100, 197, 102, 52, 40, 13, 26, 19] },
  { nombre: "SACHACA", ubigeo: "040114", validos: 19225, votos: [6847, 1442, 1969, 2498, 1095, 1521, 1058, 1158, 342, 340, 441, 222, 101, 90, 101] },
  { nombre: "SAN JUAN DE SIGUAS", ubigeo: "040115", validos: 638, votos: [72, 127, 32, 241, 36, 10, 13, 19, 57, 4, 4, 12, 6, 1, 4] },
  { nombre: "SAN JUAN DE TARUCANI", ubigeo: "040116", validos: 1244, votos: [232, 58, 57, 348, 96, 17, 157, 199, 19, 32, 2, 7, 6, 6, 8] },
  { nombre: "SANTA ISABEL DE SIGUAS", ubigeo: "040117", validos: 677, votos: [287, 213, 24, 85, 25, 2, 10, 10, 7, 5, 4, 3, 0, 0, 2] },
  { nombre: "SANTA RITA DE SIHUAS", ubigeo: "040118", validos: 4890, votos: [320, 265, 190, 1597, 127, 49, 2011, 89, 35, 86, 19, 36, 19, 16, 31] },
  { nombre: "SOCABAYA", ubigeo: "040119", validos: 40277, votos: [12527, 6568, 4841, 3153, 2967, 1922, 2241, 1511, 877, 1282, 774, 690, 315, 308, 301] },
  { nombre: "TIABAYA", ubigeo: "040120", validos: 12301, votos: [4112, 1516, 2427, 1320, 629, 459, 292, 622, 188, 282, 140, 141, 66, 47, 60] },
  { nombre: "UCHUMAYO", ubigeo: "040121", validos: 12608, votos: [2947, 2763, 1256, 1119, 609, 454, 298, 398, 214, 1921, 210, 189, 71, 98, 61] },
  { nombre: "VITOR", ubigeo: "040122", validos: 1891, votos: [252, 234, 260, 629, 42, 46, 20, 275, 30, 25, 15, 20, 10, 26, 7] },
  { nombre: "YANAHUARA", ubigeo: "040123", validos: 20432, votos: [6695, 1644, 2178, 1794, 1789, 3446, 620, 429, 453, 245, 776, 120, 78, 98, 67] },
  { nombre: "YARABAMBA", ubigeo: "040124", validos: 3127, votos: [865, 1096, 202, 340, 148, 65, 33, 197, 37, 55, 34, 28, 9, 10, 8] },
  { nombre: "YURA", ubigeo: "040125", validos: 20157, votos: [3453, 2515, 3751, 4829, 1091, 558, 773, 910, 253, 563, 266, 641, 188, 170, 196] },
  { nombre: "MARIANO MELGAR", ubigeo: "040126", validos: 38564, votos: [10207, 5302, 4446, 2529, 2043, 1533, 4929, 2991, 1279, 1238, 636, 666, 263, 283, 219] },
  { nombre: "JACOBO HUNTER", ubigeo: "040127", validos: 30562, votos: [7043, 5299, 4372, 2655, 1715, 1237, 1041, 1150, 3118, 990, 569, 575, 330, 218, 250] },
  { nombre: "ALTO SELVA ALEGRE", ubigeo: "040128", validos: 50463, votos: [13757, 9606, 5269, 3844, 3174, 2376, 2252, 1734, 1434, 1556, 3210, 983, 507, 398, 363] },
  { nombre: "JOSÉ LUIS BUSTAMANTE Y RIVERO", ubigeo: "040129", validos: 46680, votos: [21026, 6315, 3675, 2803, 3272, 3048, 1199, 1302, 990, 965, 933, 459, 310, 194, 189] },
];
