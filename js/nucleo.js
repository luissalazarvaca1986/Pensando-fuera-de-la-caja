/*
 * nucleo.js — Lo que comparten todos los algoritmos
 * =================================================
 *
 * «Pensando fuera de la caja» — código de acompañamiento.
 *
 * Este archivo NO contiene ningún algoritmo de juego. Contiene solo dos cosas:
 *
 *   1. El juego como juez: la geometría del tablero y quién ha ganado.
 *      Deliberadamente escrito con filas, columnas y diagonales, porque el
 *      tablero de nueve casillas es el problema original y es contra él contra
 *      quien hay que verificar. Como dice el capítulo 10 del libro:
 *      «la aritmética era el camino; el juego era el juez».
 *
 *   2. La biyección mu del capítulo 5, para que los algoritmos que trabajan
 *      con números puedan traducir de ida y de vuelta.
 *
 * Todos los algoritmos hablan el mismo idioma con el motor: casillas 0..8.
 * El que quiera trabajar con números traduce en su propia frontera. Eso hace
 * visible el movimiento 6 del modelo —«Volver: traducir la solución»—, en
 * lugar de esconderlo.
 */

(function (global) {
  'use strict';

  var PFC = global.PFC || (global.PFC = {});

  /* ------------------------------------------------------------------
   * 1. El tablero, tal como viene descrito. La caja.
   * ------------------------------------------------------------------ */

  // Casillas numeradas de 0 a 8, por filas:
  //
  //     0 | 1 | 2
  //    ---+---+---
  //     3 | 4 | 5
  //    ---+---+---
  //     6 | 7 | 8
  //
  PFC.CASILLAS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  // Las ocho rectas ganadoras, escritas a mano. Esta lista es exactamente lo
  // que la transformación del libro consigue eliminar: en el algoritmo V3 no
  // aparece en ninguna parte. Aquí está porque el juez la necesita.
  PFC.RECTAS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],   // filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8],   // columnas
    [0, 4, 8], [2, 4, 6]               // diagonales
  ];

  // La clasificación posicional, también escrita a mano. Misma historia.
  PFC.CENTRO_GEO = 4;
  PFC.ESQUINAS_GEO = [0, 2, 6, 8];
  PFC.LADOS_GEO = [1, 3, 5, 7];

  /* ------------------------------------------------------------------
   * 2. El cuadrado mágico y la biyección mu (capítulo 5)
   * ------------------------------------------------------------------ */

  // Matriz de referencia de la ecuación (5.1), leída por filas:
  //
  //     2 | 7 | 6
  //     9 | 5 | 1
  //     4 | 3 | 8
  //
  // MU[casilla] = número que ocupa esa posición en el cuadrado mágico.
  PFC.MU = [2, 7, 6, 9, 5, 1, 4, 3, 8];

  PFC.CONSTANTE_MAGICA = 15;

  // Como los nueve valores son distintos, mu es una biyección: nada se pierde
  // al traducir y siempre se puede volver.
  PFC.MU_INV = (function () {
    var inv = [];
    for (var c = 0; c < 9; c++) inv[PFC.MU[c]] = c;
    return inv;      // MU_INV[numero] = casilla
  })();

  PFC.aNumeros = function (casillas) {
    return casillas.map(function (c) { return PFC.MU[c]; }).sort(function (a, b) { return a - b; });
  };

  PFC.aCasillas = function (numeros) {
    return numeros.map(function (n) { return PFC.MU_INV[n]; });
  };

  // La constante mágica no se memoriza: se deduce. Ecuación (5.2).
  PFC.constanteMagica = function (n) {
    return n * (n * n + 1) / 2;
  };

  /* ------------------------------------------------------------------
   * 3. Proposición 5.2, comprobada en tiempo de carga
   * ------------------------------------------------------------------ */

  // De los 84 subconjuntos de tres elementos de {1..9}, exactamente ocho
  // suman quince. Y esos ocho son precisamente las ocho rectas del tablero.
  // No lo damos por bueno: lo calculamos cada vez que se abre la página.
  PFC.triosQuince = function () {
    var trios = [];
    for (var a = 1; a <= 9; a++)
      for (var b = a + 1; b <= 9; b++)
        for (var c = b + 1; c <= 9; c++)
          if (a + b + c === PFC.CONSTANTE_MAGICA) trios.push([a, b, c]);
    return trios;
  };

  PFC.comprobarProposicion52 = function () {
    var trios = PFC.triosQuince();
    var deLosTrios = trios.map(function (t) { return t.join('-'); }).sort();
    var deLasRectas = PFC.RECTAS
      .map(function (r) { return PFC.aNumeros(r).join('-'); })
      .sort();
    var subconjuntos = 0;
    for (var a = 1; a <= 9; a++)
      for (var b = a + 1; b <= 9; b++)
        for (var c = b + 1; c <= 9; c++) subconjuntos++;

    return {
      subconjuntosDeTres: subconjuntos,               // 84
      triosQueSumanQuince: trios.length,              // 8
      rectasDelTablero: PFC.RECTAS.length,            // 8
      trios: trios,
      coinciden: deLosTrios.join(' ') === deLasRectas.join(' '),
      sobranEnTrios: deLosTrios.filter(function (x) { return deLasRectas.indexOf(x) < 0; }),
      faltanEnTrios: deLasRectas.filter(function (x) { return deLosTrios.indexOf(x) < 0; })
    };
  };

  // La estructura posicional bajo mu. Ecuación (5.6).
  // El centro es el cinco, las esquinas son los pares, los lados los impares.
  PFC.CENTRO_NUM = [5];
  PFC.ESQUINAS_NUM = [2, 4, 6, 8];
  PFC.LADOS_NUM = [1, 3, 7, 9];

  PFC.comprobarEcuacion56 = function () {
    var iguales = function (a, b) {
      return a.slice().sort().join(',') === b.slice().sort().join(',');
    };
    return {
      centro: iguales(PFC.aNumeros([PFC.CENTRO_GEO]), PFC.CENTRO_NUM),
      esquinas: iguales(PFC.aNumeros(PFC.ESQUINAS_GEO), PFC.ESQUINAS_NUM),
      lados: iguales(PFC.aNumeros(PFC.LADOS_GEO), PFC.LADOS_NUM)
    };
  };

  /* ------------------------------------------------------------------
   * 4. El juez: quién ha ganado
   * ------------------------------------------------------------------ */

  // Geometría pura, a propósito. Este es el problema original.
  PFC.rectaGanadora = function (casillas) {
    var tiene = {};
    casillas.forEach(function (c) { tiene[c] = true; });
    for (var i = 0; i < PFC.RECTAS.length; i++) {
      var r = PFC.RECTAS[i];
      if (tiene[r[0]] && tiene[r[1]] && tiene[r[2]]) return r;
    }
    return null;
  };

  PFC.haGanado = function (casillas) {
    return PFC.rectaGanadora(casillas) !== null;
  };

  PFC.libres = function (propias, ajenas) {
    var ocupada = {};
    propias.forEach(function (c) { ocupada[c] = true; });
    ajenas.forEach(function (c) { ocupada[c] = true; });
    return PFC.CASILLAS.filter(function (c) { return !ocupada[c]; });
  };

  /* ------------------------------------------------------------------
   * 5. Las ocho simetrías del tablero (grupo diédrico D4)
   * ------------------------------------------------------------------ */

  // Se generan, no se escriben. GIRO[i] dice de qué casilla del tablero
  // original procede la casilla i después de girar noventa grados.
  var GIRO = [6, 3, 0, 7, 4, 1, 8, 5, 2];
  var ESPEJO = [2, 1, 0, 5, 4, 3, 8, 7, 6];

  function componer(p, q) {
    return p.map(function (i) { return q[i]; });
  }

  PFC.SIMETRIAS = (function () {
    var lista = [];
    var p = [0, 1, 2, 3, 4, 5, 6, 7, 8];      // identidad
    for (var g = 0; g < 4; g++) {
      lista.push(p);
      lista.push(componer(p, ESPEJO));
      p = componer(p, GIRO);
    }
    return lista;                              // ocho en total
  })();

  /* ------------------------------------------------------------------
   * 6. Claves de posición y forma canónica
   * ------------------------------------------------------------------ */

  // Una posición es: quién ocupa qué, y a quién le toca. Se escribe como
  // nueve caracteres: '.' libre, 'X' de quien mueve, 'O' del otro.
  PFC.clave = function (propias, ajenas) {
    var s = ['.', '.', '.', '.', '.', '.', '.', '.', '.'];
    propias.forEach(function (c) { s[c] = 'X'; });
    ajenas.forEach(function (c) { s[c] = 'O'; });
    return s.join('');
  };

  // La forma canónica: el menor de los ocho nombres que la posición recibe
  // bajo las ocho simetrías. Reducir a forma canónica no cambia ninguna
  // decisión; solo reduce cuántas situaciones distintas hay que considerar.
  PFC.canonica = function (clave) {
    var mejor = null;
    for (var i = 0; i < PFC.SIMETRIAS.length; i++) {
      var p = PFC.SIMETRIAS[i], t = '';
      for (var j = 0; j < 9; j++) t += clave[p[j]];
      if (mejor === null || t < mejor) mejor = t;
    }
    return mejor;
  };

  PFC.orbita = function (clave) {
    var vistas = {};
    for (var i = 0; i < PFC.SIMETRIAS.length; i++) {
      var p = PFC.SIMETRIAS[i], t = '';
      for (var j = 0; j < 9; j++) t += clave[p[j]];
      vistas[t] = true;
    }
    return Object.keys(vistas);
  };

  /* ------------------------------------------------------------------
   * 7. Registro de algoritmos
   * ------------------------------------------------------------------ */

  // Cada algoritmo se registra a sí mismo al cargarse. Todos cumplen el
  // mismo contrato, y por eso son intercambiables:
  //
  //    decidir(propias, ajenas) -> { casillas, regla, explicacion }
  //
  //  - propias, ajenas: arrays de casillas 0..8
  //  - casillas: TODAS las jugadas que el algoritmo considera igual de
  //    buenas. Devolver el conjunto entero, y no una sola, es lo que
  //    permite al capítulo 7 explorar también las ramas del propio azar.
  //  - regla / explicacion: por qué. Es la parte que el libro persigue:
  //    que la decisión se pueda leer, no solo ejecutar.

  PFC.algoritmos = [];
  PFC.porId = {};

  PFC.registrar = function (alg) {
    PFC.algoritmos.push(alg);
    PFC.porId[alg.id] = alg;
    return alg;
  };

  // Elegir una jugada concreta entre las candidatas.
  PFC.elegir = function (alg, propias, ajenas, azar) {
    var d = alg.decidir(propias, ajenas);
    var cs = d.casillas;
    var i = azar ? Math.floor(Math.random() * cs.length) : 0;
    return { casilla: cs[i], candidatas: cs, regla: d.regla, explicacion: d.explicacion };
  };

  /* ------------------------------------------------------------------
   * 8. Utilidades menores
   * ------------------------------------------------------------------ */

  PFC.parejas = function (lista) {
    var out = [];
    for (var i = 0; i < lista.length; i++)
      for (var j = i + 1; j < lista.length; j++) out.push([lista[i], lista[j]]);
    return out;
  };

  PFC.tercias = function (lista) {
    var out = [];
    for (var i = 0; i < lista.length; i++)
      for (var j = i + 1; j < lista.length; j++)
        for (var k = j + 1; k < lista.length; k++) out.push([lista[i], lista[j], lista[k]]);
    return out;
  };

  PFC.sinRepetir = function (lista) {
    return lista.filter(function (x, i) { return lista.indexOf(x) === i; });
  };

  PFC.quitar = function (lista, x) {
    return lista.filter(function (y) { return y !== x; });
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
