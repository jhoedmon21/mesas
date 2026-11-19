"use client";

import { useState } from "react";
import { ArrowRight, ChevronUp, MapPin, PanelRight } from "lucide-react";
import type { DistritoPrioridad } from "@/data/distritosPrioridad";
import {
  localesDeDistrito,
  mesasDeDistrito,
  resumenMesas,
} from "@/data/mesasDistritos";
import { fmtInt } from "@/lib/format";

interface Props {
  distrito: DistritoPrioridad;
  /** Cerro Colorado ya tiene sus 84 asociaciones: cambia la nota y el CTA. */  esCerro: boolean;
  /** Salta al distrito que además tiene las 84 asociaciones. */
  onVerCerro: () => void;
  /** Abre la ficha completa del distrito (panel lateral o bottom sheet). */
  onAbrirPanel: () => void;
}

/**
 * Tarjeta de contexto del mapa.
 *
 * No repite el resultado del distrito: esas cifras viven en la barra superior
 * y en el panel lateral. Aquí solo va lo que no está en ningún otro sitio —
 * cuántas mesas con acta y cuántos locales tiene el distrito dibujado— y el
 * acceso a la ficha. Las asociaciones solo existen en Cerro Colorado (84
 * sectores con nombre del PPRRD 2018); en el resto el mapa no dibuja puntos
 * de asociación y la tarjeta lo explica en una línea.
 */
export default function TarjetaDistritoMapa({
  distrito,
  esCerro,
  onVerCerro,
  onAbrirPanel,
}: Props) {
  const [abierta, setAbierta] = useState(true);
  const mesas = mesasDeDistrito(distrito.id);
  const resumen = resumenMesas(mesas);
  const locales = localesDeDistrito(distrito.id).length;

  return (
    <section
      aria-label={`Contexto del distrito ${distrito.nombre}`}
      className="pointer-events-auto absolute left-3 right-3 top-[4.6rem] z-20 lg:left-4 lg:right-auto lg:top-[5.5rem] lg:w-[20.5rem]"
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/96 shadow-[0_14px_40px_-16px_rgba(13,11,11,0.45)] backdrop-blur">
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
          aria-label={
            abierta
              ? "Plegar el contexto del distrito"
              : "Expandir el contexto del distrito"
          }
          className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-slate-50"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fdeaea] text-[#c41212]">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[8.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Distrito {distrito.puesto} de 15 · {distrito.provincia}
            </span>
            <span className="block truncate text-[15px] font-bold leading-tight text-slate-900">
              {distrito.nombre}
            </span>
          </span>
          <ChevronUp
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${
              abierta ? "" : "rotate-180"
            }`}
          />
        </button>

        {abierta && (
          <div className="border-t border-slate-200/80 px-3 pb-2.5 pt-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1 text-[#a10f0f]">
                <MapPin className="h-3 w-3" />
                {fmtInt(resumen.mesas)} mesas con acta
              </span>
              <span className="text-slate-300">·</span>
              <span>{fmtInt(locales)} locales de votación</span>
            </div>


            <div className="mt-2 flex gap-1.5">
              {!esCerro && (
                <button
                  type="button"
                  onClick={onVerCerro}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#e61919] py-1.5 text-[10px] font-semibold text-white transition hover:bg-[#c41212]"
                >
                  Ver Cerro Colorado
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={onAbrirPanel}
                title="Abrir la ficha del distrito"
                aria-label="Abrir la ficha del distrito"
                className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 lg:hidden"
              >
                <PanelRight className="h-3 w-3" />
                Ficha
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
