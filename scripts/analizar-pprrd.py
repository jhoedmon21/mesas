#!/usr/bin/env python
"""
Descarga los PPRRD distritales desde SIGRID/CENEPRED y mide si contienen
un padrón de asociaciones de vivienda o asentamientos humanos.

Uso:
    python scripts/analizar-pprrd.py            # descarga (si falta) y analiza
    python scripts/analizar-pprrd.py --solo-texto

Salida: tabla por distrito + JSON en .captura/pprrd/resumen.json
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

BASE = "https://sigrid.cenepred.gob.pe/sigridv3/documento/{}/descargar"
DEST = Path(".captura/pprrd")

# distrito -> (id SIGRID, etiqueta del documento)
DOCS: dict[str, tuple[int, str]] = {
    "cerro-colorado": (6216, "PPRRD Cerro Colorado 2018-2026"),
    "paucarpata": (18825, "PPRRD Paucarpata 2025-2028"),
    "cayma": (17238, "PPRRD Cayma"),
    "alto-selva-alegre": (14616, "PPRRD Alto Selva Alegre"),
    "mariano-melgar": (14808, "PPRRD Mariano Melgar"),
    "miraflores": (19503, "PPRRD Miraflores 2025-2028"),
    "socabaya": (15230, "PPRRD Socabaya 2022-2025"),
    "jose-luis-bustamante-y-rivero": (17813, "PPRRD JLByR"),
    "jacobo-hunter": (13983, "PPRRD Jacobo Hunter 2021-2025"),
    "yanahuara": (19776, "PPRRD Yanahuara"),
    "yura": (15166, "PPRRD Yura 2022-2024"),
    "arequipa-provincia": (17408, "PPRRD provincia de Arequipa"),
}

PATRONES = {
    "asociacion": re.compile(r"\bASOCIACI[OÓ]N\b|\bASOC\.", re.I),
    "asoc_vivienda": re.compile(r"ASOCIACI[OÓ]N\s+DE\s+VIVIENDA", re.I),
    "asentamiento": re.compile(r"ASENTAMIENTO\s+HUMANO", re.I),
    "pueblo_joven": re.compile(r"PUEBLO\s+JOVEN", re.I),
    "habilitacion": re.compile(r"HABILITACI[OÓ]N\s+URBANA", re.I),
}

# Líneas que parecen nombre propio de asociación (para muestreo manual)
NOMBRE = re.compile(
    r"(ASOCIACI[OÓ]N(?:\s+DE\s+VIVIENDA)?|ASOC\.)\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9 .,'\-]{4,70}"
)


def descargar(distrito: str, doc_id: int) -> Path:
    destino = DEST / f"{distrito}.pdf"
    if destino.exists() and destino.stat().st_size > 100_000:
        return destino
    DEST.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        BASE.format(doc_id),
        headers={"User-Agent": "Mozilla/5.0 (compatible; Cerreno3D-research/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=180) as resp, destino.open("wb") as fh:
        while True:
            trozo = resp.read(1 << 20)
            if not trozo:
                break
            fh.write(trozo)
    return destino


def texto_pdf(ruta: Path) -> str:
    import pymupdf  # type: ignore

    partes: list[str] = []
    with pymupdf.open(ruta) as doc:
        for pagina in doc:
            partes.append(pagina.get_text("text"))
    return "\n".join(partes)


def analizar(distrito: str, doc_id: int, etiqueta: str, solo_texto: bool) -> dict:
    ruta = DEST / f"{distrito}.pdf"
    if not solo_texto:
        try:
            ruta = descargar(distrito, doc_id)
        except Exception as exc:  # noqa: BLE001
            return {"distrito": distrito, "etiqueta": etiqueta, "error": str(exc)}

    if not ruta.exists():
        return {"distrito": distrito, "etiqueta": etiqueta, "error": "sin pdf"}

    try:
        texto = texto_pdf(ruta)
    except Exception as exc:  # noqa: BLE001
        return {"distrito": distrito, "etiqueta": etiqueta, "error": f"pdf: {exc}"}

    mayus = texto.upper()
    conteo = {clave: len(pat.findall(mayus)) for clave, pat in PATRONES.items()}

    muestras: list[str] = []
    vistas: set[str] = set()
    for m in NOMBRE.finditer(mayus):
        nombre = re.sub(r"\s+", " ", m.group(0)).strip(" .,-")
        if len(nombre) < 12 or nombre in vistas:
            continue
        vistas.add(nombre)
        muestras.append(nombre)
        if len(muestras) >= 40:
            break

    return {
        "distrito": distrito,
        "etiqueta": etiqueta,
        "sigrid": doc_id,
        "mb": round(ruta.stat().st_size / 1e6, 1),
        "caracteres": len(texto),
        "paginas": texto.count("\f") + 1,
        "conteo": conteo,
        "muestras": muestras,
    }


def main() -> int:
    solo_texto = "--solo-texto" in sys.argv
    filas = [analizar(d, i, e, solo_texto) for d, (i, e) in DOCS.items()]

    ancho = 32
    print(f"{'DISTRITO':<{ancho}} {'MB':>6} {'PÁGS':>5} {'ASOC':>6} {'A.VIV':>6} {'A.H.':>5} {'PJ':>4}")
    print("-" * (ancho + 34))
    for f in filas:
        if "error" in f:
            print(f"{f['distrito']:<{ancho}} ERROR: {f['error']}")
            continue
        c = f["conteo"]
        print(
            f"{f['distrito']:<{ancho}} {f['mb']:>6} {f['paginas']:>5} "
            f"{c['asociacion']:>6} {c['asoc_vivienda']:>6} {c['asentamiento']:>5} {c['pueblo_joven']:>4}"
        )

    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "resumen.json").write_text(
        json.dumps(filas, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\nJSON: {DEST / 'resumen.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
