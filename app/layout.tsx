import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cerreño 3D — Mando Electoral de Cerro Colorado (ONPE, ERM 2026)",
  description:
    "Centro de mando electoral de Cerro Colorado, Arequipa: 506 mesas con actas reales de ONPE (ERM 2026, gobernador regional), verde donde gana Zegarra y rojo donde gana un contrincante, con las necesidades de cada sector.",
  applicationName: "Cerreño 3D",
  authors: [{ name: "Centro de Mando Electoral — Cerro Colorado" }],
  keywords: [
    "Cerro Colorado",
    "Arequipa",
    "electoral",
    "ONPE",
    "ERM 2026",
    "mesas",
    "MapLibre",
    "Deck.gl",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full min-h-0 overflow-hidden bg-[#030712] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
