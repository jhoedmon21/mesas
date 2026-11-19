#!/usr/bin/env python
"""
Extrae los «sectores críticos» con nombre de los PPRRD escaneados.

Los PPRRD siguen la plantilla CENEPRED (RJ 082-2016): dentro del capítulo de
elementos expuestos hay una sección «Identificación de sectores críticos» y
cada sector se rotula como «2.4.1.N  SECTOR: <NOMBRE>». Esos rótulos son
nombres reales de asentamientos, asociaciones y pueblos jóvenes del distrito.

Como los PDF no traen capa de texto, se hace un barrido en dos pasadas:

  1) OCR rápido de la franja superior de cada página (donde va el rótulo).
  2) OCR completo, a mayor resolución, solo de las páginas que traen rótulo.

Salida: .captura/pprrd/sectores/<slug>.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pymupdf
from rapidocr_onnxruntime import RapidOCR

DEST = Path(".captura/pprrd")
SALIDA = DEST / "sectores"

SLUGS = [
    "miraflores",
    "cayma",
    "alto-selva-alegre",
    "socabaya",
    "jose-luis-bustamante-y-rivero",
    "jacobo-hunter",
    "yanahuara",
]

ROTULO = re.compile(r"\bSECTOR\b\s*[:;.\-]?\s*(.{3,90})", re.I)
# limpia el ruido típico del OCR alrededor del rótulo
BASURA = re.compile(r"[^A-ZÁÉÍÓÚÑ0-9 .,'()\-]")


def ocr_texto(ocr: RapidOCR, png: bytes) -> str:
    res, _ = ocr(png)
    if not res:
        return ""
    return "\n".join(linea[1] for linea in res)


def normalizar(texto: str) -> str:
    texto = BASURA.sub(" ", texto)
    texto = re.sub(r"\s+", " ", texto).strip(" .,-")
    return texto


def candidatos(texto: str) -> list[str]:
    """Rótulos «SECTOR: X» de una página, ya normalizados."""
    salida: list[str] = []
    for m in ROTULO.finditer(texto):
        nombre = normalizar(m.group(1))
        # descarta encabezados de tabla («SECTOR CRITICO», «SECTORES CRITICOS»)
        if not nombre:
            continue
        if re.fullmatch(r"(CR[IÍ]TICOS?|N[°º]?|SECTOR(ES)?)", nombre, re.I):
            continue
        if len(nombre) < 4:
            continue
        salida.append(nombre)
    return salida


def procesar(ocr: RapidOCR, slug: str) -> dict:
    ruta = DEST / f"{slug}.pdf"
    with pymupdf.open(ruta) as doc:
        total = doc.page_count
        # ---- pasada 1: franja superior ----
        paginas: dict[int, list[str]] = {}
        for i in range(total):
            pagina = doc[i]
            alto = pagina.rect.height
            franja = pymupdf.Rect(0, 0, pagina.rect.width, alto * 0.34)
            png = pagina.get_pixmap(dpi=130, clip=franja).tobytes("png")
            texto = ocr_texto(ocr, png)
            hallados = candidatos(texto)
            if hallados:
                paginas[i] = hallados
            if (i + 1) % 25 == 0:
                print(f"  {slug}: {i + 1}/{total} páginas barridas", flush=True)

        # ---- pasada 2: página completa de las candidatas ----
        detalle: list[dict] = []
        for i in sorted(paginas):
            png = doc[i].get_pixmap(dpi=200).tobytes("png")
            texto = ocr_texto(ocr, png)
            for nombre in candidatos(texto):
                detalle.append({"nombre": nombre, "pagina": i + 1})

    # dedupe conservando el primero
    vistos: set[str] = set()
    limpio: list[dict] = []
    for d in detalle:
        clave = re.sub(r"[^A-Z]", "", d["nombre"].upper())
        if clave in vistos:
            continue
        vistos.add(clave)
        limpio.append(d)

    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / f"{slug}.json").write_text(
        json.dumps(limpio, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    return {"slug": slug, "paginas": total, "sectores": len(limpio)}


def main() -> int:
    ocr = RapidOCR()
    resumen = []
    for slug in SLUGS:
        if not (DEST / f"{slug}.pdf").exists():
            print(f"falta {slug}.pdf")
            continue
        print(f"== {slug}", flush=True)
        resumen.append(procesar(ocr, slug))
        print(f"   -> {resumen[-1]}", flush=True)
    (SALIDA / "resumen.json").write_text(
        json.dumps(resumen, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    for r in resumen:
        print(f"{r['slug']:<34} {r['sectores']:>3} sectores  ({r['paginas']} pág.)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
