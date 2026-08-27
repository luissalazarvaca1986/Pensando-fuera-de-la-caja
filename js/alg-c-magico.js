/*
 * alg-c-magico.js — Solución C: cuatro reglas aritméticas
 * =======================================================
 *
 * Es el algoritmo del libro: la formulación V3 del capítulo 8, la que lleva
 * la transformación hasta el final.
 *
 * Lo que NO hay en este archivo, y conviene mirar antes de leerlo:
 *
 *   - No hay lista de las ocho rectas. Las ocho rectas son los ocho tríos
 *     que suman quince, y eso no hay que escribirlo: se deduce.
 *   - No hay coordenadas, ni filas, ni columnas, ni diagonales.
 *   - No hay ninguna comprobación de «¿están estas tres casillas alineadas?».
 *     La propiedad aritmética sustituye a la comprobación.
 *   - No hay tabla de casos. Hay cuatro reglas.
 *
 * Toda la geometría vive en una sola línea de este archivo: la traducción
 * de casillas a números al entrar, y de vuelta al salir. Es el movimiento 6
 * del modelo del capítulo 10.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC;
  const K = PFC.CONSTANTE_MAGICA;                 // 15

  /* ==================================================================
   * Etapa 2 — Saber quién ha ganado (capítulo 6.2)
   * ================================================================== */

  // Tres casillas forman recta si y solo si suman la constante mágica.
  function esLinea(trio) {
    return trio.length === 3 && trio[0] + trio[1] + trio[2] === K;
  }

  function tieneLinea(mias) {
    return PFC.tercias(mias).some(esLinea);
  }

  /* ==================================================================
   * Etapa 3 — Ver las amenazas (capítulo 6.3)
   * ================================================================== */

  // Casillas libres que completan una recta propia.
  //
  // Fíjate en lo que no está aquí: no se comprueba si a y b pertenecen a una
  // misma línea. No hace falta. Por la proposición 5.2, si 15 − (a+b) cae en
  // el rango y los tres son distintos, el trío ES una línea. Y como `libres`
  // nunca contiene números que ya sean de alguien, la distinción es gratis.
  function cierres(mias, libres) {
    const salida = [];
    for (const [a, b] of PFC.parejas(mias)) {
      const falta = K - a - b;
      if (libres.includes(falta) && !salida.includes(falta)) salida.push(falta);
    }
    return salida.sort((x, y) => x - y);
  }

  /* ==================================================================
   * Etapa 4 — Auxiliares de la regla 3 (capítulo 6.4)
   * ================================================================== */

  // ¿Puede el rival, en una sola jugada, alcanzar una posición con dos
  // amenazas a la vez? Si puede, bloquear una dejaría la otra abierta.
  function amenazaDobleEnCamino(suyas, libres) {
    return libres.some(x =>
      cierres(suyas.concat(x), PFC.quitar(libres, x)).length >= 2
    );
  }

  // Ataques válidos: jugadas que crean una amenaza propia —y por tanto
  // fuerzan la respuesta del rival— sin que el bloqueo obligado del rival
  // le construya justamente la doble amenaza que queríamos evitar.
  function ataques(mias, suyas, libres) {
    const dobles = [];      // nos dan dos amenazas: el rival no puede con las dos
    const seguros = [];     // nos dan una, y su bloqueo no le regala nada
    for (const x of libres) {
      const libresTrasAtacar = PFC.quitar(libres, x);
      const mias2 = mias.concat(x);
      const misAmenazas = cierres(mias2, libresTrasAtacar);

      if (misAmenazas.length === 0) continue;          // no fuerza respuesta
      if (misAmenazas.length >= 2) { dobles.push(x); continue; }

      const bloqueo = misAmenazas[0];                  // el rival está obligado
      const suyas2 = suyas.concat(bloqueo);
      const libresTrasBloqueo = PFC.quitar(libresTrasAtacar, bloqueo);
      if (cierres(suyas2, libresTrasBloqueo).length >= 2) continue;
      seguros.push(x);
    }
    return dobles.length ? dobles : seguros;
  }

  /* ==================================================================
   * Etapa 5 — Las cuatro reglas, en orden de prioridad (capítulo 6.5)
   * ================================================================== */

  // Preferencia posicional de la regla 4, en aritmética pura.
  // El centro es el cinco, las esquinas son los pares, los lados los impares.
  const PREFERENCIA = [PFC.CENTRO_NUM, PFC.ESQUINAS_NUM, PFC.LADOS_NUM];
  const NIVELES = ['el centro', 'una esquina', 'un lado'];

  // Devuelve TODAS las jugadas que las cuatro reglas consideran igual de
  // buenas, más la regla que decidió y su explicación aritmética.
  function jugada(mias, suyas) {
    const ocupados = mias.concat(suyas);
    const libres = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !ocupados.includes(n));

    // Regla 1. Ganar si es posible.
    const propias = cierres(mias, libres);
    if (propias.length) {
      return {
        casillas: propias, regla: 'Regla 1 — ganar',
        explicacion: explicaCierre(mias, propias, 'Cierro mi línea')
      };
    }

    // Regla 2. Si se puede perder, no perder.
    const ajenas = cierres(suyas, libres);
    if (ajenas.length) {
      return {
        casillas: ajenas, regla: 'Regla 2 — no perder',
        explicacion: explicaCierre(suyas, ajenas, 'El rival cerraría ahí, así que bloqueo')
      };
    }

    // Regla 3. Evitar casos dobles.
    if (amenazaDobleEnCamino(suyas, libres)) {
      const ataque = ataques(mias, suyas, libres);
      if (ataque.length) {
        return {
          casillas: ataque, regla: 'Regla 3 — evitar la doble amenaza',
          explicacion: explicaRegla3(mias, suyas, libres, ataque)
        };
      }
    }

    // Regla 4. Preferencia posicional: centro, esquinas, lados.
    for (let i = 0; i < PREFERENCIA.length; i++) {
      const nivel = PREFERENCIA[i].filter(n => libres.includes(n));
      if (nivel.length) {
        return {
          casillas: nivel, regla: 'Regla 4 — preferencia posicional',
          explicacion: 'Nada que ganar ni bloquear, y ninguna doble amenaza en camino. '
            + 'Juego ' + NIVELES[i] + ': ' + listar(nivel) + '.'
        };
      }
    }

    throw new Error('no quedan casillas libres');
  }

  /* ==================================================================
   * Explicaciones. No deciden nada: solo cuentan la aritmética que se
   * ha usado, para que la jugada se pueda leer y no solo ejecutar.
   * ================================================================== */

  function explicaCierre(conjunto, cierres, encabezado) {
    const cuentas = [];
    for (const [a, b] of PFC.parejas(conjunto)) {
      const falta = K - a - b;
      if (cierres.includes(falta)) {
        cuentas.push('15 − (' + a + ' + ' + b + ') = ' + falta + ', y el ' + falta + ' está libre');
      }
    }
    return encabezado + ': ' + cuentas.join('; ') + '.';
  }

  function explicaRegla3(mias, suyas, libres, ataque) {
    let peligro = '';
    for (const x of libres) {
      const dos = cierres(suyas.concat(x), PFC.quitar(libres, x));
      if (dos.length >= 2) {
        peligro = 'Si el rival tomara el ' + x + ' tendría dos amenazas a la vez ('
          + listar(dos) + ') y solo podría bloquearse una. ';
        break;
      }
    }
    return peligro + 'Ataco en ' + listar(ataque)
      + ' para forzar su respuesta, eligiendo un ataque cuyo bloqueo obligado no le construya esa doble.';
  }

  function listar(ns) {
    return ns.length === 1 ? 'el ' + ns[0] : 'el ' + ns.slice(0, -1).join(', el ') + ' o el ' + ns[ns.length - 1];
  }

  /* ==================================================================
   * La frontera. Aquí, y solo aquí, hay geometría.
   * ================================================================== */

  // El motor habla de casillas 0..8, porque el tablero es el problema real.
  // El algoritmo habla de números 1..9. mu traduce en las dos direcciones.
  function decidir(propias, ajenas) {
    const d = jugada(PFC.aNumeros(propias), PFC.aNumeros(ajenas));
    return {
      casillas: PFC.aCasillas(d.casillas),          // volver al tablero
      regla: d.regla,
      explicacion: d.explicacion
    };
  }

  /* ==================================================================
   * Variantes para la ablación del capítulo 7. Son el MISMO algoritmo
   * con piezas retiradas, para comprobar que las cuatro reglas no solo
   * bastan: hacen falta.
   * ================================================================== */

  function variante(opciones) {
    return function (propias, ajenas) {
      const mias = PFC.aNumeros(propias), suyas = PFC.aNumeros(ajenas);
      const ocupados = mias.concat(suyas);
      const libres = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !ocupados.includes(n));

      const propias1 = cierres(mias, libres);
      const ajenas1 = cierres(suyas, libres);

      if (opciones.invertirPrioridad) {
        // Bloquear ANTES de ganar. Es la primera rotura del capítulo 7.5:
        // el algoritmo defiende una amenaza teniendo la victoria servida.
        if (ajenas1.length) return salida(ajenas1, 'Regla 2 — no perder');
        if (propias1.length) return salida(propias1, 'Regla 1 — ganar');
      } else {
        if (propias1.length) return salida(propias1, 'Regla 1 — ganar');
        if (ajenas1.length) return salida(ajenas1, 'Regla 2 — no perder');
      }

      if (opciones.regla3 && amenazaDobleEnCamino(suyas, libres)) {
        const a = ataques(mias, suyas, libres);
        if (a.length) return salida(a, 'Regla 3 — evitar la doble amenaza');
      }

      if (opciones.regla4 === 'azar') {
        return salida(libres, 'Regla 4 — azar puro');
      }
      for (let i = 0; i < PREFERENCIA.length; i++) {
        const nivel = PREFERENCIA[i].filter(n => libres.includes(n));
        if (nivel.length) return salida(nivel, 'Regla 4 — preferencia posicional');
      }
      throw new Error('no quedan casillas libres');

      function salida(numeros, regla) {
        return { casillas: PFC.aCasillas(numeros), regla: regla, explicacion: '' };
      }
    };
  }

  /* ================================================================== */

  PFC.registrar({
    id: 'C',
    nombre: 'C — Cuadrado mágico: cuatro reglas',
    corto: 'C · cuatro reglas',
    capitulo: 'Capítulos 5 y 6',
    resumen: 'Sin tablero, sin lista de rectas y sin coordenadas. Ganar es tener tres '
      + 'números que sumen 15; amenazar es que 15 − (a+b) siga libre.',
    necesita: 'Que las líneas suman quince',
    geometria: 'Ninguna',
    decidir: decidir,
    fuente: [esLinea, tieneLinea, cierres, amenazaDobleEnCamino, ataques, jugada, decidir]
  });

  // Se exponen para la página de verificación y para las otras formulaciones.
  PFC.magico = {
    esLinea, tieneLinea, cierres, amenazaDobleEnCamino, ataques, jugada, variante
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
