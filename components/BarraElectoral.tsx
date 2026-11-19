"use client";

import {
  Download,
  Table2,
  Target,
  Users,
  Vote,
} from "lucide-react";
import { POBLACION_DISTRITAL } from "@/data/cerroColoradoGeo";
import { RESUMEN_MESAS } from "@/data/mesasCerroColorado";
import { mesasDeDistrito, resumenMesas } from "@/data/mesasDistritos";
import type { DistritoPrioridad } from "@/data/distritosPrioridad";
import { fmtInt } from "@/lib/format";

interface Props {
  onGenerarInforme: () => void;
  /** Alcance del PDF: provincia, distrito o asociación visible. */
  alcance: string;
  distritoActivo: DistritoPrioridad;
  esCerro: boolean;
}

export default function BarraElectoral({
  onGenerarInforme,
  alcance,
  distritoActivo,
  esCerro,
}: Props) {
  const resumen = resumenMesas(mesasDeDistrito(distritoActivo.id));
  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-2.5 pb-2.5 sm:px-4 sm:pb-3">
      <div className="pointer-events-auto mx-auto flex max-w-[1900px] items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-950/85 px-2.5 py-1.5 backdrop-blur-xl sm:gap-3 sm:px-3.5 sm:py-2">
        <div
          className="hidden items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-emerald-300 lg:flex"
          title="Actas de mesa reales de ONPE · ERM 2026 · Gobernador Regional"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          ONPE · actas por mesa
        </div>
        <span className="hidden h-4 w-px bg-slate-700/70 lg:block" />

        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden sm:gap-4">
          <div className="flex shrink-0 items-center gap-1.5">
            <Vote className="h-3 w-3 shrink-0 text-cyan-300" />
            <span className="tabular text-[10px] font-semibold text-slate-100 sm:text-[11px]">
              {fmtInt(esCerro ? RESUMEN_MESAS.validos : distritoActivo.validos)}
            </span>
            <span className="whitespace-nowrap text-[9px] text-slate-500">
              <span className="sm:hidden">vál.</span>
              <span className="hidden sm:inline">válidos</span>
            </span>
          </div>

          <span className="h-3.5 w-px shrink-0 bg-slate-700/70" />

          <div
            className="flex shrink-0 items-center gap-1.5"
            title={
              esCerro
                ? "Población de Cerro Colorado · INEI 2025"
                : "Electores hábiles en las actas del distrito"
            }
          >
            {esCerro ? (
              <Users className="h-3 w-3 shrink-0 text-amber-300" />
            ) : (
              <Target className="h-3 w-3 shrink-0 text-amber-300" />
            )}
            <span className="tabular text-[10px] font-semibold text-slate-100 sm:text-[11px]">
              {fmtInt(esCerro ? POBLACION_DISTRITAL : resumen.electores)}
            </span>
            <span className="text-[9px] text-slate-500 xl:hidden">
              {esCerro ? "habitantes" : "electores"}
            </span>
            <span className="hidden text-[9px] text-slate-500 xl:inline">
              {esCerro
                ? "hab. Cerro Colorado · INEI 2025"
                : "electores hábiles · actas del distrito"}
            </span>
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-400/40 bg-amber-400/[0.08] px-2 py-1 min-[1440px]:flex">
            <span className="text-[8px] uppercase tracking-[0.14em] text-slate-500">
              Balotaje
            </span>
            <span className="text-[9.5px] font-bold text-amber-300">
              06 DIC 2026
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerarInforme}
          title={`Generar informe PDF · ${alcance}`}
          aria-label={`Generar informe PDF de ${alcance}`}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-gradient-to-r from-cyan-400/15 to-emerald-400/10 px-2 py-1.5 text-[9.5px] font-semibold text-cyan-100 transition hover:border-cyan-300/70 hover:from-cyan-400/25 hover:to-emerald-400/20 sm:px-3 sm:text-[10.5px]"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Informe PDF · {alcance}</span>
          <span className="sm:hidden">PDF</span>
        </button>
      </div>
    </footer>
  );
}
