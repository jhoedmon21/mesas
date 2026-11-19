"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Info,
  MapPin,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { FUENTE_MESAS, rankingMesa } from "@/data/mesasCerroColorado";
import {
  FUERA_LIMITE_POR_DISTRITO,
  type MesaDistrito,
} from "@/data/mesasDistritos";
import { fmtDec, fmtInt } from "@/lib/format";

interface Props {
  mesa: MesaDistrito;
  onClose: () => void;
  onVerZona: () => void;
  /** Solo Cerro Colorado tiene asociaciones de barrio y ficha de zona. */
  esCerro: boolean;
}

export default function MesaModal({
  mesa,
  onClose,
  onVerZona,
  esCerro,
}: Props) {

  const ranking = useMemo(() => rankingMesa(mesa), [mesa]);
  const maxVotos = ranking[0]?.votos || 1;
  const ganador = ranking[0];
  const segundo = ranking[1];
  const perdida = ganador && ganador.candidatoId !== "zegarra";
  const [lng, lat] = mesa.position;
  const fueraLimite =
    FUERA_LIMITE_POR_DISTRITO.get(mesa.distritoId)?.has(mesa.id) ?? false;

  useEffect(() => {
    const esc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    // Sin fondo modal: la ficha es un panel lateral que deja el mapa vivo. Antes
    // cualquier clic fuera la cerraba (y el velo difuminaba el mapa), así que
    // interactuar con el visor borraba lo que estabas leyendo. Se cierra con la
    // X o con Escape, y se cambia de mesa con un clic en otro punto.
    <div className="pointer-events-none fixed inset-0 z-50 flex justify-end">
      <aside
        role="dialog"
        aria-modal="false"
        aria-label={`Ficha de la mesa ${mesa.numero}`}
        className="animate-slide-right hud-panel pointer-events-auto relative flex h-full w-full flex-col overflow-hidden rounded-none border-y-0 border-r-0 sm:max-w-[500px] sm:rounded-l-3xl"
      >
        <header className="relative border-b border-slate-700/50 px-4 pb-3 pt-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="hud-label text-cyan-300/80">
                Ficha de mesa · actas ONPE
              </p>
              <h2 className="tabular mt-0.5 truncate text-[19px] font-bold leading-tight text-slate-50">
                Mesa {mesa.actaCodigo}
              </h2>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-slate-500">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                {mesa.zonaNombre ?? mesa.localNombre} ·{" "}
                {mesa.sector ?? "Local de votación"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hud-icon-btn shrink-0"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${
                perdida
                  ? "border-rose-400/50 bg-rose-400/10 text-rose-300"
                  : "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {perdida ? (
                <TrendingDown className="h-2.5 w-2.5" />
              ) : (
                <TrendingUp className="h-2.5 w-2.5" />
              )}
              {perdida
                ? `Perdida contra ${ganador.corto}`
                : "Ganada · Zegarra primero"}
            </span>
            <span className="rounded-md border border-slate-700/60 bg-slate-900/60 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">
              {fmtInt(mesa.validos)} válidos
            </span>
            {fueraLimite && (
              <span className="rounded-md border border-slate-400/50 bg-slate-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">
                Local fuera del límite distrital
              </span>
            )}
          </div>
        </header>

        <div className="hud-scroll flex-1 space-y-3 overflow-y-auto py-3 pl-4 pr-5">
          {/* Quién ganó la mesa y contra quién se perdió */}
          <div
            className="rounded-xl border px-2.5 py-2"
            style={{
              borderColor: perdida ? "rgba(244,63,94,0.35)" : "rgba(34,197,94,0.35)",
              background: perdida
                ? "rgba(244,63,94,0.07)"
                : "rgba(34,197,94,0.07)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <Target
                className="h-3 w-3"
                style={{ color: perdida ? "#f87171" : "#4ade80" }}
              />
              <p
                className="hud-label"
                style={{ color: perdida ? "#f87171" : "#4ade80" }}
              >
                {perdida ? "Contra quién se perdió esta mesa" : "Contra quién se ganó"}
              </p>
            </div>

            {perdida ? (
              <p className="mt-1 text-[10.5px] leading-relaxed text-slate-200">
                <strong className="font-bold" style={{ color: ganador.color }}>
                  {ganador.nombre}
                </strong>{" "}
                ({ganador.agrupacion}) se impuso con{" "}
                <strong className="tabular">{fmtInt(ganador.votos)}</strong> votos
                ({fmtDec(ganador.pct)}%). Zegarra quedó{" "}
                <strong>{mesa.puestoZegarra}.º</strong> con{" "}
                <strong className="tabular">{fmtInt(mesa.zegarra)}</strong> votos:
                diferencia de{" "}
                <strong className="tabular" style={{ color: "#f87171" }}>
                  −{fmtInt(ganador.votos - mesa.zegarra)}
                </strong>{" "}
                votos (
                {fmtDec(
                  ((ganador.votos - mesa.zegarra) / (mesa.validos || 1)) * 100,
                )}{" "}
                pp de los válidos).
                {segundo && (
                  <>
                    {" "}
                    Segundo lugar: <strong>{segundo.corto}</strong> con{" "}
                    {fmtInt(segundo.votos)}.
                  </>
                )}
              </p>
            ) : (
              <p className="mt-1 text-[10.5px] leading-relaxed text-slate-200">
                Zegarra ganó la mesa con{" "}
                <strong className="tabular">{fmtInt(mesa.zegarra)}</strong> votos
                ({fmtDec(ganador.pct)}%).{" "}
                {segundo && (
                  <>
                    Segundo: <strong>{segundo.corto}</strong> con{" "}
                    {fmtInt(segundo.votos)} votos (
                    {fmtDec(
                      ((mesa.zegarra - segundo.votos) / (mesa.validos || 1)) * 100,
                    )}{" "}
                    pp de diferencia).
                  </>
                )}
              </p>
            )}
          </div>

          {/* Ubicación */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="hud-label">Ubicación de la mesa</p>
              <span className="text-[9px] text-slate-500">
                {!mesa.aproximada && mesa.localNombre
                  ? "local de votación"
                  : "punto aproximado"}
              </span>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-950/50 px-2.5 py-2">
              {!mesa.aproximada && mesa.localNombre ? (
                <div className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-cyan-300" />
                  <span className="min-w-0">
                    <span className="block text-[9px] uppercase tracking-[0.12em] text-slate-500">
                      Local de votación
                    </span>
                    <span className="block text-[10.5px] font-semibold leading-snug text-slate-100">
                      {mesa.localNombre}
                    </span>
                    <span className="block text-[9px] leading-snug text-slate-400">
                      {esCerro ? (
                        <>
                          Cuadrante {mesa.cuadrante} · {mesa.zonaNombre} · a{" "}
                          {fmtInt(mesa.distanciaLocalM ?? 0)} m de la sede
                          {mesa.localCodigo
                            ? ` · código de local ${mesa.localCodigo}`
                            : ""}
                        </>
                      ) : (
                        <>
                          a {fmtInt(mesa.distanciaLocalM ?? 0)} m del local ·{" "}
                          {mesa.referencia}
                        </>
                      )}
                    </span>
                  </span>
                </div>
              ) : (
                <p className="flex items-start gap-1.5 text-[10px] leading-snug text-slate-200">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-cyan-300" />
                  <span>
                    {mesa.referencia}
                    <span className="text-slate-500">
                      {" "}
                      · a {fmtInt(mesa.distanciaCentroM ?? 0)} m del centro de la zona
                      · sin local georreferenciado
                    </span>
                  </span>
                </p>
              )}
              <p className="tabular mt-1 text-[11px] font-semibold text-slate-100">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {esCerro && (
                  <button
                    type="button"
                    onClick={onVerZona}
                    className="flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[9px] font-semibold text-amber-200 transition hover:bg-amber-400/20"
                  >
                    <MapPin className="h-3 w-3" />
                    Ficha de la zona
                  </button>
                )}
              </div>
              <p className="mt-1.5 flex items-start gap-1 text-[9px] leading-snug text-slate-500">
                <Info className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                {esCerro
                  ? FUENTE_MESAS.notaUbicacion
                  : "El punto se apoya en el local de votación georreferenciado que publica ONPE; las mesas del mismo local se separan unos metros para poder seleccionarlas."}
              </p>
              {mesa.coincidenciaMesas && (
                <p className="mt-1 rounded-md border border-amber-400/30 bg-amber-400/[0.06] px-2 py-1 text-[8.5px] leading-snug text-amber-200/90">
                  El nombre del acta no coincide con el catálogo de locales; la
                  coordenada se tomó del único local del catálogo con la misma
                  cantidad de mesas.
                </p>
              )}
            </div>
          </div>

          {/* Reparto completo */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="hud-label">Reparto de la mesa · 15 candidaturas</p>
              <span className="text-[9px] text-slate-500">
                {fmtInt(mesa.validos)} válidos
              </span>
            </div>
            <div className="space-y-[3px]">
              {ranking.map((r) => {
                const esZegarra = r.candidatoId === "zegarra";
                const esGanador = r.candidatoId === ganador.candidatoId;
                const destacado = esZegarra || esGanador;
                return (
                  <div key={r.candidatoId} className="flex items-center gap-1.5 pr-1">
                    <span
                      className={`w-[68px] shrink-0 truncate text-[9px] ${
                        destacado
                          ? "font-bold text-slate-100"
                          : "font-medium text-slate-400"
                      }`}
                      title={`${r.nombre} · ${r.agrupacion}`}
                    >
                      {r.corto}
                    </span>
                    <span className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-slate-800/70">
                      <span
                        className="absolute inset-y-0 left-0 rounded-sm transition-[width] duration-500"
                        style={{
                          width: `${Math.max(1.5, (r.votos / maxVotos) * 100)}%`,
                          background: r.color,
                          opacity: destacado ? 1 : 0.5,
                        }}
                      />
                    </span>
                    <span className="tabular w-9 shrink-0 text-right text-[9px] font-semibold text-slate-300">
                      {fmtDec(r.pct)}%
                    </span>
                    <span className="tabular w-8 shrink-0 text-right text-[9px] text-slate-500">
                      {fmtInt(r.votos)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="border-t border-slate-700/50 px-4 py-2">
          <p className="flex items-start gap-1 text-[9px] leading-snug text-slate-500">
            <Info className="mt-0.5 h-2.5 w-2.5 shrink-0" />
            {FUENTE_MESAS.etiqueta}: {FUENTE_MESAS.nota}{" "}
            {esCerro
              ? "Los totales de las 15 candidaturas cierran exactos contra la fila ONPE de Cerro Colorado."
              : "Es el voto real de la mesa; el total del distrito suma todas sus actas capturadas."}
          </p>
        </footer>
      </aside>
    </div>
  );
}
