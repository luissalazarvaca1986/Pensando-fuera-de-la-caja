/*
 * alg-tabla.js — Soluciones A y B: la lista de casos
 * ==================================================
 *
 * A) Enumeración exhaustiva: un caso por posición.        4 520 casos
 * B) Con simetría: un caso por clase de equivalencia.       627 casos
 *
 * Estas dos soluciones NO están escritas a mano —sería inviable, y el
 * capítulo 14.1 explica por qué eso importa—: se generan automáticamente a
 * partir de la solución exacta del juego. Así son las mejores versiones
 * posibles de sí mismas y no hay margen para que estén mal escritas.
 *
 * Las dos funcionan. Las dos son correctas. Ninguna se puede leer y defender.
 * Esa es toda la discusión del libro:
 *
 *   «Puede explicarse por qué hizo esta jugada: se busca el caso y se lee.
 *    Pero no puede explicarse por qué juega bien siempre. Esa respuesta está
 *    repartida entre seiscientos veintisiete sitios, y nadie la tiene entera.»
 */

(function (global) {
  'use strict';
  const PFC = global.PFC;

  /* ==================================================================
   * A) Un caso por posición
   * ================================================================== */

  let tablaA = null;

  function construirTablaA() {
    if (tablaA) return tablaA;
    tablaA = new Map();
    for (const p of PFC.posiciones().values()) {
      if (p.terminada) continue;                       // aquí no hay nada que elegir
      const mias = p.turnoDeX ? p.xs : p.os;
      const suyas = p.turnoDeX ? p.os : p.xs;
      tablaA.set(PFC.clave(mias, suyas), PFC.jugadasOptimas(mias, suyas));
    }
    return tablaA;
  }

  function decidirA(propias, ajenas) {
    const tabla = construirTablaA();
    const clave = PFC.clave(propias, ajenas);
    const casillas = tabla.get(clave);
    if (!casillas) throw new Error('caso no cubierto: ' + clave);
    return {
      casillas,
      regla: 'Caso ' + (indiceDe(tabla, clave) + 1) + ' de ' + tabla.size,
      explicacion: 'Se busca la posición «' + clave + '» en la lista de ' + tabla.size
        + ' casos y se lee la respuesta. Por qué esa respuesta es la correcta no lo dice '
        + 'el programa: lo dice la tabla, y la tabla hay que creérsela.'
    };
  }

  /* ==================================================================
   * B) Un caso por clase de simetría
   * ================================================================== */

  // Además de la forma canónica hace falta saber QUÉ simetría llevó hasta
  // ella, para poder traducir la jugada de vuelta al tablero real.
  function canonicaConSimetria(clave) {
    let mejor = null, permutacion = null;
    for (const p of PFC.SIMETRIAS) {
      let t = '';
      for (let j = 0; j < 9; j++) t += clave[p[j]];
      if (mejor === null || t < mejor) { mejor = t; permutacion = p; }
    }
    return { clave: mejor, permutacion };
  }

  function desdeClave(clave) {
    const mias = [], suyas = [];
    for (let c = 0; c < 9; c++) {
      if (clave[c] === 'X') mias.push(c);
      else if (clave[c] === 'O') suyas.push(c);
    }
    return { mias, suyas };
  }

  let tablaB = null;

  function construirTablaB() {
    if (tablaB) return tablaB;
    tablaB = new Map();
    for (const clave of construirTablaA().keys()) {
      const can = canonicaConSimetria(clave).clave;
      if (tablaB.has(can)) continue;
      const { mias, suyas } = desdeClave(can);
      tablaB.set(can, PFC.jugadasOptimas(mias, suyas));
    }
    return tablaB;
  }

  function decidirB(propias, ajenas) {
    const tabla = construirTablaB();
    const clave = PFC.clave(propias, ajenas);
    const { clave: can, permutacion } = canonicaConSimetria(clave);
    const enCanonica = tabla.get(can);
    if (!enCanonica) throw new Error('clase no cubierta: ' + can);
    // Traducir de vuelta: la casilla j de la forma canónica es la casilla
    // permutacion[j] del tablero real.
    const casillas = enCanonica.map(j => permutacion[j]).sort((a, b) => a - b);
    return {
      casillas,
      regla: 'Clase ' + (indiceDe(tabla, can) + 1) + ' de ' + tabla.size,
      explicacion: 'La posición se reduce a su forma canónica «' + can + '», se busca esa '
        + 'clase entre ' + tabla.size + ' y la jugada se gira de vuelta. Siete veces menos '
        + 'casos que A, y sigue siendo una lista.'
    };
  }

  function indiceDe(mapa, clave) {
    let i = 0;
    for (const k of mapa.keys()) { if (k === clave) return i; i++; }
    return -1;
  }

  /* ==================================================================
   * El generador de la cadena de condicionales
   * ==================================================================
   *
   * Aquí se ve, en bytes, la desproporción del capítulo 2. La cadena no se
   * usa para jugar —jugar se hace con la tabla, que es más rápida—: se
   * genera para poder medirla.
   */

  PFC.generarCadena = function (cual) {
    const tabla = cual === 'B' ? construirTablaB() : construirTablaA();
    const conSimetria = cual === 'B';
    const lineas = [];

    lineas.push('// ' + (conSimetria
      ? 'Solución B: un condicional por clase de simetría.'
      : 'Solución A: un condicional por posición.'));
    lineas.push('function jugada(tablero) {' + (conSimetria
      ? '   // tablero ya reducido a forma canónica' : ''));
    for (const [clave, casillas] of tabla) {
      lineas.push('  if (tablero === "' + clave + '") return ' + casillas[0] + ';');
    }
    lineas.push('  throw new Error("caso no cubierto");');
    lineas.push('}');

    const texto = lineas.join('\n');
    return {
      texto,
      casos: tabla.size,
      condicionales: tabla.size,          // un caso, un condicional
      lineas: lineas.length,
      bytes: new TextEncoder().encode(texto).length
    };
  };

  /* ================================================================== */

  PFC.registrar({
    id: 'A',
    nombre: 'A — Enumeración exhaustiva',
    corto: 'A · 4 520 casos',
    capitulo: 'Capítulo 2.2',
    resumen: 'Un caso por posición. Funciona siempre y no se puede leer. La tabla se '
      + 'genera del juego resuelto, así que es la mejor versión posible de sí misma.',
    necesita: 'Todas las posiciones del juego',
    geometria: 'Todo el tablero, posición a posición',
    perezoso: true,
    decidir: decidirA,
    fuente: [decidirA, construirTablaA]
  });

  PFC.registrar({
    id: 'B',
    nombre: 'B — Con simetría',
    corto: 'B · 627 clases',
    capitulo: 'Capítulo 2.3',
    resumen: 'Un caso por clase de equivalencia bajo las ocho simetrías. Siete veces '
      + 'menos casos que A. Sigue siendo una lista.',
    necesita: 'Íd., agrupadas por equivalencia',
    geometria: 'Íd., más las ocho simetrías',
    perezoso: true,
    decidir: decidirB,
    fuente: [canonicaConSimetria, decidirB, construirTablaB]
  });

  PFC.tablas = { construirTablaA, construirTablaB, canonicaConSimetria };

})(typeof globalThis !== 'undefined' ? globalThis : this);
