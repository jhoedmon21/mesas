import type { Metadata } from "next";
import ElectoralDashboard from "@/components/ElectoralDashboard";

export const metadata: Metadata = {
  title: "Cerreño 3D — Mando Electoral de Cerro Colorado (ONPE, ERM 2026)",
  description:
    "Centro de mando electoral de Cerro Colorado, Arequipa: 506 mesas con actas reales de ONPE (ERM 2026, gobernador regional), verde donde gana Zegarra y rojo donde gana un contrincante, con las necesidades de cada sector.",
};

export default function ElectoralPage() {
  return <ElectoralDashboard />;
}
