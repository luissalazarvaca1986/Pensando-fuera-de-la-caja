/*
 * ui-recuento.js — El recuento y las cifras (capítulos 2, 9 y 14)
 * ===============================================================
 * Ninguna cifra está escrita a mano. Todas se calculan aquí.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC, UI = global.UI;
  const $ = s => document.querySelector(s);
  const n = UI.numero;

  function coteja(mio, libro) {
    if (libro === undefined) return '<td class="tenue">—</td>';
    return '<td class="num ' + (mio === libro ? 'bien' : 'aviso-t') + '">'
      + n(libro) + (mio === libro ? ' ✓' : ' ≠') + '</td>';
  }

  /* ---------- 1. El universo del tres en raya ---------- */

  function universo(r) {
    const filas = [
      ['Combinaciones de las nueve casillas', '3⁹', r.combinaciones, 19683],
      ['Recuentos de fichas legales', 'ecuación 14.1', r.recuentosLegales, 6046],
      ['Exigían una victoria anterior', 'recorrido', r.exigianVictoriaAnterior, 568],
      ['Posiciones alcanzables', '6 046 − 568', r.alcanzables, 5478],
      ['Ya decididas, sin jugada que elegir', 'recorrido', r.decididas, 958],
      null,
      ['Hay que decidir jugada, empezando', 'recorrido', r.empezando, 2423],
      ['Hay que decidir jugada, respondiendo', 'recorrido', r.respondiendo, 2097],
      ['Casos que cubrir', '2 423 + 2 097', r.casos, 4520],
      null,
      ['Casos con simetría, empezando', 'clases bajo D4', r.clasesEmpezando, 338],
      ['Casos con simetría, respondiendo', 'clases bajo D4', r.clasesRespondiendo, 289],
      ['Casos con simetría', '338 + 289', r.clases, 627],
      null,
      ['Posiciones legales en ambos papeles', '2 × 5 478 − 2 423', r.enAmbosPapeles, 8533],
      ['Íd. módulo las ocho simetrías', 'clases bajo D4', r.clasesAmbosPapeles, 1192]
    ];

    $('#t-universo').innerHTML =
      '<thead><tr><th>magnitud</th><th>cómo se obtiene</th><th class="num">calculado aquí</th>'
      + '<th class="num">en el libro</th></tr></thead><tbody>'
      + filas.map(function (f) {
        if (!f) return '<tr class="separa"><td colspan="4"></td></tr>';
        const dest = (f[3] === 4520 || f[3] === 627) ? ' class="destacada"' : '';
        return '<tr' + dest + '><td>' + f[0] + '</td><td class="tenue">' + f[1] + '</td>'
          + '<td class="num">' + n(f[2]) + '</td>' + coteja(f[2], f[3]) + '</tr>';
      }).join('') + '</tbody>';
  }

  /* ---------- 2. La ecuación 14.1, término a término ---------- */

  function terminos(r) {
    let s = '  k    C(9,k)   C(k,⌈k/2⌉)     producto\n';
    s += '  ' + '─'.repeat(42) + '\n';
    for (const t of r.terminos) {
      s += '  ' + String(t.k).padStart(1) + '  ' + String(t.a).padStart(8)
        + '  ' + String(t.b).padStart(11) + '  ' + String(t.producto).padStart(11) + '\n';
    }
    s += '  ' + '─'.repeat(42) + '\n';
    s += '  total' + String(r.recuentosLegales).padStart(35) + '\n\n';
    s += '  C(9,k) elige qué casillas están ocupadas.\n';
    s += '  C(k,⌈k/2⌉) reparte esas k fichas entre quien abrió y quien respondió.\n';
    $('#terminos').textContent = s;
  }

  /* ---------- 3. El reparto por tamaño de órbita ---------- */

  function orbitas(r) {
    const orden = [8, 4, 2, 1];
    const libroCasos = { 8: 4064, 4: 444, 2: 8, 1: 4 };
    const libroClases = { 8: 508, 4: 111, 2: 4, 1: 4 };
    let totalCasos = 0, totalClases = 0;

    $('#t-orbitas').innerHTML =
      '<thead><tr><th class="num">versiones distintas</th><th class="num">casos</th>'
      + '<th class="num">libro</th><th class="num">clases</th><th class="num">libro</th>'
      + '</tr></thead><tbody>'
      + orden.map(function (k) {
        const o = r.orbitas[k];
        totalCasos += o.casos; totalClases += o.clases;
        return '<tr><td class="num">' + k + '</td><td class="num">' + n(o.casos) + '</td>'
          + coteja(o.casos, libroCasos[k]) + '<td class="num">' + n(o.clases) + '</td>'
          + coteja(o.clases, libroClases[k]) + '</tr>';
      }).join('')
      + '<tr class="destacada separa"><td>total</td><td class="num">' + n(totalCasos) + '</td>'
      + coteja(totalCasos, 4520) + '<td class="num">' + n(totalClases) + '</td>'
      + coteja(totalClases, 627) + '</tr></tbody>';

    $('#comprobacion-orbitas').textContent =
      '508 × 8 + 111 × 4 + 4 × 2 + 4 × 1 = '
      + (r.orbitas[8].clases * 8 + r.orbitas[4].clases * 4
        + r.orbitas[2].clases * 2 + r.orbitas[1].clases * 1)
      + '   y las clases suman ' + totalClases + '.';
  }

  /* ---------- 4. Tamaño del código ---------- */

  async function tamanos() {
    const ids = ['A', 'B', 'C', 'V1', 'V2'];
    const libro = {
      A: { lineas: 4522, cond: 4520, bytes: 239435 },
      B: { lineas: 630, cond: 627, bytes: 35215 },
      C: { lineas: 77, cond: 14, bytes: 5116 }
    };
    const medidas = {};
    for (const id of ids) {
      $('#p-tamanos').innerHTML = '<span class="girando"></span> midiendo ' + id;
      medidas[id] = await UI.pronto(() => PFC.medir(PFC.porId[id]));
    }
    $('#p-tamanos').textContent = 'medición del código — hecha';

    $('#t-tamanos').innerHTML =
      '<thead><tr><th>solución</th><th class="num">casos</th><th class="num">condicionales</th>'
      + '<th class="num">líneas</th><th class="num">bytes</th><th>qué se ha medido</th>'
      + '</tr></thead><tbody>'
      + ids.map(function (id) {
        const m = medidas[id], l = libro[id];
        return '<tr' + (id === 'C' ? ' class="destacada"' : '') + '><td>'
          + PFC.porId[id].corto + '</td>'
          + '<td class="num">' + m.casos + '</td>'
          + '<td class="num">' + n(m.condicionales)
          + (l ? ' <span class="tenue">(' + n(l.cond) + ')</span>' : '') + '</td>'
          + '<td class="num">' + n(m.lineas)
          + (l ? ' <span class="tenue">(' + n(l.lineas) + ')</span>' : '') + '</td>'
          + '<td class="num">' + n(m.bytes)
          + (l ? ' <span class="tenue">(' + n(l.bytes) + ')</span>' : '') + '</td>'
          + '<td class="tenue">' + m.queSeMide + '</td></tr>';
      }).join('') + '</tbody>';

    const red = (a, b) => (a / b).toFixed(1).replace('.', ',') + '×';
    $('#t-reduccion').innerHTML =
      '<thead><tr><th>reducción de C</th><th class="num">frente a A</th>'
      + '<th class="num">libro</th><th class="num">frente a B</th><th class="num">libro</th>'
      + '</tr></thead><tbody>'
      + '<tr><td>líneas de código</td>'
      + '<td class="num">' + red(medidas.A.lineas, medidas.C.lineas) + '</td>'
      + '<td class="num tenue">59×</td>'
      + '<td class="num">' + red(medidas.B.lineas, medidas.C.lineas) + '</td>'
      + '<td class="num tenue">8,2×</td></tr>'
      + '<tr><td>bytes</td>'
      + '<td class="num">' + red(medidas.A.bytes, medidas.C.bytes) + '</td>'
      + '<td class="num tenue">47×</td>'
      + '<td class="num">' + red(medidas.B.bytes, medidas.C.bytes) + '</td>'
      + '<td class="num tenue">6,9×</td></tr>'
      + '<tr><td>condicionales</td>'
      + '<td class="num">' + red(medidas.A.condicionales, medidas.C.condicionales) + '</td>'
      + '<td class="num tenue">323×</td>'
      + '<td class="num">' + red(medidas.B.condicionales, medidas.C.condicionales) + '</td>'
      + '<td class="num tenue">44,8×</td></tr>'
      + '</tbody>';
  }

  /* ---------- 5. La cadena de condicionales, generada ---------- */

  async function generarCadena(cual) {
    $('#p-cadena').innerHTML = '<span class="girando"></span> generando la cadena de '
      + (cual === 'A' ? '4 520 casos' : '627 clases');
    const g = await UI.pronto(() => PFC.generarCadena(cual));
    $('#p-cadena').textContent = 'cadena ' + cual + ' generada: ' + n(g.lineas)
      + ' líneas, ' + n(g.bytes) + ' bytes, ' + n(g.condicionales) + ' condicionales';

    // Se muestra un fragmento: el archivo entero no cabe, y ese es el punto.
    const lineas = g.texto.split('\n');
    const cabeza = lineas.slice(0, 14).join('\n');
    const cola = lineas.slice(-6).join('\n');
    UI.pintarCodigo($('#cadena'),
      cabeza + '\n\n  // … ' + n(g.casos - 20) + ' condicionales más …\n\n' + cola);
    document.querySelectorAll('#pestanas-cadena button').forEach(b =>
      b.classList.toggle('activa', b.dataset.cual === cual));
  }

  /* ---------- 6. Coste por jugada y posiciones que ve ---------- */

  async function coste() {
    const ids = ['A', 'B', 'V1', 'V2', 'C'];
    const filas = [];
    for (const id of ids) {
      $('#p-coste').innerHTML = '<span class="girando"></span> midiendo el coste de ' + id;
      const c = await UI.pronto(() => PFC.costePorJugada(PFC.porId[id]));
      const v = await UI.pronto(() => PFC.posicionesQueVe(PFC.porId[id]));
      filas.push({ id, c, v });
    }
    $('#p-coste').textContent = 'coste por jugada — hecho';

    $('#t-coste').innerHTML =
      '<thead><tr><th>solución</th><th class="num">operaciones por jugada</th>'
      + '<th class="num">máximo</th><th class="num">posiciones que ve</th>'
      + '<th class="num">clases de simetría</th></tr></thead><tbody>'
      + filas.map(({ id, c, v }) =>
        '<tr' + (id === 'C' ? ' class="destacada"' : '') + '><td>' + PFC.porId[id].corto + '</td>'
        + '<td class="num">' + c.media.toFixed(1).replace('.', ',') + '</td>'
        + '<td class="num">' + n(c.maximo) + '</td>'
        + '<td class="num">' + n(v.posiciones) + '</td>'
        + '<td class="num">' + n(v.clases) + '</td></tr>').join('') + '</tbody>';

    const c116 = filas.find(f => f.id === 'C').v.clases;
    $('#nota-clases').innerHTML = 'El algoritmo del cuadrado mágico reduce a <strong>'
      + c116 + ' clases</strong> las posiciones distintas que hay que considerar y verificar. '
      + 'El libro da 116 en el capítulo 14.6, y '
      + (c116 === 116 ? '<span class="bien">coincide</span>.' : 'aquí sale ' + c116 + '.')
      + ' La comparación del libro aplica la simetría a los dos lados, no solo a uno: usarla en '
      + 'un solo lado inflaría el resultado a favor de C.';
  }

  /* ---------- Arranque ---------- */

  global.arrancarRecuento = function () {
    UI.montarArmazon('recuento.html');

    $('#pestanas-cadena').innerHTML =
      '<button data-cual="A">cadena A · 4 520 casos</button>'
      + '<button data-cual="B">cadena B · 627 clases</button>';
    document.querySelectorAll('#pestanas-cadena button').forEach(b =>
      b.addEventListener('click', () => generarCadena(b.dataset.cual)));

    $('#lanzar').addEventListener('click', async function () {
      $('#lanzar').disabled = true;
      $('#lanzar').textContent = 'calculando…';
      $('#resultados').classList.remove('oculto');

      $('#p-universo').innerHTML = '<span class="girando"></span> recorriendo el juego entero';
      const r = await UI.pronto(() => PFC.recuento());
      $('#p-universo').textContent = 'recuento del juego — hecho';
      universo(r); terminos(r); orbitas(r);

      await tamanos();
      await generarCadena('A');
      await coste();

      $('#lanzar').textContent = 'cálculo terminado — pulsa para repetirlo';
      $('#lanzar').disabled = false;
    });
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
