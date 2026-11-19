"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Radar, X } from "lucide-react";
import BarraElectoral from "@/components/BarraElectoral";
import FichaDistritoPrioridad from "@/components/FichaDistritoPrioridad";
import MesaModal from "@/components/MesaModal";
import PanelDistrito from "@/components/PanelDistrito";
import TopBarElectoral from "@/components/TopBarElectoral";
import {
  CERRO_COLORADO_DISTRITO,
  DISTRITOS_PRIORIDAD,
  DISTRITOS_PRIORIDAD_POR_ID,
} from "@/data/distritosPrioridad";
import { VISTAS, type Vuelo, type Vista } from "@/lib/camara";
import { MESAS_POR_ID } from "@/data/mesasDistritos";
import { CAPAS_INICIALES, type CapaId, type CapasEstado } from "@/lib/layers";
import { planDeDistrito, polilineaDeRuta } from "@/lib/planCampana";

const ElectoralMap = dynamic(() => import("@/components/ElectoralMap"), {
  ssr: false,
  loading: () => <MapaSkeleton />,
});

type PanelMovil = "agenda" | null;
type FichaAImprimir =
  | "distrito"
  | "distritoPrioridad"
  | null;

function MapaSkeleton() {
  return (
    <div className="absolute inset-0 bg-[#030712]">
      <div className="map-grid absolute inset-0 opacity-50" />
      <div className="map-vignette absolute inset-0" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-slate-950/80">
          <Radar className="h-6 w-6 animate-spin text-cyan-300" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-slate-500">
          Cargando resultados ONPE
        </p>
        <p className="text-[9px] text-slate-600">
          Esri World Imagery · AWS Terrain · Deck.gl
        </p>
      </div>
    </div>
  );
}

export default function ElectoralDashboard() {
  const [capas, setCapas] = useState<CapasEstado>(CAPAS_INICIALES);
  const [distritoId, setDistritoId] = useState(CERRO_COLORADO_DISTRITO.id);
  const [asociacionId, setAsociacionId] = useState<string | null>(null);
  const [mesaId, setMesaId] = useState<string | null>(null);
  const [vuelo, setVuelo] = useState<Vuelo | null>(null);
  const [vistaActivaId, setVistaActivaId] = useState<string | null>(
    "cono-norte",
  );
  const [panelMovil, setPanelMovil] = useState<PanelMovil>(null);
  const [fichaAImprimir, setFichaAImprimir] = useState<FichaAImprimir>(null);
  // Ruta de campaña: trazado sobre el mapa y animación de la cometa.
  const [rutaActiva, setRutaActiva] = useState(false);
  /** Modo mapa completo: pliega el panel derecho y las tarjetas del visor. */
  const [mapaCompleto, setMapaCompleto] = useState(false);
  // Fuerza el reencuadre del distrito activo aunque se repita la selección.
  const [encuadreNonce, setEncuadreNonce] = useState(0);
  // Modo campaña por defecto: top 10 por válidos al frente, resto atenuado.
  const [prioridadElectoral, setPrioridadElectoral] = useState(true);

  const distritoActivo =
    DISTRITOS_PRIORIDAD_POR_ID.get(distritoId) ?? CERRO_COLORADO_DISTRITO;
  const esCerro = distritoActivo.esCerro;


  /* El trazado de la ruta sale del motor de lib/planCampana, que se recalcula
     por distrito. El panel del plan ya no existe: la ruta se enciende desde el
     control del visor. */
  const planCampana = useMemo(
    () => planDeDistrito(distritoActivo.id),
    [distritoActivo.id],
  );
  /* El trazado se pasa siempre para que el control de ruta del visor exista
     aunque esté apagada; el encendido lo decide `rutaActiva`. */
  const rutaCampana = useMemo(() => polilineaDeRuta(planCampana), [planCampana]);
  const rutaVisible = rutaActiva;

  // Enlace directo a una mesa: /electoral?mesa=040103-03-025
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idDistrito = params.get("distrito");
    const distritoUrl = idDistrito
      ? DISTRITOS_PRIORIDAD_POR_ID.get(idDistrito)
      : null;
    if (distritoUrl) {
      setDistritoId(distritoUrl.id);
      setPrioridadElectoral(true);
      setVistaActivaId(null);
      // Los distritos se encuadran con el tamaño real del mapa; Cerro usa
      // su vuelo de detalle de siempre.
      if (distritoUrl.esCerro) {
        setVuelo({
          center: distritoUrl.centro,
          zoom: distritoUrl.zoom,
          pitch: 62,
          bearing: 6,
          nonce: Date.now(),
        });
        return;
      }
      // Los demás distritos no tienen asociaciones ni mesas que abrir.
      return;
    }
    const idMesa = params.get("mesa");
    if (idMesa) {
      const mesa = MESAS_POR_ID.get(idMesa);
      if (mesa) {
        setDistritoId(mesa.distritoId);
        setMesaId(idMesa);
        setVistaActivaId(null);
        setVuelo({
          center: mesa.position,
          zoom: 14.7,
          pitch: 58,
          bearing: 10,
          nonce: Date.now(),
        });
        return;
      }
    }
  }, []);

  const mesaSeleccionada = useMemo(
    () => (mesaId ? MESAS_POR_ID.get(mesaId) ?? null : null),
    [mesaId],
  );

  const volar = useCallback((vista: Vista) => {
    setVistaActivaId(vista.id);
    setVuelo({
      center: vista.center,
      zoom: vista.zoom,
      pitch: vista.pitch,
      bearing: vista.bearing,
      nonce: Date.now(),
    });
  }, []);

  const seleccionarDistrito = useCallback((id: string, forzar = false) => {
    const distrito = DISTRITOS_PRIORIDAD_POR_ID.get(id);
    if (!distrito) return;
    // Un clic sobre el distrito que ya está abierto no hace nada: el polígono
    // cubre casi todo el mapa, así que reencuadrar en cada clic borraba la
    // vista y la ficha de la mesa que estabas leyendo. El encuadre solo se
    // fuerza desde «Vista general del distrito».
    if (!forzar && distrito.id === distritoId) return;
    setDistritoId(distrito.id);
    setAsociacionId(null);
    setMesaId(null);
    setPanelMovil(null);
    setPrioridadElectoral(true);
    setVistaActivaId(null);
    setEncuadreNonce((n) => n + 1);
    if (distrito.esCerro) {
      setVuelo({
        center: [-71.567, -16.357],
        zoom: 13.55,
        pitch: 62,
        bearing: 6,
        nonce: Date.now(),
      });
    }
  }, [distritoId]);

  const alternarCapa = useCallback((id: CapaId) => {
    setCapas((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const seleccionarMesa = useCallback((id: string) => {
    const mesa = MESAS_POR_ID.get(id);
    if (mesa) setDistritoId(mesa.distritoId);
    setMesaId(id);
    setAsociacionId(null);
    setPanelMovil(null);
    if (mesa) {
      setVuelo({
        center: mesa.position,
        zoom: 14.7,
        pitch: 58,
        bearing: 10,
        nonce: Date.now(),
      });
    }
  }, []);

  const imprimir = useCallback((tipo: Exclude<FichaAImprimir, null>) => {
    setFichaAImprimir(tipo);
  }, []);

  const alcanceInforme = distritoActivo.nombre;

  const generarInforme = useCallback(() => {
    imprimir(esCerro ? "distrito" : "distritoPrioridad");
  }, [esCerro, imprimir]);

  useEffect(() => {
    if (!fichaAImprimir) return;
    const timer = window.setTimeout(() => {
      window.print();
      setFichaAImprimir(null);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [fichaAImprimir]);

  useEffect(() => {
    if (!panelMovil) return;
    const esc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanelMovil(null);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [panelMovil]);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#030712]">
      <div className="no-print absolute inset-0">
        <ElectoralMap
          capas={capas}
          vuelo={vuelo}
          mesaId={mesaId}
          onSelectMesa={seleccionarMesa}
          onVolverVista={() => seleccionarDistrito(distritoActivo.id, true)}
          prioridad={prioridadElectoral}
          distritoId={distritoActivo.id}
          onSelectDistrito={seleccionarDistrito}
          esCerro={esCerro}
          encuadreNonce={encuadreNonce}
          onVerCerro={() => seleccionarDistrito(CERRO_COLORADO_DISTRITO.id)}
          onAbrirPanel={() => setPanelMovil("agenda")}
          rutaCampana={rutaCampana}
          rutaActiva={rutaActiva}
          rutaVisible={rutaVisible}
          onToggleRuta={() => setRutaActiva((v) => !v)}
          compacto={mapaCompleto}
          onToggleCompacto={() => setMapaCompleto((v) => !v)}
          onToggleCapa={alternarCapa}
        />

        <TopBarElectoral
          vistaActivaId={vistaActivaId}
          onVolarVista={volar}
          distritoActivo={distritoActivo}
          distritos={DISTRITOS_PRIORIDAD}
          onSelectDistrito={seleccionarDistrito}
        />

        {!mapaCompleto && (
        <div className="pointer-events-none absolute inset-0 z-20 hidden lg:block">
          <div className="pointer-events-auto absolute bottom-[4.25rem] right-4 top-[5.1rem] w-[348px] xl:w-[364px]">
            <PanelDistrito
              distrito={distritoActivo}
              onSelectDistrito={seleccionarDistrito}
              onVolverCerro={() => seleccionarDistrito(CERRO_COLORADO_DISTRITO.id)}
              onSelectMesa={seleccionarMesa}
            />
          </div>
        </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-between p-3 pb-16 lg:hidden">
          <div className="pointer-events-auto ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setPanelMovil("agenda")}
              className="flex items-center gap-1.5 rounded-full border border-slate-600/60 bg-slate-950/85 px-3 py-2 text-[10px] font-semibold text-slate-200 shadow-lg backdrop-blur-md transition active:scale-95"
            >
              <Layers className="h-3.5 w-3.5 text-amber-300" />
              Ficha del distrito
            </button>
          </div>
        </div>

        <BarraElectoral
          onGenerarInforme={generarInforme}
          alcance={alcanceInforme}
          distritoActivo={distritoActivo}
          esCerro={esCerro}
        />

        {mesaSeleccionada && (
          <MesaModal
            mesa={mesaSeleccionada}
            esCerro={esCerro}
            onClose={() => setMesaId(null)}
            onVerZona={() => setMesaId(null)}
          />
        )}

        {panelMovil && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Cerrar panel"
              onClick={() => setPanelMovil(null)}
              className="animate-fade-in absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            />
            <div className="animate-sheet-up absolute inset-x-0 bottom-0 top-[8%] flex flex-col overflow-hidden rounded-t-2xl border-t border-cyan-400/25 bg-slate-950/95 shadow-[0_-20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-2 px-2.5 pb-1.5 pt-2">
                <p className="hud-label px-1 text-slate-300">
                  Ficha del distrito
                </p>
                <button
                  type="button"
                  onClick={() => setPanelMovil(null)}
                  className="hud-icon-btn"
                  aria-label="Cerrar panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 px-2.5 pb-3">
                <PanelDistrito
                  distrito={distritoActivo}
                  onSelectDistrito={seleccionarDistrito}
                  onVolverCerro={() =>
                    seleccionarDistrito(CERRO_COLORADO_DISTRITO.id)
                  }
                  onSelectMesa={seleccionarMesa}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <FichaDistritoPrioridad distrito={distritoActivo} />
    </main>
  );
}
