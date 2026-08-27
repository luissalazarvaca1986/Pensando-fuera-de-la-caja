/*
 * ui-verificacion.js — Comprobarlo de verdad (capítulos 7 y 8)
 * ============================================================
 * Cada tabla de esta página se calcula recorriendo el árbol completo del
 * juego en tu navegador, ahora. Junto a cada cifra va la del libro, y se
 * marca si coincide o no. También cuando no coincide.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC, UI = global.UI;
  const $ = s => document.querySelector(s);

  function cotejar(mio, libro) {
    if (libro === undefined || libro === null) return '<td class="tenue">—</td>';
    return '<td class="num ' + (mio === libro ? 'bien' : 'aviso-t') + '">'
      + UI.numero(libro) + (mio === libro ? ' ✓' : ' ≠') + '</td>';
  }

  async function paso(elemento, texto, fn) {
    elemento.innerHTML = '<span class="girando"></span> ' + texto;
    const r = await UI.pronto(fn);
    elemento.textContent = texto + ' — hecho';
    return r;
  }

  /* ---------- 1. Los seis algoritmos, sobre el juego entero ---------- */

  async function recorridoDeTodos() {
    const filas = [];
    for (const alg of PFC.algoritmos) {
      const r = await paso($('#p-todos'), 'recorriendo el árbol completo con ' + alg.id,
        () => PFC.recorrer(alg.decidir));
      filas.push({ alg, r });
    }
    $('#p-todos').textContent = 'recorrido completo de los seis algoritmos — hecho';

    $('#t-todos').innerHTML =
      '<thead><tr><th>algoritmo</th><th>capítulo</th><th class="num">partidas</th>'
      + '<th class="num">victorias</th><th class="num">empates</th>'
      + '<th class="num">derrotas</th></tr></thead><tbody>'
      + filas.map(({ alg, r }) =>
        '<tr><td>' + alg.corto + '</td><td class="tenue">' + alg.capitulo + '</td>'
        + '<td class="num">' + UI.numero(r.partidas) + '</td>'
        + '<td class="num">' + UI.numero(r.victorias) + '</td>'
        + '<td class="num">' + UI.numero(r.empates) + '</td>'
        + '<td class="num ' + (r.derrotas ? 'mal' : 'bien') + '">' + r.derrotas + '</td></tr>'
      ).join('') + '</tbody>';

    const derrotasTotales = filas.reduce((s, f) => s + f.r.derrotas, 0);
    $('#c-derrotas').textContent = derrotasTotales;
    $('#c-derrotas').className = 'valor ' + (derrotasTotales === 0 ? 'ok' : 'no');
    $('#c-partidas').textContent = UI.numero(filas.reduce((s, f) => s + f.r.partidas, 0));
  }

  /* ---------- 2. Ablación: ¿hacen falta las cuatro reglas? ---------- */

  async function ablacion() {
    const filas = [];
    for (const caso of PFC.ablacion()) {
      const r = await paso($('#p-ablacion'), 'ablación: ' + caso.nombre,
        () => PFC.recorrer(caso.decidir));
      filas.push({ caso, r });
    }
    $('#p-ablacion').textContent = 'ablación de las cuatro reglas — hecho';

    $('#t-ablacion').innerHTML =
      '<thead><tr><th>configuración</th><th class="num">partidas</th>'
      + '<th class="num">libro</th><th class="num">derrotas</th>'
      + '<th class="num">libro</th></tr></thead><tbody>'
      + filas.map(({ caso, r }) =>
        '<tr' + (caso.esLaBuena ? ' class="destacada"' : '') + '><td>' + caso.nombre + '</td>'
        + '<td class="num">' + UI.numero(r.partidas) + '</td>'
        + cotejar(r.partidas, caso.libro.partidas)
        + '<td class="num ' + (r.derrotas ? 'mal' : 'bien') + '">' + UI.numero(r.derrotas) + '</td>'
        + cotejar(r.derrotas, caso.libro.derrotas)
        + '</tr>').join('') + '</tbody>';
  }

  /* ---------- 3. Las tres roturas del capítulo 7.5 ---------- */

  async function roturas() {
    const filas = [];
    for (const rot of PFC.roturas()) {
      const r = await paso($('#p-roturas'), 'rompiendo: ' + rot.nombre, () => ({
        total: PFC.recorrer(rot.decidir),
        respondiendo: PFC.recorrer(rot.decidir, { rol: 'respondiendo' }),
        empezando: PFC.recorrer(rot.decidir, { rol: 'empezando' })
      }));
      filas.push({ rot, r });
    }
    $('#p-roturas').textContent = 'las tres roturas instructivas — hecho';

    $('#t-roturas').innerHTML =
      '<thead><tr><th>qué se rompe</th><th class="num">partidas</th>'
      + '<th class="num">derrotas</th><th class="num">empezando</th>'
      + '<th class="num">respondiendo</th><th>dónde duele</th></tr></thead><tbody>'
      + filas.map(({ rot, r }) =>
        '<tr><td>' + rot.nombre + '</td>'
        + '<td class="num">' + UI.numero(r.total.partidas) + '</td>'
        + '<td class="num ' + (r.total.derrotas ? 'mal' : 'bien') + '">'
        + UI.numero(r.total.derrotas) + '</td>'
        + '<td class="num">' + UI.numero(r.empezando.derrotas) + '</td>'
        + '<td class="num">' + UI.numero(r.respondiendo.derrotas)
        + ' <span class="tenue">de ' + UI.numero(r.respondiendo.partidas) + '</span></td>'
        + '<td class="tenue">' + rot.nota + '</td></tr>').join('') + '</tbody>';

    // La partida concreta que pierde, cuando se quita la regla 3.
    const sinRegla3 = PFC.roturas()[3];
    const r = PFC.recorrer(sinRegla3.decidir);
    if (r.partidaPerdida) {
      $('#partida-perdida').textContent = narrar(r.partidaPerdida);
    }
  }

  // «Si aparece aunque sea una, muéstrame la partida que lleva a ella.»
  function narrar(historia) {
    const mias = [], suyas = [];
    let s = 'Una de las partidas que pierde, jugada a jugada:\n\n';
    historia.forEach(function (m, i) {
      (m.quien === 'algoritmo' ? mias : suyas).push(m.casilla);
      s += '  ' + String(i + 1).padStart(2) + '. '
        + (m.quien === 'algoritmo' ? 'algoritmo' : 'rival    ')
        + '  casilla ' + m.casilla + '  (número ' + PFC.MU[m.casilla] + ')\n';
    });
    s += '\n' + global.DM.caja(
      (function () {
        const c = [];
        for (let i = 0; i < 9; i++) c.push(mias.includes(i) ? 'X' : suyas.includes(i) ? 'O' : '·');
        return c;
      })(), 3);
    s += '\n  X = algoritmo, O = rival. El rival ha hecho tres en raya.\n';
    s += '  P = { ' + PFC.aNumeros(mias).join(', ') + ' }   '
      + 'R = { ' + PFC.aNumeros(suyas).join(', ') + ' }\n';
    return s;
  }

  /* ---------- 4. Las tres formulaciones del capítulo 8 ---------- */

  async function formulaciones() {
    const ids = ['V1', 'V2', 'C'];
    const etiquetas = {
      V1: 'V1 — fichas 1/10, sin cuadrado mágico',
      V2: 'V2 — fichas 1/10 con cuadrado mágico',
      C: 'V3 — solo aritmética, sin geometría'
    };
    const filas = [];
    for (const id of ids) {
      const r = await paso($('#p-formulaciones'), 'verificando ' + id,
        () => PFC.recorrer(PFC.determinista(PFC.porId[id].decidir)));
      filas.push({ id, r });
    }

    const cmpV1V2 = await paso($('#p-formulaciones'), 'comparando V1 con V2',
      () => PFC.comparar(PFC.determinista(PFC.porId.V1.decidir),
        PFC.determinista(PFC.porId.V2.decidir)));
    const cmpConjuntos = await paso($('#p-formulaciones'), 'comparando los conjuntos completos',
      () => PFC.comparar(PFC.porId.V1.decidir, PFC.porId.C.decidir));
    $('#p-formulaciones').textContent = 'las tres formulaciones — hecho';

    $('#t-formulaciones').innerHTML =
      '<thead><tr><th>formulación</th><th>geometría que usa</th>'
      + '<th class="num">partidas</th><th class="num">libro</th>'
      + '<th class="num">derrotas</th><th class="num">libro</th></tr></thead><tbody>'
      + filas.map(({ id, r }) =>
        '<tr><td>' + etiquetas[id] + '</td>'
        + '<td class="tenue">' + PFC.porId[id].geometria + '</td>'
        + '<td class="num">' + UI.numero(r.partidas) + '</td>' + cotejar(r.partidas, 551)
        + '<td class="num ' + (r.derrotas ? 'mal' : 'bien') + '">' + r.derrotas + '</td>'
        + cotejar(r.derrotas, 0) + '</tr>').join('') + '</tbody>';

    $('#comparaciones').innerHTML =
      '<p>V1 frente a V2, jugada única: <strong>' + cmpV1V2.posicionesComparadas
      + ' posiciones comparadas</strong>, <span class="'
      + (cmpV1V2.discrepancias.length ? 'mal' : 'bien') + '">'
      + cmpV1V2.discrepancias.length + ' discrepancias</span>. '
      + 'El libro dice 723 posiciones y ninguna discrepancia: la cifra de posiciones depende de '
      + 'cómo se cuenten los dos papeles, la de discrepancias no.</p>'
      + '<p>Y algo más fuerte todavía: comparando los <em>conjuntos completos</em> de jugadas '
      + 'candidatas, V1 y la formulación aritmética coinciden en las <strong>'
      + cmpConjuntos.posicionesComparadas + ' posiciones</strong> con <span class="'
      + (cmpConjuntos.discrepancias.length ? 'mal' : 'bien') + '">'
      + cmpConjuntos.discrepancias.length + ' discrepancias</span>. '
      + 'No son algoritmos parecidos: son el mismo algoritmo dicho de dos maneras.</p>';
  }

  /* ---------- 5. La proposición 5.2, delante de ti ---------- */

  function proposicion() {
    const p = PFC.comprobarProposicion52();
    let s = 'Subconjuntos de tres elementos de {1..9} .......... ' + p.subconjuntosDeTres + '\n';
    s += 'De ellos, los que suman 15 ....................... ' + p.triosQueSumanQuince + '\n';
    s += 'Rectas ganadoras del tablero ..................... ' + p.rectasDelTablero + '\n\n';
    s += 'Cada recta del tablero, traducida con μ:\n\n';
    const nombres = PFC.geometrico.NOMBRES_RECTA;
    PFC.RECTAS.forEach(function (r, i) {
      s += '  ' + nombres[i].padEnd(9) + '[' + r.join(',') + ']  →  {'
        + PFC.aNumeros(r).join(',') + '}   suma '
        + PFC.aNumeros(r).reduce((a, b) => a + b, 0) + '\n';
    });
    s += '\nLos ocho tríos de {1..9} que suman 15:\n\n  '
      + p.trios.map(t => '{' + t.join(',') + '}').join('  ') + '\n\n';
    s += p.coinciden
      ? '¿Coinciden exactamente? SÍ. No sobra ninguno y no falta ninguno.\n'
      : '¿Coinciden? NO. Sobran: ' + p.sobranEnTrios.join(' ')
        + '  Faltan: ' + p.faltanEnTrios.join(' ') + '\n';
    $('#proposicion').textContent = s;
  }

  /* ---------- Arranque ---------- */

  global.arrancarVerificacion = function () {
    UI.montarArmazon('verificacion.html');
    proposicion();
    $('#lanzar').addEventListener('click', async function () {
      $('#lanzar').disabled = true;
      $('#lanzar').textContent = 'recorriendo el juego entero…';
      $('#resultados').classList.remove('oculto');
      await recorridoDeTodos();
      await ablacion();
      await roturas();
      await formulaciones();
      $('#lanzar').textContent = 'recorrido terminado — pulsa para repetirlo';
      $('#lanzar').disabled = false;
    });
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
