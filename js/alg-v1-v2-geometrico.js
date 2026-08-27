/*
 * alg-v1-v2-geometrico.js — Las formulaciones V1 y V2 (capítulo 8)
 * ================================================================
 *
 * Este archivo existe para responder a la objeción más seria que se le puede
 * hacer al libro: ¿hacía falta el cuadrado mágico?
 *
 * Las dos formulaciones que hay aquí detectan igual y solo se diferencian en
 * UNA función, `localizar`:
 *
 *   V1  localiza la casilla que cierra la recta RECORRIÉNDOLA hasta
 *       encontrar el hueco. No usa el cuadrado mágico en ningún sitio.
 *
 *   V2  localiza la misma casilla con la resta 15 − (a + b) sobre los
 *       números del cuadrado mágico. Es la formulación del relato original.
 *
 * Todo lo demás es idéntico, y eso es precisamente la demostración: el
 * cuadrado mágico, aquí, no está haciendo el trabajo. Lo hacen las fichas
 * 1 y 10. Compruébalo en la página de verificación: las dos toman la misma
 * decisión en todas las posiciones comparadas.
 *
 * Fíjate en lo que las dos conservan, y que V3 no tiene:
 *   - la lista RECTAS, escrita a mano;
 *   - las coordenadas;
 *   - la clasificación centro / esquinas / lados, escrita a mano.
 *
 * Eso es «una transformación parcial no rinde»: V2 mantiene las dos
 * representaciones a la vez, paga el coste de las dos y no puede descartar
 * ninguna.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC;

  /* ==================================================================
   * La codificación posicional de fichas (capítulo 6.1)
   * ================================================================== */

  // Casilla libre vale 0, ficha propia 1, ficha del rival 10.
  // Como en una recta caben tres fichas y 3 < 10, la suma S = a + 10b es una
  // codificación posicional: las unidades cuentan tus fichas y las decenas
  // las del rival. Leer 20 es leer «dos del rival, ninguna mía».
  const LIBRE = 0, PROPIA = 1, AJENA = 10;

  const AMENAZA_PROPIA = 2;    // dos mías y un hueco
  const AMENAZA_AJENA = 20;    // dos suyas y un hueco

  function tablero(propias, ajenas) {
    const t = [LIBRE, LIBRE, LIBRE, LIBRE, LIBRE, LIBRE, LIBRE, LIBRE, LIBRE];
    for (const c of propias) t[c] = PROPIA;
    for (const c of ajenas) t[c] = AJENA;
    return t;
  }

  function sumaRecta(t, recta) {
    return t[recta[0]] + t[recta[1]] + t[recta[2]];
  }

  /* ==================================================================
   * La única diferencia entre V1 y V2
   * ================================================================== */

  // V1: recorrer la recta hasta dar con el hueco.
  function localizarRecorriendo(t, recta) {
    for (const c of recta) if (t[c] === LIBRE) return c;
    return null;
  }

  // V2: sumar los dos números mágicos ocupados y restar de quince.
  function localizarPorResta(t, recta) {
    let a = 0, b = 0;
    for (const c of recta) {
      if (t[c] !== LIBRE) { if (a === 0) a = PFC.MU[c]; else b = PFC.MU[c]; }
    }
    const falta = PFC.CONSTANTE_MAGICA - (a + b);
    return PFC.MU_INV[falta];
  }

  /* ==================================================================
   * Detección: recorriendo las ocho rectas escritas a mano
   * ================================================================== */

  function cierres(t, valorBuscado, localizar) {
    const salida = [];
    for (const recta of PFC.RECTAS) {
      if (sumaRecta(t, recta) === valorBuscado) {
        const c = localizar(t, recta);
        if (c !== null && !salida.includes(c)) salida.push(c);
      }
    }
    return salida.sort((x, y) => x - y);
  }

  /* ==================================================================
   * Reglas 3 y 4, en geometría
   * ================================================================== */

  function amenazaDobleEnCamino(propias, ajenas, localizar) {
    for (const x of PFC.libres(propias, ajenas)) {
      const t = tablero(propias, ajenas.concat(x));
      if (cierres(t, AMENAZA_AJENA, localizar).length >= 2) return true;
    }
    return false;
  }

  function ataques(propias, ajenas, localizar) {
    const dobles = [], seguros = [];
    for (const x of PFC.libres(propias, ajenas)) {
      const misAmenazas = cierres(tablero(propias.concat(x), ajenas), AMENAZA_PROPIA, localizar);
      if (misAmenazas.length === 0) continue;
      if (misAmenazas.length >= 2) { dobles.push(x); continue; }

      const bloqueo = misAmenazas[0];
      const tras = tablero(propias.concat(x), ajenas.concat(bloqueo));
      if (cierres(tras, AMENAZA_AJENA, localizar).length >= 2) continue;
      seguros.push(x);
    }
    return dobles.length ? dobles : seguros;
  }

  // Preferencia posicional, escrita a mano porque aquí no hay aritmética
  // que la regale.
  const PREFERENCIA_GEO = [[PFC.CENTRO_GEO], PFC.ESQUINAS_GEO, PFC.LADOS_GEO];
  const NIVELES = ['el centro', 'una esquina', 'un lado'];

  /* ==================================================================
   * Las cuatro reglas, comunes a V1 y V2
   * ================================================================== */

  function crear(localizar, comoLocaliza) {
    return function decidir(propias, ajenas) {
      const t = tablero(propias, ajenas);
      const libres = PFC.libres(propias, ajenas);

      // Regla 1. Ganar si es posible: alguna recta vale 2.
      const mias = cierres(t, AMENAZA_PROPIA, localizar);
      if (mias.length) return {
        casillas: mias, regla: 'Regla 1 — ganar',
        explicacion: 'Hay una recta que vale ' + AMENAZA_PROPIA
          + ' (dos fichas mías y un hueco). ' + comoLocaliza + ' Cierro en ' + mias.join(', ') + '.'
      };

      // Regla 2. Si se puede perder, no perder: alguna recta vale 20.
      const suyas = cierres(t, AMENAZA_AJENA, localizar);
      if (suyas.length) return {
        casillas: suyas, regla: 'Regla 2 — no perder',
        explicacion: 'Hay una recta que vale ' + AMENAZA_AJENA
          + ' (dos fichas del rival y un hueco). ' + comoLocaliza + ' Bloqueo en ' + suyas.join(', ') + '.'
      };

      // Regla 3. Evitar casos dobles.
      if (amenazaDobleEnCamino(propias, ajenas, localizar)) {
        const a = ataques(propias, ajenas, localizar);
        if (a.length) return {
          casillas: a, regla: 'Regla 3 — evitar la doble amenaza',
          explicacion: 'El rival puede alcanzar dos amenazas a la vez en una jugada. '
            + 'Ataco en ' + a.join(', ') + ' para forzar su respuesta.'
        };
      }

      // Regla 4. Preferencia posicional, sobre la lista escrita a mano.
      for (let i = 0; i < PREFERENCIA_GEO.length; i++) {
        const nivel = PREFERENCIA_GEO[i].filter(c => libres.includes(c));
        if (nivel.length) return {
          casillas: nivel, regla: 'Regla 4 — preferencia posicional',
          explicacion: 'Nada que ganar ni bloquear. Juego ' + NIVELES[i]
            + ': casilla ' + nivel.join(', ') + '.'
        };
      }

      throw new Error('no quedan casillas libres');
    };
  }

  const decidirV1 = crear(localizarRecorriendo, 'Localizo el hueco recorriendo la recta.');
  const decidirV2 = crear(localizarPorResta, 'Localizo el hueco con 15 − (a + b) sobre el cuadrado mágico.');

  /* ================================================================== */

  PFC.registrar({
    id: 'V1',
    nombre: 'V1 — Fichas 1/10, sin cuadrado mágico',
    corto: 'V1 · sin cuadrado mágico',
    capitulo: 'Capítulo 8',
    resumen: 'Detecta sumando las ocho rectas con las fichas 1 y 10, y localiza el '
      + 'hueco recorriendo la recta. Conserva toda la geometría.',
    necesita: 'La lista de las 8 rectas y las coordenadas',
    geometria: 'Rectas, coordenadas, posiciones',
    decidir: decidirV1,
    fuente: [tablero, sumaRecta, localizarRecorriendo, cierres, crear]
  });

  PFC.registrar({
    id: 'V2',
    nombre: 'V2 — Fichas 1/10 con cuadrado mágico',
    corto: 'V2 · transformación parcial',
    capitulo: 'Capítulo 8',
    resumen: 'Idéntica a V1 salvo en localizar el hueco: aquí se usa 15 − (a+b). '
      + 'Dos representaciones conviviendo: se paga el coste de las dos.',
    necesita: 'Las 8 rectas, las coordenadas y el cuadrado mágico',
    geometria: 'Rectas, coordenadas, posiciones',
    decidir: decidirV2,
    fuente: [localizarPorResta, cierres, crear]
  });

  // Se exponen los internos para que la página pueda mostrar la memoria de
  // trabajo del algoritmo en el panel «Dentro de la máquina».
  PFC.geometrico = {
    decidirV1, decidirV2, localizarRecorriendo, localizarPorResta,
    tablero, sumaRecta, cierres, amenazaDobleEnCamino, ataques,
    LIBRE, PROPIA, AJENA, AMENAZA_PROPIA, AMENAZA_AJENA,
    NOMBRES_RECTA: ['fila 1', 'fila 2', 'fila 3', 'col 1', 'col 2', 'col 3', 'diag \\', 'diag /']
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
