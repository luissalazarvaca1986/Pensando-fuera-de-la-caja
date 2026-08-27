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
  // Marco en ASCII puro: '+', '-' y '|'. Nada de caracteres de caja, por la
  // misma razón que el tablero: en un móvil se sustituyen y se descuadra.
  UI.marco = function (lineas, ancho) {
    // El ancho pedido es un mínimo, no un máximo: si una línea es más larga,
    // manda ella. Si no, el borde derecho se desalinearía en esa fila.
    const masLarga = lineas.reduce((m, l) => Math.max(m, l.length), 0);
    const w = Math.max(ancho || 0, masLarga);
    const h = '-'.repeat(w + 2);
    const out = ['+' + h + '+'];
    for (const l of lineas) out.push('| ' + UI.rellenar(l, w) + ' |');
    out.push('+' + h + '+');
    return out.join('\n');
  };


  /* ---------- Dibujar contando columnas, no confiando en la fuente ----------
   *
   * El problema de dibujar rejillas con texto es que se apoya en una promesa
   * que no siempre se cumple: que todos los caracteres midan lo mismo. En un
   * móvil se rompe por dos vías —un glifo que la fuente no tiene y sustituye
   * por otro de distinto ancho, o una negrita con distinto avance— y la
   * rejilla se parte.
   *
   * Aquí no se confía. Cada carácter va dentro de su propia caja de UNA
   * columna exacta, centrado. El tablero se cuenta por caracteres y cada
   * carácter ocupa una columna, punto. Con eso la rejilla la garantiza la
   * maquetación, y da igual qué fuente acabe usando el navegador.
   */

  // Convierte un texto en una fila de columnas exactas.
  UI.enColumnas = function (texto) {
    let salida = '';
    for (const caracter of String(texto)) {
      salida += '<i>' + UI.escapar(caracter) + '</i>';
    }
    return salida;
  };

  // Pinta un texto entero —varios renglones— por columnas. Se salta el
  // trabajo si el texto no ha cambiado: en una partida se repinta a cada
  // jugada y esto se ejecuta muchas veces.
  UI.pintarPorColumnas = function (elemento, texto) {
    if (!elemento) return;
    if (elemento.dataset.texto === texto) return;
    elemento.dataset.texto = texto;
    elemento.classList.add('en-columnas');
    elemento.innerHTML = String(texto).split('\n')
      .map(UI.enColumnas).join('\n');
  };

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
  //
  // Viene en dos formatos. Con sitio, con puntos que alinean los resultados en
  // columna, como un arranque de verdad. Sin sitio —un móvil— en dos renglones
  // por comprobación: una línea de ochenta caracteres allí no se lee, se sale
  // de la pantalla y se pierde.
  function registroDeArranque(columnas) {
    const p52 = PFC.comprobarProposicion52();
    const e56 = PFC.comprobarEcuacion56();
    const marca = ok => ok ? '<span class="ok">ok</span>'
      : '<span class="mal">FALLA</span>';

    const filas = [
      ['constante mágica K3', 'n(n²+1)/2 = ' + PFC.constanteMagica(3),
        PFC.constanteMagica(3) === 15],
      ['proposición 5.2', p52.triosQueSumanQuince + ' de ' + p52.subconjuntosDeTres
        + ' tríos suman 15 y son las ' + p52.rectasDelTablero + ' rectas', p52.coinciden],
      ['ecuación 5.6', 'centro=5 · esquinas=pares · lados=impares',
        e56.centro && e56.esquinas && e56.lados],
      ['simetrías del tablero (D4)', PFC.SIMETRIAS.length + ' transformaciones',
        PFC.SIMETRIAS.length === 8],
      ['algoritmos registrados', PFC.algoritmos.map(a => a.id).join(' '),
        PFC.algoritmos.length > 0]
    ];
    const largo = UI.REPO.replace('https://github.com/', 'github.com/');
    const corto = UI.REPO.replace('https://github.com/', '');
    const enlace = texto => '<a href="' + UI.REPO + '">' + texto + '</a>';

    if (columnas >= 74) {
      return filas.map(f => '$ ' + (f[0] + ' ').padEnd(34, '.') + ' '
        + marca(f[2]) + ' · ' + f[1]).join('\n')
        + '\n$ ' + 'repositorio'.padEnd(34, '.') + ' ' + enlace(largo);
    }
    return filas.map(f => '$ ' + f[0] + '\n    ' + marca(f[2]) + ' · ' + f[1]).join('\n')
      + '\n$ repositorio\n    ' + enlace(corto);
  }

  // El banner, en dos tallas. El texto largo no se recorta: se cambia por uno
  // más corto, que es distinto de perderlo.
  function bannerTexto(columnas) {
    if (columnas >= 66) {
      return UI.marco([
        'P E N S A N D O   F U E R A   D E   L A   C A J A',
        '',
        'Cambiar la forma de representar para cambiar la de resolver.',
        'Tres en raya · seis algoritmos · el juego recorrido entero.',
        '',
        'Luis Alfonso Salazar Vaca — código de acompañamiento del libro'
      ], 60);
    }
    return UI.marco([
      'PENSANDO FUERA DE LA CAJA',
      '',
      'Cambiar la forma de',
      'representar para cambiar',
      'la de resolver.',
      '',
      'Tres en raya.',
      'Seis algoritmos.',
      'El juego recorrido entero.',
      '',
      'Luis Alfonso Salazar Vaca',
      'código de acompañamiento'
    ], Math.max(26, Math.min(30, columnas - 4)));
  }

  // Se llama al montar y en cada cambio de tamaño: el ancho se mide, no se
  // adivina.
  UI.ajustarCabecera = function () {
    const banner = document.getElementById('banner');
    const arranque = document.getElementById('arranque');
    if (banner) banner.textContent = bannerTexto(UI.columnasQueCaben(banner));
    if (arranque) {
      const cols = UI.columnasQueCaben(arranque);
      arranque.classList.toggle('compacto', cols < 74);
      arranque.innerHTML = registroDeArranque(cols);
    }
  };

  UI.cabecera = function (paginaActiva) {
    const paginas = [
      { archivo: 'index.html', texto: '1 jugar' },
      { archivo: 'verificacion.html', texto: '2 comprobarlo de verdad' },
      { archivo: 'recuento.html', texto: '3 el recuento y las cifras' }
    ];
    // Los dos <pre> se rellenan en UI.ajustarCabecera, que mide el ancho.
    return '<header class="principal"><div class="envoltura">'
      + '<pre class="banner" id="banner"></pre>'
      + '<pre class="arranque" id="arranque"></pre>'
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
    UI.ajustarCabecera();
    let temporizador = null;
    window.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(UI.ajustarCabecera, 150);
    });
  };


  // Cuántos caracteres monoespaciados caben de ancho en un elemento. Se mide,
  // no se estima: en un móvil de 360 px no cabe lo mismo que en un portátil,
  // y el ASCII de ancho fijo hay que repartirlo en consecuencia.
  UI.columnasQueCaben = function (elemento) {
    if (!elemento) return 80;
    const medidor = document.createElement('span');
    medidor.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;'
      + 'font:inherit';
    medidor.textContent = '0'.repeat(100);
    elemento.appendChild(medidor);
    const anchoDe100 = medidor.getBoundingClientRect().width;
    elemento.removeChild(medidor);

    // clientWidth INCLUYE el relleno: hay que descontarlo, o el cálculo sale
    // optimista y el dibujo se sale por unos pocos píxeles.
    const est = getComputedStyle(elemento);
    const relleno = parseFloat(est.paddingLeft || 0) + parseFloat(est.paddingRight || 0);
    const disponible = elemento.clientWidth - relleno - 2;   // 2 px de margen
    if (!anchoDe100 || disponible <= 0) return 80;
    return Math.max(24, Math.floor(disponible / (anchoDe100 / 100)));
  };

  UI.pronto = function (fn) {
    return new Promise(res => setTimeout(() => res(fn()), 20));
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
