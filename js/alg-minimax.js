/*
 * alg-minimax.js — La vía que el autor no conocía
 * ===============================================
 *
 * «Cuando resolví este problema no tenía conocimiento sobre Minimax. No lo
 *  descarté por sus limitaciones. Sencillamente no sabía que existía.»
 *
 * Está aquí para que la comparación sea completa y honesta. Minimax es una
 * idea potente y general: no enumera situaciones, sino futuros, y sirve
 * igual para las damas o —con muchos añadidos— para el ajedrez.
 *
 * Y no pierde nunca, claro. Fíjate, eso sí, en qué contesta cuando se le
 * pregunta POR QUÉ ha jugado donde ha jugado: «porque exploré el árbol y
 * esta rama daba el mejor valor». Es cierto, es correcto, y no es una
 * explicación que puedas seguir con la cabeza.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC;

  function decidir(propias, ajenas) {
    const casillas = PFC.jugadasOptimas(propias, ajenas);
    const nodos = PFC.libres(propias, ajenas).length;
    return {
      casillas,
      regla: 'Minimax — mejor valor del árbol',
      explicacion: 'Se han explorado las ' + nodos + ' jugadas posibles y, para cada una, '
        + 'todas las respuestas del rival hasta el final de la partida. '
        + 'Estas dan el mejor desenlace suponiendo que el rival también juega bien.'
    };
  }

  PFC.registrar({
    id: 'M',
    nombre: 'M — Minimax',
    corto: 'M · Minimax',
    capitulo: 'Capítulo 1.2.3',
    resumen: 'No enumera situaciones sino futuros. La solución habitual al tres en raya, '
      + 'y la que el autor no conocía. Correcta, general y difícil de seguir leyéndola.',
    necesita: 'Las reglas del juego y tiempo de cálculo',
    geometria: 'La condición de victoria',
    perezoso: true,
    decidir: decidir,
    fuente: [decidir, PFC.valor, PFC.jugadasOptimas]
  });

})(typeof globalThis !== 'undefined' ? globalThis : this);
