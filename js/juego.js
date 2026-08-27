/*
 * juego.js — El juego entero, recorrido y resuelto
 * ================================================
 *
 * El tres en raya tiene una propiedad rarísima: se lo puede recorrer
 * completo. Este archivo lo hace, y de ahí salen dos cosas:
 *
 *   1. El recuento del capítulo 14: cuántas posiciones hay, cuántas exigen
 *      decidir una jugada, y cuántas quedan al agrupar por simetría.
 *
 *   2. La solución exacta del juego, con la que se GENERAN las soluciones A
 *      y B. Generarlas, en lugar de escribirlas a mano, es lo que hace justa
 *      la comparación: no hay margen para que estén mal escritas.
 *
 * Nada de lo que hay aquí forma parte del algoritmo del libro. Es el
 * instrumento de medida.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC;

  /* ==================================================================
   * 1. Todas las posiciones alcanzables
   * ================================================================== */

  // Clave absoluta: 'X' es siempre quien abrió la partida.
  function claveAbsoluta(xs, os) {
    const s = ['.', '.', '.', '.', '.', '.', '.', '.', '.'];
    for (const c of xs) s[c] = 'X';
    for (const c of os) s[c] = 'O';
    return s.join('');
  }

  // Se parte del tablero vacío y se abre TODA jugada legal. La partida se
  // detiene en cuanto alguien hace tres en línea: por eso no aparecen
  // tableros que habrían exigido una victoria anterior.
  let cachePosiciones = null;

  PFC.posiciones = function () {
    if (cachePosiciones) return cachePosiciones;
    const vistas = new Map();

    const visitar = (xs, os) => {
      const clave = claveAbsoluta(xs, os);
      if (vistas.has(clave)) return;

      const ganoX = PFC.haGanado(xs), ganoO = PFC.haGanado(os);
      const lleno = xs.length + os.length === 9;
      const turnoDeX = xs.length === os.length;

      vistas.set(clave, {
        xs, os, turnoDeX,
        terminada: ganoX || ganoO || lleno,
        ganoX, ganoO, lleno
      });

      if (ganoX || ganoO || lleno) return;
      for (const c of PFC.libres(xs, os)) {
        if (turnoDeX) visitar(xs.concat(c).sort((a, b) => a - b), os);
        else visitar(xs, os.concat(c).sort((a, b) => a - b));
      }
    };

    visitar([], []);
    cachePosiciones = vistas;
    return vistas;
  };

  /* ==================================================================
   * 2. La solución exacta (para generar A y B)
   * ================================================================== */

  // Valor de la posición para quien mueve, suponiendo que los dos juegan lo
  // mejor posible. Es, sin adornos, el Minimax que el autor no conocía
  // cuando resolvió el problema.
  //
  // El valor lleva la profundidad dentro: ganar en la jugada k vale 10 − k.
  // Así ganar ya es mejor que ganar más tarde, y perder tarde es mejor que
  // perder pronto. Sin eso, un minimax «puro» consideraría igual de buenas
  // todas las jugadas que fuerzan la victoria, incluida la que la aplaza
  // teniendo la recta servida — y la tabla generada a partir de él saldría
  // jugando raro. Aquí interesa que A y B sean las mejores versiones
  // posibles de sí mismas.
  const cacheValor = new Map();

  PFC.valor = function (mias, suyas) {
    const libres = PFC.libres(mias, suyas);
    if (libres.length === 0) return 0;

    const clave = PFC.clave(mias, suyas);
    if (cacheValor.has(clave)) return cacheValor.get(clave);

    const jugada = mias.length + suyas.length + 1;
    let mejor = -Infinity;
    for (const c of libres) {
      const nuevas = mias.concat(c).sort((a, b) => a - b);
      const v = PFC.haGanado(nuevas) ? 10 - jugada : -PFC.valor(suyas, nuevas);
      if (v > mejor) mejor = v;
    }
    cacheValor.set(clave, mejor);
    return mejor;
  };

  // El signo, para cuando solo interesa gana / tablas / pierde.
  PFC.desenlace = function (mias, suyas) {
    return Math.sign(PFC.valor(mias, suyas));
  };

  // Todas las jugadas que alcanzan el mejor valor posible. Devolver el
  // conjunto entero, y no una sola, permite que el recorrido del capítulo 7
  // abra también las ramas del azar.
  PFC.jugadasOptimas = function (mias, suyas) {
    const libres = PFC.libres(mias, suyas);
    const jugada = mias.length + suyas.length + 1;
    let mejor = -Infinity;
    const valores = [];
    for (const c of libres) {
      const nuevas = mias.concat(c).sort((a, b) => a - b);
      const v = PFC.haGanado(nuevas) ? 10 - jugada : -PFC.valor(suyas, nuevas);
      valores.push([c, v]);
      if (v > mejor) mejor = v;
    }
    return valores.filter(([, v]) => v === mejor).map(([c]) => c);
  };

  // El valor de cada jugada, para poder pintarlo en una matriz.
  PFC.valorDeCadaJugada = function (mias, suyas) {
    const jugada = mias.length + suyas.length + 1;
    const salida = {};
    for (const c of PFC.libres(mias, suyas)) {
      const nuevas = mias.concat(c).sort((a, b) => a - b);
      salida[c] = PFC.haGanado(nuevas) ? 10 - jugada : -PFC.valor(suyas, nuevas);
    }
    return salida;
  };

  /* ==================================================================
   * 3. El recuento del capítulo 14
   * ================================================================== */

  PFC.recuento = function () {
    const pos = PFC.posiciones();

    // Lo más grosero: cada casilla vacía, con tu ficha o con la del rival.
    const combinaciones = Math.pow(3, 9);                       // 19 683

    // Impón la alternancia de turnos. Ecuación (14.1).
    const terminos = [];
    let recuentosLegales = 0;
    for (let k = 0; k <= 9; k++) {
      const a = combinatorio(9, k);
      const b = combinatorio(k, Math.ceil(k / 2));
      terminos.push({ k, a, b, producto: a * b });
      recuentosLegales += a * b;                                //  6 046
    }

    const alcanzables = pos.size;                               //  5 478
    const exigianVictoriaAnterior = recuentosLegales - alcanzables;   //  568

    let decididas = 0, empezando = 0, respondiendo = 0;
    const casos = [];
    for (const p of pos.values()) {
      if (p.terminada) { decididas++; continue; }
      casos.push(p);
      if (p.turnoDeX) empezando++; else respondiendo++;
    }

    // Clases de simetría de los casos, por papel.
    const clasesEmpezando = new Set(), clasesRespondiendo = new Set();
    for (const p of casos) {
      const c = PFC.canonica(PFC.clave(
        p.turnoDeX ? p.xs : p.os,
        p.turnoDeX ? p.os : p.xs
      ));
      (p.turnoDeX ? clasesEmpezando : clasesRespondiendo).add(c);
    }

    // Reparto de los casos por tamaño de órbita (el «Compruébalo» del cap. 2).
    const orbitas = { 8: { casos: 0, clases: 0 }, 4: { casos: 0, clases: 0 },
                      2: { casos: 0, clases: 0 }, 1: { casos: 0, clases: 0 } };
    const yaContada = new Set();
    for (const p of casos) {
      const clave = PFC.clave(p.turnoDeX ? p.xs : p.os, p.turnoDeX ? p.os : p.xs);
      const tam = PFC.orbita(clave).length;
      orbitas[tam].casos++;
      const can = p.turnoDeX ? 'X' + PFC.canonica(clave) : 'O' + PFC.canonica(clave);
      if (!yaContada.has(can)) { yaContada.add(can); orbitas[tam].clases++; }
    }

    // Posiciones que ve un programa que juegue en los dos papeles: las que
    // aparecen abriendo y las que aparecen respondiendo, sin contar dos veces
    // las que coinciden.
    const enAmbosPapeles = new Set();
    for (const p of pos.values()) {
      enAmbosPapeles.add(PFC.clave(p.xs, p.os));     // nosotros abrimos
      enAmbosPapeles.add(PFC.clave(p.os, p.xs));     // nosotros respondemos
    }
    const clasesAmbosPapeles = new Set();
    for (const k of enAmbosPapeles) clasesAmbosPapeles.add(PFC.canonica(k));

    return {
      combinaciones, terminos, recuentosLegales, exigianVictoriaAnterior,
      alcanzables, decididas, empezando, respondiendo,
      casos: empezando + respondiendo,
      clasesEmpezando: clasesEmpezando.size,
      clasesRespondiendo: clasesRespondiendo.size,
      clases: clasesEmpezando.size + clasesRespondiendo.size,
      orbitas,
      enAmbosPapeles: enAmbosPapeles.size,
      clasesAmbosPapeles: clasesAmbosPapeles.size
    };
  };

  function combinatorio(n, k) {
    if (k < 0 || k > n) return 0;
    let r = 1;
    for (let i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return Math.round(r);
  }
  PFC.combinatorio = combinatorio;

})(typeof globalThis !== 'undefined' ? globalThis : this);
