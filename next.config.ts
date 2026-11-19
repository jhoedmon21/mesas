import type { NextConfig } from "next";

/* En Vercel el resultado del build debe quedar en `.next`: el builder lee ese
   directorio y no el `distDir` propio. En local se mantiene `.build` por el
   motivo de abajo. */
const distDir = process.env.VERCEL ? ".next" : ".build";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // El build escribe un archivo `trace` que en esta máquina queda bloqueado por
  // algo externo (EPERM al abrirlo) cuando se usa `.next`. Un directorio propio
  // evita la colisión con restos de sesiones anteriores. `next start` lee el
  // mismo valor, así que build y serve siempre coinciden.
  distDir,
};

export default nextConfig;
