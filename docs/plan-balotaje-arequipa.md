# Balotaje 6 de diciembre · Zegarra vs. Huisa

Lectura de los 15 distritos del tablero con la aritmética del pozo. Todos los
números salen de las actas ONPE ya contadas (3.115 mesas, 15 distritos) y del
módulo `lib/planCampana.ts` del tablero.

## La aritmética, en una línea

Con `Z` = votos de Zegarra, `H` = de Huisa y `O` = votos de las trece
candidaturas eliminadas, Zegarra gana una mesa cuando captura del pozo más de

```
oZ  >  (O + H − Z) / 2        →        cuota = 0,5 − (Z − H) / (2·O)
```

De ahí salen las dos monedas del tablero:

- **colchón** = `(0,5 − cuota) · O` — votos de ventaja (o déficit, si es
  negativo) sobre el punto donde Huisa lo pasa.
- **techo** = la mayor `cuota` de todas las mesas del distrito. Es la cuota que
  hace falta para llevarse **todas** las actas. Por encima del techo, cada punto
  extra de pozo ya no compra ninguna acta.
- **holgura** = `cuota natural − techo`. Positiva: el distrito está cerrado con
  el reparto natural. Negativa: aquí hay que subir la captación.

## El mapa del esfuerzo

| Distrito | Mesas | Natural | Techo | Holgura | Actas en juego |
|---|---:|---:|---:|---:|---:|
| **Cayma** | 274 | 49,9% | 67,0% | −17,1 pp | **167** |
| **La Joya** | 98 | 50,3% | 63,8% | −13,4 pp | **46** |
| **Majes** | 190 | 52,4% | 57,2% | −4,8 pp | **30** |
| **Cerro Colorado** | 506 | 57,7% | 62,1% | −4,5 pp | **4** |
| Jacobo Hunter | 142 | 57,1% | 57,2% | −0,1 pp | 1 |
| Paucarpata | 388 | 76,5% | 46,0% | +30,5 pp | 0 |
| Arequipa | 241 | 79,0% | 39,1% | +39,9 pp | 0 |
| José Luis Bustamante y Rivero | 220 | 76,9% | 38,9% | +38,0 pp | 0 |
| Yanahuara | 102 | 80,3% | 42,6% | +37,7 pp | 0 |
| Mollendo | 75 | 73,4% | 50,0% | +23,4 pp | 0 |
| Miraflores | 176 | 67,3% | 49,2% | +18,1 pp | 0 |
| Socabaya | 189 | 65,6% | 51,6% | +14,0 pp | 0 |
| Mariano Melgar | 179 | 65,8% | 53,4% | +12,4 pp | 0 |
| Alto Selva Alegre | 239 | 58,9% | 58,8% | +0,1 pp | 0 |
| Yura | 96 | 57,9% | 54,1% | +3,8 pp | 0 |

**Total: 248 actas en juego de 3.115 (8,0%).**

## Qué dice esto

1. **El balotaje no se juega en los quince distritos, se juega en cinco.** Con
   el reparto natural del pozo Zegarra ya se lleva 2.867 actas de 3.115. Las 248
   restantes están casi todas en Cayma.

2. **Cayma es el distrito, no un distrito.** 167 de las 248 actas en juego. Ahí
   el reparto natural lo deja empatado (49,9% del pozo) y gana solo 107 de 274
   mesas. Para cerrarlo necesita el 67% del pozo: 17,1 puntos más de los que le
   tocan. La escalera muestra el rendimiento decreciente: de 52% a 62% del pozo
   compra 131 actas; de 62% a 67%, solo 5. La mitad del trabajo está en el
   primer tramo.

3. **Ocho distritos están cerrados con 20 puntos de sobra.** Paucarpata podría
   ceder el 30% del pozo y aún así llevarse las 388 actas. Cada sol gastado ahí
   no compra una sola acta: se defiende con la estructura local, sin carpa.

4. **Cerro Colorado es trabajo quirúrgico.** 502 de 506 actas con el reparto
   natural: 4 actas en 506 mesas. No es una campaña de distrito, son cuatro
   locales concretos — y el tablero ya los marca como focos.

## Cómo se usa el tablero

1. Panel «Los 15 · dónde se decide» → entrar por Cayma.
2. «Plan de campaña» → pestaña **Traspaso**: leer el veredicto y el techo.
3. Pestaña **Focos**: los locales ordenados por déficit + riesgo, con la ruta
   de 5 paradas por jornada y el mensaje por local.
4. Pestaña **Guion**: el texto de carpa por tipo de foco.

## Límites de estos números

- El modelo asume que el pozo se reparte entre los dos finalistas. No proyecta
  voto: ordena actas ya contadas.
- El reparto «natural» es un supuesto de afinidad proporcional, no una
  encuesta. El simulador existe justamente para moverlo.
- La georreferenciación de locales es ONPE. Las únicas asociaciones cargadas
  son las 84 de Cerro Colorado (nombres del PPRRD 2018, geometría modelada); los
  otros catorce distritos no tienen padrón público y el mapa no dibuja ninguno.
  Para el trabajo de campo, la alerta de visita cercana apunta al local de
  votación más próximo, que sí tiene coordenada oficial.
