/* Loader de desarrollo: resuelve el alias "@/..." de tsconfig para poder
   importar los módulos con node a secas en los scripts de verificación. */
export async function resolve(especificador, contexto, siguiente) {
  if (especificador.startsWith("@/")) {
    const relativo = especificador.slice(2);
    const conExtension = /\.[cm]?[jt]sx?$/.test(relativo)
      ? relativo
      : `${relativo}.ts`;
    const url = new URL(`../${conExtension}`, import.meta.url);
    return siguiente(url.href, contexto);
  }
  return siguiente(especificador, contexto);
}
