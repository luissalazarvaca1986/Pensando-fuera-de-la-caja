/*
 * recorrido.js — Comprobarlo de verdad (capítulo 7)
 * =================================================
 *
 * «Cincuenta partidas ganadas demuestran que el algoritmo no falla en esas
 *  cincuenta. Nada más.»
 *
 * Aquí no hay muestreo. Se recorre el árbol COMPLETO del juego:
 *
 *   - todas las respuestas posibles del rival, sin excepción;
 *   - en las dos posiciones de salida (empezando el algoritmo y empezando
 *     el rival);
 *   - y también todas las alternativas del propio azar. Esto último es lo
 *     que casi nadie hace: si el algoritmo elige al azar entre varias
 *     jugadas igual de buenas, «no perder nunca» exige que se cumpla para
 *     todas las elecciones posibles, no para la que salió esta vez.
 *
 * Por eso el contrato de los algoritmos devuelve el CONJUNTO de jugadas
 * candidatas y no una sola: aquí se abren todas.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC;

  // Recorre el juego entero para un algoritmo. Devuelve el recuento y, si
  // aparece alguna derrota, la primera partida que lleva a ella.
  PFC.recorrer = function (decidir, opciones) {
    opciones = opciones || {};
    const st = {
      partidas: 0, victorias: 0, empates: 0, derrotas: 0,
      partidaPerdida: null, posicionesVistas: new Set()
    };

    const roles = opciones.rol === 'empezando' ? [true]
      : opciones.rol === 'respondiendo' ? [false]
        : [true, false];

    for (const empiezaElAlgoritmo of roles) {
      explorar([], [], empiezaElAlgoritmo, [], st, decidir);
    }
    return st;
  };

  function explorar(mias, suyas, turnoDelAlgoritmo, historia, st, decidir) {
    // ¿Terminó la partida con la jugada anterior?
    if (PFC.haGanado(mias)) { anotar(st, 'victorias', historia); return; }
    if (PFC.haGanado(suyas)) { anotar(st, 'derrotas', historia); return; }
    if (mias.length + suyas.length === 9) { anotar(st, 'empates', historia); return; }

    if (turnoDelAlgoritmo) {
      st.posicionesVistas.add(PFC.clave(mias, suyas));
      // Se abren TODAS las jugadas que el algoritmo considera igual de buenas.
      const candidatas = decidir(mias, suyas).casillas;
      for (const c of candidatas) {
        explorar(mias.concat(c), suyas, false,
          historia.concat([{ quien: 'algoritmo', casilla: c }]), st, decidir);
      }
    } else {
      // Se abren TODAS las respuestas del rival, buenas y malas.
      for (const c of PFC.libres(mias, suyas)) {
        explorar(mias, suyas.concat(c), true,
          historia.concat([{ quien: 'rival', casilla: c }]), st, decidir);
      }
    }
  }

  function anotar(st, resultado, historia) {
    st.partidas++;
    st[resultado]++;
    if (resultado === 'derrotas' && st.partidaPerdida === null) {
      st.partidaPerdida = historia.slice();
    }
  }

  /* ------------------------------------------------------------------
   * Ablación (capítulo 14.5): quitar una pieza para ver si su ausencia
   * produce derrotas. Es como se comprueba que las cuatro reglas no solo
   * bastan, sino que hacen falta.
   * ------------------------------------------------------------------ */

  PFC.ablacion = function () {
    const v = PFC.magico.variante;
    return [
      { nombre: 'Reglas 1, 2, 4 aleatoria', libro: { partidas: 86048, derrotas: 8320 },
        decidir: v({ regla3: false, regla4: 'azar' }) },
      { nombre: 'Reglas 1, 2, 3, 4 aleatoria', libro: { partidas: 39232, derrotas: 1600 },
        decidir: v({ regla3: true, regla4: 'azar' }) },
      { nombre: 'Reglas 1, 2 + 4 posicional', libro: { partidas: 2096, derrotas: 64 },
        decidir: v({ regla3: false, regla4: 'posicional' }) },
      { nombre: 'Reglas 1, 2, 3 + 4 posicional', libro: { partidas: 1784, derrotas: 0 },
        decidir: v({ regla3: true, regla4: 'posicional' }), esLaBuena: true }
    ];
  };

  // Las tres roturas instructivas del capítulo 7.5.
  PFC.roturas = function () {
    const v = PFC.magico.variante;
    return [
      { nombre: 'Las cuatro reglas, intactas',
        nota: 'la referencia',
        decidir: v({ regla3: true, regla4: 'posicional' }) },
      { nombre: '1. Invertir las reglas 1 y 2',
        nota: 'bloquea teniendo la victoria servida',
        decidir: v({ regla3: true, regla4: 'posicional', invertirPrioridad: true }) },
      { nombre: '2. Devolver la regla 4 al azar puro',
        nota: 'las derrotas llegan en las PRIMERAS jugadas',
        decidir: v({ regla3: true, regla4: 'azar' }) },
      { nombre: '3. Quitar la regla 3',
        nota: 'el rival construye dos amenazas y solo se bloquea una',
        decidir: v({ regla3: false, regla4: 'posicional' }) }
    ];
  };

  // Solo la primera candidata: es como se comparan las tres formulaciones en
  // el capítulo 8, y da las 551 partidas de su tabla.
  PFC.determinista = function (decidir) {
    return function (mias, suyas) {
      const d = decidir(mias, suyas);
      return { casillas: [d.casillas[0]], regla: d.regla, explicacion: d.explicacion };
    };
  };

  /* ------------------------------------------------------------------
   * ¿Toman dos algoritmos la misma decisión? (capítulo 8)
   * ------------------------------------------------------------------ */

  // Compara dos algoritmos sobre todas las posiciones en las que ambos
  // tienen que decidir, alcanzables jugando el primero de los dos.
  // Se cuenta cada papel por separado —empezando y respondiendo—, porque una
  // misma disposición del tablero es una situación distinta según quién abrió.
  PFC.comparar = function (decidirA, decidirB) {
    const discrepancias = [];
    let posicionesComparadas = 0;

    const recorrerPapel = (empiezaA) => {
      const vistas = new Set();
      const visitar = (mias, suyas, turno) => {
        if (PFC.haGanado(mias) || PFC.haGanado(suyas)) return;
        if (mias.length + suyas.length === 9) return;
        if (turno) {
          const clave = PFC.clave(mias, suyas);
          const a = decidirA(mias, suyas).casillas;
          if (!vistas.has(clave)) {
            vistas.add(clave);
            const b = decidirB(mias, suyas).casillas;
            const iguales = a.slice().sort().join(',') === b.slice().sort().join(',');
            if (!iguales) discrepancias.push({ clave, a: a.slice().sort(), b: b.slice().sort() });
          }
          for (const c of a) visitar(mias.concat(c), suyas, false);
        } else {
          for (const c of PFC.libres(mias, suyas)) visitar(mias, suyas.concat(c), true);
        }
      };
      visitar([], [], empiezaA);
      return vistas.size;
    };

    posicionesComparadas = recorrerPapel(true) + recorrerPapel(false);
    return { posicionesComparadas, discrepancias };
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
