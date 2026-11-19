import { redirect } from "next/navigation";

/** Única entrada del sitio: todo vive en el mando electoral de Cerro Colorado. */
export default function Home() {
  redirect("/electoral");
}
