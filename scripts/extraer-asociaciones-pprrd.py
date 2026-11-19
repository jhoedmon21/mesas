#!/usr/bin/env python
"""
Extrae los nombres de las asociaciones / núcleos urbanos de los PPRRD de
Paucarpata y Yura y los deja en .captura/asociaciones-extraidas.json

Las tablas de estos PDF se leen mejor por el texto en orden que por
find_tables(): la extracción por celdas pierde los espacios entre palabras.

Uso:
    python scripts/extraer-asociaciones-pprrd.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pymupdf

DEST = Path(".captura")
ENTERO = re.compile(r"^\d{1,3}$")


RUIDO = re.compile(
    r"^(PLAN DE PREVENCI|DESASTRES PARA EL PELIGRO|ASOCIADOS DEL DISTRITO"
    r"|ASOCIACIONES FORMALIZADAS|MUNICIPALIDAD PROVINCIAL$)"
)


def lineas(doc: pymupdf.Document, paginas: list[int]) -> list[str]:
    salida: list[str] = []
    for i in paginas:
        for linea in doc[i].get_text("text").splitlines():
            limpia = " ".join(linea.split())
            if limpia and not RUIDO.match(limpia.upper()):
                salida.append(limpia)
    return salida


def pares_numero_nombre(ls: list[str], max_num: int = 999) -> dict[int, str]:
    """Patrón: número suelto y luego el nombre (una o varias líneas)."""
    resultado: dict[int, str] = {}
    i = 0
    while i < len(ls):
        if ENTERO.match(ls[i]) and int(ls[i]) <= max_num:
            numero = int(ls[i])
            i += 1
            partes: list[str] = []
            while i < len(ls) and not ENTERO.match(ls[i]):
                partes.append(ls[i])
                i += 1
                if len(partes) >= 3:  # un nombre no ocupa más de 3 líneas
                    break
            nombre = " ".join(partes).strip(" .-")
            if numero not in resultado and nombre and len(nombre) > 2:
                resultado[numero] = nombre
        else:
            i += 1
    return resultado


def paucarpata() -> list[dict]:
    with pymupdf.open(DEST / "pprrd/paucarpata.pdf") as doc:
        ls = lineas(doc, [14, 15, 16])
    # recorta desde el título de la tabla hasta la fuente
    inicio = next(
        (k for k, v in enumerate(ls) if v.upper().startswith("DIVISIÓN INTERNA")), 0
    )
    fin = next((k for k, v in enumerate(ls) if v.upper().startswith("FUENTE:")), len(ls))
    pares = pares_numero_nombre(ls[inicio:fin], max_num=128)
    return [
        {"numero": n, "nombre": pares[n], "estado": None, "origen": None}
        for n in sorted(pares)
    ]


def yura_cuadro_25() -> list[dict]:
    """Cuadro N° 2-25: dos columnas (N°, Nombre) por fila."""
    with pymupdf.open(DEST / "pprrd/yura.pdf") as doc:
        ls = lineas(doc, [126])
    inicio = next(
        (k for k, v in enumerate(ls) if v.upper().startswith("CUADRO N° 2- 25")
         or v.upper().startswith("CUADRO N° 2-25")), 0
    )
    fin = next(
        (k for k, v in enumerate(ls) if v.upper().startswith("ELABORACIÓN")), len(ls)
    )
    cuerpo = ls[inicio:fin]

    pares = pares_numero_nombre(cuerpo, max_num=21)
    # el estado (COFOPRI / Municipalidad Provincial) aparece como rótulo
    origen_cofopri = range(1, 8)
    salida = []
    for n in sorted(pares):
        origen = (
            "COFOPRI"
            if n in origen_cofopri
            else "Municipalidad Provincial de Arequipa"
        )
        salida.append({"numero": n, "nombre": pares[n], "estado": "Formalizada", "origen": origen})
    return salida


def yura_cuadro_26() -> list[dict]:
    """Cuadro N° 2-26: Nombre, 'Posesión', N°."""
    with pymupdf.open(DEST / "pprrd/yura.pdf") as doc:
        ls = lineas(doc, [127])
    inicio = next(
        (k for k, v in enumerate(ls) if v.upper().startswith("CUADRO N° 2- 26")
         or v.upper().startswith("CUADRO N° 2-26")), 0
    )
    fin = next(
        (k for k, v in enumerate(ls) if v.upper().startswith("ELABORACIÓN")), len(ls)
    )
    cuerpo = ls[inicio:fin]

    salida: list[dict] = []
    buffer: list[str] = []
    for linea in cuerpo:
        if linea.lower().startswith("posesión") or linea.lower().startswith("posesion"):
            nombre = " ".join(buffer).strip(" .-")
            # la primera fila arrastra el rótulo del cuadro: se corta hasta el nombre
            nombre = re.sub(
                r"^.*?(?=\bASOC\b|\bURB\.|\bA\.H\.|\bAA\.HH\b|\bPUEBLO\b|\bPROFAM\b|\bUPIS\b|\bASEN\b)",
                "",
                nombre,
            ).strip(" .-")
            if nombre and len(nombre) > 4:
                salida.append(
                    {"numero": None, "nombre": nombre, "estado": "Posesión", "origen": "Predio con posesión"}
                )
            buffer = []
        elif ENTERO.match(linea) or linea.upper().startswith("LOCALIDAD"):
            continue
        else:
            buffer.append(linea)
    return salida


AREA = re.compile(r"^\d+[.,]\d+$")
NUM_FILA = re.compile(r"^\d{1,2}$")

# el tipo de unidad se parte en dos líneas cuando es largo
TIPO_LARGO = re.compile(
    r"^(Asociaci[oó]n de Vivienda de|Asociaci[oó]n de Vivienda|Asociaci[oó]n|"
    r"Asentamiento Humano|Pueblo Joven|Urbanizaci[oó]n|Villa|Cooperativa)",
    re.I,
)


def mariano_melgar() -> list[dict]:
    """§5.2 Identificación de sectores críticos: N° | tipo | nombre | área | área."""
    with pymupdf.open(DEST / "pprrd/mariano-melgar.pdf") as doc:
        ls: list[str] = []
        for i in range(69, 74):
            ls += [
                " ".join(l.split())
                for l in doc[i].get_text("text").splitlines()
                if l.strip()
            ]

    salida: list[dict] = []
    k = 0
    while k < len(ls) - 2:
        if NUM_FILA.match(ls[k]) and int(ls[k]) == len(salida) + 1:
            tipo = ls[k + 1]
            if not TIPO_LARGO.match(tipo):
                k += 1
                continue
            j = k + 2
            partes: list[str] = []
            while j < len(ls) and not AREA.match(ls[j]) and len(partes) < 3:
                partes.append(ls[j])
                j += 1
            if j < len(ls) and AREA.match(ls[j]) and partes:
                nombre = " ".join(partes).strip(" .-")
                # «Asociación de Vivienda de» + «Interés Social El Buen Pastor»
                nombre = re.sub(r"^Inter[eé]s Social\s+", "", nombre, flags=re.I)
                salida.append(
                    {
                        "numero": int(ls[k]),
                        "nombre": nombre,
                        "estado": None,
                        "origen": tipo,
                    }
                )
                k = j
                continue
        k += 1
    return salida


def main() -> int:
    p = paucarpata()
    y25 = yura_cuadro_25()
    y26 = yura_cuadro_26()
    mm = mariano_melgar()

    datos = {
        "paucarpata": {"fuente": "PPRRD Paucarpata 2025-2028, Tabla 1", "sigrid": 18825,
                       "paginas": "15-16", "items": p},
        "yura": {"fuente": "PPRRD Yura 2022-2024, Cuadros N° 2-25 y 2-26", "sigrid": 15166,
                 "paginas": "127-128", "items": y25 + y26},
        "mariano-melgar": {"fuente": "PPRRD Mariano Melgar 2022-2026, §5.2 sectores críticos",
                           "sigrid": 18826, "paginas": "70-72", "items": mm},
    }
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "asociaciones-extraidas.json").write_text(
        json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"paucarpata: {len(p)} (esperado 128)")
    print(f"yura 2-25:  {len(y25)} (esperado 21)")
    print(f"yura 2-26:  {len(y26)} (esperado 35)")
    print(f"yura total: {len(y25) + len(y26)} (esperado 56)")
    print(f"mariano melgar: {len(mm)} (esperado 18)")
    print("\nprimeras de Paucarpata:")
    for it in p[:5]:
        print("  ", it["numero"], it["nombre"])
    print("últimas de Paucarpata:")
    for it in p[-4:]:
        print("  ", it["numero"], it["nombre"])
    print("\nmuestra de Yura 2-26:")
    for it in y26[:4]:
        print("  ", it["nombre"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
