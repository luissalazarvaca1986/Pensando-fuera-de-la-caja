# Pensando fuera de la caja — código de acompañamiento

> Cambiar la forma de representar para cambiar la forma de resolver.

Código del libro **_Pensando fuera de la caja. IA y programación para programadores y no
programadores_**, de Luis Alfonso Salazar Vaca.

Seis algoritmos que juegan al tres en raya, jugables en el navegador, con **la memoria de la
máquina a la vista** y con todas las cifras del libro recalculadas delante de ti.

**▶ Ábrelo aquí: <https://luissalazarvaca1986.github.io/Pensando-fuera-de-la-caja/>**

No hay que instalar nada. No hay dependencias, ni compilación, ni servidor: son tres archivos
HTML, una hoja de estilo y once archivos JavaScript. También funciona abriendo `index.html`
directamente desde el disco.

---

## De qué va esto

El libro parte de un encargo con una condición muy concreta:

> La computadora no puede perder. Solo puede empatar o ganar.

La vía natural es enumerar los casos. Y son **4 520**, para un tablero de nueve casillas.
Aprovechando las simetrías bajan a **627**. Las dos soluciones funcionan, y ninguna de las dos se
puede leer y defender.

Entonces el libro cambia de pregunta. En lugar de «¿cómo resuelvo esto?», pregunta **«¿qué otra
cosa tiene esta misma forma?»**. Y la respuesta es el cuadrado mágico de orden tres:

```
    2 │ 7 │ 6
   ───┼───┼───
    9 │ 5 │ 1        Cada fila, columna y diagonal suma 15.
   ───┼───┼───
    4 │ 3 │ 8
```

De los 84 subconjuntos de tres elementos de {1..9}, **exactamente ocho suman quince**, y esos ocho
son precisamente las ocho maneras de ganar. Ni uno de más, ni uno de menos.

A partir de ahí, el juego entero se juega con sumas y restas:

| Concepto del juego | Expresión aritmética |
| --- | --- |
| Ganar | Poseer tres números que sumen 15 |
| Amenazar | Tener `a`, `b` con `15 − (a + b)` libre |
| Bloquear | Tomar el `15 − (a + b)` del rival |
| Centro | El 5 |
| Esquinas | Los números pares |
| Lados | Los números impares |

**4 520 casos → 4 reglas.** Y la lista de las ocho rectas no está en ninguna parte del programa,
porque las ocho rectas son los ocho tríos que suman quince.

---

## Las tres páginas

### 1 · [Jugar](index.html) — `index.html`

Tablero en ASCII, jugable con el **teclado** (flechas para moverse, barra espaciadora para jugar,
`1`–`9` para jugar por número mágico, `n` para una partida nueva) o con el **ratón** (el puntero
selecciona, el clic juega).

Eliges los dos contendientes arriba — humano o cualquiera de los seis algoritmos, incluso dos
algoritmos entre sí. **Quién empieza no se elige: se sortea**, porque el encargo era no perder
nunca y eso hay que cumplirlo en los dos papeles.

Tres cosas que mirar mientras juegas:

- **Por qué esa jugada.** Qué regla se disparó y con qué aritmética. Literalmente:
  `15 − (2 + 8) = 5, y el 5 es mío → la recta del rival está muerta`.
- **Dentro de la máquina.** La memoria de trabajo del algoritmo a quien le toca mover, en texto.
  Con `C` verás dos conjuntos de números y una resta; con `A`, una clave, un número de entrada y
  una tabla de 4 520 filas que hay que creerse. Es la diferencia del libro, hecha visible.
- **El código que acaba de decidir.** No es una transcripción: es el texto de las funciones que se
  están ejecutando, sacado con `Function.prototype.toString()`.

### 2 · [Comprobarlo de verdad](verificacion.html) — `verificacion.html`

> Jugar unas partidas no demuestra nada.

Recorre el árbol **completo** del juego: todas las respuestas posibles del rival, en las dos
posiciones de salida, y también **todas las alternativas del propio azar** — porque si el algoritmo
elige al azar entre varias jugadas igual de buenas, «no perder nunca» exige que se cumpla para
todas las elecciones, no para la que salió esta vez.

Incluye la ablación de las cuatro reglas, las tres roturas instructivas del capítulo 7.5 (con la
partida concreta que se pierde, jugada a jugada) y las tres formulaciones del capítulo 8.

### 3 · [El recuento y las cifras](recuento.html) — `recuento.html`

El capítulo 14 ejecutándose: el universo del juego, la ecuación 14.1 término a término, de dónde
sale el 627, el tamaño del código medido y la cadena de 4 520 condicionales **generada delante de
ti** (solo se muestra el principio y el final, porque el resto no cabe — y eso *es* el argumento).

---

## Los seis algoritmos

| | Cómo decide | Geometría que usa | Capítulo |
| --- | --- | --- | --- |
| **A** | Un caso por posición · 4 520 | Todo el tablero, posición a posición | 2.2 |
| **B** | Un caso por clase de simetría · 627 | Íd., más las ocho simetrías | 2.3 |
| **V1** | Fichas 1/10, hueco por recorrido | Rectas, coordenadas, posiciones | 8 |
| **V2** | Fichas 1/10 + cuadrado mágico | Rectas, coordenadas y el cuadrado | 8 |
| **C** | Cuatro reglas aritméticas | **Ninguna** | 5 y 6 |
| **M** | Minimax | La condición de victoria | 1.2.3 |

`A` y `B` **no están escritas a mano** — sería inviable: se generan automáticamente a partir de la
solución exacta del juego, así que son las mejores versiones posibles de sí mismas y la comparación
es justa. Es lo que pide el capítulo 14.1.

`V1` y `V2` se diferencian en **una sola función**, `localizar`. Ahí está la respuesta a la
objeción más seria que se le puede hacer al libro, y la página de verificación la contesta con
números.

---

## Cifras reproducidas

Todo lo que sigue se calcula al abrir las páginas. Nada está escrito a mano.

| Magnitud | Libro | Aquí |
| --- | --- | --- |
| Posiciones alcanzables | 5 478 | 5 478 ✓ |
| Casos que cubrir | 4 520 | 4 520 ✓ |
| Casos con simetría | 627 (338 + 289) | 627 ✓ |
| Posiciones en ambos papeles | 8 533 | 8 533 ✓ |
| Íd. módulo las ocho simetrías | 1 192 | 1 192 ✓ |
| Reparto por órbita | 4 064/508 · 444/111 · 8/4 · 4/4 | idéntico ✓ |
| Las cuatro reglas, árbol completo | 1 784 partidas, **0 derrotas** | 1 784, **0** ✓ |
| Sin la regla 3 | 2 096 partidas, 64 derrotas | 2 096, 64 ✓ |
| Regla 4 como azar puro | 86 048 partidas, 8 320 derrotas | 86 048, 8 320 ✓ |
| Las tres formulaciones | 551 partidas, 0 derrotas cada una | 551, 0 ✓ |
| Clases que ve el algoritmo del cuadrado | 116 | 116 ✓ |

### Dos cosas que **no** coinciden, y se dicen

1. **Reglas 1, 2, 3 con la regla 4 al azar puro.** El libro da 39 232 partidas y 1 600 derrotas;
   aquí salen 37 312 y 1 792. La diferencia está en cómo se elige el ataque de la regla 3 cuando
   hay varios válidos, un detalle que el libro no fija por escrito. Se deja a la vista en lugar de
   ajustarlo hasta que cuadre.

2. **Líneas y bytes de A y B.** Salen a dos líneas de las del libro, pero bastantes bytes por
   debajo, porque la clave de cada caso se escribe de otra manera. El propio libro advierte que
   estas cifras dependen del estilo del generador y que la magnitud robusta es el número de casos y
   de condicionales.

Y una que sale **más fuerte** que en el libro: comparando los conjuntos completos de jugadas
candidatas, `V1`, `V2` y `C` no toman **ni una sola decisión distinta** en ninguna posición. No son
algoritmos parecidos: son el mismo algoritmo dicho de dos maneras.

---

## Cómo está organizado el código

```
index.html              jugar
verificacion.html       recorrer el árbol completo
recuento.html           las cifras del capítulo 14
css/estilo.css          estética de terminal, sin dependencias

js/nucleo.js                 el tablero, la biyección μ, las simetrías D4, el juez
js/juego.js                  el juego recorrido y resuelto (instrumento de medida)
js/alg-c-magico.js           C — las cuatro reglas aritméticas  ← el algoritmo del libro
js/alg-v1-v2-geometrico.js   V1 y V2 — fichas 1/10, con y sin cuadrado mágico
js/alg-tabla.js              A y B — la lista de casos, generada
js/alg-minimax.js            M — la vía que el autor no conocía
js/recorrido.js              verificación exhaustiva, ablación y roturas
js/medidas.js                tamaño del código y coste por jugada
js/dentro-de-la-maquina.js   qué guarda cada algoritmo, en ASCII
js/ui-comun.js               banner, resaltado de código, utilidades
js/ui-jugar.js               la partida: teclado, ratón, sorteo
js/ui-verificacion.js        la página 2
js/ui-recuento.js            la página 3
```

Todos los archivos son JavaScript clásico —sin módulos, sin `import`— a propósito: así la página
funciona igual servida por GitHub Pages y abierta directamente desde el disco con doble clic.

### Por qué el dibujo no confía en la fuente

Dibujar rejillas con texto se apoya en una promesa que no siempre se cumple: que todos los
caracteres midan lo mismo. Probándolo en un teléfono real se rompió por tres vías a la vez —un
carácter de caja Unicode que la fuente no tiene y sustituye por otro de distinto ancho, una negrita
con distinto avance, y un tamaño de letra adivinado con `vw`—. El tablero dejaba de ser una
rejilla.

La solución no es elegir mejor la fuente, es **no depender de ella**. Tres medidas:

1. **Solo ASCII de 7 bits.** El dibujo usa `+`, `-` y `|`. Nada de `┌ ─ │ █`.
2. **Una columna exacta por carácter.** Cada carácter va dentro de un `<i>` de `width: 1ch`,
   centrado. El tablero se cuenta por caracteres y cada carácter ocupa una columna, punto: la
   rejilla la garantiza la maquetación, no las métricas de la fuente.
3. **El mismo peso en todas las celdas.** Solo cambia el color, nunca la negrita.

Está comprobado por el camino difícil: forzando `Georgia` —una fuente **proporcional**— y una
negrita 900 en unas celdas y no en otras, las dieciséis columnas del tablero y las sesenta y una de
las matrices siguen cayendo en la misma posición, con **cero desviaciones**. Si aguanta eso, aguanta
cualquier fuente de cualquier teléfono.

El título es texto normal, no arte de caracteres, por la misma razón: el arte compuesto depende de
que la fuente tenga el glifo exacto y de que todos midan igual. Un título de texto no puede fallar.

### Cómo se adapta al ancho

Nada del dibujo tiene un tamaño escrito a mano. Se **mide** el ancho disponible en caracteres
—descontando el relleno— y a partir de ahí:

- el tablero y el título ajustan su tamaño de letra para ocupar el ancho exacto;
- las matrices y la traza se reparten en filas: cuatro en un portátil, dos o una en un móvil;
- la prosa de los volcados se envuelve por palabras, **sin tocar las rejillas** (una línea que
  contiene `|` o `+-` es parte de un dibujo y no se parte nunca);
- el banner y el registro de arranque cambian a una versión corta en lugar de recortarse, porque
  recortar es perder texto.

En un teléfono se juega **tocando la casilla**, y las casillas se dimensionan para el dedo.

El contrato que hace intercambiables los seis algoritmos es una sola función:

```js
decidir(propias, ajenas) → { casillas, regla, explicacion }
```

`casillas` devuelve **todas** las jugadas que el algoritmo considera igual de buenas, no una. Eso
es lo que permite a la verificación abrir también las ramas del propio azar, que es donde el libro
descubrió que la cuarta regla estaba mal especificada.

---

## Si encuentras una derrota

El programa tiene un objetivo declarado y comprobable: **cero derrotas**. Si alguno de los seis
algoritmos pierde una partida contigo, es un fallo de verdad —no una opinión— y me interesa mucho.
Abre una *issue* con la secuencia de jugadas; la bitácora de la partida la trae entera.

---

## Aclaración de honestidad

La correspondencia entre el tres en raya y el cuadrado mágico **no es un descubrimiento de este
libro**, y sería deshonesto dejarlo creer. Está documentada desde hace más de medio siglo: John A.
Michon la describió formalmente en 1967 al analizar el juego JAM, también conocido como *Number
Scrabble*, *Pick 15* o *3 to 15*.

Lo que el libro cuenta es el **camino**: qué preguntas hay que hacerse para llegar a un sitio así
partiendo de un problema que no se sabe resolver. Ese camino es reproducible aunque el destino ya
estuviera en el mapa.

---

## Licencia

Código bajo licencia MIT — úsalo, cámbialo, dalo en clase. El texto del libro es del autor.

---

*La próxima entrega del libro cambia de escenario y de escala: Space Invaders y la programación
orientada a objetos.*
