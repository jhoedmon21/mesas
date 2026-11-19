# Fuentes de asociaciones para los 15 distritos del tablero

Fecha de trabajo: 18 de noviembre de 2026.

> **Estado: documento histórico.** La extracción que se describe aquí se retiró
> de la plataforma el 18/11/2026. Los nombres salían del PPRRD, pero la
> coordenada de la mayoría era una colocación aproximada y el resultado se leía
> como padrón verificado. Hoy el tablero solo carga las 84 asociaciones de Cerro
> Colorado y, en los otros catorce distritos, la alerta de visita cercana apunta
> al local de votación de ONPE. El documento se conserva como registro de la
> búsqueda de fuentes y de por qué no hay padrón público.

## Qué se buscó

El distrito de Cerro Colorado tiene 84 asociaciones con nombre documentado porque
su PPRRD 2018 trae el Cuadro N°30 «Asociaciones de vivienda». Este documento
responde una sola pregunta para los otros 14 distritos:

> ¿Existe una fuente pública con los **nombres** de las asociaciones de vivienda,
> asentamientos humanos o pueblos del distrito?

Se buscó el mismo tipo de instrumento: **PPRRD** (Plan de Prevención y Reducción
del Riesgo de Desastres), PDU o plan de usos del suelo.

## Resultado en una tabla

| Distrito | Fuente | SIGRID | Págs | ¿Lista de nombres? | Entradas |
|---|---|---|---|---|---|
| **Paucarpata** | PPRRD 2025-2028, Tabla 1 «División interna» | 18825 | 166 | **Sí, completa** | **128** |
| **Yura** | PPRRD 2022-2024, Cuadros N° 2-25 y 2-26 | 15166 | 211 | **Sí, completa** | **58** |
| **Mariano Melgar** | PPRRD 2022-2026, §5.2 Sectores críticos | 14808 | 96 | Parcial | **18** |
| **Cerro Colorado** | PPRRD 2018, Cuadro N°30 (ya en el repo) | 6216 | 170 | **Sí, completa** | 146 |
| Miraflores | PPRRD 2025-2028 | 19503 | 120 | No | — |
| Cayma | PPRRD 2022-2026 | 17238 | 105 | No | — |
| Alto Selva Alegre | PPRRD | 14616 | 85 | No | — |
| Socabaya | PPRRD 2022-2025 | 15230 | 130 | No | — |
| José Luis Bustamante y Rivero | PPRRD 2024-2027 | 17813 | 160 | No | — |
| Jacobo Hunter | PPRRD 2021-2025 | 13983 | 246 | No | — |
| Yanahuara | PPRRD | 19776 | 100 | No | — |
| Arequipa (provincia) | PPRRD provincial | 17408 | 317 | No | — |
| Majes (Caylloma) | PPRRD provincial Caylloma | — | 143 | No | — |
| Mollendo | Plan de usos del suelo | 4321 | 328 | No | — |
| Arequipa (cercado) | **sin PPRRD localizado** | — | — | — | — |
| La Joya | **sin PPRRD localizado** | — | — | — | — |

Cuatro distritos suman **350 unidades territoriales con nombre** — más de cuatro
veces lo que hay hoy para Cerro Colorado.

## Los cuatro con lista utilizable

### Paucarpata — 128 pueblos

`SIGRID 18825`, PPRRD para el peligro de lluvias 2025-2028, páginas 15-17.

> «El Distrito de Paucarpata está conformado por **128 pueblos**, los cuales se
> encuentran sectorizados y delimitados en el plano básico de la Gerencia de
> Desarrollo Urbano.»

La **Tabla 1** los enumera completa. Mezcla AA.HH., asociaciones de vivienda,
pueblos jóvenes, cooperativas y urbanizaciones, así que hay que clasificar
después. Muestras reales: `Asoc. Viv. Las Mercedes`, `Asoc. Viv. Cerrito de
Huacsapata`, `Asoc. Prog. Pro-Viv. Granjita`, `Asociación de Vivienda La Isla`,
`Asoc. Viv. Unión Cahuaya Rosaspata`, `AA.HH. Naciones Unidas`, `P.J. Ampliación
Alto Jesús`.

Ventaja sobre Cerro: es la **división interna oficial** del distrito, no un
listado de riesgo.

### Yura — 58 núcleos urbanos

`SIGRID 15166`, PPRRD 2022-2024, páginas 127-128.

- **Cuadro N° 2-25** — 21 núcleos formalizados, separados por origen:
  *COFOPRI* (A.H. Hijos de Ciudad de Dios, A.H. Los Milagros, Asoc. Urbanizadora
  Ciudad de Dios, Villa de Cristo, Pueblo Tradicional Yura Viejo, Pueblo Joven
  Porvenir Yura, Pueblo Tradicional El Balneario, Pueblo Tradicional La Calera,
  etc.) y *Municipalidad Provincial* (PROFAM Sector 1 y 2, Asoc. Bella Vista,
  Asoc. Paraíso, La Pascana, PROFAM Sector 3, Asoc. Abelardo Quiñones, Asoc.
  Salamanca).
- **Cuadro N° 2-26** — 37 asociaciones con estado **«Posesión»**, entre ellas
  Asoc. Pequeños Agropecuarios Villa Uyupampa, Asoc. Virgen de la Candelaria
  Anexo Quiscos, Asoc. Casa Granja Monte Sinaí 2 y 3, Asoc. de Vivienda Los
  Andenes del Cono Norte, Asoc. Villa Tambo, Asoc. Real Progreso.

Es la fuente más limpia de las tres: trae **nombre + estado legal + origen**.

### Mariano Melgar — 18 sectores críticos

`SIGRID 14808`, PPRRD ante actividad eruptiva del Misti 2022-2026, páginas 68-72.
La tabla «Identificación de sectores críticos» numera 18 unidades y las nombra:
Asociación de Vivienda Héroes del Cenepa, Flor de Oro, Asociación Urbanización
Nuevo Milenio, Asociación de Vivienda de Interés Social El Buen Pastor, Asociación
de Vivienda Sagrado Corazón de Jesús, Asociación de Vivienda Taller Los Pinos…

Es **parcial**: solo lista las que tienen riesgo alto o medio, no todo el distrito.

### Cerro Colorado — 146

Ya documentado en `docs/validacion-asociaciones.md`. Cuadro N°30 del PPRRD 2018,
146 entradas, de las cuales 84 están en el modelo.

## Los ocho que no traen padrón

Miraflores, Cayma, Alto Selva Alegre, Socabaya, José Luis Bustamante y Rivero,
Jacobo Hunter, Yanahuara y el PPRRD provincial de Arequipa siguen la **plantilla
estándar de CENEPRED** (RJ 082-2016). Su índice es siempre el mismo:

```
2.3  Identificación de peligros del ámbito
     2.3.1 Características del ámbito
     2.3.2 Identificación de peligros
2.4  Identificación de los elementos expuestos y vulnerabilidades
     2.4.1 Identificación de sectores críticos
     2.4.2 Análisis de vulnerabilidad distrital
```

No hay sección de asociaciones ni de asentamientos humanos. Se verificó leyendo
el índice de cada uno (los ocho son PDF escaneado, sin capa de texto; el índice
se extrajo con OCR). Los que sí tienen tabla —Paucarpata, Yura— la delatan en el
índice, así que la prueba es fiable.

El PPRRD provincial de Arequipa (317 páginas, con capa de texto) no menciona
«ASOCIACIÓN» ni una sola vez.

## Los dos sin fuente

- **Arequipa (cercado).** No hay PPRRD distrital en SIGRID. El provincial no
  sirve. La vía alternativa es el **Plan de Desarrollo Metropolitano de Arequipa**
  (`muniarequipa.gob.pe/descargas/transparencia/pdm/`), que cubre 11 distritos y
  sí habla de asentamientos, pero es un documento normativo, no un padrón.
- **La Joya.** Sin PPRRD en SIGRID (0 resultados para la entidad `MD LA JOYA`).
- **Mollendo.** La Municipalidad Provincial de Islay publicó un PPRRD el
  22/12/2023 en gob.pe pero **sin adjunto descargable**. Lo más cercano es el
  «Mapa de peligros, plan de usos del suelo y medidas de mitigación» (SIGRID
  4321, 328 páginas), que solo menciona «ASOCIACIÓN» 13 veces. Habría que pedir
  el PPRRD por Mesa de Partes.
- **Majes.** Depende del PPRRD provincial de Caylloma (143 páginas): 3 menciones
  de «ASOCIACIÓN», ninguna es un padrón.

## Límite que comparten todas las fuentes

Ninguna trae **coordenadas**. Igual que con Cerro Colorado, los nombres son
reales y verificables, pero la geometría tendría que generarse con el mismo
método de bloques esquemáticos (`scripts/generar-asociaciones.mjs`), o buscarse
aparte en el plano básico de la Gerencia de Desarrollo Urbano de cada
municipalidad.

## Reproducir

```bash
# descarga los 12 PPRRD de SIGRID y mide menciones
python scripts/analizar-pprrd.py

# OCR del índice de los escaneados (requiere rapidocr-onnxruntime)
python scripts/ocr-indice-pprrd.py
```

Los PDF quedan en `.captura/pprrd/` y el resumen en
`.captura/pprrd/resumen.json`.
