# Cerreño 3D · Manual de la plataforma

**Mando Electoral Arequipa 2026 — segunda vuelta Zegarra vs. Huisa, 6 de diciembre.**

Este documento explica qué hace cada parte de la plataforma, para qué sirve, de
qué dato sale y qué no debe asumirse de ella. Está escrito para uso de campaña,
no para desarrolladores: el detalle técnico vive en los comentarios del código.

---

## 1. Qué es y para qué sirve

Un tablero territorial de los **15 distritos** de la provincia de Arequipa que
cruza tres cosas:

1. **El resultado real de la primera vuelta**, mesa por mesa, tal como lo publicó
   ONPE (3.115 mesas, 286 locales de votación, 651.703 votos válidos).
2. **La aritmética del balotaje**: en la segunda vuelta solo quedan Zegarra y
   Huisa, y los **385.091 votos** de las trece candidaturas eliminadas —el
   *pozo*— son el premio.
3. **El territorio**: dónde está cada mesa, qué locales concentran el voto, qué
   asociaciones de vivienda existen y cuánto cuesta llegar a cada una.

**Para qué sirve, en una frase:** decir dónde conviene poner una carpa, en qué
orden recorrer los locales y dónde NO gastar, con aritmética sobre actas ya
contadas en lugar de intuición.

**Lo que no es:** no es una encuesta ni una proyección de voto. No estima
intención. Todo lo que muestra son actas ya contadas y divisiones sobre ellas.

---

## 2. Cómo se abre

- Doble clic en **`INICIAR.bat`**. Libera el puerto 3001, compila si no hay build
  y abre el navegador en `http://localhost:3001`.
- La app es un Next.js con exportación estática: no necesita internet para
  funcionar, solo para las teselas del mapa base.
- Si ya hay build, arranca en menos de un segundo.

---

## 3. La pantalla

```
┌──────────────────────────────────────────────────────────────┐
│ TOP BAR   Cerreño 3D · distrito activo · margen · meta +10pp │
├───────────────┬──────────────────────────────┬───────────────┤
│  PANEL IZQ.   │            MAPA              │  PANEL DER.   │
│  ficha del    │  mesas · locales · límites   │  resultado y  │
│  distrito     │  asociaciones · ruta         │  mesas/local  │
├───────────────┴──────────────────────────────┴───────────────┤
│ BARRA INFERIOR  actas · válidos · fecha · Plan · Informe PDF │
└──────────────────────────────────────────────────────────────┘
```

### Top bar
Nombre del distrito activo, posición en el ranking (ej. «distrito 2 de 15»),
porcentaje de Zegarra y el avance hacia la meta de +10 puntos.

### Barra inferior
Totales del distrito activo (actas, válidos, electores), la fecha del balotaje y
el acceso al **Informe PDF**. El botón del plan de campaña se retiró con el panel
(ver §4.3).

---

## 4. Los módulos, uno por uno

### 4.1 Mapa (`ElectoralMap`)
Es el corazón del visor. Dibuja con MapLibre GL + Deck.gl:

| Capa | Qué muestra | De dónde sale |
|---|---|---|
| **Mesas** | Un punto por mesa, en su local real. Verde = gana Zegarra con margen, rojo = gana un contrincante, ámbar = disputa a menos de 5 pp | Actas ONPE por mesa |
| **Latido de mesas perdidas** | Anillo rojo que se abre y se apaga sobre cada mesa roja, con fase escalonada para que se lea como una ola | Derivada de la capa de mesas |
| **Límites distritales** | El polígono real del distrito | Límites distritales (INEI) |
| **Ruta de campaña** | Polilínea ámbar con contracanto oscuro y paradas numeradas; con la ruta encendida se añade una cometa animada | Motor de plan (ver 4.3) |
| **Redes / Empleo** | Capas de contexto territorial | Datos de apoyo |

Al pasar el cursor sobre una mesa aparece un globo con su detalle; al hacer clic
se abre su ficha.

El control de **capas** también vive en la botonera del visor, arriba del todo:
un botón que abre un panel flotante con los tres conmutadores —satélite,
distritos y mesas— y se cierra al tocar fuera o con Escape. El satélite es la
primera fila y, mientras está encendido, el propio botón muestra el icono de
satélite sobre el acento de la marca.

El control de **ruta** está en la misma botonera, junto al de **mapa completo**,
que pliega el panel derecho, la tarjeta de contexto y la leyenda para dejar el
territorio, las mesas y la ruta a la vista. Enciende y apaga el trazado sin abrir
ningún panel. Todas las capas 2D se dibujan con
`depthCompare: "always"` para no quedar enterradas bajo la extrusión del
distrito.

### 4.2 Panel del distrito — «Ficha» (derecha)
Dos bloques:

- **Mesas por local**: cada local de votación con sus mesas, mesas ganadas y el
  margen. Es la lista de trabajo territorial clásica.
- **Pozo de otras candidaturas**: los votos de las trece eliminadas en el
  distrito, en una sola cifra.

El panel no repite lo que ya dice la barra superior ni incluye textos de
instrucción: solo cifras que cambian una decisión de campaña. Se retiraron el
plan de jornadas, el ranking «Los 15 · dónde se decide», la composición del voto
(la barra superior ya da Zegarra y el pozo), el avance a +10 pp, las actas
contabilizadas con la participación (dato de la captura, no de la campaña) y los
conmutadores de capa, que ahora están sobre el mapa.

### 4.3 Sin panel de plan de campaña

El panel de cuatro pestañas (focos, ruta, traspaso y guion) **se retiró** con su
botón de la barra inferior. Era el módulo más pesado del producto y competía con
el mapa, que es donde se toma la decisión.

Lo que sobrevive del motor `lib/planCampana` es solo el **trazado de la ruta**:
`planDeDistrito()` sigue calculando el orden de visita y `polilineaDeRuta()`
alimenta la polilínea ámbar. La ruta se enciende y se apaga desde el control del
visor, sin abrir ningún panel.

### 4.4 Sin capas de barrio

El mapa no dibuja polígonos de asociaciones ni de sectores: ningún distrito
publica un padrón verificable y las capas anteriores se retiraron. Lo que se
dibuja es el polígono del distrito, sus mesas (con acta de ONPE) y sus locales
georreferenciados. Cerro Colorado y los otros catorce distritos usan el mismo
panel lateral: mesas por local y pozo de otras candidaturas.

### 4.5 Sin tarjeta de visita cercana

La tarjeta flotante que proponía el local de votación más cercano al centro del
mapa **se retiró**. Ocupaba el tercio inferior del visor y competía con las
mesas, que es donde está la información de trabajo. La recomendación de a dónde
ir se resuelve ahora en el panel del distrito («Mesas por local») y en el mapa,
con el latido de las mesas perdidas.

### 4.6 Fichas y modales
- **Ficha de mesa** (`MesaModal`): quién ganó la mesa y contra quién, ubicación del
  local y reparto completo de las quince candidaturas. Se abre como panel lateral
  **sin fondo modal**: el mapa sigue vivo, se puede mover y se cambia de mesa con
  otro clic. Se cierra con la X o con Escape, no con un clic fuera. Lleva el
  código ONPE de la mesa en la cabecera; no incluye el bloque de validación en la
  web de ONPE, los botones de centrar, copiar coordenadas, copiar enlace y ver
  satélite, ni la rejilla de cifras de participación (válidos, electores hábiles,
  puesto de Zegarra y margen Zegarra−Huisa): el reparto y el relato de la mesa ya
  dan esos números, y la rejilla repetía la barra superior.
- **Ficha del distrito** (`FichaDistritoPrioridad`): perfil completo, rival más
  cercano y prioridad. Es la misma para los quince distritos.
- **Tarjeta de contexto** (`TarjetaDistritoMapa`): cuántas mesas con acta y
  cuántos locales tiene el distrito dibujado.

---

## 5. Exportaciones

| Acción | Dónde | Qué produce |
|---|---|---|
| **Informe PDF** | Barra inferior | Informe imprimible del distrito activo |

Las exportaciones de focos y el plan de campo desaparecieron con el panel de plan
de campaña.

Todo se genera en el navegador: no hay servidor ni base de datos detrás.

---

## 6. Datos: qué es real y qué es modelo

Esta es la parte que hay que leer antes de tomar decisiones.

### 6.1 Resultado electoral — REAL
Actas ONPE de la primera vuelta, mesa por mesa, con código de local y ubigeo.
Los locales tienen la coordenada que publica ONPE en GEO_LOCALES. Es la base de
todo el tablero y no está modelada.

### 6.2 Capas de barrio — retiradas

No hay capas de asociaciones ni de sectores en el mapa. Se cargaron en su
momento (84 polígonos de Cerro Colorado y 198 puntos en otros tres distritos) y
se retiraron: los nombres venían del PPRRD, pero la geometría, las familias y
los servicios eran estimaciones, y en la mayoría de los casos la coordenada era
una colocación aproximada. El tablero prefirió quedarse sin capa antes que
mostrar un padrón que no lo era. La recomendación usa el local de
votación de ONPE, que sí tiene coordenada oficial.

### 6.3 Otras fuentes
- **Población**: INEI, censo 2017 (Cerro Colorado: 262.000 hab.).
- **RUC**: padrón reducido de SUNAT, ubigeo INEI `040104` (18.603 RUC en Cerro
  Colorado). Ojo: el ubigeo `040103` es de ONPE y corresponde a Cayma.
- **Límites**: límites distritales reales, no esquemáticos.

---

## 7. Glosario del balotaje

| Término | Qué es |
|---|---|
| **Pozo** | Votos de las trece candidaturas eliminadas. En los 15 distritos: 385.091 |
| **Cuota** | Fracción del pozo que Zegarra necesita en una mesa para pasar a Huisa. `cuota = 0,5 − (Z − H) / (2·O)` |
| **Colchón** | Votos de ventaja sobre ese umbral. Negativo = déficit |
| **Techo** | La cuota más alta de todas las mesas del distrito: la que hace falta para llevarse **todas** las actas |
| **Holgura** | Reparto natural − techo. Positiva = distrito cerrado; negativa = hay que subir captación |
| **Reparto natural** | Cuota que obtendría Zegarra si el pozo se repartiera según la fuerza de cada finalista |
| **Contactos por voto** | 8,3 contactos efectivos por cada voto adicional (supuesto de trabajo) |

### El mapa del esfuerzo hoy

De **3.115 actas**, solo **248** no están cerradas con el reparto natural:

| Distrito | Actas en juego | Reparto natural | Techo |
|---|---:|---:|---:|
| Cayma | 167 / 274 | 49,9% | 67,0% |
| La Joya | 46 / 98 | 50,3% | 63,8% |
| Majes | 30 / 190 | 52,4% | 57,2% |
| Cerro Colorado | 4 / 506 | 57,7% | 62,1% |
| Jacobo Hunter | 1 / 142 | 57,1% | 57,2% |

El resto está cerrado con doce puntos o más de holgura. **Cayma es el distrito:**
167 de las 248 actas.

---

## 8. Límites conocidos

1. **No proyecta voto.** El reparto del pozo es un supuesto de afinidad
   proporcional, no una encuesta. El simulador existe para mover ese supuesto.
2. **La capa de asociaciones de Cerro Colorado es modelada** en geometría y
   métricas: los nombres son del PPRRD, las posiciones y los indicadores no.
3. **Catorce distritos sin asociaciones.** No hay padrón público; la
   recomendación usa el local de votación de ONPE, no una asociación supuesta.
5. **Los nombres de «sectores críticos»** de siete PPRRD escaneados no pudieron
   recuperarse por OCR con calidad suficiente; quedaron fuera.
6. **El modelo espejo** de Cerro Colorado (asignación de votos de mesa a
   asociación) es una estimación, no un conteo.

---

## 9. Mantenimiento

| Script | Para qué |
|---|---|
| `scripts/generar-locales-distritos.mjs` | Regenera los 286 locales ONPE con coordenadas |
| `scripts/extraer-asociaciones-pprrd.py` | Extrae asociaciones de los PPRRD (PDF) |
| `scripts/importar-asociaciones-distritos.py` | Cruza nombres con locales ONPE y OSM |
| `scripts/generar-asociaciones.mjs` | Regenera la capa modelada de Cerro Colorado |
| `scripts/ocr-sectores-pprrd.py` | Barrido OCR de sectores críticos (calidad insuficiente) |

Documentos de respaldo: `docs/validacion-asociaciones.md` (trazabilidad nombre por
nombre), `docs/fuentes-asociaciones-distritos.md` (qué se buscó y qué se
encontró) y `docs/plan-balotaje-arequipa.md` (lectura estratégica del balotaje).
