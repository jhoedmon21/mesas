# Cerreño 3D — Centros de Mando de Cerro Colorado

Plataforma territorial con dos centros de mando sobre el mismo mapa satelital y
de relieve: el **gemelo digital territorial** (brecha de saneamiento, agua,
pistas, seguridad y empleo juvenil en las 84 asociaciones del distrito) y el
**mando electoral de Arequipa 2026** (resultados ONPE de primera vuelta, 29
distritos y aritmética del balotaje).

## Rutas

| Ruta | Módulo |
|---|---|
| `/` | Portada de acceso a ambos centros de mando |
| `/territorio` | Gemelo digital territorial y simulador de escenarios |
| `/electoral` | Mando electoral Arequipa 2026 |

> **Tres niveles de dato, tres niveles de certeza.** Los votos y márgenes por
> distrito provienen de ONPE (ERM 2026). Los indicadores territoriales de las 84
> asociaciones de Cerro Colorado (titulación, agua, pistas, cámaras, empleo) son
> estimaciones de trabajo del modelo y no constituyen certificación registral ni
> padrón de beneficiarios. Las ubicaciones de las 65 asociaciones añadidas son
> contornos esquemáticos muestreados dentro del anillo distrital, no levantamientos
> catastrales. La lectura por mesa sale de las **actas ONPE** (código de acta y
> votos por candidatura); el punto se apoya en el local de votación publicado por
> ONPE y se separa unos metros cuando varias mesas comparten sede.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- MapLibre GL JS 5 con:
  - satélite **Esri World Imagery** (sin API key)
  - relieve **AWS Terrarium DEM** (sin API key) como `hillshade`
- Deck.gl 9 con `GeoJsonLayer`, `TripsLayer`, `PathLayer` y `TextLayer`
- Lucide React para iconografía

## Ejecutar

**En Windows, la forma más simple:** doble clic en `INICIAR.bat`. Levanta el
servidor y abre el navegador solo.

**Desde terminal:**

```bash
npm install
npm run dev        # http://localhost:3001
npm run typecheck
npm run build
npm start          # http://localhost:3001
```

> **Puerto 3001, no 3000.** En este equipo el puerto 3000 está ocupado por un
> proxy del entorno: `next dev` lo detectaba, se cambiaba a 3001 y la URL
> habitual devolvía 502. Los scripts fijan el puerto explícitamente para que la
> dirección sea siempre la misma.

Requiere conexión a internet para los tiles satelitales y el DEM. Si el
dispositivo no soporta WebGL, los paneles de resultados siguen operativos.

## Qué muestra

### Escala provincia — 29 distritos

- Coropleta divergente por margen Zegarra − **rival seleccionado**: cian cuando
  gana Zegarra, color del rival cuando gana el rival, gris en empate técnico
  (±0.5 pp).
- La **altura de extrusión** es proporcional a los votos válidos del distrito,
  no al resultado: el mapa muestra dónde hay votos, no quién ganó más alto.
- Panel izquierdo: distritos ganados, los perdidos, el distrito decisivo y los
  márgenes más cortos frente a ese rival.
- Panel derecho: selector de rival, voto a consolidar, bastiones del rival,
  Cerro Colorado, balotaje real y agenda territorial de Cerro Colorado.

### Prioridad distrital — 15 distritos

El combo **Distrito · N de 15** cambia el tablero completo: cámara, polígono
activo, panel lateral, barra inferior y alcance del PDF. Los 15 están ordenados
por pozo de otras candidaturas, no por votos válidos.

Los contornos son los **límites distritales reales** de la cartografía
distrital del INEI publicada en `josedaniel-cb/limites-peru-geojson` (MIT):
9,354 vértices en `data/limitesDistritalesReales.ts`, incluidos Majes
(Caylloma) y Mollendo (Islay). Reemplazan los polígonos esquemáticos de la
capa anterior.

El panel del distrito replica, para los 15, la lectura que Cerro Colorado tenía
con sus 84 asociaciones, pero en la granularidad que el dato permite:

- resultado Zegarra − Huisa, avance a +10 pp y margen local;
- pozo de otras candidaturas: votos en disputa, 5% del pozo y peso sobre los
  válidos (el mismo denominador de la barra de composición);
- composición del voto y **quién tiene el pozo** (top 5 de las 13 candidaturas);
- **ranking real de las 15 candidaturas** en el distrito, con votos y %;
- **frente a los 14 rivales**, ordenado por cercanía del margen;
- **plan de 19 jornadas** hasta el balotaje del 06 dic 2026;
- actas y participación, y el ranking de los 15 distritos por pozo.

Los totales de cada distrito salen de la matriz ONPE de 15 candidaturas (actas
al 100%), no de la tabla redondeada de priorización: así el panel, la ficha y el
mapa no muestran dos pozos distintos para el mismo distrito. La tabla solo fija
el orden (puesto 1..15). Majes (Caylloma) y Mollendo (Islay) están fuera de la
matriz provincial: sus totales se suman de sus propias actas por mesa —el mismo
conteo que dibuja la capa de mesas—, y el panel advierte que no hay desglose de
la matriz provincial en lugar de imputarlo.

Los 15 distritos tienen **actas ONPE por mesa** (3,115 mesas: las 506 de Cerro
Colorado más 2,609 en los otros catorce) y un local de votación
georreferenciado. Cerro Colorado conserva además sus 84 asociaciones de barrio y
su plan por zona; en los demás el punto del mapa es el local de votación. El PDF
imprime su propia ficha A4 con el ranking de las 15, los 14 frentes, las mesas y
el plan de jornadas.

El catálogo de locales sale de `GEO_LOCALES` de ONPE (latitud y longitud por
sede); el nombre del local del acta es la clave de cruce. Si un local no se
encuentra, la mesa cae en el centro del distrito y la ficha la marca como punto
aproximado: no se inventa una dirección. Las mesas de un mismo local se separan
unos metros de forma determinista para poder seleccionarlas.

En el mapa, la tarjeta de contexto (plegable en móvil) resume el distrito y
cuántas mesas y locales tiene; la leyenda se pliega en pantalla pequeña, los
controles de cámara se apartan de la barra inferior y la ficha distrital se abre
como hoja inferior.

### Frente a cualquier candidatura

La primera vuelta no fue solo Zegarra contra Huisa. `data/candidatosArequipa2026.ts`
guarda la matriz completa —**15 candidaturas × 29 distritos**, verificada contra
los 676,523 votos válidos— y `lib/rivales.ts` calcula el frente a frente contra
cualquiera de las 14 candidaturas restantes.

Lo que aparece al cambiar de rival:

- **Huisa** (98,425 · 14.55%): pierde 3 distritos — San Juan de Siguas (−8.62),
  Yarabamba (−7.39) y Cayma (−0.10 pp, 56 votos).
- **Cornejo** (90,196 · 13.33%): pierde 3 distritos — Polobaya (−6.31), Yura
  (−1.48) y Vitor (−0.42). Pero el dato relevante está en Cerro Colorado:
  **23,910 vs 23,681, apenas 229 votos de diferencia** sobre 107,335 válidos.
  Es el segundo real del distrito más grande de la provincia, no Huisa.
- **Cáceres** (69,736 · 10.31%): gana **7 distritos** — La Joya, Pocsi, Polobaya,
  San Juan de Siguas, San Juan de Tarucani, Vitor y Yura.

Contar solo contra Huisa infla la lectura: con el campo completo Zegarra fue
primera fuerza en **19 de 29** distritos (Cáceres en 7, Huisa en 2, Huamantuma
en 1) y segundo más votado en 5. Huisa queda segundo en 10 distritos y Cornejo
en 6.

El panel derecho separa el **voto a consolidar** en dos bloques (donde el rival
gana / donde el rival pierde) y ordena sus bastiones por volumen, para decidir
dónde se concentra el trabajo territorial.

### Escala Cerro Colorado — 84 asociaciones

- Cada polígono se colorea por índice compuesto de necesidad (titulación, agua,
  pistas, seguridad, empleo) y se extruye según ese índice.
- Clic en una asociación: ficha con brechas por dimensión, demanda prioritaria,
  cámaras y vacantes faltantes, carga social y MyPEs.
- Rutas animadas de agua/pistas y al traslado al Parque Industrial Río Seco.

La capa completa son 84 asociaciones: 8 sectores APIPA que ya estaban dibujados
(I, III, V, VII, X, XIII, XVI y XVIII) más los 10 que faltaban (II, IV, VI, VIII,
IX, XI, XII, XIV, XV y XVII), los sectores de José Luis Bustamante y Rivero y 45
asociaciones más de Cono Norte, Eje Comercial, Zona Tradicional, Parque
Industrial y Área de Expansión.

**Cómo se generaron las 65 nuevas.** `scripts/generar-asociaciones.mjs` toma los
19 bloques originales, muestrea un centro para cada asociación dentro de la
ventana de su sector y acepta el bloque sólo si todo su contorno cae dentro del
anillo de Cerro Colorado, no se superpone con otro y queda a 30 m o más de sus
vecinos. El resultado vive en `data/asociacionesRestantes.ts` y se regenera con:

```bash
node scripts/generar-asociaciones.mjs
```

**Lectura electoral.** Las 84 asociaciones no son 84 unidades electorales
equivalentes. Sólo **45 tienen mesas** asignadas de las actas ONPE y las otras
39 son contexto territorial. Las **2 zonas con más válidos concentran el 51%**
del electorado, las **5 el 75%** y las **10 el 91%**. La zona más grande, Parque
Industrial Río Seco (35,164 válidos), tiene un margen Zegarra − Huisa de apenas
**+1.0 pp**: ahí está el mayor pozo de votos, no en las asociaciones más
necesitadas. La capa de mesas usa el código de acta real de ONPE.

**Prioridad electoral.** Es el modo inicial del panel: el selector *Prioridad
electoral / Necesidad* cambia la lectura sin ocultar nada. Ordena las 84
asociaciones por votos válidos, pinta el top 10 (90.8% del electorado) en ámbar
como **zonas de importancia** —altura según volumen de válidos— y deja el resto
en gris translúcido. El margen Zegarra − Huisa sigue en el tooltip y en la lista.
El contador **84 de 84** permanece visible en el panel y en la leyenda del mapa;
las 39 asociaciones sin mesas quedan como contexto y no entran al ranking.

Cada zona muestra además su brecha local a +10 pp: los votos netos que le faltan
para que su propio margen llegue a 10%. La meta distrital es **+4,369 netos**
(de +5.93 a +10 pp); cerrar las diez brechas locales del top 10 suma **+4,970**
y dejaría el distrito en **+10.6 pp**. La cifra por zona se calcula con
`votosNetosParaMeta()` en `lib/estrategia.ts`.

**Población.** Al pasar de 19 a 84 polígonos, la suma de familias se normaliza a
la población distrital de INEI (262,000 hab. a 3.64 personas por familia). Se
conserva la proporción de cada asociación y se escalan cámaras y vacantes con el
mismo factor para que las brechas no cambien. La verificación imprime el total y
comprueba que no haya polígonos encimados:

```bash
node --experimental-strip-types --loader ./scripts/alias-loader.mjs \
  scripts/verificar-asociaciones.ts
```

### Balotaje

La meta se calcula con aritmética explícita, no con proyecciones: si Zegarra y
Huisa conservan íntegro su voto de primera vuelta, Zegarra necesita
`(huisa + otras − zegarra) / 2` votos del pozo de las demás candidaturas. La
fórmula está documentada en `lib/electoral.ts` y se imprime con el pozo y el
porcentaje exigido.

### Mesas y pérdidas

El panel de estrategia por zona ya no tiene botón en la barra; su lectura por
mesa y zona quedó en la ficha de mesa y en la vista de asociaciones. La capa
**Mesas y pérdidas** dibuja las actas reales de ONPE y colorea cada mesa por lo
que decide la campaña, no solo por quién ganó:

| Tono | Regla | Qué significa |
|---|---|---|
| **Ámbar** | 1.º y 2.º a menos de **5 pp** | En disputa: victoria frágil o derrota remontable. Es donde se trabaja. |
| **Verde** | gana Zegarra por 5 pp o más | Ventaja con margen |
| **Rojo** | gana un contrincante por 5 pp o más | Pérdida con margen |

El margen se mide entre el **primero y el segundo**, no entre Zegarra y Huisa:
una mesa donde gana un tercero por dos puntos no está ganada ni perdida frente a
Zegarra, está en disputa. El umbral vive en `lib/mesas.ts`
(`UMBRAL_DISPUTA_PP`) y es el único número que hay que tocar para abrir o cerrar
el foco. Los grupos del mapa dibujan el mismo pastel de tres tonos, y el filtro
de la leyenda separa **disputa / ganadas / perdidas** —las tres cifras suman el
total—.

Al pasar el cursor se lee la mesa, el local, el ganador, la diferencia 1.º−2.º y
el tono; al hacer clic se abre la ficha con la ubicación y el detalle de **contra
quién se perdió**, el reparto completo de las 15 candidaturas y el frente contra
el rival elegido. El código que se muestra es el código de acta publicado por
ONPE.

**Una cifra, un lugar.** Para que cuatro paneles no digan lo mismo con números
distintos: la barra superior lleva el resultado del distrito (Zegarra y margen),
la tarjeta del mapa lleva la cobertura (mesas con acta y locales), el panel
lateral lleva el avance a la meta y el análisis del pozo, y la barra inferior
lleva el corte de actas (válidos, electores, fecha). Ningún dato se repite entre
ellos. La tarjeta de contexto aparece en los 15 distritos, Cerro Colorado
incluido.

> **Fuente.** `data/actasCerroColorado.ts` guarda las 506 actas del distrito y
> `data/actasDistritosJson.ts` las de los otros 14, capturadas del detalle de
> ONPE (ERM 2026, Gobernador Regional). La suma de votos de cada acta coincide
> con sus válidos y los totales del distrito cierran contra la fila ONPE. Las
> coordenadas de los locales vienen de `GEO_LOCALES`; el único dato estimado es
> el temblor de unos metros cuando varias mesas comparten sede.

**Ubicación.** Cada mesa se apoya en un local de votación real del distrito
(46 locales de la captura ONPE, 39 georreferenciados con OpenStreetMap y
asignados a la asociación más cercana en `data/localesZona.ts`). Si la asociación
no tiene local identificado, la mesa cae en un punto aproximado del polígono y
la ficha lo advierte. Las mesas de un local comparten sus códigos de acta de
ONPE, de modo que la ficha muestra la codificación real cuando existe.

### Vista de asociaciones

El botón **Asociaciones** abre la tabla de decisión de las 84. Las columnas son
ordenables: puesto por válidos, sector, CUI, válidos, mesas, margen Zegarra −
Huisa, netos para +10 pp, netos por mesa e índice de necesidad. Se filtra por
búsqueda, sector y alcance (todas, top 10, con mesas o sin mesas), y cada fila
tiene **Ver** para ubicar la zona en el mapa.

Cada zona con mesas abre un **Plan de campo**: reparte los netos objetivo entre
las 19 jornadas al balotaje del 06 dic 2026, calcula la meta diaria y lista las
cinco mesas de peor margen con su acta ONPE y la brecha a remontar. El plan se
imprime en A4 vertical con espacio para responsable y avance. El corte filtrado
también se descarga en CSV o se imprime en A4 horizontal con la meta distrital y
la nota de fuente. No es una proyección de voto: ordena el trabajo
territorial por volumen y brecha.

## Estructura

```
app/
  layout.tsx             Metadatos, viewport y fuente HUD
  page.tsx               Portada de acceso a ambos módulos
  territorio/page.tsx    Entrada del gemelo digital territorial
  electoral/page.tsx     Entrada del mando electoral
  globals.css            Glassmorphism, sliders, animaciones y estilos de impresión
components/
  Portada.tsx            Acceso a los dos centros de mando
  ElectoralDashboard.tsx Estado compartido de escala, capas, selección y PDF
  ElectoralMap.tsx       MapLibre + Deck.gl: distritos, asociaciones y flujos
  TopBarElectoral.tsx    Marca, marcador provincial, escala y vuelos de cámara
  PanelProvincia.tsx     Frente al rival: ganados, perdidos y márgenes cortos
  PanelAgenda.tsx        Selector de rival, voto a consolidar y agenda
  PanelEstrategia.tsx    Pérdidas por mesa/zona (ya sin botón en la barra)
  PanelDistrito.tsx      Resultado, pozo, meta +10 pp y ranking de los 15
  FichaDistritoPrioridad.tsx  Ficha A4 imprimible de cada distrito
  PanelAsociaciones.tsx  Tabla de las 84: orden, filtros, CSV e impresión A4
  DistritoModal.tsx      Ficha del distrito con ranking de las 15 candidaturas
  AsociacionModal.tsx    Ficha territorial de la asociación
  BarraElectoral.tsx     Telemetría inferior y generación de PDF
  FichaElectoral.tsx     Ficha A4 de distrito
  FichaAsociacion.tsx    Ficha A4 de asociación
  FichaProvincia.tsx     Informe A4 provincial (29 distritos y balotaje)
data/
  electoralArequipa2026.ts  29 distritos: votos y actas (geometría esquemática)
                            el mapa de 15 usa los límites reales de abajo
  limitesDistritalesReales.ts  15 distritos: límites reales INEI (9,354 pts)
  distritosPrioridad.ts     15 distritos por pozo: totales, meta y encuadre
  candidatosArequipa2026.ts Matriz 15 candidaturas × 29 distritos (ONPE)
  actasCerroColorado.ts     506 actas ONPE del distrito (local, votos, código)
  actasDistritosJson.ts     Actas ONPE de los otros 14 distritos (generado)
  localesDistritos.ts       286 locales de los 15 distritos con lat/lon (generado)
  mesasDistritos.ts         Mesas de los 15 distritos: acta + local + ganador
  mesasCerroColorado.ts     506 mesas de Cerro Colorado ancladas a sus actas
  localesZona.ts            39 locales georreferenciados por asociación (generado)
  onpe-actas.json           Captura de actas: local, electores y votos Zegarra/Huisa
  onpe-locales.json         46 locales de votación del distrito
  onpe-locales-geo.json     Coordenadas OSM de los locales (39 con match)
  cerroColoradoGeo.ts       84 polígonos, estados legales, CUI, corredores y redes
  asociacionesRestantes.ts  65 asociaciones nuevas (generado por script)
lib/
  electoral.ts          Resumen provincial, márgenes, meta de balotaje y colores
  rivales.ts            Frente a frente contra las 14 candidaturas y colores
  estrategia.ts         Cruce mesas × necesidades y prioridad por zona
  agenda.ts             Brechas por dimensión e índice de necesidad
  camara.ts             Encuadres de cámara
  layers.ts             Catálogo de capas del visor
  format.ts             Formato es-PE
  useAnimatedNumber.ts  Conteo animado de métricas
```

El tablero territorial (`Dashboard.tsx`, `Map3DCanvas.tsx`, `HudTopBar.tsx`,
`HudLeftMetrics.tsx`, `HudRightControls.tsx`, `AssociationModal.tsx`,
`TelemetryBar.tsx`, `FichaPrint.tsx`) se monta en `/territorio`; el electoral
(`ElectoralDashboard.tsx` y sus paneles) se monta en `/electoral`.

## Interacciones

- **Clic en distrito**: vuelo de cámara + ficha con reparto del voto, actas,
  diferencia, lectura de balotaje y agenda (si es Cerro Colorado).
- **Escala**: alterna entre los 29 distritos y las 84 asociaciones del distrito.
  Al volver a provincia se cierra la ficha de asociación.
- **Capas**: satélite + relieve, resultado por distrito, asociaciones, mesas y
  pérdidas, redes de agua/pistas y rutas al empleo.
- **Vuelos de cámara**: Conurbación, Cerro Colorado, Cono Norte y Provincia
  completa.
- **PDF**: imprime el alcance visible — informe provincial en la vista de los 29
  distritos, ficha de distrito al seleccionarlo (o en la escala Cerro Colorado) y
  ficha de asociación al abrir una. El botón inferior muestra el alcance, igual
  que `Ctrl+P`. Cada ficha incluye fuente ONPE, fecha de descarga y firmas de
  responsabilidad; las de asociación añaden folio CUI.
- **Responsive**: paneles laterales en laptop; botones desplegables y hoja
  inferior en celular.

## Notas técnicas

- El mapa se carga con `dynamic(..., { ssr: false })` para evitar errores de
  hidratación de WebGL.
- **Relieve sin malla de terreno (decisión deliberada).** El DEM Terrarium se
  usa como *hillshade*, no como `setTerrain()`. Con terreno activo, MapLibre
  coloca la superficie a ~2,400 m de altitud mientras Deck.gl proyecta sus capas
  sobre el plano `z = 0`; el resultado son polígonos flotando sobre la imagen.
  El sombreado de relieve conserva la lectura topográfica y mantiene los datos
  apoyados en el suelo.
- Los flujos usan `TripsLayer` con timestamps acumulados por longitud de ruta,
  de modo que la animación recorre cada corredor a velocidad uniforme.
- Los conteos animados arrancan en el valor real, no en 0: si el primer frame se
  retrasa mientras Deck.gl compila shaders, el HUD nunca muestra ceros falsos.
- Los códigos ubigeo de ONPE **no coinciden** con los de INEI; el cruce con las
  geometrías se hace por nombre. No unir por ubigeo.
- El diseño respeta `prefers-reduced-motion` para animaciones CSS y conteos.

## Verificación

```bash
npm run typecheck
npm run build

# capa territorial: 84 asociaciones, APIPA I–XVIII, anillo y superposiciones
node --experimental-strip-types --loader ./scripts/alias-loader.mjs \
  scripts/verificar-asociaciones.ts

# mesas: 15 distritos, cobertura por local y totales contra la matriz ONPE
node --experimental-strip-types --loader ./scripts/alias-loader.mjs \
  scripts/verificar-mesas-distritos.ts
```

El verificador de mesas imprime, por distrito, cuántas mesas y locales hay,
cuántas quedaron sin local georreferenciado y la diferencia entre la suma de
actas y el total oficial. Con los 15 distritos capturados, todas las
diferencias deben ser 0 (Majes incluido, que suma sus propias actas).

`npm run build` compila las tres rutas como estáticas. La portada carga sin
WebGL; los mapas de `/territorio` y `/electoral` se importan con
`dynamic(..., { ssr: false })`.

La trazabilidad de los nombres y el resultado de la consulta al padrón de SUNAT
están en [docs/validacion-asociaciones.md](docs/validacion-asociaciones.md).
SUNARP no pudo automatizarse porque su directorio de personas jurídicas está
detrás de un captcha de Cloudflare; el documento explica qué falta para cerrar
la validación registral.

## Fuente electoral

ONPE, Presentación de Resultados ERM 2026, elección de Gobernador Regional de
Arequipa, primera vuelta del 4 de octubre de 2026, actas 100% contabilizadas.
Segunda vuelta: 6 de diciembre de 2026.
