"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Compass,
  Hexagon,
  Layers,
  List,
  MapPin,
  Minus,
  Plus,
  Radar,
  Route,
  Satellite,
  Maximize2,
  Minimize2,
  Box,
  Map as MapIcon,
  X,
} from "lucide-react";
import { Map as MapLibreMap, type MapOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import {
  GeoJsonLayer,
  PathLayer,
  PolygonLayer,
  ScatterplotLayer,
  TextLayer,
} from "@deck.gl/layers";
import { TripsLayer } from "@deck.gl/geo-layers";
import {
  ASOCIACIONES,
  ASOCIACIONES_POR_ID,
  centroide as centroideAsociacion,
  CORREDORES_SEGUROS,
  REDES_AGUA,
  RUTAS_EMPLEO,
  type AsociacionFeature,
  type AsociacionProps,
  type Tramo,
} from "@/data/cerroColoradoGeo";
import { FEATURE_LIMITE_CERRO } from "@/data/limiteCerroColorado";
import {
  DISTRITOS_PRIORIDAD,
  DISTRITOS_PRIORIDAD_POR_ID,
  FEATURES_DISTRITOS,
  MAX_POZO_DISTRITAL,
  TOP_DISTRITOS_IDS,
  type DistritoFeaturePrioridad,
  type DistritoPropiedades,
} from "@/data/distritosPrioridad";
import { CANDIDATOS } from "@/data/candidatosArequipa2026";
import {
  FUERA_LIMITE_POR_DISTRITO,
  MESAS_POR_DISTRITO,
  type MesaDistrito,
} from "@/data/mesasDistritos";
import {
  COLOR_TONO,
  HEX_TONO,
  UMBRAL_DISPUTA_PP,
  contarTonos,
  margenPrimeroSegundo,
  tonoMesa,
  type TonoMesa,
} from "@/lib/mesas";
import { fmtDec, fmtInt } from "@/lib/format";
import type { CapaId, CapasEstado } from "@/lib/layers";
import type { Vuelo } from "@/lib/camara";
import TarjetaDistritoMapa from "@/components/TarjetaDistritoMapa";

/* ============================================================================
   Lienzo electoral — estilo "tarjetas sobre mapa claro" (fusion)
   ----------------------------------------------------------------------------
   Fusiona los dos referentes elegidos:
     · Cartografía clara tipo OSM (Carto Positron) con marcadores vivos:
       verde donde gana Zegarra, rojo donde gana un contrincante, y CLUSTERS
       con conteo al alejar (estilo reportes).
     · Tarjetas blancas con pills de color para leyenda, etiquetas y tooltip.
   El satélite Esri queda disponible como vista alternativa desde el panel.
   ========================================================================== */

const ESTILO: NonNullable<MapOptions["style"]> = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    satelite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        "Satélite: Esri, Maxar · Base vector: OpenFreeMap © OpenStreetMap · Resultados: ONPE ERM 2026",
    },
    terreno: {
      type: "raster-dem",
      tiles: [
        "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
      ],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 15,
    },
    calles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    },
  },
  layers: [
    {
      id: "fondo",
      type: "background",
      paint: { "background-color": "#f1f5f9" },
    },
    {
      id: "agua",
      type: "fill",
      source: "calles",
      "source-layer": "water",
      paint: { "fill-color": "#cfe4f7" },
    },
    {
      id: "zona-verde",
      type: "fill",
      source: "calles",
      "source-layer": "park",
      paint: { "fill-color": "#e0f0e0" },
    },
    {
      id: "edificio",
      type: "fill",
      source: "calles",
      "source-layer": "building",
      minzoom: 12,
      paint: { "fill-color": "#e6eaf0" },
    },
    {
      id: "satelite",
      type: "raster",
      source: "satelite",
      layout: { visibility: "none" },
      paint: {
        "raster-opacity": 1,
        "raster-saturation": -0.12,
        "raster-contrast": 0.2,
        "raster-brightness-max": 0.92,
        "raster-brightness-min": 0.05,
        "raster-fade-duration": 260,
      },
    },
    {
      id: "relieve",
      type: "hillshade",
      source: "terreno",
      paint: {
        // El DEM se usa como relieve sombreado, no como malla: con `setTerrain`
        // la superficie sube a ~2,400 m y las capas Deck.gl (que dibujan en
        // z = 0) quedarían flotando.
        "hillshade-exaggeration": 0.28,
        "hillshade-shadow-color": "#c3cfd9",
        "hillshade-highlight-color": "#ffffff",
        "hillshade-accent-color": "#e2e8f0",
      },
    },
    {
      id: "via-casing",
      type: "line",
      source: "calles",
      "source-layer": "transportation",
      paint: {
        "line-color": "#d5dde6",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          0.8,
          13,
          2.2,
          16,
          7,
        ],
      },
    },
    {
      id: "via",
      type: "line",
      source: "calles",
      "source-layer": "transportation",
      paint: {
        "line-color": "#ffffff",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          0.6,
          13,
          1.6,
          16,
          5.4,
        ],
      },
    },
    {
      // Nombres de barrios y lugares sobre el mapa claro.
      id: "nombres-lugares",
      type: "symbol",
      source: "calles",
      "source-layer": "place",
      minzoom: 9,
      maxzoom: 16,
      layout: {
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-font": ["Noto Sans Regular"],
        "text-letter-spacing": 0.05,
        "text-transform": "uppercase",
      },
      paint: {
        "text-color": "#64748b",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.4,
        "text-opacity": 0.9,
      },
    },
    {
      // Nombres de calles sobre el satélite (solo en modo 2D).
      id: "nombres-calles",
      type: "symbol",
      source: "calles",
      "source-layer": "transportation_name",
      minzoom: 12,
      layout: {
        visibility: "none",
        "symbol-placement": "line",
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-font": ["Noto Sans Regular"],
        "text-letter-spacing": 0.04,
        "text-max-angle": 38,
      },
      paint: {
        "text-color": "#0f172a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.6,
        "text-opacity": 0.95,
      },
    },
  ],
};

const DURACION_VIAJE = 6200;

function crearTimestamps(tramo: Tramo, duracion = DURACION_VIAJE): number[] {
  const tiempos = [0];
  let total = 0;
  for (let i = 1; i < tramo.waypoints.length; i += 1) {
    const [lng1, lat1] = tramo.waypoints[i - 1];
    const [lng2, lat2] = tramo.waypoints[i];
    const dx = (lng2 - lng1) * 111_320 * Math.cos((lat1 * Math.PI) / 180);
    const dy = (lat2 - lat1) * 110_574;
    total += Math.hypot(dx, dy);
    tiempos.push(total);
  }
  const maxima = total || 1;
  return tiempos.map((t) => Math.round((t / maxima) * duracion));
}

const TIEMPOS_AGUA = new Map(
  REDES_AGUA.map((t) => [t.id, crearTimestamps(t)]),
);
const TIEMPOS_PISTAS = new Map(
  CORREDORES_SEGUROS.map((t) => [t.id, crearTimestamps(t)]),
);
const TIEMPOS_EMPLEO = new Map(
  RUTAS_EMPLEO.map((t) => [t.id, crearTimestamps(t)]),
);

/** Contorno del distrito de Cerro Colorado (solo referencia, sin coropleta). */
const CERRO = FEATURE_LIMITE_CERRO;

/* ------------------------------------------------ secciones separadas *
 * Los polígonos de origen se traslapan entre sí (digitalización manual:
 * 9 pares). Al extruirlos se ven apilados. Se encogen iterativamente
 * SOLO los que chocan, hacia su propio centroide, hasta separarlos; las
 * secciones sin conflicto conservan su geometría original.          */

type Anillo = [number, number][];

function puntoEnAnilloMapa(p: [number, number], anillo: Anillo): boolean {
  let dentro = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];
    if (
      yi > p[1] !== yj > p[1] &&
      p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi
    ) {
      dentro = !dentro;
    }
  }
  return dentro;
}

function escalarAnillo(anillo: Anillo, factor: number): Anillo {
  const cx = anillo.reduce((a, p) => a + p[0], 0) / anillo.length;
  const cy = anillo.reduce((a, p) => a + p[1], 0) / anillo.length;
  return anillo.map(
    (p) =>
      [cx + (p[0] - cx) * factor, cy + (p[1] - cy) * factor] as [
        number,
        number,
      ],
  );
}

const ASOCIACIONES_SEPARADAS: typeof ASOCIACIONES = (() => {
  const anillos = new Map<string, Anillo>(
    ASOCIACIONES.features.map((f) => [
      f.properties.id,
      f.geometry.coordinates[0] as Anillo,
    ]),
  );
  for (let iteracion = 0; iteracion < 12; iteracion += 1) {
    const entradas = [...anillos.entries()];
    const implicados = new Set<string>();
    for (let i = 0; i < entradas.length; i += 1) {
      for (let j = i + 1; j < entradas.length; j += 1) {
        const a = entradas[i][1];
        const b = entradas[j][1];
        if (
          a.some((p) => puntoEnAnilloMapa(p, b)) ||
          b.some((p) => puntoEnAnilloMapa(p, a))
        ) {
          implicados.add(entradas[i][0]);
          implicados.add(entradas[j][0]);
        }
      }
    }
    if (!implicados.size) break;
    for (const id of implicados) {
      anillos.set(id, escalarAnillo(anillos.get(id)!, 0.92));
    }
  }
  return {
    type: "FeatureCollection",
    features: ASOCIACIONES.features.map((f) => ({
      ...f,
      geometry: {
        type: "Polygon",
        coordinates: [
          anillos.get(f.properties.id) ?? (f.geometry.coordinates[0] as Anillo),
        ],
      },
    })),
  };
})();

const VERDE = [34, 197, 94] as [number, number, number]; // gana Zegarra
const ROJO = [239, 68, 68] as [number, number, number]; // gana contrincante
const NARANJA = [245, 158, 11] as [number, number, number]; // en disputa

/* ------------------------------------------------------------------ clusters *
 * Al alejar, las 506 mesas se agrupan en círculos con conteo (estilo de
 * reportes): el color del círculo es el ganador mayoritario del grupo.
 * Al acercarse a z ≥ 14 vuelven a verse las mesas individuales.            */

const ZOOM_INDIVIDUAL = 13;
const MESAS_VACIAS: MesaDistrito[] = [];
const SIN_FUERA: ReadonlySet<string> = new Set();

interface ClusterMesas {
  position: [number, number];
  total: number;
  verde: number;
  naranja: number;
  rojo: number;
  /** true si TODAS las mesas del grupo votan en un local fuera del límite. */
  fuera: boolean;
}

function tamañoCelda(zoom: number): number {
  if (zoom < 10.5) return 0.09;
  if (zoom < 12) return 0.045;
  if (zoom < 13) return 0.022;
  return 0.011;
}

/** Radio (px) del círculo de cluster, escalado por √conteo. */
function radioCluster(cluster: ClusterMesas): number {
  return Math.min(44, 14 + Math.sqrt(cluster.total) * 3.6);
}

/** Tono dominante del grupo: el que más mesas aporta (empate → disputa). */
function tonoMayor(c: ClusterMesas): [number, number, number] {
  if (c.naranja >= c.verde && c.naranja >= c.rojo) return NARANJA;
  return c.verde >= c.rojo ? VERDE : ROJO;
}

/**
 * Sector (porción de pastel) del círculo de cluster entre dos fracciones.
 * Parte de las 12 en punto y avanza en el sentido del reloj.
 */
function sectorPolygon(
  c: ClusterMesas,
  radioPx: number,
  zoom: number,
  desde: number,
  hasta: number,
): number[][][] {
  const [lng, lat] = c.position;
  const cosLat = Math.cos((lat * Math.PI) / 180) || 1e-6;
  // 1 px de pantalla = 360 / (256 · 2^zoom) grados de latitud.
  const rLat = radioPx / ((512 * Math.pow(2, zoom)) / 360);
  const rLng = rLat / cosLat;
  const puntos: [number, number][] = [[lng, lat]];
  const pasos = 26;
  const inicio = Math.PI / 2; // 12 en punto
  const arco = 2 * Math.PI * Math.max(0, hasta - desde);
  for (let i = 0; i <= pasos; i += 1) {
    const ang = inicio + (i / pasos) * arco;
    puntos.push([lng + rLng * Math.cos(ang), lat + rLat * Math.sin(ang)]);
  }
  puntos.push([lng, lat]);
  return [puntos];
}

function agruparMesas(
  zoom: number,
  mesas: MesaDistrito[],
  fueraLimite: ReadonlySet<string>,
): ClusterMesas[] {
  const tamaño = tamañoCelda(zoom);
  // Dentro y fuera del límite se agrupan por separado: una esfera que
  // mezcla locales internos con locales vecinos confundiría su ubicación.
  const celdas = new Map<string, MesaDistrito[]>();
  for (const mesa of mesas) {
    const [lng, lat] = mesa.position;
    const marca = fueraLimite.has(mesa.id) ? "F" : "D";
    const clave = `${marca}:${Math.round(lng / tamaño)}:${Math.round(lat / tamaño)}`;
    const grupo = celdas.get(clave);
    if (grupo) grupo.push(mesa);
    else celdas.set(clave, [mesa]);
  }
  const clusters: ClusterMesas[] = [];
  for (const [clave, grupo] of celdas) {
    let verde = 0;
    let naranja = 0;
    for (const mesa of grupo) {
      const tono = tonoMesa(mesa);
      if (tono === "ganada") verde += 1;
      else if (tono === "disputada") naranja += 1;
    }
    const lng = grupo.reduce((s, m) => s + m.position[0], 0) / grupo.length;
    const lat = grupo.reduce((s, m) => s + m.position[1], 0) / grupo.length;
    clusters.push({
      position: [lng, lat],
      total: grupo.length,
      verde,
      naranja,
      rojo: grupo.length - verde - naranja,
      fuera: clave.startsWith("F"),
    });
  }
  return clusters;
}

interface Props {
  capas: CapasEstado;
  vuelo: Vuelo | null;
  /** Mesa seleccionada (se resalta y se enfoca). */
  mesaId: string | null;
  onSelectMesa: (id: string) => void;
  /** Vuelve a la vista general del distrito. */
  onVolverVista: () => void;
  /** Modo campaña: resalta el top 10 por pozo y atenúa el resto. */
  prioridad: boolean;
  /** Distrito activo del combo. */
  distritoId: string;
  onSelectDistrito: (id: string) => void;
  /** Cerro Colorado conserva asociaciones, mesas y rutas. */
  esCerro: boolean;
  /** Cambia cuando se pide reencuadrar el distrito activo. */
  encuadreNonce: number;
  /** Vuelve a Cerro Colorado desde la tarjeta de contexto. */
  onVerCerro: () => void;
  /** Abre la ficha del distrito en móvil. */
  onAbrirPanel: () => void;
  /** Paradas de la ruta de campaña, en orden (lng, lat). */
  rutaCampana?: [number, number][];
  /** Enciende la animación de la ruta de campaña. */
  rutaActiva?: boolean;
  /** Dibuja la ruta aunque la animación esté apagada (p. ej. con el plan abierto). */
  rutaVisible?: boolean;
  /** Muestra u oculta la ruta de campaña desde el propio mapa. */
  onToggleRuta?: () => void;
  /** Modo mapa completo: oculta las tarjetas y la leyenda del visor. */
  compacto?: boolean;
  onToggleCompacto?: () => void;
  /** Enciende y apaga una capa del visor desde el propio mapa. */
  onToggleCapa?: (id: CapaId) => void;
}

interface HoverInfo {
  x: number;
  y: number;
  titulo: string;
  lineas: string[];
  acento: string;
  /** Código del acta ONPE, si el elemento la tiene. */
  acta?: string;
}

type EtiquetaDistrito = DistritoPropiedades & {
  position: [number, number];
};

/** Filtro del visor: todas, solo las disputadas, las ganadas o las perdidas. */
type FiltroMesas = "todas" | "disputadas" | "ganadas" | "perdidas";

/** Tramo animable de la ruta de campaña: paradas y tiempos acumulados. */
interface TramoRuta {
  path: [number, number][];
  tiempos: number[];
}

/* Las tres capas que se conmutan desde el propio visor. Antes vivían en el
   panel lateral del distrito, donde se perdían entre las cifras; aquí están a
   un clic del mapa y el satélite es la primera de la lista. */
const CAPAS_VISOR: {
  id: CapaId;
  label: string;
  detalle: string;
  color: string;
  icono: typeof Layers;
}[] = [
  {
    id: "satelite",
    label: "Vista satelital",
    detalle: "Esri World Imagery",
    color: "#0891b2",
    icono: Satellite,
  },
  {
    id: "distritos",
    label: "Distritos priorizados",
    detalle: "15 distritos · altura por pozo",
    color: "#0e7490",
    icono: Hexagon,
  },
  {
    id: "mesas",
    label: "Mesas de votación",
    detalle: "Actas ONPE del distrito activo",
    color: "#16a34a",
    icono: MapPin,
  },
];

export default function ElectoralMap({
  capas,
  vuelo,
  mesaId,
  onSelectMesa,
  onVolverVista,
  prioridad,
  distritoId,
  onSelectDistrito,
  esCerro,
  encuadreNonce,
  onVerCerro,
  onAbrirPanel,
  rutaCampana,
  rutaActiva = false,
  rutaVisible = false,
  onToggleRuta,
  compacto = false,
  onToggleCompacto,
  onToggleCapa,
}: Props) {
  const distritoActivo =
    DISTRITOS_PRIORIDAD_POR_ID.get(distritoId) ?? DISTRITOS_PRIORIDAD[0];
  const mesas = MESAS_POR_DISTRITO.get(distritoId) ?? MESAS_VACIAS;
  const fueraLimite = FUERA_LIMITE_POR_DISTRITO.get(distritoId) ?? SIN_FUERA;
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [cargado, setCargado] = useState(false);
  const [estiloListo, setEstiloListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [tiempo, setTiempo] = useState(0);
  const [zoom, setZoom] = useState(13.55);
  const [rumbo, setRumbo] = useState(6);
  const [tamanoMapa, setTamanoMapa] = useState(0);
  const [modo2d, setModo2d] = useState(false);
  const [filtroMesas, setFiltroMesas] = useState<FiltroMesas>("todas");
  // En móvil la leyenda arranca plegada: el mapa gana media pantalla.
  const [leyendaAbierta, setLeyendaAbierta] = useState(false);
  // Panel de capas: vive sobre el mapa, no en el panel del distrito.
  const [capasAbiertas, setCapasAbiertas] = useState(false);
  const capasRef = useRef<HTMLDivElement>(null);
  // El evento "load" del estilo puede llegar tarde: no debe devolver la
  // cámara a Cerro si ya hay otro distrito seleccionado.
  const distritoVivoRef = useRef(distritoId);
  distritoVivoRef.current = distritoId;

  /* El panel de capas se cierra al tocar fuera o con Escape. `pointerdown` en
     captura cierra antes de que el mapa procese el clic, y el contenedor
     incluye el botón que lo abre: si no, pulsarlo lo cerraría y reabriría. */
  useEffect(() => {
    if (!capasAbiertas) return;
    const fuera = (evento: PointerEvent) => {
      if (!capasRef.current?.contains(evento.target as Node)) {
        setCapasAbiertas(false);
      }
    };
    const esc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setCapasAbiertas(false);
    };
    document.addEventListener("pointerdown", fuera, true);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fuera, true);
      document.removeEventListener("keydown", esc);
    };
  }, [capasAbiertas]);

  /* Conteo por tono: una mesa en disputa no suma ni a ganadas ni a perdidas.
     Las tres cifras suman el total y coinciden con los colores del mapa. */
  const conteoTonos = useMemo(() => contarTonos(mesas), [mesas]);
  const ganadas = conteoTonos.ganada;
  const perdidas = conteoTonos.perdida;
  const disputadas = conteoTonos.disputada;

  const opcionesFiltro = useMemo(
    () => [
      {
        id: "todas" as const,
        etiqueta: "Todas",
        titulo: "Mostrar todas las mesas",
        total: mesas.length,
      },
      {
        id: "disputadas" as const,
        etiqueta: "Disputa",
        titulo: `Mostrar las mesas con menos de ${UMBRAL_DISPUTA_PP} pp entre 1.º y 2.º`,
        total: disputadas,
      },
      {
        id: "ganadas" as const,
        etiqueta: "Ganadas",
        titulo: "Mostrar solo las mesas donde gana Zegarra con margen",
        total: ganadas,
      },
      {
        id: "perdidas" as const,
        etiqueta: "Perdidas",
        titulo: "Mostrar solo las mesas donde gana un contrincante con margen",
        total: perdidas,
      },
    ],
    [mesas.length, disputadas, ganadas, perdidas],
  );

  const mesasVisibles = useMemo(() => {
    if (filtroMesas === "todas") return mesas;
    const buscado: TonoMesa =
      filtroMesas === "ganadas"
        ? "ganada"
        : filtroMesas === "perdidas"
          ? "perdida"
          : "disputada";
    return mesas.filter((m) => tonoMesa(m) === buscado);
  }, [filtroMesas, mesas]);

  /* ------------------------------------------------------------ clustering */

  const agrupando = zoom < ZOOM_INDIVIDUAL;
  // En zoom muy alejado los polígonos se amontonan: se muestran solo puntos.
  const mesasAgrupadas = capas.mesas && agrupando;
  const clusters = useMemo(
    // Distritos grandes (Mollendo, Majes, La Joya) se encuadran por debajo de
    // z10: si se corta ahí, el mapa queda sin mesas. El grupo se dibuja desde
    // z9 y el contorno sigue visible debajo.
    () =>
      agrupando && zoom >= 9
        ? agruparMesas(zoom, mesasVisibles, fueraLimite)
        : null,
    [agrupando, zoom, mesasVisibles, fueraLimite],
  );

  const volarACluster = useCallback(
    (cluster: ClusterMesas) => {
      mapRef.current?.flyTo({
        center: cluster.position,
        zoom: Math.min(ZOOM_INDIVIDUAL + 0.5, zoom + 2.4),
        duration: 1200,
        essential: true,
      });
    },
    [zoom],
  );

  /* ---------------------------------------------------------------- init */

  useEffect(() => {
    if (!mapaRef.current || mapRef.current) return;

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: mapaRef.current,
        style: ESTILO,
        center: [-71.567, -16.357],
        zoom: 13.55,
        pitch: 62,
        bearing: 6,
        minZoom: 8,
        maxZoom: 17,
        maxPitch: 78,
        attributionControl: { compact: true },
        canvasContextAttributes: { antialias: true },
      });
    } catch {
      setError(
        "No se pudo iniciar WebGL en este dispositivo. Los paneles de resultados siguen operativos.",
      );
      return;
    }

    mapRef.current = map;
    // Diagnóstico en consola del navegador: window.__mapElectoral
    (window as unknown as { __mapElectoral?: MapLibreMap }).__mapElectoral = map;

    const overlay = new MapboxOverlay({
      interleaved: false,
      layers: [],
      getCursor: ({ isHovering }) => (isHovering ? "pointer" : "grab"),
    });
    overlayRef.current = overlay;
    map.addControl(overlay);

    const sincronizarTamano = () => {
      map.resize();
      map.fire("resize");
    };
    requestAnimationFrame(sincronizarTamano);
    window.setTimeout(sincronizarTamano, 250);
    window.setTimeout(sincronizarTamano, 1200);

    map.on("zoom", () => setZoom(map.getZoom()));
    map.on("rotate", () => setRumbo(map.getBearing()));

    const respaldoCarga = window.setTimeout(() => setCargado(true), 2600);

    map.on("style.load", () => setEstiloListo(true));

    map.on("load", () => {
      window.clearTimeout(respaldoCarga);
      setCargado(true);
      setEstiloListo(true);
      const activo = DISTRITOS_PRIORIDAD_POR_ID.get(
        distritoVivoRef.current,
      );
      if (activo && !activo.esCerro) return;
      map.jumpTo({ pitch: 6 });
      map.easeTo({
        pitch: 62,
        bearing: 6,
        center: [-71.567, -16.357],
        zoom: 13.55,
        duration: 2400,
        essential: true,
      });
    });

    return () => {
      window.clearTimeout(respaldoCarga);
      try {
        overlay.finalize();
      } catch {
        /* noop */
      }
      overlayRef.current = null;
      mapRef.current = null;
      map.remove();
      setCargado(false);
      setEstiloListo(false);
    };
  }, []);

  /* ---------------------------------------------------- tamaño del lienzo */

  useEffect(() => {
    const map = mapRef.current;
    const contenedor = mapaRef.current;
    if (!map || !contenedor) return;
    const observador = new ResizeObserver(() => {
      map.resize();
      map.fire("resize");
      const nuevo = contenedor.clientWidth * 10000 + contenedor.clientHeight;
      setTamanoMapa((previo) => (previo === nuevo ? previo : nuevo));
    });
    observador.observe(contenedor);
    return () => observador.disconnect();
  }, []);

  /* ------------------------------ mapa claro ↔ satélite + nombres de calle */

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const aplicar = () => {
      try {
        const sat = capas.satelite;
        const vis = (id: string, visible: boolean) => {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
          }
        };
        vis("satelite", sat);
        [
          "agua",
          "zona-verde",
          "edificio",
          "via-casing",
          "via",
          "nombres-lugares",
        ].forEach((id) => vis(id, !sat));
        vis("nombres-calles", !sat);
        if (map.getLayer("nombres-calles")) {
          map.setLayoutProperty("nombres-calles", "text-size", modo2d ? 12.5 : 11);
        }
      } catch (razon) {
        console.warn("ElectoralMap: visibilidad pendiente", razon);
      }
    };
    // Aplicar directamente: `setLayoutProperty` funciona aunque el estilo
    // aún esté cargando (isStyleLoaded puede quedar false por glifos
    // pendientes); `styledata` cubre recargas posteriores del estilo.
    aplicar();
    map.once("styledata", aplicar);
    return () => {
      map.off("styledata", aplicar);
    };
  }, [capas.satelite, modo2d, estiloListo]);

  /* ------------------------------------------------------- modo 2D ↔ 3D */

  const estado3d = useRef({ pitch: 62, bearing: 6, zoom: 13.55 });

  const alternar2d = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    setModo2d((prev) => {
      const hacia2d = !prev;
      if (!hacia2d) {
        const { pitch, bearing, zoom: z } = estado3d.current;
        map.easeTo({ pitch, bearing, zoom: z, duration: 1400, essential: true });
      } else {
        estado3d.current = {
          pitch: map.getPitch(),
          bearing: map.getBearing(),
          zoom: map.getZoom(),
        };
        map.easeTo({
          pitch: 0,
          bearing: 0,
          zoom: Math.min(16.4, map.getZoom() + 0.9),
          duration: 1400,
          essential: true,
        });
      }
      return hacia2d;
    });
  }, []);

  /* ------------------------------------------------- atribución compacta */

  useEffect(() => {
    if (!cargado) return;
    const timer = window.setTimeout(() => {
      mapaRef.current
        ?.querySelector(".maplibregl-ctrl-attrib")
        ?.classList.remove("maplibregl-compact-show");
    }, 600);
    return () => window.clearTimeout(timer);
  }, [cargado]);

  /* --------------------------------------------------------------- vuelo */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !vuelo) return;
    setHover(null);
    map.flyTo({
      center: vuelo.center,
      zoom: vuelo.zoom,
      pitch: vuelo.pitch,
      bearing: vuelo.bearing,
      duration: 2200,
      curve: 1.6,
      essential: true,
    });
  }, [vuelo]);

  /* ---------------------- encuadre del distrito real según el viewport */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cargado || esCerro) return;

    const ancho = map.getContainer().clientWidth;
    const escritorio = ancho >= 1024;
    // El margen deja libre la tarjeta de contexto (arriba a la izquierda),
    // el panel lateral y la barra inferior. Con pitch el borde cercano se
    // agranda y `cameraForBounds` no siempre lo compensa.
    const padding =
      ancho >= 1280
        ? { top: 108, bottom: 104, left: 372, right: 396 }
        : escritorio
          ? { top: 106, bottom: 102, left: 344, right: 386 }
          : { top: 262, bottom: 96, left: 26, right: 26 };
    const [oeste, sur, este, norte] = distritoActivo.bbox;

    const camara = map.cameraForBounds(
      [
        [oeste, sur],
        [este, norte],
      ],
      { padding, maxZoom: 14.4, pitch: 48, bearing: 0 },
    );
    if (!camara) return;

    map.flyTo({
      center: camara.center,
      zoom: camara.zoom,
      pitch: 48,
      bearing: 0,
      duration: 1700,
      curve: 1.35,
      essential: true,
    });
  }, [
    distritoActivo,
    distritoId,
    encuadreNonce,
    esCerro,
    cargado,
    tamanoMapa,
  ]);

  /* ----------------------------------------------------- animación trips */

  const animando =
    capas.redes ||
    capas.empleo ||
    !!mesaId ||
    (rutaVisible && rutaActiva) ||
    (capas.mesas && !agrupando && conteoTonos.perdida > 0);

  useEffect(() => {
    if (!animando) return;
    let frame = 0;
    let ultimo = 0;
    const loop = (ahora: number) => {
      if (ahora - ultimo > 42) {
        setTiempo(ahora / 1000);
        ultimo = ahora;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [animando]);

  /* --------------------------------------------------------------- capas */

  // En 2D las secciones se aplanan: la información es la ubicación, no el relieve.
  const factorAltura = modo2d ? 0 : zoom >= 13 ? 0.4 : zoom >= 12 ? 0.72 : 1;
  // Al acercarse a un distrito, los vecinos pasan a contexto: solo el activo
  // conserva color y altura. En la vista regional vuelve la lectura top 10.
  const enfoqueDistrital = !esCerro && zoom >= 10.4;

  const capaDistritos = useMemo(() => {
    if (!capas.distritos) return null;
    return new GeoJsonLayer<DistritoPropiedades>({
      id: "distritos-prioridad",
      data: FEATURES_DISTRITOS,
      extruded: !modo2d,
      filled: true,
      stroked: true,
      pickable: true,
      // El polígono del distrito se ve siempre: es el único relleno territorial
      // que queda en el mapa.
      visible: true,
      material: {
        ambient: 0.7,
        diffuse: 0.5,
        shininess: 24,
        specularColor: [250, 250, 250],
      },
      transitions: { getFillColor: 600, getElevation: 600 },
      // Altura = pozo de otras candidaturas: dónde hay voto movible, no
      // simplemente dónde hay más electores.
      getElevation: (f) => {
        if (f.properties.id === distritoId) {
          return Math.max(
            42,
            (f.properties.pozo / MAX_POZO_DISTRITAL) * 300 * factorAltura,
          );
        }
        if (enfoqueDistrital) return 8;
        return Math.max(
          28,
          (f.properties.pozo / MAX_POZO_DISTRITAL) * 280 * factorAltura,
        );
      },
      getFillColor: (f) => {
        if (f.properties.id === distritoId) {
          // Carmesí translúcido: al acercarse baja a un velo para no tapar las
          // calles; de lejos marca el distrito sin más.
          const cerca = zoom >= 12.5;
          return [230, 25, 25, modo2d ? (cerca ? 46 : 92) : cerca ? 34 : 72];
        }
        if (enfoqueDistrital) {
          return [138, 119, 104, modo2d ? 18 : 14];
        }
        if (prioridad && TOP_DISTRITOS_IDS.has(f.properties.id)) {
          // Oro = top 10 por pozo (zona de importancia).
          return [242, 193, 78, modo2d ? 118 : 96];
        }
        return [138, 119, 104, modo2d ? 46 : 36];
      },
      getLineColor: (f) => {
        if (f.properties.id === distritoId) return [230, 25, 25, 255];
        if (enfoqueDistrital) return [168, 148, 128, 90];
        if (prioridad && TOP_DISTRITOS_IDS.has(f.properties.id)) {
          return [201, 154, 46, 235];
        }
        return [168, 148, 128, 130];
      },
      getLineWidth: (f) => (f.properties.id === distritoId ? 3.8 : 1.5),
      lineWidthMinPixels: 1.2,
      lineWidthMaxPixels: 5,
      updateTriggers: {
        getElevation: [factorAltura, modo2d, enfoqueDistrital, distritoId],
        getFillColor: [modo2d, prioridad, distritoId, enfoqueDistrital, zoom >= 12.5],
        getLineColor: [prioridad, distritoId, enfoqueDistrital],
        getLineWidth: [distritoId],
      },
      onClick: (info) => {
        const f = info.object as DistritoFeaturePrioridad | undefined;
        if (f?.properties?.id) {
          setHover(null);
          onSelectDistrito(f.properties.id);
        }
      },
      // Sin tarjeta al pasar el ratón: el polígono ocupa casi todo el visor y
      // la tarjeta aparecía encima de las mesas mientras se trabajaba. El
      // distrito se abre con un clic.
    });
  }, [
    capas.distritos,
    modo2d,
    factorAltura,
    esCerro,
    zoom,
    prioridad,
    distritoId,
    onSelectDistrito,
    enfoqueDistrital,
  ]);

  const capaEtiquetasDistritos = useMemo(() => {
    if (!capas.distritos || (esCerro && zoom >= 11.8)) return null;
    // Una sola etiqueta: la del distrito activo. El resto se lee en el combo,
    // el ranking del panel o el tooltip; así no se enciman los nombres del
    // racimo urbano de Arequipa.
    const datos = DISTRITOS_PRIORIDAD.filter(
      (d) => d.id === distritoId,
    ).map((d) => ({
      ...d,
      // En distritos grandes el centro coincide con el racimo de mesas y la
      // píldora tapa el conteo. Se sube al tercio superior del polígono.
      position: [
        d.centro[0],
        d.bbox[3] - (d.bbox[3] - d.bbox[1]) * 0.12,
      ] as [number, number],
    }));
    return new TextLayer<EtiquetaDistrito>({
      id: "etiquetas-distritos",
      data: datos,
      getPosition: (d) => [d.position[0], d.position[1]],
      getText: (d) => `${d.puesto} · ${d.nombre}`,
      getSize: (d) => (d.id === distritoId ? 13 : 10.5),
      getColor: (d) =>
        d.id === distritoId
          ? [255, 247, 240]
          : TOP_DISTRITOS_IDS.has(d.id)
            ? [67, 45, 12]
            : [92, 77, 67],
      getAngle: 0,
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontWeight: 700,
      billboard: true,
      sizeUnits: "pixels",
      background: true,
      getBackgroundColor: (d) =>
        d.id === distritoId
          ? [230, 25, 25, 246]
          : TOP_DISTRITOS_IDS.has(d.id)
            ? [242, 193, 78, 246]
            : [255, 255, 255, 235],
      backgroundPadding: [5, 3],
      getBorderColor: (d) =>
        d.id === distritoId
          ? ([122, 12, 12, 255] as [number, number, number, number])
          : TOP_DISTRITOS_IDS.has(d.id)
            ? ([201, 154, 46, 255] as [number, number, number, number])
            : ([168, 148, 128, 255] as [number, number, number, number]),
      characterSet: "auto",
      pickable: false,
      parameters: { depthCompare: "always", depthWriteEnabled: false },
      updateTriggers: {
        getSize: [distritoId],
        getColor: [distritoId],
        getBorderColor: [distritoId],
      },
    });
  }, [capas.distritos, esCerro, zoom, distritoId]);

  const capaContorno = useMemo(() => {
    if (!CERRO || !esCerro) return null;
    return new GeoJsonLayer({
      id: "contorno-cerro-colorado",
      data: { type: "FeatureCollection", features: [CERRO] },
      filled: false,
      stroked: true,
      extruded: false,
      pickable: false,
      visible: true,
      getLineColor: [230, 25, 25, 220],
      getLineWidth: 3.4,
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 6,
    });
  }, [esCerro]);

  const capaMesas = useMemo(() => {
    if (!capas.mesas || mesas.length === 0) return null;
    return new ScatterplotLayer<MesaDistrito>({
      id: "mesas-electorales",
      data: mesasVisibles,
      getPosition: (m) => m.position,
      radiusUnits: "pixels",
      // Verde = gana Zegarra con margen; rojo = gana un contrincante con
      // margen; ámbar = 1.º y 2.º a menos de UMBRAL_DISPUTA_PP puntos.
      getRadius: (m) => (m.id === mesaId ? 11 : 7),
      getFillColor: (m) => {
        const base = COLOR_TONO[tonoMesa(m)];
        if (m.id === mesaId) return [base[0], base[1], base[2], 255];
        // Local fuera del límite distrital: punto hueco (solo borde).
        if (fueraLimite.has(m.id)) {
          return [base[0], base[1], base[2], 42];
        }
        return [base[0], base[1], base[2], 242];
      },
      stroked: true,
      getLineColor: (m) => {
        const base = COLOR_TONO[tonoMesa(m)];
        if (m.id === mesaId) return [255, 255, 255, 255];
        if (fueraLimite.has(m.id)) {
          return [base[0], base[1], base[2], 255];
        }
        return [255, 255, 255, 210];
      },
      getLineWidth: (m) => (m.id === mesaId ? 2.6 : fueraLimite.has(m.id) ? 1.8 : 1),
      lineWidthUnits: "pixels",
      pickable: true,
      opacity: 0.98,
      visible: !agrupando,
      // Las mesas deben leerse sobre las extrusiones, no quedar tapadas.
      parameters: { depthCompare: "always", depthWriteEnabled: false },
      updateTriggers: {
        getRadius: [mesaId],
        getFillColor: [mesaId],
        getLineColor: [mesaId],
        getLineWidth: [mesaId],
        visible: [agrupando],
      },
      onClick: (info) => {
        const m = info.object as MesaDistrito | undefined;
        if (m?.id) {
          setHover(null);
          onSelectMesa(m.id);
        }
      },
      onHover: (info) => {
        const m = info.object as MesaDistrito | undefined;
        if (!m || !info.x || !info.y) {
          setHover(null);
          return;
        }
        const ganador =
          CANDIDATOS.find((c) => c.id === m.ganadorId) ?? CANDIDATOS[0];
        const segundo =
          CANDIDATOS.find((c) => c.id === m.segundoId) ?? CANDIDATOS[1];
        const gana = m.gana === "ZEGARRA";
        const idxGan = CANDIDATOS.indexOf(ganador);
        const idxSeg = CANDIDATOS.indexOf(segundo);
        const tono = tonoMesa(m);
        const diferencia = margenPrimeroSegundo(m);
        setHover({
          x: info.x,
          y: info.y,
          titulo: `Mesa ${m.actaCodigo} · ${m.zonaNombre}`,
          lineas: [
            gana
              ? `Gana Zegarra con ${fmtInt(m.zegarra)} votos · 2.º ${segundo.corto} ${fmtInt(m.votos[idxSeg] ?? 0)}`
              : `Gana ${ganador.corto} con ${fmtInt(m.votos[idxGan] ?? 0)} · Zegarra ${m.puestoZegarra}.º con ${fmtInt(m.zegarra)}`,
            `1.º − 2.º: ${fmtDec(diferencia)} pp · ${
              tono === "disputada"
                ? `en disputa (menos de ${UMBRAL_DISPUTA_PP} pp)`
                : tono === "ganada"
                  ? "ventaja de Zegarra"
                  : "ventaja del contrincante"
            }`,
            m.localNombre ?? "Sin local georreferenciado",
            fueraLimite.has(m.id)
              ? "Local fuera del límite distrital · atiende a votantes de CC"
              : `${fmtInt(m.validos)} válidos · ${m.referencia}`,
            "Clic para ver la ficha de la mesa",
          ],
          acta: m.actaCodigo,
          acento: HEX_TONO[tono],
        });
      },
    });
  }, [
    capas.mesas,
    mesaId,
    agrupando,
    onSelectMesa,
    mesasVisibles,
    mesas.length,
    fueraLimite,
  ]);

  /* Latido de las mesas perdidas: un anillo rojo se abre desde cada punto y se
     apaga. La fase va escalonada por índice para que se lea como una ola y no
     como un parpadeo sincronizado. Solo con las mesas sueltas (sin clusters):
     a zoom de grupo los anillos se encimarían bajo los círculos de conteo. */
  const capaPerdidas = useMemo(() => {
    if (!capas.mesas || agrupando) return null;
    const rojas = mesasVisibles.filter((m) => tonoMesa(m) === "perdida");
    if (rojas.length === 0) return null;
    const datos = rojas.map((m, i) => ({
      position: m.position,
      fase: (i * 0.137) % 1,
    }));
    const ciclo = (fase: number) => (tiempo * 0.55 + fase) % 1;
    return new ScatterplotLayer<(typeof datos)[number]>({
      id: "mesas-perdidas-latido",
      data: datos,
      getPosition: (d) => d.position,
      radiusUnits: "pixels",
      getRadius: (d) => 6 + 20 * ciclo(d.fase),
      // Anillo, no disco: sobre el mapa claro un relleno translúcido se pierde,
      // el borde nítido se lee como una onda que sale del punto.
      stroked: true,
      filled: false,
      getLineColor: (d) =>
        [239, 68, 68, Math.round(235 * (1 - ciclo(d.fase)))] as [
          number,
          number,
          number,
          number,
        ],
      lineWidthUnits: "pixels",
      getLineWidth: 2.4,
      pickable: false,
      parameters: { depthCompare: "always", depthWriteEnabled: false },
      updateTriggers: { getRadius: [tiempo], getLineColor: [tiempo] },
    });
  }, [capas.mesas, agrupando, mesasVisibles, tiempo]);

  /** Anillo de pulso animado sobre la mesa seleccionada. */
  const capaPulso = useMemo(() => {    if (!mesaId) return null;
    const mesa = mesas.find((m) => m.id === mesaId);
    if (!mesa) return null;
    const base = COLOR_TONO[tonoMesa(mesa)];
    const onda = (Math.sin(tiempo * 2.6) + 1) / 2; // 0..1
    return new ScatterplotLayer({
      id: "mesa-pulso",
      data: [{ position: mesa.position }],
      getPosition: (d) => d.position,
      radiusUnits: "pixels",
      getRadius: 12 + onda * 16,
      getFillColor: [...base, Math.round(150 * (1 - onda))] as [
        number,
        number,
        number,
        number,
      ],
      stroked: false,
      pickable: false,
      parameters: { depthCompare: "always", depthWriteEnabled: false },
    });
  }, [mesaId, tiempo, mesas]);

  /** Píldora con el código del acta ONPE sobre la mesa seleccionada. */
  const capaMesaActa = useMemo(() => {
    if (!mesaId) return null;
    const mesa = mesas.find((m) => m.id === mesaId);
    if (!mesa?.actaCodigo) return null;
    const pxPorGrado = (512 * Math.pow(2, zoom)) / 360;
    const dLat = 24 / pxPorGrado;
    return new TextLayer({
      id: "mesa-acta-onpe",
      data: [
        {
          position: [mesa.position[0], mesa.position[1] + dLat] as [number, number],
          texto: `Acta ONPE ${mesa.actaCodigo}`,
        },
      ],
      getPosition: (d) => d.position,
      getText: (d) => d.texto,
      getSize: 9.5,
      getColor: [15, 23, 42],
      getAngle: 0,
      fontWeight: 800,
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      billboard: true,
      sizeUnits: "pixels",
      background: true,
      getBackgroundColor: [255, 255, 255, 248],
      backgroundPadding: [5, 2],
      getBorderColor: [8, 145, 178, 255],
      getBorderWidth: 1.5,
      characterSet: "auto",
      pickable: false,
      parameters: { depthCompare: "always", depthWriteEnabled: false },
    });
  }, [mesaId, zoom, mesas]);

  /** Clusters de mesas con conteo (estilo de reportes) al alejar el mapa. */
  const capaClusters = useMemo(() => {
    if (!capas.mesas || !clusters) return null;
    // Desplazamiento angular para las píldoras verde/rojo: px → grados.
    // Quedan DENTRO del círculo, pegadas al borde superior/inferior, para no
    // invadir los grupos vecinos.
    const pxPorGrado = (512 * Math.pow(2, zoom)) / 360;
    const dLat = (cluster: ClusterMesas, signo: number) =>
      (Math.max(11, radioCluster(cluster) - 8) * signo) / pxPorGrado;
    const verdes = clusters
      .filter((c) => c.verde > 0)
      .map((c) => ({ ...c, position: [c.position[0], c.position[1] + dLat(c, 1)] as [number, number], etiqueta: `✓ ${c.verde}` }));
    const rojas = clusters
      .filter((c) => c.rojo > 0)
      .map((c) => ({ ...c, position: [c.position[0], c.position[1] + dLat(c, -1)] as [number, number], etiqueta: `✗ ${c.rojo}` }));
    // La cuña se dibuja en grados a partir del radio EN PÍXELES actual, así
    // coincide exactamente con los círculos (radiusUnits: "pixels") en cada
    // nivel de zoom; los clusters se recalculan con cada cambio de zoom.
    return [
      new ScatterplotLayer<ClusterMesas>({
        id: "clusters-halo",
        data: clusters,
        getPosition: (c) => c.position,
        radiusUnits: "pixels",
        getRadius: (c) => radioCluster(c) + 7,
        getFillColor: (c) => {
          const base = tonoMayor(c);
          // Grupos con local fuera del límite: halo más tenue.
          return [base[0], base[1], base[2], c.fuera ? 32 : 60] as [
            number,
            number,
            number,
            number,
          ];
        },
        stroked: false,
        pickable: false,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
      new ScatterplotLayer<ClusterMesas>({
        id: "clusters-mesas",
        data: clusters,
        getPosition: (c) => c.position,
        radiusUnits: "pixels",
        getRadius: radioCluster,
        // Círculo exterior = el grupo completo. El ámbar es la base: encima se
        // dibujan el sector verde (ganadas) y el rojo (perdidas), de modo que
        // lo que queda en ámbar son las mesas en disputa del grupo.
        getFillColor: (c) => {
          return [NARANJA[0], NARANJA[1], NARANJA[2], c.fuera ? 118 : 232] as [
            number,
            number,
            number,
            number,
          ];
        },
        stroked: true,
        getLineColor: (c) =>
          [255, 255, 255, c.fuera ? 190 : 255] as [number, number, number, number],
        getLineWidth: 2,
        lineWidthUnits: "pixels",
        pickable: true,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
        onClick: (info) => {
          const c = info.object as ClusterMesas | undefined;
          if (c) {
            setHover(null);
            volarACluster(c);
          }
        },
        onHover: (info) => {
          const c = info.object as ClusterMesas | undefined;
          if (!c || !info.x || !info.y) {
            setHover(null);
            return;
          }
          setHover({
            x: info.x,
            y: info.y,
            titulo: `${fmtInt(c.total)} mesas en este grupo${c.fuera ? " · local fuera del límite" : ""}`,
            lineas: [
              `Gana Zegarra ${fmtInt(c.verde)} · en disputa ${fmtInt(c.naranja)} · contrincante ${fmtInt(c.rojo)}`,
              ...(c.fuera
                ? [
                    "Todas sus mesas votan en un local vecino a Cerro Colorado",
                    "Las actas siguen siendo del distrito",
                  ]
                : []),
              "Clic para acercar y ver las mesas",
            ],
            acento:
              c.naranja >= c.verde && c.naranja >= c.rojo
                ? "#f59e0b"
                : c.verde >= c.rojo
                  ? "#16a34a"
                  : "#dc2626",
          });
        },
      }),
      // Pastel de tres tonos sobre el círculo ámbar: verde desde las 12 en
      // punto, rojo a continuación, y el ámbar que sobra son las disputadas.
      new PolygonLayer<ClusterMesas>({
        id: "clusters-sector-verde",
        data: clusters.filter((c) => c.verde > 0),
        getPolygon: (c) =>
          sectorPolygon(c, radioCluster(c), zoom, 0, c.verde / c.total),
        filled: true,
        getFillColor: [34, 197, 94, 246],
        stroked: false,
        pickable: false,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
      new PolygonLayer<ClusterMesas>({
        id: "clusters-sector-rojo",
        data: clusters.filter((c) => c.rojo > 0),
        getPolygon: (c) =>
          sectorPolygon(
            c,
            radioCluster(c),
            zoom,
            c.verde / c.total,
            (c.verde + c.rojo) / c.total,
          ),
        filled: true,
        getFillColor: [239, 68, 68, 246],
        stroked: false,
        pickable: false,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
      // Chip central estilo "tarjeta de dato": total en blanco con borde
      // del color mayoritario, sobre el núcleo proporcional.
      new TextLayer<ClusterMesas>({
        id: "clusters-conteo",
        data: clusters,
        getPosition: (c) => c.position,
        getText: (c) => String(c.total),
        getSize: 10.5,
        getColor: [15, 23, 42],
        getAngle: 0,
        fontWeight: 800,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        billboard: true,
        sizeUnits: "pixels",
        background: true,
        getBackgroundColor: [255, 255, 255, 250],
        backgroundPadding: [4, 2],
        getBorderColor: (c) => {
          const base = tonoMayor(c);
          return [base[0], base[1], base[2], 255] as [
            number,
            number,
            number,
            number,
          ];
        },
        getBorderWidth: 1.6,
        characterSet: "auto",
        pickable: false,
        updateTriggers: { getBorderColor: [clusters] },
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
      // Píldora verde: cuántas mesas del grupo ganó Zegarra.
      new TextLayer<(typeof verdes)[number]>({
        id: "clusters-verde",
        data: verdes,
        getPosition: (d) => d.position,
        getText: (d) => d.etiqueta,
        getSize: 9,
        getColor: [255, 255, 255],
        getAngle: 0,
        fontWeight: 800,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        billboard: true,
        sizeUnits: "pixels",
        background: true,
        getBackgroundColor: [22, 163, 74, 250],
        backgroundPadding: [4, 1.5],
        getBorderColor: [255, 255, 255, 255],
        getBorderWidth: 1.2,
        characterSet: "auto✓✗0123456789",
        pickable: false,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
      // Píldora roja: cuántas mesas del grupo ganó un contrincante.
      new TextLayer<(typeof rojas)[number]>({
        id: "clusters-rojo",
        data: rojas,
        getPosition: (d) => d.position,
        getText: (d) => d.etiqueta,
        getSize: 9,
        getColor: [255, 255, 255],
        getAngle: 0,
        fontWeight: 800,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        billboard: true,
        sizeUnits: "pixels",
        background: true,
        getBackgroundColor: [220, 38, 38, 250],
        backgroundPadding: [4, 1.5],
        getBorderColor: [255, 255, 255, 255],
        getBorderWidth: 1.2,
        characterSet: "auto✓✗0123456789",
        pickable: false,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
    ];
  }, [capas.mesas, clusters, volarACluster, zoom]);

  /** Etiquetas de las secciones: pill blanco con borde por necesidad. */
  /** Etiquetas de secciones sin superposición (decluttering voraz).
   *  Se prioriza la sección seleccionada y las de mayor necesidad; se
   *  estima la caja en pantalla con Web Mercator a escala del zoom actual. */


  const capasRutas = useMemo(() => {
    const lista: (PathLayer<Tramo> | TripsLayer<Tramo>)[] = [];
    if (!esCerro) return lista;

    if (capas.redes) {
      lista.push(
        new PathLayer<Tramo>({
          id: "redes-agua",
          data: REDES_AGUA,
          getPath: (d) => d.waypoints,
          getColor: [56, 189, 248, 170],
          getWidth: 1.6,
          widthMinPixels: 1,
          widthUnits: "pixels",
        }),
        new TripsLayer<Tramo>({
          id: "trips-agua",
          data: REDES_AGUA,
          getPath: (d) => d.waypoints,
          getTimestamps: (d) => TIEMPOS_AGUA.get(d.id) ?? [0],
          getColor: [125, 211, 252],
          getWidth: 2.6,
          opacity: 0.95,
          widthMinPixels: 1.6,
          trailLength: 240,
          currentTime: tiempo,
          fadeTrail: true,
        }),
        new TripsLayer<Tramo>({
          id: "trips-pistas",
          data: CORREDORES_SEGUROS,
          getPath: (d) => d.waypoints,
          getTimestamps: (d) => TIEMPOS_PISTAS.get(d.id) ?? [0],
          getColor: [251, 191, 36],
          getWidth: 2.4,
          opacity: 0.9,
          widthMinPixels: 1.5,
          trailLength: 220,
          currentTime: tiempo,
          fadeTrail: true,
        }),
      );
    }

    if (capas.empleo) {
      lista.push(
        new TripsLayer<Tramo>({
          id: "trips-empleo",
          data: RUTAS_EMPLEO,
          getPath: (d) => d.waypoints,
          getTimestamps: (d) => TIEMPOS_EMPLEO.get(d.id) ?? [0],
          getColor: [52, 211, 153],
          getWidth: 2.4,
          opacity: 0.9,
          widthMinPixels: 1.5,
          trailLength: 240,
          currentTime: tiempo,
          fadeTrail: true,
        }),
      );
    }

    return lista;
  }, [capas.redes, capas.empleo, tiempo, esCerro]);

  /* ------------------------------------------------- ruta de campaña *
   * Polilínea de paradas + cometa animada que recorre el trayecto. La
   * animación es un TripsLayer con tiempo ciclado: sirve para grabar el
   * recorrido y usarlo como pieza de difusión, no solo para mirarlo.      */

  const capasRutaCampana = useMemo(() => {
    const paradas = rutaCampana ?? [];
    if (!rutaVisible || paradas.length < 2) return [];

    const DURACION = 26; // segundos por vuelta completa
    const acumulado: number[] = [0];
    for (let i = 1; i < paradas.length; i += 1) {
      const [x1, y1] = paradas[i - 1];
      const [x2, y2] = paradas[i];
      const dx = (x2 - x1) * 111.32 * Math.cos(((y1 + y2) / 2) * (Math.PI / 180));
      const dy = (y2 - y1) * 111.32;
      acumulado.push(acumulado[i - 1] + Math.hypot(dx, dy));
    }
    const total = acumulado[acumulado.length - 1] || 1;
    const tramo: TramoRuta = {
      path: paradas,
      tiempos: acumulado.map((d) => (d / total) * DURACION),
    };
    const numeros = paradas.map((p, i) => ({ p, i }));

    const lista: (
      | PathLayer<TramoRuta>
      | TripsLayer<TramoRuta>
      | ScatterplotLayer<{ p: [number, number]; i: number }>
      | TextLayer<{ p: [number, number]; i: number }>
    )[] = [
      // Halo ámbar ancho y translúcido: separa la ruta del mapa claro sin
      // taparlo. Debajo del contracanto para que no lave el borde oscuro.
      new PathLayer<TramoRuta>({
        id: "ruta-campana-halo",
        data: [tramo],
        getPath: (d) => d.path,
        getColor: [251, 191, 36, 70],
        getWidth: 22,
        widthUnits: "pixels",
        widthMinPixels: 16,
        capRounded: true,
        jointRounded: true,
        pickable: false,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
      // Contracanto oscuro: sobre el mapa claro el ámbar solo no se lee, y bajo
      // la extrusión del distrito la ruta quedaría enterrada si no se pide
      // explícitamente que gane siempre la prueba de profundidad.
      new PathLayer<TramoRuta>({
        id: "ruta-campana-casing",
        data: [tramo],
        getPath: (d) => d.path,
        getColor: [12, 18, 32, 215],
        getWidth: 10,
        widthUnits: "pixels",
        widthMinPixels: 8,
        capRounded: true,
        jointRounded: true,
        pickable: false,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
      new PathLayer<TramoRuta>({
        id: "ruta-campana-base",
        data: [tramo],
        getPath: (d) => d.path,
        getColor: [251, 191, 36, 255],
        getWidth: 5,
        widthUnits: "pixels",
        widthMinPixels: 4.2,
        capRounded: true,
        jointRounded: true,
        pickable: false,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
      new ScatterplotLayer<{ p: [number, number]; i: number }>({
        id: "ruta-campana-paradas",
        data: numeros,
        getPosition: (d) => d.p,
        radiusUnits: "pixels",
        getRadius: 12,
        getFillColor: [12, 18, 32, 248],
        getLineColor: [251, 191, 36, 255],
        stroked: true,
        filled: true,
        getLineWidth: 2.6,
        lineWidthUnits: "pixels",
        pickable: false,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
      new TextLayer<{ p: [number, number]; i: number }>({
        id: "ruta-campana-numeros",
        data: numeros,
        getPosition: (d) => d.p,
        getText: (d) => String(d.i + 1),
        getSize: 11,
        getColor: [251, 191, 36, 255],
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontWeight: 700,
        billboard: true,
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        pickable: false,
        parameters: { depthCompare: "always", depthWriteEnabled: false },
      }),
    ];

    if (rutaActiva) {
      lista.push(
        new TripsLayer<TramoRuta>({
          id: "ruta-campana-cometa",
          data: [tramo],
          getPath: (d) => d.path,
          getTimestamps: (d) => d.tiempos,
          getColor: [255, 214, 10],
          getWidth: 7,
          widthUnits: "pixels",
          widthMinPixels: 5,
          opacity: 0.95,
          trailLength: 9,
          currentTime: tiempo % DURACION,
          fadeTrail: true,
          capRounded: true,
          parameters: { depthCompare: "always", depthWriteEnabled: false },
        }),
      );
    }

    return lista;
  }, [rutaCampana, rutaActiva, rutaVisible, tiempo]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.setProps({
      layers: [
        capaDistritos,
        capaEtiquetasDistritos,
        capaContorno,
        ...(capaClusters ?? []),
        capaMesas,
        capaPerdidas,
        capaPulso,
        capaMesaActa,
        ...capasRutas,
        ...capasRutaCampana,
      ].filter(Boolean) as never[],
    });
  }, [
    capaDistritos,
    capaEtiquetasDistritos,
    capaContorno,
    capaClusters,
    capaPerdidas,
    capaMesas,
    capaPulso,
    capaMesaActa,
    capasRutas,
    capasRutaCampana,
  ]);

  /* ------------------------------------------------------------- controles */

  const acercar = () => mapRef.current?.zoomIn({ duration: 420 });
  const alejar = () => mapRef.current?.zoomOut({ duration: 420 });
  const reiniciarRumbo = () =>
    mapRef.current?.easeTo({
      bearing: modo2d ? 0 : 6,
      pitch: modo2d ? 0 : 62,
      duration: 700,
    });

  return (
    <div ref={contenedorRef} className="absolute inset-0">
      <div ref={mapaRef} className="h-full w-full" />
      <div className="map-vignette pointer-events-none absolute inset-0" />

      {error && (
        <div className="absolute inset-x-4 top-1/2 z-30 mx-auto max-w-sm rounded-xl border border-amber-400/40 bg-slate-950/92 p-4 text-center backdrop-blur">
          <p className="text-[11px] leading-relaxed text-amber-200">{error}</p>
        </div>
      )}

      {!cargado && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/85">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
            <Radar className="h-6 w-6 animate-spin text-cyan-600" />
          </div>
          <p className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500 shadow-sm ring-1 ring-slate-200">
            Cargando resultados ONPE
          </p>
        </div>
      )}

      {/* En modo mapa completo desaparecen las tarjetas y la leyenda: el visor
          se queda con el territorio, las mesas y la ruta. */}
      {!compacto && (
        <>
      {/* Contexto del distrito: cobertura de mesas y acceso a la ficha. Va en
          los 15 distritos, Cerro Colorado incluido. */}
      {cargado && (
        <TarjetaDistritoMapa
          distrito={distritoActivo}
          esCerro={esCerro}
          onVerCerro={onVerCerro}
          onAbrirPanel={onAbrirPanel}
        />
      )}

      {/* Chip flotante: volver a la vista general (aparece al adentrarse) */}
      {esCerro && (mesaId || zoom > 14.05) && (
        <button
          type="button"
          onClick={onVolverVista}
          className="absolute left-3 top-[15.5rem] z-20 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 lg:left-[22rem] lg:top-[5.6rem]"
        >
          <Compass className="h-3.5 w-3.5 text-cyan-600" />
          Vista general del distrito
        </button>
      )}

      {/* Leyenda de mesas: plegada en móvil, fija en escritorio */}
      {mesas.length > 0 && !leyendaAbierta && (
        <button
          type="button"
          onClick={() => setLeyendaAbierta(true)}
          aria-expanded={false}
          className="pointer-events-auto absolute bottom-[4.5rem] left-3 z-20 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur sm:hidden"
        >
          <List className="h-3.5 w-3.5 text-cyan-600" />
          Leyenda · {fmtInt(mesas.length)} mesas
        </button>
      )}
      <div
        className={`pointer-events-none absolute bottom-[4.5rem] left-3 z-20 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur max-sm:bottom-[4.5rem] max-sm:w-[13rem] ${
          mesas.length > 0 ? "" : "hidden"
        } ${leyendaAbierta ? "" : "max-sm:hidden"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {filtroMesas === "todas"
              ? "Mesas · actas ONPE"
              : `${fmtInt(mesasVisibles.length)} de ${fmtInt(mesas.length)} mesas · actas ONPE`}
          </p>
          <button
            type="button"
            onClick={() => setLeyendaAbierta(false)}
            aria-label="Cerrar leyenda"
            className="pointer-events-auto -mr-1 flex h-5 w-5 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:hidden"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <div
          role="group"
          aria-label="Filtrar mesas por resultado"
          className="pointer-events-auto mt-1.5 grid grid-cols-4 gap-0.5 rounded-lg bg-slate-100 p-0.5"
        >
          {opcionesFiltro.map((opcion) => {
            const activo = filtroMesas === opcion.id;
            const tono =
              opcion.id === "ganadas"
                ? "bg-emerald-600"
                : opcion.id === "perdidas"
                  ? "bg-red-600"
                  : opcion.id === "disputadas"
                    ? "bg-amber-500"
                    : "bg-slate-900";
            return (
              <button
                key={opcion.id}
                type="button"
                onClick={() => {
                  setFiltroMesas(opcion.id);
                  setHover(null);
                }}
                aria-pressed={activo}
                title={opcion.titulo}
                className={`rounded-md px-1 py-1 text-[8.5px] font-bold uppercase tracking-[0.08em] transition ${
                  activo
                    ? `${tono} text-white shadow-sm`
                    : "text-slate-500 hover:bg-white hover:text-slate-800"
                }`}
              >
                {opcion.etiqueta}
                <span
                  className={`tabular mt-0.5 block text-[9px] ${
                    activo ? "text-white/85" : "text-slate-400"
                  }`}
                >
                  {fmtInt(opcion.total)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-1.5 space-y-1">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
              style={{ background: "rgb(245,158,11)" }}
            />
            <span className="text-[9.5px] font-semibold text-slate-700">
              En disputa
            </span>
            <span
              className="tabular ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white"
              style={{ background: "rgb(217,119,6)" }}
            >
              {fmtInt(disputadas)}
            </span>
          </div>
          <p className="pl-4 text-[8px] font-medium leading-snug text-slate-400">
            Menos de {UMBRAL_DISPUTA_PP} pp entre 1.º y 2.º: victoria frágil o
            derrota remontable. Ahí se define la campaña.
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
              style={{ background: "rgb(34,197,94)" }}
            />
            <span className="text-[9.5px] font-semibold text-slate-700">
              Gana Zegarra
            </span>
            <span
              className="tabular ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white"
              style={{ background: "rgb(22,163,74)" }}
            >
              {fmtInt(ganadas)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
              style={{ background: "rgb(239,68,68)" }}
            />
            <span className="text-[9.5px] font-semibold text-slate-700">
              Gana contrincante
            </span>
            <span
              className="tabular ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white"
              style={{ background: "rgb(220,38,38)" }}
            >
              {fmtInt(perdidas)}
            </span>
          </div>
          {fueraLimite.size > 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                style={{
                  background: "rgba(239,68,68,0.25)",
                  boxShadow: "inset 0 0 0 2px rgb(239,68,68)",
                }}
              />
              <span className="text-[9.5px] font-semibold text-slate-700">
                Local fuera del límite
              </span>
              <span
                className="tabular ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white"
                style={{ background: "rgb(100,116,139)" }}
              >
                {fmtInt(fueraLimite.size)}
              </span>
            </div>
          )}
          {agrupando && (
            <p className="text-[8.5px] font-medium text-slate-400">
              En cada grupo: pastel verde ganadas · ámbar en disputa · rojo
              perdidas · ✓ y ✗ cuentan cada bloque · acércate para ver mesa por
              mesa
            </p>
          )}
        </div>
      </div>
        </>
      )}

      {/* Leyenda distrital: solo en la vista regional de Cerro. En los otros
          distritos la tarjeta de contexto ya resume el resultado. */}
      {esCerro && zoom < 11.5 && (
        <div className="pointer-events-none absolute bottom-4 left-3 z-20 hidden w-[13.75rem] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur sm:block">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">
              15 distritos · pozo
            </p>
            <span className="rounded bg-amber-500 px-1 py-px text-[7.5px] font-bold text-white">
              Top 10
            </span>
          </div>
          <div className="mt-1.5 rounded-md border border-cyan-300 bg-cyan-50 px-2 py-1.5">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-cyan-700">
              Distrito activo
            </p>
            <p className="mt-0.5 truncate text-[10.5px] font-bold text-slate-800">
              {distritoActivo.nombre}
            </p>
            <p className="tabular mt-0.5 text-[8.5px] font-semibold text-slate-600">
              {fmtInt(distritoActivo.pozo)} en disputa · {fmtDec(distritoActivo.zegarraPct)}% Zegarra
            </p>
          </div>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-amber-500" />
              <span className="text-[9px] font-semibold text-slate-700">
                Top 10 por pozo
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-cyan-400" />
              <span className="text-[9px] font-semibold text-slate-700">
                Distrito seleccionado
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-slate-400" />
              <span className="text-[9px] font-semibold text-slate-700">
                Resto de los 15
              </span>
            </div>
          </div>
          <p className="mt-1.5 border-t border-slate-200 pt-1 text-[8px] leading-snug text-slate-500">
            Altura = pozo de otras candidaturas. Clic en un polígono para
            cambiar de distrito.
          </p>
        </div>
      )}

      {/* Controles de cámara: chips blancos */}
      <div className="pointer-events-auto absolute bottom-4 right-3 z-20 flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-lg shadow-slate-900/10 backdrop-blur max-lg:bottom-[6.75rem] lg:right-[25rem] xl:right-[26.5rem]">
        {/* Capas del visor: satélite, distritos y mesas se conmutan aquí, a un
            clic del mapa. El panel se abre hacia la izquierda porque el
            control está pegado al borde derecho. */}
        <div ref={capasRef} className="relative">
          <button
            type="button"
            onClick={() => setCapasAbiertas((v) => !v)}
            aria-expanded={capasAbiertas}
            aria-haspopup="true"
            aria-label="Capas del visor"
            title="Capas del visor · satélite, distritos y mesas"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              capas.satelite
                ? "bg-cyan-700 text-white shadow"
                : capasAbiertas
                  ? "bg-slate-800 text-amber-300 shadow"
                  : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {capas.satelite ? (
              <Satellite className="h-4 w-4" />
            ) : (
              <Layers className="h-4 w-4" />
            )}
          </button>

          {capasAbiertas && (
            <div
              role="group"
              aria-label="Capas del visor"
              className="absolute bottom-0 right-full z-30 mr-2 w-[15.5rem] rounded-xl border border-slate-200 bg-white/97 p-2 shadow-xl shadow-slate-900/20 backdrop-blur"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
                <p className="text-[8.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Capas del visor
                </p>
                <button
                  type="button"
                  onClick={() => setCapasAbiertas(false)}
                  aria-label="Cerrar capas del visor"
                  className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-1">
                {CAPAS_VISOR.map((capa) => {
                  const Icono = capa.icono;
                  const activa = capas[capa.id];
                  const etiqueta =
                    capa.id === "mesas"
                      ? `${capa.label} (${fmtInt(mesas.length)})`
                      : capa.label;
                  return (
                    <button
                      key={capa.id}
                      type="button"
                      aria-pressed={activa}
                      onClick={() => onToggleCapa?.(capa.id)}
                      title={capa.detalle}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                        activa
                          ? "border-cyan-300 bg-cyan-50"
                          : "border-slate-200 bg-white opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border"
                        style={{
                          color: activa ? capa.color : "#94a3b8",
                          borderColor: activa ? `${capa.color}55` : "#e2e8f0",
                          background: activa ? `${capa.color}14` : "#f8fafc",
                        }}
                      >
                        <Icono className="h-3 w-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[10px] font-bold text-slate-800">
                          {etiqueta}
                        </span>
                        <span className="block truncate text-[8px] text-slate-500">
                          {capa.detalle}
                        </span>
                      </span>
                      <span
                        className={`relative h-3.5 w-6 shrink-0 rounded-full border transition ${
                          activa
                            ? "border-cyan-600 bg-cyan-600"
                            : "border-slate-300 bg-slate-200"
                        }`}
                      >
                        <span
                          className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
                            activa ? "left-[11px]" : "left-[1px]"
                          }`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 border-t border-slate-200 pt-1 text-[8px] leading-snug text-slate-500">
                El satélite oculta los nombres de calle y el agua del mapa claro.
              </p>
            </div>
          )}
        </div>
        <div className="h-px w-6 bg-slate-200" />
        <button
          type="button"
          onClick={onToggleCompacto}
          aria-pressed={compacto}
          aria-label={
            compacto
              ? "Mostrar paneles y leyenda del visor"
              : "Ver el mapa a pantalla completa"
          }
          title={
            compacto
              ? "Mostrar paneles y leyenda"
              : "Mapa a pantalla completa · oculta paneles y leyenda"
          }
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
            compacto
              ? "bg-slate-800 text-amber-300 shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {compacto ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
        <div className="h-px w-6 bg-slate-200" />
        {(rutaCampana?.length ?? 0) > 1 && (
          <>
            <div className="h-px w-6 bg-slate-200" />
            <button
              type="button"
              onClick={onToggleRuta}
              aria-pressed={rutaActiva}
              aria-label={
                rutaActiva
                  ? "Ocultar la ruta de campaña del mapa"
                  : "Marcar la ruta de campaña en el mapa"
              }
              title={
                rutaActiva
                  ? "Ocultar la ruta de campaña"
                  : "Marcar la ruta de campaña en el mapa"
              }
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                rutaActiva
                  ? "bg-amber-400 text-slate-900 shadow"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Route className="h-4 w-4" />
            </button>
          </>
        )}
        <div className="h-px w-6 bg-slate-200" />
        <button
          type="button"
          onClick={alternar2d}
          aria-pressed={modo2d}
          title={modo2d ? "Volver al 3D con relieve" : "Ver en 2D con nombres de calles"}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
            modo2d
              ? "bg-cyan-600 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          {modo2d ? (
            <Box className="h-4 w-4" />
          ) : (
            <MapIcon className="h-4 w-4" />
          )}
        </button>
        <div className="h-px w-6 bg-slate-200" />
        <button
          type="button"
          onClick={alejar}
          aria-label="Alejar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="tabular min-w-[3.2rem] text-center text-[10px] font-semibold text-slate-500">
          z {zoom.toFixed(1)}
        </span>
        <button
          type="button"
          onClick={acercar}
          aria-label="Acercar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <div className="h-px w-6 bg-slate-200" />
        <button
          type="button"
          onClick={reiniciarRumbo}
          aria-label="Reorientar cámara"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
        >
          <Compass
            className="h-3.5 w-3.5"
            style={{ transform: `rotate(${-rumbo}deg)` }}
          />
        </button>
      </div>

      {/* Tooltip: tarjeta blanca con acento de color y chip de acta */}
      {hover && (
        <div
          className="pointer-events-none absolute z-30 w-max max-w-[17rem] rounded-xl bg-white/97 px-2.5 py-2 shadow-xl backdrop-blur"
          style={{
            left:
              hover.x > (contenedorRef.current?.clientWidth ?? 900) - 280
                ? hover.x - 262
                : hover.x + 14,
            top: Math.max(hover.y - 12, 8),
            boxShadow: `0 8px 24px -8px ${hover.acento}55, 0 0 0 1px ${hover.acento}44`,
          }}
        >
          <p
            className="text-[11.5px] font-bold leading-tight"
            style={{ color: hover.acento }}
          >
            {hover.titulo}
          </p>
          {hover.lineas.map((linea) => (
            <p key={linea} className="mt-0.5 text-[10.5px] leading-snug text-slate-600">
              {linea}
            </p>
          ))}
          {hover.acta && (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-slate-900 px-1.5 py-0.5">
              <span className="text-[7.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Acta ONPE
              </span>
              <span className="tabular text-[9px] font-bold text-cyan-300">
                {hover.acta}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
