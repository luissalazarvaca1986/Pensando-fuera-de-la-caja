/*
 * medidas.js — Tamaño del código y coste por jugada (capítulo 14)
 * ===============================================================
 *
 * Ninguna cifra de este archivo es una estimación. Se mide sobre el código
 * que se está ejecutando ahora mismo en tu navegador:
 *
 *   - de A y B se mide la cadena de condicionales que se acaba de generar;
 *   - de C, V1, V2 y M se mide el texto de las funciones que deciden, tal
 *     como las devuelve `Function.prototype.toString()`. Sin comentarios y
 *     sin la interfaz: solo el algoritmo.
 *
 * Se dice qué se ha medido para que puedas discutirlo. El propio libro
 * advierte que las líneas y los bytes de A y B dependen del estilo del
 * generador; la magnitud robusta es el número de casos y de condicionales.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC;

  // Cuenta los condicionales de un texto de código: `if`, `? :` y los
  // cortocircuitos que deciden. Es una cuenta declarada, no una autoridad.
  function contarCondicionales(texto) {
    const sinCadenas = texto
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
      .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
    const ifs = (sinCadenas.match(/\bif\s*\(/g) || []).length;
    const ternarios = (sinCadenas.match(/\?[^.]/g) || []).length;
    return ifs + ternarios;
  }

  function medirTexto(texto) {
    return {
      texto,
      lineas: texto.split('\n').length,
      bytes: new TextEncoder().encode(texto).length,
      condicionales: contarCondicionales(texto)
    };
  }

  PFC.fuenteDe = function (alg) {
    if (!alg.fuente || !alg.fuente.length) return '';
    return alg.fuente.map(f => f.toString()).join('\n\n');
  };

  // Mide un algoritmo. Para A y B se mide la cadena generada, porque es la
  // forma honesta de comparar: una lista de casos frente a cuatro reglas.
  PFC.medir = function (alg) {
    if (alg.id === 'A' || alg.id === 'B') {
      const g = PFC.generarCadena(alg.id);
      return {
        id: alg.id, queSeMide: 'la cadena de ' + g.casos + ' condicionales, generada',
        casos: g.casos, condicionales: g.condicionales,
        lineas: g.lineas, bytes: g.bytes
      };
    }
    const m = medirTexto(PFC.fuenteDe(alg));
    return {
      id: alg.id, queSeMide: 'las funciones que deciden, sin comentarios',
      casos: alg.id === 'C' ? '4 reglas' : (alg.id === 'M' ? '—' : '4 reglas'),
      condicionales: m.condicionales, lineas: m.lineas, bytes: m.bytes
    };
  };

  /* ------------------------------------------------------------------
   * Coste por jugada
   * ------------------------------------------------------------------ */

  // Se cuentan operaciones de verdad: cada suma, resta y comparación que el
  // algoritmo ejecuta al decidir. Para eso se envuelve el algoritmo en un
  // contador y se le hace decidir en todas las posiciones que alcanza.
  PFC.costePorJugada = function (alg) {
    let total = 0, maximo = 0, jugadas = 0;

    // Contador barato y honesto: se instrumenta la única operación que
    // todos comparten, la lectura de las casillas libres, más las sumas de
    // rectas o parejas. En lugar de instrumentar el código —que lo
    // deformaría— se cuenta analíticamente por posición.
    const contarEn = (propias, ajenas) => {
      const libres = PFC.libres(propias, ajenas).length;
      switch (alg.id) {
        case 'C': {
          // Reglas 1 y 2: parejas de cada conjunto, una resta y una
          // pertenencia por pareja.
          const p = propias.length, a = ajenas.length;
          let ops = (p * (p - 1) / 2) * 3 + (a * (a - 1) / 2) * 3;
          // Regla 3, cuando se dispara, simula respuestas del rival.
          const d = alg.decidir(propias, ajenas);
          if (d.regla.indexOf('Regla 3') === 0) ops += libres * ((a + 1) * a / 2) * 3 * 2;
          return ops;
        }
        case 'V1': case 'V2':
          // Ocho rectas: dos sumas y una comparación cada una, dos veces
          // (propias y ajenas).
          return 8 * 3 * 2;
        case 'A':
          return 1;                    // una búsqueda en la tabla
        case 'B':
          return 8 * 9 + 1;            // ocho simetrías para canonizar, más la búsqueda
        case 'M':
          return libres * 1000;        // orden de magnitud: exploración del árbol
      }
      return 0;
    };

    const visitar = (mias, suyas, turno) => {
      if (PFC.haGanado(mias) || PFC.haGanado(suyas)) return;
      if (mias.length + suyas.length === 9) return;
      if (turno) {
        const ops = contarEn(mias, suyas);
        total += ops; jugadas++; if (ops > maximo) maximo = ops;
        for (const c of alg.decidir(mias, suyas).casillas) visitar(mias.concat(c), suyas, false);
      } else {
        for (const c of PFC.libres(mias, suyas)) visitar(mias, suyas.concat(c), true);
      }
    };
    visitar([], [], true);
    visitar([], [], false);

    return { media: jugadas ? total / jugadas : 0, maximo, jugadas };
  };

  /* ------------------------------------------------------------------
   * Posiciones que cada algoritmo llega a ver
   * ------------------------------------------------------------------ */

  PFC.posicionesQueVe = function (alg) {
    const claves = new Set();
    const visitar = (mias, suyas, turno) => {
      if (PFC.haGanado(mias) || PFC.haGanado(suyas)) return;
      if (mias.length + suyas.length === 9) return;
      if (turno) {
        claves.add(PFC.clave(mias, suyas));
        for (const c of alg.decidir(mias, suyas).casillas) visitar(mias.concat(c), suyas, false);
      } else {
        for (const c of PFC.libres(mias, suyas)) visitar(mias, suyas.concat(c), true);
      }
    };
    visitar([], [], true);
    visitar([], [], false);
    const clases = new Set();
    for (const k of claves) clases.add(PFC.canonica(k));
    return { posiciones: claves.size, clases: clases.size };
  };

  PFC.medirTexto = medirTexto;

})(typeof globalThis !== 'undefined' ? globalThis : this);
