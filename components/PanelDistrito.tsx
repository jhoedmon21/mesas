"use client";

import { useMemo } from "react";
import { ArrowLeft, MapPin, Target } from "lucide-react";
import type { DistritoPrioridad } from "@/data/distritosPrioridad";
import {
  mesasDeDistrito,
  resumenMesas,
  type MesaDistrito,
} from "@/data/mesasDistritos";
import { contarTonos } from "@/lib/mesas";
import { fmtDec, fmtInt } from "@/lib/format";

interface Props {
  distrito: DistritoPrioridad;
  onSelectDistrito: (id: string) => void;
  onVolverCerro: () => void;
  onSelectMesa: (id: string) => void;
}

export default function PanelDistrito({
  distrito,
  onSelectDistrito,
  onVolverCerro,
  onSelectMesa,
}: Props) {
  const mesas = useMemo(() => mesasDeDistrito(distrito.id), [distrito.id]);
  const resumen = useMemo(() => resumenMesas(mesas), [mesas]);
  const grupos = useMemo(() => {
    const mapa = new Map<string, MesaDistrito[]>();
    for (const mesa of mesas) {
      const lista = mapa.get(mesa.localId);
      if (lista) lista.push(mesa);
      else mapa.set(mesa.localId, [mesa]);
    }
    return [...mapa.values()]
      .map((lista) => ({
        id: lista[0].localId,
        nombre: lista[0].localNombre,
        aproximada: lista[0].aproximada,
        mesas: lista,
        zegarra: lista.reduce((s, m) => s + m.zegarra, 0),
        validos: lista.reduce((s, m) => s + m.validos, 0),
        ganadas: contarTonos(lista).ganada,
        disputadas: contarTonos(lista).disputada,
      }))
      .sort((a, b) => b.mesas.length - a.mesas.length);
  }, [mesas]);


  return (
    <section
      aria-label={`Resultado y prioridad del distrito ${distrito.nombre}`}
      className="hud-panel animate-slide-up flex h-full flex-col overflow-hidden rounded-2xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/40 px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <h2 className="hud-label truncate text-slate-300">
            {distrito.nombre} · resultado
          </h2>
        </div>
        <span className="shrink-0 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
          Ficha
        </span>
      </div>

      <div className="hud-scroll flex-1 space-y-3 overflow-y-auto px-3.5 py-2.5">
        {/* Mesas y locales con acta */}
        {resumen.mesas > 0 && (
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-cyan-300" />
                <p className="hud-label text-slate-300">
                  Mesas por local
                </p>
              </div>
              <span className="text-[9px] text-slate-500">
                {fmtInt(resumen.mesas)} mesas · {fmtInt(resumen.locales)} locales
              </span>
            </div>
            <div className="hud-scroll max-h-48 space-y-1 overflow-y-auto pr-0.5">
              {grupos.map((grupo) => (
                <button
                  key={grupo.id}
                  type="button"
                  onClick={() => onSelectMesa(grupo.mesas[0].id)}
                  title={`Abrir una mesa de ${grupo.nombre}`}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-950/45 px-2 py-1.5 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-semibold text-slate-200">
                      {grupo.nombre}
                    </span>
                    <span className="mt-0.5 block text-[8.5px] text-slate-500">
                      {fmtInt(grupo.mesas.length)} mesas ·{" "}
                      {fmtInt(grupo.ganadas)} ganadas Zegarra ·{" "}
                      {fmtInt(grupo.disputadas)} en disputa
                      {grupo.aproximada ? " · local sin georreferencia" : ""}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-right">
                    <span className="block text-[10.5px] font-bold text-cyan-200">
                      {grupo.validos
                        ? fmtDec((grupo.zegarra / grupo.validos) * 100)
                        : "0"}
                      %
                    </span>
                    <span className="block text-[8px] text-slate-500">
                      Zegarra
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pozo */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Target className="h-3 w-3 text-amber-300" />
            <p className="hud-label text-slate-300">Pozo de otras candidaturas</p>
          </div>
          <div className="rounded-lg border border-slate-700/60 bg-slate-950/45 px-2 py-1.5">
            <p className="text-[8.5px] uppercase tracking-[0.1em] text-slate-500">
              Votos en disputa
            </p>
            <p className="tabular mt-0.5 text-[15px] font-bold text-amber-200">
              {fmtInt(distrito.pozo)}
            </p>
          </div>
        </div>

        {!distrito.esCerro && (
          <button
            type="button"
            onClick={onVolverCerro}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-cyan-400/50 bg-cyan-400/15 py-1.5 text-[10.5px] font-semibold text-cyan-200 transition hover:bg-cyan-400/25"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver al detalle de Cerro Colorado
          </button>
        )}
      </div>
    </section>
  );
}
