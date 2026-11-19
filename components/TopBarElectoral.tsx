"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Map as MapIcon,
  MapPin,
  Mountain,
  Building2,
} from "lucide-react";
import { VISTAS, type Vista } from "@/lib/camara";
import { RESUMEN_MESAS } from "@/data/mesasCerroColorado";
import type { DistritoPrioridad } from "@/data/distritosPrioridad";
import { fmtDec, fmtInt } from "@/lib/format";

const ICONO_VISTA: Record<string, typeof MapIcon> = {
  "cono-norte": Mountain,
  "cerro-colorado": Building2,
  "region-15": MapIcon,
};

interface Props {
  vistaActivaId: string | null;
  onVolarVista: (vista: Vista) => void;
  distritoActivo: DistritoPrioridad;
  distritos: DistritoPrioridad[];
  onSelectDistrito: (id: string) => void;
}

export default function TopBarElectoral({
  vistaActivaId,
  onVolarVista,
  distritoActivo,
  distritos,
  onSelectDistrito,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [distritoAbierto, setDistritoAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const distritoRef = useRef<HTMLDivElement>(null);
  const vistaActiva = VISTAS.find((v) => v.id === vistaActivaId) ?? VISTAS[0];
  const esCerro = distritoActivo.esCerro;
  const zegarraPct = esCerro
    ? RESUMEN_MESAS.zegarraPct
    : distritoActivo.zegarraPct;
  const margen = esCerro ? RESUMEN_MESAS.margen : distritoActivo.margen;
  /* El pozo ya no ocupa un lugar en la barra: vive en el panel del distrito.
     Aquí solo se usa para ordenar y rotular el menú de distritos. */
  const pozo = esCerro
    ? RESUMEN_MESAS.validos - RESUMEN_MESAS.zegarra - RESUMEN_MESAS.huisa
    : distritoActivo.pozo;

  useEffect(() => {
    if (!abierto) return;
    const fuera = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setAbierto(false);
    };
    const esc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  useEffect(() => {
    if (!distritoAbierto) return;
    const fuera = (event: MouseEvent) => {
      if (!distritoRef.current?.contains(event.target as Node)) {
        setDistritoAbierto(false);
      }
    };
    const esc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDistritoAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [distritoAbierto]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 p-2.5 sm:p-4">
      <div className="hud-panel pointer-events-auto mx-auto flex max-w-[1900px] items-center gap-2.5 rounded-xl px-2.5 py-2 sm:gap-3.5 sm:rounded-2xl sm:px-4 sm:py-2.5">
        <div
          aria-hidden="true"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-950 shadow-[0_0_24px_-6px_rgba(34,211,238,0.65)] sm:h-10 sm:w-10"
        >
          <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
            <path
              d="M16 3.5 27.5 9.8v12.4L16 28.5 4.5 22.2V9.8Z"
              fill="rgba(34,211,238,0.08)"
              stroke="rgba(34,211,238,0.65)"
              strokeWidth="1.1"
            />
            <path
              d="M10 22V14M14 22V10M18 22V16M22 22V12"
              stroke="#67e8f9"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path d="M8 24h16" stroke="rgba(34,211,238,0.45)" strokeWidth="1" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight text-slate-100 sm:text-lg">
              Cerreño <span className="text-cyan-300">3D</span>
            </h1>
            <span className="hidden text-slate-600 sm:inline">—</span>
            <span className="hidden truncate text-[13px] font-normal text-slate-300 md:inline">
              Mando Electoral · {distritoActivo.nombre}
            </span>
          </div>
          <p className="hidden truncate text-[9.5px] font-medium uppercase tracking-[0.18em] text-slate-500 sm:block">
            ERM 2026 · actas ONPE 100% · distrito {distritoActivo.puesto} de 15
          </p>
        </div>

        {/* Marcador del distrito */}
        <div className="hidden shrink-0 items-center gap-3 rounded-lg border border-cyan-400/35 bg-cyan-400/[0.07] px-3 py-1.5 md:flex">
          <div className="min-w-0 leading-none">
            <p className="max-w-[9rem] truncate text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Zegarra en {distritoActivo.nombre}
            </p>
            <p className="tabular mt-0.5 text-[13px] font-bold text-cyan-300">
              {fmtDec(zegarraPct)}%
            </p>
          </div>
          <div className="h-6 w-px bg-slate-700/70" />
          <div className="leading-none">
            <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Margen
            </p>
            <p
              className={`tabular mt-0.5 text-[13px] font-bold ${
                margen >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {margen >= 0 ? "+" : "−"}
              {fmtDec(Math.abs(margen))} pp
            </p>
          </div>
        </div>

        {/* Selector de distrito: misma lectura para los 15, sin perder Cerro. */}
        <div className="relative shrink-0" ref={distritoRef}>
          <button
            type="button"
            onClick={() => setDistritoAbierto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={distritoAbierto}
            title="Cambiar de distrito"
            className="flex max-w-[10.5rem] items-center gap-1.5 rounded-lg border border-amber-400/45 bg-amber-400/[0.09] px-2 py-2 text-left transition hover:border-amber-300/70 hover:bg-amber-400/15 sm:max-w-none sm:gap-2 sm:px-3"
          >
            <MapPin className="h-4 w-4 shrink-0 text-amber-300" />
            <span className="hidden min-w-0 flex-col sm:flex">
              <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-amber-200/60">
                Distrito · {distritoActivo.puesto} de 15
              </span>
              <span className="max-w-[128px] truncate text-[11.5px] font-semibold text-slate-100">
                {distritoActivo.nombre}
              </span>
            </span>
            <span className="min-w-0 truncate text-[10px] font-semibold text-slate-100 sm:hidden">
              {distritoActivo.nombre}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-amber-200/70 transition ${distritoAbierto ? "rotate-180" : ""}`}
            />
          </button>

          {distritoAbierto && (
            <div
              role="menu"
              className="hud-panel animate-fade-in absolute right-0 top-[calc(100%+8px)] max-h-[min(72vh,30rem)] w-[calc(100vw-2.5rem)] max-w-[360px] overflow-y-auto p-1.5"
            >
              <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Prioridad por pozo
                </p>
                <span className="text-[8px] text-slate-600">
                  {fmtInt(pozo)} en {distritoActivo.nombre}
                </span>
              </div>
              {distritos.map((d) => {
                const activo = d.id === distritoActivo.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={activo}
                    onClick={() => {
                      onSelectDistrito(d.id);
                      setDistritoAbierto(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                      activo
                        ? "bg-amber-400/12 text-amber-100"
                        : "text-slate-200 hover:bg-slate-800/70"
                    }`}
                  >
                    <span
                      className={`tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[9px] font-bold ${
                        activo
                          ? "border-amber-300/60 bg-amber-400/20 text-amber-200"
                          : "border-slate-700/60 bg-slate-950/70 text-slate-400"
                      }`}
                    >
                      {d.puesto}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-semibold">
                        {d.nombre}
                      </span>
                      <span className="block truncate text-[9px] text-slate-500">
                        {d.provincia} · {fmtInt(d.pozo)} en disputa
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-right">
                      <span
                        className={`block text-[10px] font-bold ${
                          d.margen >= 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {d.margen >= 0 ? "+" : "−"}
                        {fmtDec(Math.abs(d.margen), 1)} pp
                      </span>
                      <span className="block text-[8.5px] text-slate-500">
                        {fmtDec(d.zegarraPct)}% Zegarra
                      </span>
                    </span>
                    {activo && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                    )}
                  </button>
                );
              })}
              <p className="border-t border-slate-800/70 px-2.5 py-2 text-[8px] leading-snug text-slate-500">
                El pozo son los votos de las candidaturas que no son Zegarra ni
                Huisa. El orden prioriza dónde hay más voto movible.
              </p>
            </div>
          )}
        </div>

        {/* Los encuadres son del detalle de Cerro; en otro distrito el panel manda. */}
        {distritoActivo.esCerro && (
          <div className="relative hidden shrink-0 sm:block" ref={menuRef}>
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={abierto}
              className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/70 px-2.5 py-2 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/10 sm:px-3"
            >
              <MapIcon className="h-4 w-4 shrink-0 text-cyan-300" />
              <span className="hidden min-w-0 flex-col sm:flex">
                <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Vuelo de cámara
                </span>
                <span className="max-w-[150px] truncate text-[11.5px] font-semibold text-slate-100">
                  {vistaActivaId ? vistaActiva.label : "Navegación libre"}
                </span>
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${abierto ? "rotate-180" : ""}`}
              />
            </button>

            {abierto && (
              <div
                role="menu"
                className="hud-panel animate-fade-in absolute right-0 top-[calc(100%+8px)] w-[calc(100vw-2.5rem)] max-w-[330px] overflow-hidden p-1.5"
              >
                <p className="px-2.5 py-1.5 text-[8.5px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Encuadres
                </p>
                {VISTAS.map((vista) => {
                  const Icono = ICONO_VISTA[vista.id] ?? MapIcon;
                  const activa = vista.id === vistaActivaId;
                  return (
                    <button
                      key={vista.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onVolarVista(vista);
                        setAbierto(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                        activa
                          ? "bg-cyan-400/10 text-cyan-100"
                          : "text-slate-200 hover:bg-slate-800/70"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700/60 bg-slate-950/70">
                        <Icono className="h-3.5 w-3.5 text-cyan-300" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11.5px] font-semibold">
                          {vista.label}
                        </span>
                        <span className="block truncate text-[9.5px] text-slate-500">
                          {vista.detalle}
                        </span>
                      </span>
                      {activa && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
