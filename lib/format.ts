export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

const entero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function fmtInt(value: number): string {
  return entero.format(Math.round(value));
}

export function fmtDec(value: number, decimals = 1): string {
  return value.toLocaleString("es-PE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtSoles(value: number): string {
  if (value >= 1_000_000) return `S/ ${decimal.format(value / 1_000_000)} M`;
  if (value >= 1_000) return `S/ ${entero.format(Math.round(value / 1_000))} mil`;
  return `S/ ${entero.format(Math.round(value))}`;
}

export function fmtSolesCorto(value: number): string {
  if (value >= 1_000_000) return `S/ ${decimal.format(value / 1_000_000)}M`;
  return `S/ ${entero.format(Math.round(value / 1_000))}k`;
}

export function fmtPct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function fmtCoordenada(lng: number, lat: number): string {
  return `${Math.abs(lat).toFixed(5)}° S, ${Math.abs(lng).toFixed(5)}° O`;
}
