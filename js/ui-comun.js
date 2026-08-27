/*
 * ui-comun.js — Presentación. No decide jugadas: solo escribe en pantalla.
 * ========================================================================
 * Todo se dibuja con caracteres. No hay imágenes, ni tipografías
 * descargadas, ni dependencias. La página entera es texto.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC;
  const UI = global.UI = {};

  UI.REPO = 'https://github.com/luissalazarvaca1986/Pensando-fuera-de-la-caja';

  UI.escapar = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  UI.numero = function (n) {
    return typeof n === 'number' ? n.toLocaleString('es-ES') : String(n);
  };

  UI.rellenar = function (s, n) {
    s = String(s);
    return s.length >= n ? s : s + ' '.repeat(n - s.length);
  };

  // Un marco de caja con las líneas alineadas al mismo ancho, calculado y
  // no escrito a mano: así nunca se desalinea.
  UI.marco = function (lineas, ancho) {
    const w = ancho || lineas.reduce((m, l) => Math.max(m, l.length), 0) + 2;
    const h = '─'.repeat(w + 2);
    const out = ['┌' + h + '┐'];
    for (const l of lineas) out.push('│ ' + UI.rellenar(l, w) + ' │');
    out.push('└' + h + '┘');
    return out.join('\n');
  };

  // Título en arte ASCII. Se guarda literal: no depende de ninguna tipografía.
  UI.ARTE_PRUEBA = [
    '████ ████ █  █ █    ████      ████      ████ ████ █  █ ████ ███  ████',
    '█  █ █  █ ██ █ █    █  █      █  █      █  █ █  █ █  █ █    █  █ █  █',
    '████ █  █ █ ██ █    █  █      ████      ████ ████ █  █ ███  ███  ████',
    '█    █  █ █  █ █    █  █      █  █      █    █ █  █  █ █    █  █ █  █',
    '█    ████ █  █ ████ ████      █  █      █    █  █ ████ ████ ███  █  █',
    '',
    '████ █  █      █  █  ██  ████ █  █ ████',
    ' ██  █  █      ████  ██  █    ████ █  █',
    ' ██  █  █      ████  ██  ████ ████ █  █',
    ' ██  █  █      █  █  ██     █ █  █ █  █',
    ' ██  ████      █  █  ██  ████ █  █ ████',
  ].join('\n');

  /* ---------- Resaltado de código, minúsculo y suficiente ---------- */

  const CLAVES = new RegExp('\\b(' + [
    'function', 'return', 'const', 'let', 'var', 'if', 'else', 'for', 'of', 'in',
    'while', 'new', 'throw', 'break', 'continue', 'switch', 'case', 'default',
    'true', 'false', 'null', 'undefined', 'this', 'typeof'
  ].join('|') + ')\\b', 'g');

  // Se trocea el texto en comentarios, cadenas y resto. Solo el resto recibe
  // resaltado, para no romper nada dentro de una cadena o un comentario.
  UI.resaltar = function (codigo) {
    const trozos = [];
    const patron = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/g;
    let ultimo = 0, m;
    while ((m = patron.exec(codigo)) !== null) {
      if (m.index > ultimo) trozos.push({ t: 'codigo', v: codigo.slice(ultimo, m.index) });
      trozos.push({ t: m[1] ? 'coment' : 'cadena', v: m[0] });
      ultimo = m.index + m[0].length;
    }
    if (ultimo < codigo.length) trozos.push({ t: 'codigo', v: codigo.slice(ultimo) });

    return trozos.map(function (tr) {
      const e = UI.escapar(tr.v);
      if (tr.t === 'coment') return '<span class="tk-coment">' + e + '</span>';
      if (tr.t === 'cadena') return '<span class="tk-cadena">' + e + '</span>';
      return e.replace(CLAVES, '<span class="tk-clave">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="tk-num">$1</span>');
    }).join('');
  };

  UI.pintarCodigo = function (elemento, codigo) {
    elemento.innerHTML = UI.resaltar(codigo);
  };

  /* ---------- Cabecera: banner y registro de arranque ---------- */

  // El registro de arranque no es decorativo: cada línea es una comprobación
  // que se ejecuta de verdad al abrir la página.
  function registroDeArranque() {
    const p52 = PFC.comprobarProposicion52();
    const e56 = PFC.comprobarEcuacion56();
    const lineas = [];
    const linea = (que, valor, ok) =>
      '$ ' + (que + ' ').padEnd(34, '.') + ' '
      + (ok ? '<span class="ok">ok</span> · ' : '<span class="mal">FALLA</span> · ')
      + valor;

    lineas.push(linea('constante mágica K3',
      'n(n²+1)/2 = ' + PFC.constanteMagica(3), PFC.constanteMagica(3) === 15));
    lineas.push(linea('proposición 5.2',
      p52.triosQueSumanQuince + ' de ' + p52.subconjuntosDeTres
      + ' tríos suman 15 y son las ' + p52.rectasDelTablero + ' rectas', p52.coinciden));
    lineas.push(linea('ecuación 5.6',
      'centro=5 · esquinas=pares · lados=impares', e56.centro && e56.esquinas && e56.lados));
    lineas.push(linea('simetrías del tablero (D4)',
      PFC.SIMETRIAS.length + ' transformaciones', PFC.SIMETRIAS.length === 8));
    lineas.push(linea('algoritmos registrados',
      PFC.algoritmos.map(a => a.id).join(' '), PFC.algoritmos.length > 0));
    return lineas.join('\n');
  }

  UI.cabecera = function (paginaActiva) {
    const banner = UI.marco([
      'P E N S A N D O   F U E R A   D E   L A   C A J A',
      '',
      'Cambiar la forma de representar para cambiar la de resolver.',
      'Tres en raya · seis algoritmos · el juego recorrido entero.',
      '',
      'Luis Alfonso Salazar Vaca — código de acompañamiento del libro',
    ], 62);

    const paginas = [
      { archivo: 'index.html', texto: '1 jugar' },
      { archivo: 'verificacion.html', texto: '2 comprobarlo de verdad' },
      { archivo: 'recuento.html', texto: '3 el recuento y las cifras' }
    ];

    return '<header class="principal"><div class="envoltura">'
      + '<pre class="banner">' + UI.escapar(banner) + '</pre>'
      + '<pre class="arranque">' + registroDeArranque() + '\n'
      + '$ ' + 'repositorio'.padEnd(34, '.') + ' <a href="' + UI.REPO + '">'
      + UI.REPO.replace('https://', '') + '</a></pre>'
      + '<nav class="paginas">'
      + paginas.map(p => '<a href="' + p.archivo + '"'
        + (p.archivo === paginaActiva ? ' class="activa"' : '') + '>' + p.texto + '</a>').join('')
      + '</nav></div></header>';
  };

  UI.pie = function () {
    return '<footer class="principal"><div class="envoltura">'
      + '<p>Ninguna cifra de estas páginas está escrita a mano: todas se calculan en tu '
      + 'navegador cada vez que las abres. Donde una no coincide con el libro, se dice.</p>'
      + '<p>Código de acompañamiento de <em>Pensando fuera de la caja</em>. La correspondencia '
      + 'entre el tres en raya y el cuadrado mágico está documentada desde Michon (1967); '
      + 'lo que el libro cuenta es el camino hasta ella.</p>'
      + '<p class="tenue">Sin dependencias, sin analítica, sin peticiones a la red. '
      + 'Todo ocurre en esta pestaña.</p>'
      + '</div></footer>';
  };

  UI.montarArmazon = function (paginaActiva) {
    document.body.insertAdjacentHTML('afterbegin', UI.cabecera(paginaActiva));
    document.body.insertAdjacentHTML('beforeend', UI.pie());
  };

  UI.pronto = function (fn) {
    return new Promise(res => setTimeout(() => res(fn()), 20));
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
