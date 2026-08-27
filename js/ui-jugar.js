/*
 * ui-jugar.js — La partida
 * ========================
 *
 * Tablero en ASCII, jugable con el teclado (flechas y barra espaciadora) o
 * con el ratón (el puntero selecciona, el clic juega).
 *
 * Quién empieza NO se elige: se sortea al empezar cada partida. Así el
 * algoritmo tiene que responder en los dos papeles, que es justo la
 * condición del encargo del libro.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC, UI = global.UI, DM = global.DM;

  /* ---------- Estado ---------- */

  const P = {
    x: [], o: [],            // casillas de cada jugador; X siempre empieza
    turno: 'X',
    terminada: false,
    resultado: null,
    cursor: 4,
    candidatas: [],
    bitacora: [],
    historial: [],          // una instantánea del tablero por jugada
    ultima: null,
    ultimaDecision: null,   // { alg, propias, ajenas, decision }
    jugadorX: 'humano',      // 'humano' o id de algoritmo
    jugadorO: 'C',
    azar: true,
    etiquetas: true,          // mostrar la etiqueta de las casillas libres
    pestanaCodigo: 'C',
    marcador: { ganadas: 0, perdidas: 0, tablas: 0 }
  };

  const $ = s => document.querySelector(s);

  /* ==================================================================
   * El tablero en ASCII
   * ==================================================================
   *
   * Se construye como una sola cadena con un <span> por casilla, de modo
   * que el dibujo sea texto de verdad y a la vez se pueda pinchar.
   */

  // El algoritmo cuyo punto de vista se está mostrando: el que le toca mover
  // si es una máquina y, si no, el otro contendiente.
  function algoritmoEnJuego() {
    return algoritmoDe(P.turno) || algoritmoDe(P.turno === 'X' ? 'O' : 'X');
  }

  // Qué se escribe en una casilla libre. Y esto NO es un detalle estético:
  // un algoritmo que no conoce el cuadrado mágico no debe verlo en el
  // tablero. V1, A, B y M trabajan con coordenadas —casillas 0..8—; C y V2
  // trabajan con los números del cuadrado. El tablero enseña lo que el
  // algoritmo que decide tiene delante, y nada más.
  function modoEtiqueta() {
    const alg = algoritmoEnJuego();
    if (!alg) return 'casilla';
    return (alg.id === 'C' || alg.id === 'V2') ? 'magico' : 'casilla';
  }

  function etiquetaLibre(c) {
    if (!P.etiquetas) return '.';
    return modoEtiqueta() === 'magico' ? String(PFC.MU[c]) : String(c);
  }

  function dibujarTablero() {
    const ganadoraX = PFC.rectaGanadora(P.x) || [];
    const ganadoraO = PFC.rectaGanadora(P.o) || [];
    const enRectaGanadora = c => ganadoraX.includes(c) || ganadoraO.includes(c);

    const celda = c => {
      const esX = P.x.includes(c), esO = P.o.includes(c);
      const contenido = esX ? 'X' : esO ? 'O' : etiquetaLibre(c);
      const clases = ['celda'];
      if (esX) clases.push('marca-X', 'ocupada');
      else if (esO) clases.push('marca-O', 'ocupada');
      else clases.push('libre');
      if (enRectaGanadora(c)) clases.push('ganadora');
      else if (c === P.cursor && !P.terminada && esHumano(P.turno) && !esX && !esO) clases.push('cursor');
      else if (P.candidatas.includes(c) && !esX && !esO) clases.push('candidata');
      // Tres columnas exactas: espacio, glifo, espacio.
      return '<span class="' + clases.join(' ') + '" data-casilla="' + c + '">'
        + UI.enColumnas(' ' + contenido + ' ') + '</span>';
    };

    // El tablero se construye contando caracteres, y cada carácter va en su
    // propia caja de ancho fijo (una columna exacta). Así la rejilla la
    // garantiza la maquetación y no las métricas de la fuente: da igual que
    // el móvil sustituya un glifo o que la negrita tenga otro avance.
    //
    // Y solo se usan '+', '-' y '|', que están en todas las fuentes.
    const raya = UI.enColumnas('   +---+---+---+');
    let s = raya + '\n';
    for (let f = 0; f < 3; f++) {
      s += UI.enColumnas('   ') + UI.enColumnas('|')
        + [0, 1, 2].map(k => celda(f * 3 + k)).join(UI.enColumnas('|'))
        + UI.enColumnas('|') + '\n';
      s += raya + (f < 2 ? '\n' : '');
    }
    return s;   // sin salto final: un renglón vacío desplazaría el dibujo
  }

  /* ==================================================================
   * Quién juega
   * ================================================================== */

  function esHumano(marca) {
    return (marca === 'X' ? P.jugadorX : P.jugadorO) === 'humano';
  }

  function algoritmoDe(marca) {
    const id = marca === 'X' ? P.jugadorX : P.jugadorO;
    return id === 'humano' ? null : PFC.porId[id];
  }

  function propiasDe(marca) { return marca === 'X' ? P.x : P.o; }
  function ajenasDe(marca) { return marca === 'X' ? P.o : P.x; }

  function nombreDe(marca) {
    const alg = algoritmoDe(marca);
    return alg ? alg.corto : 'humano';
  }

  /* ==================================================================
   * El curso de la partida
   * ================================================================== */

  function nuevaPartida() {
    P.x = []; P.o = []; P.turno = 'X';
    P.terminada = false; P.resultado = null;
    P.bitacora = []; P.ultima = null; P.candidatas = [];
    P.historial = [{ x: [], o: [] }];
    P.ultimaDecision = null;
    P.cursor = 4;

    // Sorteo: los dos contendientes se reparten los papeles al azar.
    const a = $('#jugador-a').value, b = $('#jugador-b').value;
    if (Math.random() < 0.5) { P.jugadorX = a; P.jugadorO = b; }
    else { P.jugadorX = b; P.jugadorO = a; }

    anotar('sorteo', 'Empieza X (' + nombreDe('X') + '). Responde O (' + nombreDe('O') + ').');
    refrescar();
    seguir();
  }

  function jugar(casilla) {
    if (P.terminada) return;
    if (P.x.includes(casilla) || P.o.includes(casilla)) return;

    const marca = P.turno;
    propiasDe(marca).push(casilla);
    propiasDe(marca).sort((a, b) => a - b);
    P.ultima = { marca, casilla };
    P.historial.push({ x: P.x.slice(), o: P.o.slice() });

    comprobarFin();
    if (!P.terminada) P.turno = marca === 'X' ? 'O' : 'X';
    refrescar();
    if (!P.terminada) seguir();
  }

  function comprobarFin() {
    if (PFC.haGanado(P.x)) { P.terminada = true; P.resultado = 'X'; }
    else if (PFC.haGanado(P.o)) { P.terminada = true; P.resultado = 'O'; }
    else if (P.x.length + P.o.length === 9) { P.terminada = true; P.resultado = 'tablas'; }
    if (!P.terminada) return;

    // El marcador se lleva desde el punto de vista del humano si hay uno.
    const humano = P.jugadorX === 'humano' ? 'X' : P.jugadorO === 'humano' ? 'O' : null;
    if (humano) {
      if (P.resultado === 'tablas') P.marcador.tablas++;
      else if (P.resultado === humano) P.marcador.ganadas++;
      else P.marcador.perdidas++;
    }
  }

  // Si a quien le toca es un algoritmo, se le pide la jugada.
  function seguir() {
    if (P.terminada || esHumano(P.turno)) {
      if (!P.terminada && esHumano(P.turno)) situarCursorEnLibre();
      P.candidatas = [];
      refrescar();
      return;
    }
    const marca = P.turno;
    const alg = algoritmoDe(marca);
    const propias = propiasDe(marca).slice(), ajenas = ajenasDe(marca).slice();

    const decision = alg.decidir(propias, ajenas);
    P.candidatas = decision.casillas.slice();
    P.ultimaDecision = { alg, propias, ajenas, decision };
    refrescar();

    const casilla = P.azar
      ? decision.casillas[Math.floor(Math.random() * decision.casillas.length)]
      : decision.casillas[0];

    anotar(marca, marca + ' · ' + alg.corto + ' juega la casilla ' + casilla
      + ((alg.id === 'C' || alg.id === 'V2') ? ' (número mágico ' + PFC.MU[casilla] + ')' : ''),
      decision.regla + '. ' + decision.explicacion
      + (decision.casillas.length > 1
        ? ' Jugadas igual de buenas: ' + decision.casillas.join(', ') + '.' : ''));

    setTimeout(() => jugar(casilla), 260);
  }

  function anotar(quien, texto, detalle) {
    P.bitacora.push({ quien, texto, detalle: detalle || '' });
  }

  function situarCursorEnLibre() {
    const libres = PFC.libres(P.x, P.o);
    if (!libres.includes(P.cursor)) P.cursor = libres.length ? libres[0] : 4;
  }

  function estaLibre(c) {
    return c >= 0 && c <= 8 && !P.x.includes(c) && !P.o.includes(c);
  }

  // Única puerta de entrada de las jugadas humanas. Comprueba la legalidad
  // ANTES de anotar: si no, la bitácora acabaría contando jugadas que no
  // ocurrieron, que es justo lo que no debe hacer una bitácora.
  function jugarHumano(casilla, comoLoDijo) {
    if (P.terminada || !esHumano(P.turno) || !estaLibre(casilla)) return false;
    anotar(P.turno, P.turno + ' · humano juega ' + comoLoDijo);
    jugar(casilla);
    return true;
  }

  /* ==================================================================
   * Entrada: teclado y ratón
   * ================================================================== */

  // El cursor salta las casillas ocupadas: da una vuelta completa en esa
  // dirección y se queda en la primera libre que encuentra.
  function moverCursor(df, dc) {
    let f = Math.floor(P.cursor / 3), c = P.cursor % 3;
    for (let intento = 0; intento < 3; intento++) {
      f = (f + df + 3) % 3;
      c = (c + dc + 3) % 3;
      const destino = f * 3 + c;
      if (estaLibre(destino)) { P.cursor = destino; refrescar(); return; }
    }
    // Toda la fila o columna está ocupada: se busca la siguiente libre.
    const libres = PFC.libres(P.x, P.o);
    if (libres.length) {
      const avance = (df + dc) >= 0 ? 1 : -1;
      let i = libres.findIndex(x => x > P.cursor);
      if (avance < 0) {
        const previas = libres.filter(x => x < P.cursor);
        P.cursor = previas.length ? previas[previas.length - 1] : libres[libres.length - 1];
      } else {
        P.cursor = i >= 0 ? libres[i] : libres[0];
      }
    }
    refrescar();
  }

  function atenderTeclado(e) {
    if (P.terminada || !esHumano(P.turno)) {
      if (e.key === 'n' || e.key === 'N') { nuevaPartida(); e.preventDefault(); }
      return;
    }
    switch (e.key) {
      case 'ArrowUp':    case 'w': moverCursor(-1, 0); break;
      case 'ArrowDown':  case 's': moverCursor(1, 0); break;
      case 'ArrowLeft':  case 'a': moverCursor(0, -1); break;
      case 'ArrowRight': case 'd': moverCursor(0, 1); break;
      case ' ': case 'Enter':
        jugarHumano(P.cursor, 'la casilla ' + P.cursor + '  [barra espaciadora]');
        break;
      case 'n': case 'N': nuevaPartida(); break;
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9': {
        const d = Number(e.key);
        const magico = modoEtiqueta() === 'magico';
        if (magico && d === 0) return;                 // no hay casilla 0 mágica
        if (!magico && d === 9) return;                // no hay casilla 9
        const casilla = magico ? PFC.MU_INV[d] : d;
        if (!estaLibre(casilla)) return;
        P.cursor = casilla;
        jugarHumano(casilla, magico
          ? 'el número mágico ' + d + '  (casilla ' + casilla + ')'
          : 'la casilla ' + casilla + '  (número mágico ' + PFC.MU[casilla] + ')');
        break;
      }
      default: return;
    }
    e.preventDefault();
  }

  /* ==================================================================
   * Pintar
   * ================================================================== */

  function refrescar() {
    $('#tablero').innerHTML = dibujarTablero();
    ajustarTablero();

    // Estado de la partida.
    const est = $('#estado');
    if (!P.terminada) {
      est.className = 'estado-partida';
      est.textContent = 'Turno de ' + P.turno + ' — ' + nombreDe(P.turno)
        + (esHumano(P.turno) ? '  (te toca)' : '  (pensando…)');
    } else {
      const humano = P.jugadorX === 'humano' ? 'X' : P.jugadorO === 'humano' ? 'O' : null;
      if (P.resultado === 'tablas') {
        est.className = 'estado-partida tablas'; est.textContent = 'Tablas.';
      } else if (humano && P.resultado === humano) {
        est.className = 'estado-partida gana';
        est.textContent = 'Has ganado. Si el algoritmo era C, V1, V2, A, B o M, esto no debería '
          + 'haber ocurrido: cuéntalo en el repositorio.';
      } else if (humano) {
        est.className = 'estado-partida pierde';
        est.textContent = 'Gana ' + P.resultado + ' — ' + nombreDe(P.resultado) + '.';
      } else {
        est.className = 'estado-partida';
        est.textContent = 'Gana ' + P.resultado + ' — ' + nombreDe(P.resultado) + '.';
      }
    }

    // Leyenda y ayuda de teclado: dicen lo que el algoritmo en juego usa
    // de verdad, no lo que le conviene al dibujo.
    const modo = modoEtiqueta();
    const alg = algoritmoEnJuego();
    $('#leyenda').innerHTML = '<span class="fx">X</span> primero en mover'
      + ' · <span class="fo">O</span> responde · '
      + (!P.etiquetas ? 'etiquetas ocultas'
        : modo === 'magico'
          ? 'los números son el <strong>cuadrado mágico</strong>: es con ellos con lo que '
            + (alg ? alg.id : 'C') + ' decide'
          : 'los números son las <strong>casillas 0–8</strong>: '
            + (alg ? alg.id : 'este algoritmo') + ' no conoce el cuadrado mágico');
    $('#etiqueta-numeros').textContent = modo === 'magico'
      ? 'ver los números del cuadrado mágico'
      : 'ver el número de casilla (0–8)';
    $('#ayuda-digitos').textContent = modo === 'magico'
      ? '1–9 jugar por número mágico'
      : '0–8 jugar por número de casilla';

    // Marcador.
    const m = P.marcador;
    $('#marcador').innerHTML = 'partidas: <span class="cifra-m">'
      + (m.ganadas + m.perdidas + m.tablas) + '</span>  ·  has ganado: <span class="'
      + (m.ganadas ? 'mal' : 'cifra-m') + '">' + m.ganadas + '</span>'
      + '  ·  has perdido: <span class="cifra-m">' + m.perdidas + '</span>'
      + '  ·  tablas: <span class="cifra-m">' + m.tablas + '</span>';

    // Por qué esa jugada.
    const ult = P.bitacora.filter(b => b.detalle).slice(-1)[0];
    if (ult) {
      $('#regla').textContent = ult.detalle.split('.')[0] + '.';
      $('#explicacion').textContent = ult.detalle.slice(ult.detalle.indexOf('.') + 1).trim();
    } else {
      $('#regla').textContent = '—';
      $('#explicacion').textContent = 'Todavía no ha decidido nada ningún algoritmo.';
    }
    // Las matrices de la decisión: la regla, vista como matrices. El ancho se
    // mide en el propio elemento, para que en un móvil se apilen en lugar de
    // salirse de la pantalla.
    const d = P.ultimaDecision;
    const columnasMatrices = UI.columnasQueCaben($('#matrices'));
    DM.fijarAncho(columnasMatrices);
    UI.pintarPorColumnas($('#matrices'), d
      ? DM.matrices(d.alg, d.propias, d.ajenas, d.decision, columnasMatrices)
      : 'Las matrices de la decisión aparecen en cuanto decida un algoritmo.');

    $('#candidatas').textContent = P.candidatas.length
      ? 'Jugadas que considera igual de buenas: ' + P.candidatas.join(', ')
        + (P.candidatas.length > 1 ? '  (se elige ' + (P.azar ? 'al azar' : 'la primera') + ')' : '')
      : '';

    // Bitácora.
    $('#bitacora').innerHTML = P.bitacora.map(function (b, i) {
      const clase = b.quien === 'sorteo' ? 'turno'
        : (esHumano(b.quien) ? 'quien-hum' : 'quien-alg');
      return '<li><span class="turno">' + String(i).padStart(2, '0') + '</span> '
        + '<span class="' + clase + '">' + UI.escapar(b.texto) + '</span>'
        + (b.detalle ? '<span class="detalle">' + UI.escapar(b.detalle) + '</span>' : '')
        + '</li>';
    }).join('');
    const bit = $('#bitacora'); bit.scrollTop = bit.scrollHeight;

    pintarDentro();
    pintarCodigo();
  }

  // «Dentro de la máquina»: qué está guardando el algoritmo a quien le toca.
  function pintarDentro() {
    const marca = P.terminada ? (P.ultima ? P.ultima.marca : 'O') : P.turno;
    let alg = algoritmoDe(marca);
    if (!alg) alg = algoritmoDe(marca === 'X' ? 'O' : 'X');
    if (!alg) {
      UI.pintarPorColumnas($('#dentro'), 'Los dos jugadores son humanos: no hay ninguna '
        + 'máquina en la que mirar. Elige un algoritmo arriba.');
      UI.pintarPorColumnas($('#traza'), '');
      $('#dentro-quien').textContent = '';
      return;
    }
    const suMarca = algoritmoDe(marca) ? marca : (marca === 'X' ? 'O' : 'X');
    $('#dentro-quien').textContent = alg.nombre + '  ·  ' + alg.capitulo
      + '  ·  desde el punto de vista de ' + suMarca;
    const columnas = UI.columnasQueCaben($('#dentro'));
    DM.fijarAncho(columnas);
    UI.pintarPorColumnas($('#dentro'), DM.pintar(
      alg, propiasDe(suMarca).slice(), ajenasDe(suMarca).slice(),
      suMarca, suMarca === 'X' ? 'O' : 'X', columnas));
    UI.pintarPorColumnas($('#traza'), DM.traza(alg, P.historial, suMarca, columnas));
  }

  // El código que acaba de decidir. No es una copia: es el texto de las
  // funciones que se están ejecutando, sacado con toString().
  function pintarCodigo() {
    const alg = PFC.porId[P.pestanaCodigo];
    if (!alg) return;
    $('#codigo-titulo').textContent = alg.nombre + '  ·  ' + alg.capitulo;
    $('#codigo-resumen').textContent = alg.resumen;
    UI.pintarCodigo($('#codigo'), PFC.fuenteDe(alg) || '// sin fuente disponible');
    document.querySelectorAll('#pestanas-codigo button').forEach(function (b) {
      b.classList.toggle('activa', b.dataset.id === P.pestanaCodigo);
    });
  }

  /* ==================================================================
   * El título en arte ASCII, ajustado al ancho disponible
   * ==================================================================
   *
   * No se elige un tamaño de letra a ojo: se mide cuánto ocupa la línea más
   * larga del dibujo y se despeja el tamaño que la hace encajar exactamente.
   * Así ocupa el 100 % del ancho en cualquier pantalla.
   */

  // El tablero, ajustado al ancho disponible igual que el título. Así no
  // depende de adivinar un tamaño con vw: se mide y se despeja. En un móvil
  // estrecho encoge lo justo, y nunca se sale.
  function ajustarTablero() {
    const pre = document.getElementById('tablero');
    if (!pre) return;
    const caja = pre.parentElement;
    const columnas = 16;                       // '   +---+---+---+'
    const medidor = document.createElement('span');
    medidor.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;'
      + 'font-family:inherit;font-weight:inherit;font-size:100px';
    medidor.textContent = '0'.repeat(columnas);
    caja.appendChild(medidor);
    const anchoACien = medidor.getBoundingClientRect().width;
    caja.removeChild(medidor);

    const disponible = caja.clientWidth - 4;
    if (!anchoACien || !disponible) return;
    const cabe = 100 * disponible / anchoACien;
    pre.style.fontSize = Math.max(13, Math.min(34, cabe)).toFixed(2) + 'px';
  }

  /* ==================================================================
   * Arranque
   * ================================================================== */

  function opcionesDeJugador(seleccionado) {
    return '<option value="humano"' + (seleccionado === 'humano' ? ' selected' : '') + '>'
      + 'humano (yo)</option>'
      + PFC.algoritmos.map(a => '<option value="' + a.id + '"'
        + (seleccionado === a.id ? ' selected' : '') + '>' + a.nombre + '</option>').join('');
  }

  global.arrancarJuego = function () {
    UI.montarArmazon('index.html');
    ajustarTablero();
    let temporizador = null;
    global.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { ajustarTablero(); refrescar(); }, 150);
    });

    $('#jugador-a').innerHTML = opcionesDeJugador('humano');
    $('#jugador-b').innerHTML = opcionesDeJugador('C');

    $('#pestanas-codigo').innerHTML = PFC.algoritmos
      .map(a => '<button data-id="' + a.id + '">' + a.id + '</button>').join('');
    document.querySelectorAll('#pestanas-codigo button').forEach(function (b) {
      b.addEventListener('click', function () { P.pestanaCodigo = b.dataset.id; pintarCodigo(); });
    });

    // Ratón: el puntero selecciona, el clic juega.
    const tab = $('#tablero');
    tab.addEventListener('mouseover', function (e) {
      const s = e.target.closest('[data-casilla]');
      if (!s || P.terminada || !esHumano(P.turno)) return;
      const c = Number(s.dataset.casilla);
      if (P.x.includes(c) || P.o.includes(c)) return;
      if (c !== P.cursor) { P.cursor = c; refrescar(); }
    });
    tab.addEventListener('click', function (e) {
      const s = e.target.closest('[data-casilla]');
      if (!s) return;
      const c = Number(s.dataset.casilla);
      jugarHumano(c, 'la casilla ' + c + '  [clic]');
    });

    document.addEventListener('keydown', atenderTeclado);

    $('#nueva').addEventListener('click', nuevaPartida);
    $('#azar').addEventListener('change', function (e) { P.azar = e.target.checked; refrescar(); });
    $('#numeros').addEventListener('change', function (e) {
      P.etiquetas = e.target.checked; refrescar();
    });
    $('#jugador-a').addEventListener('change', nuevaPartida);
    $('#jugador-b').addEventListener('change', nuevaPartida);

    nuevaPartida();
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
