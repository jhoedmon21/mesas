#!/usr/bin/env python
"""
OCR del front-matter (índice) de los PPRRD escaneados de SIGRID.

Para cada distrito busca la página de CONTENIDO/ÍNDICE y la imprime, de modo
que se pueda ver si el plan incluye una sección de asociaciones de vivienda,
asentamientos humanos o sectores críticos.

Uso:
    python scripts/ocr-indice-pprrd.py                 # páginas 1-18
    python scripts/ocr-indice-pprrd.py --hasta 24
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import pymupdf
from rapidocr_onnxruntime import RapidOCR

DEST = Path(".captura/pprrd")
ESCANEADOS = [
    "cayma",
    "alto-selva-alegre",
    "miraflores",
    "socabaya",
    "jose-luis-bustamante-y-rivero",
    "jacobo-hunter",
    "yanahuara",
]
CLAVES_INDICE = re.compile(r"CONTENIDO|[IÍ]NDICE|TABLA\s+DE\s+CONTENIDO", re.I)

ocr = RapidOCR()


def ocr_pagina(doc: pymupdf.Document, idx: int) -> str:
    pix = doc[idx].get_pixmap(dpi=150)
    png = pix.tobytes("png")
    resultado, _ = ocr(png)
    if not resultado:
        return ""
    return "\n".join(linea[1] for linea in resultado)


def main() -> int:
    hasta = 18
    if "--hasta" in sys.argv:
        hasta = int(sys.argv[sys.argv.index("--hasta") + 1])

    salida = DEST / "indices"
    salida.mkdir(parents=True, exist_ok=True)

    for slug in ESCANEADOS:
        ruta = DEST / f"{slug}.pdf"
        if not ruta.exists():
            print(f"!! falta {ruta}")
            continue
        with pymupdf.open(ruta) as doc:
            limite = min(hasta, doc.page_count)
            elegido: tuple[int, str] | None = None
            for i in range(limite):
                texto = ocr_pagina(doc, i)
                if CLAVES_INDICE.search(texto) and len(texto) > 400:
                    elegido = (i + 1, texto)
                    break
            print("=" * 78)
            print(f"{slug}  (páginas {limite} revisadas)")
            if not elegido:
                print("  sin página de contenido detectada")
                continue
            pagina, texto = elegido
            (salida / f"{slug}-indice.txt").write_text(texto, encoding="utf-8")
            print(f"  índice en página {pagina}:")
            for linea in texto.splitlines():
                if len(linea.strip()) > 3:
                    print("   ", linea.strip()[:100])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
