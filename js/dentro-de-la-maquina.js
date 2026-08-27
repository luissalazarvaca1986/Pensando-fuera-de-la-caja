/*
 * dentro-de-la-maquina.js — Qué está guardando el algoritmo
 * =========================================================
 *
 * Un tablero pintado no dice nada sobre cómo se decide. Este archivo abre la
 * tapa: para cada algoritmo, muestra en texto lo que de verdad tiene en la
 * memoria mientras piensa, y la aritmética exacta que acaba de hacer.
 *
 * No decide nada. Solo mira. Todo lo que muestra se recalcula a partir de la
 * posición, con las mismas funciones que usa el algoritmo, para que no pueda
 * contar una cosa distinta de la que ocurre.
 *
 * Y ahí está la diferencia que persigue el libro. Mira lo que sale con C
 * —dos conjuntos de números y una resta— y lo que sale con A: una clave, un
 * número de entrada y una tabla de cuatro mil quinientas filas que hay que
 * creerse.
 */

(function (global) {
  'use strict';
  const PFC = global.PFC;
  const DM = global.DM = {};

  /* ---------- Dibujo ASCII ---------- */

  function centrar(texto, ancho) {
    const t = String(texto);
    const sobra = ancho - t.length;
    if (sobra <= 0) return t.slice(0, ancho);
    const izq = Math.floor(sobra / 2);
    return ' '.repeat(izq) + t + ' '.repeat(sobra - izq);
  }

  // Una rejilla de tres por tres, en caracteres de caja.
  function caja(celdas, ancho, sangria) {
    const s = sangria || '  ';
    const h = '─'.repeat(ancho);
    let out = s + '┌' + h + '┬' + h + '┬' + h + '┐\n';
    for (let f = 0; f < 3; f++) {
      out += s + '│' + celdas.slice(f * 3, f * 3 + 3)
        .map(c => centrar(c, ancho)).join('│') + '│\n';
      out += s + (f < 2 ? '├' + h + '┼' + h + '┼' + h + '┤' : '└' + h + '┴' + h + '┴' + h + '┘') + '\n';
    }
    return out;
  }
  DM.caja = caja;

  function conjunto(nombre, numeros) {
    return nombre + ' = { ' + (numeros.length ? numeros.join(', ') : '—') + ' }';
  }

  function titulo(t) {
    return '── ' + t + ' ' + '─'.repeat(Math.max(0, 58 - t.length)) + '\n';
  }

  function si(v) { return v ? 'SÍ' : 'no'; }

  /* ==================================================================
   * C — Cuadrado mágico: dos conjuntos de números y una resta
   * ================================================================== */

  function dentroDeC(propias, ajenas, quienSoy, quienEsElOtro) {
    const K = PFC.CONSTANTE_MAGICA;
    const mias = PFC.aNumeros(propias);
    const suyas = PFC.aNumeros(ajenas);
    const ocupados = mias.concat(suyas);
    const libres = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !ocupados.includes(n));

    let s = titulo('MATRIZ DE REFERENCIA (ecuación 5.1)');
    s += caja(PFC.MU.map(String), 3);
    s += '  Toda la geometría del juego cabe aquí. El algoritmo no guarda\n'
      + '  filas, ni columnas, ni diagonales: solo estos nueve números.\n\n';

    s += titulo('ESTADO DE LA PARTIDA — el par (P, R)');
    s += '  ' + conjunto('P  mío   (' + quienSoy + ')', mias) + '\n';
    s += '  ' + conjunto('R  rival (' + quienEsElOtro + ')', suyas) + '\n';
    s += '  ' + conjunto('LIBRES', libres) + '\n\n';

    s += titulo('ARITMÉTICA: 15 − (a + b), sobre MIS parejas');
    s += cuentas(mias, libres, K) || '  (aún no tengo dos números)\n';
    s += '\n' + titulo('ARITMÉTICA: 15 − (a + b), sobre las parejas DEL RIVAL');
    s += cuentas(suyas, libres, K) || '  (aún no tiene dos números)\n';

    s += '\n' + titulo('LAS OCHO RECTAS, QUE NO ESTÁN ESCRITAS EN NINGÚN SITIO');
    s += '  ' + PFC.triosQuince().map(t => '{' + t.join(',') + '}').join(' ') + '\n';
    s += '  Son los ocho subconjuntos de {1..9} que suman 15, de los 84\n'
      + '  posibles. Se deducen; no hay lista que mantener.\n\n';

    s += titulo('ESTRUCTURA POSICIONAL (ecuación 5.6)');
    s += '  centro   = { 5 }             el cinco\n';
    s += '  esquinas = { 2, 4, 6, 8 }    los pares\n';
    s += '  lados    = { 1, 3, 7, 9 }    los impares\n';
    return s;
  }

  function cuentas(conj, libres, K) {
    let s = '';
    for (const [a, b] of PFC.parejas(conj)) {
      const falta = K - a - b;
      const enRango = falta >= 1 && falta <= 9;
      const libre = libres.includes(falta);
      s += '  ' + String(a).padStart(2) + ' + ' + String(b).padStart(2) + ' = '
        + String(a + b).padStart(2) + '   →  15 − ' + String(a + b).padStart(2) + ' = '
        + (enRango ? String(falta) : '·') + '   '
        + (!enRango ? '(fuera de rango: no hay recta)'
          : libre ? '¿libre? SÍ  →  RECTA ABIERTA' : '¿libre? no  →  recta muerta')
        + '\n';
    }
    return s;
  }

  /* ==================================================================
   * V1 y V2 — La matriz codificada y las ocho sumas
   * ================================================================== */

  function dentroDeGeometrico(propias, ajenas, quienSoy, quienEsElOtro, usaCuadrado) {
    const G = PFC.geometrico;
    const t = G.tablero(propias, ajenas);

    let s = titulo('TABLERO CODIFICADO — S = a + 10b (ecuación 6.1)');
    s += caja(t.map(String), 4);
    s += '  libre 0 · ficha mía (' + quienSoy + ') 1 · ficha del rival ('
      + quienEsElOtro + ') 10\n'
      + '  Como en una recta caben tres fichas y 3 < 10, la suma se lee en\n'
      + '  base diez sin conversión: unidades = mías, decenas = suyas.\n\n';

    s += titulo('LISTA DE LAS OCHO RECTAS — escrita a mano en el programa');
    s += '  ' + PFC.RECTAS.map(r => '[' + r.join(',') + ']').join(' ') + '\n';
    s += '  Esto es exactamente lo que la formulación C consigue eliminar.\n\n';

    s += titulo('SUMA DE CADA RECTA');
    for (let i = 0; i < PFC.RECTAS.length; i++) {
      const r = PFC.RECTAS[i];
      const suma = G.sumaRecta(t, r);
      const mias = suma % 10, suyas = Math.floor(suma / 10);
      let nota = '';
      if (suma === 3) nota = '← TRES EN RAYA MÍO';
      else if (suma === 30) nota = '← tres en raya del rival';
      else if (suma === G.AMENAZA_PROPIA) nota = '← puedo cerrar aquí';
      else if (suma === G.AMENAZA_AJENA) nota = '← DEBO BLOQUEAR aquí';
      else if (mias > 0 && suyas > 0) nota = '(recta muerta)';
      s += '  ' + G.NOMBRES_RECTA[i].padEnd(8) + '[' + r.join(',') + ']  = '
        + String(suma).padStart(3) + '   ' + suyas + ' suyas, ' + mias + ' mías   ' + nota + '\n';
    }

    s += '\n' + titulo(usaCuadrado
      ? 'LOCALIZAR EL HUECO — V2: con 15 − (a + b)'
      : 'LOCALIZAR EL HUECO — V1: recorriendo la recta');
    if (usaCuadrado) {
      s += caja(PFC.MU.map(String), 3);
      s += '  Se toman los dos números mágicos ocupados de la recta y se resta\n'
        + '  de quince. Es la formulación del relato original.\n';
    } else {
      s += '  Se recorre la recta hasta dar con la casilla vacía. No hace falta\n'
        + '  ningún cuadrado mágico: la recta amenazada tiene un solo hueco.\n';
    }
    let ejemplos = '';
    for (let i = 0; i < PFC.RECTAS.length; i++) {
      const r = PFC.RECTAS[i], suma = G.sumaRecta(t, r);
      if (suma !== G.AMENAZA_PROPIA && suma !== G.AMENAZA_AJENA) continue;
      const a = [], libre = [];
      for (const c of r) (t[c] === G.LIBRE ? libre : a).push(c);
      const c = usaCuadrado ? G.localizarPorResta(t, r) : G.localizarRecorriendo(t, r);
      ejemplos += '  [' + r.join(',') + ']  ' + (usaCuadrado
        ? '15 − (' + PFC.MU[a[0]] + ' + ' + PFC.MU[a[1]] + ') = ' + PFC.MU[c]
          + '  → casilla ' + c
        : 'hueco encontrado al recorrerla  → casilla ' + c) + '\n';
    }
    s += ejemplos ? '\n' + ejemplos : '\n  (ninguna recta amenazada ahora mismo)\n';

    s += '\n' + titulo('CLASIFICACIÓN POSICIONAL — también escrita a mano');
    s += '  centro   = [4]\n  esquinas = [0,2,6,8]\n  lados    = [1,3,5,7]\n';
    return s;
  }

  /* ==================================================================
   * A — La tabla de 4 520 casos
   * ================================================================== */

  function dentroDeTablaA(propias, ajenas) {
    const tabla = PFC.tablas.construirTablaA();
    const clave = PFC.clave(propias, ajenas);

    const claves = Array.from(tabla.keys());
    const i = claves.indexOf(clave);

    let s = titulo('TABLA DE CASOS EN MEMORIA');
    s += '  entradas          ' + tabla.size.toLocaleString('es-ES') + '\n';
    s += '  clave buscada     "' + clave + '"\n';
    s += '  ¿la encuentra?    ' + si(i >= 0) + '\n';
    s += '  entrada número    ' + (i >= 0 ? (i + 1).toLocaleString('es-ES') + ' de '
      + tabla.size.toLocaleString('es-ES') : '—') + '\n';
    s += '  respuesta leída   ' + (i >= 0 ? tabla.get(clave).join(', ') : '—') + '\n\n';

    s += titulo('CÓMO SE LEE LA CLAVE');
    s += caja(clave.split('').map(c => c === '.' ? '·' : c), 3);
    s += '  X soy yo, O es el rival, · es una casilla libre.\n\n';

    s += titulo('FRAGMENTO DE LA TABLA, ALREDEDOR DE ESTA ENTRADA');
    const desde = Math.max(0, i - 4), hasta = Math.min(claves.length, i + 5);
    if (desde > 0) s += '        ⋮\n';
    for (let j = desde; j < hasta; j++) {
      const k = claves[j];
      s += '  ' + String(j + 1).padStart(5) + '  "' + k + '"  →  '
        + tabla.get(k).join(',') + (j === i ? '   ← ésta' : '') + '\n';
    }
    if (hasta < claves.length) s += '        ⋮\n';

    s += '\n' + titulo('LO QUE ESTA TABLA NO PUEDE DECIRTE');
    s += '  Por qué esta jugada: se busca el caso y se lee. Eso sí.\n'
      + '  Por qué juega bien SIEMPRE: esa respuesta está repartida entre\n'
      + '  ' + tabla.size.toLocaleString('es-ES') + ' sitios, y nadie la tiene entera.\n';
    return s;
  }

  /* ==================================================================
   * B — La misma tabla, reducida por simetría
   * ================================================================== */

  function dentroDeTablaB(propias, ajenas) {
    const tabla = PFC.tablas.construirTablaB();
    const clave = PFC.clave(propias, ajenas);
    const { clave: can, permutacion } = PFC.tablas.canonicaConSimetria(clave);

    let s = titulo('LAS OCHO VISTAS DE ESTA POSICIÓN');
    for (const p of PFC.SIMETRIAS) {
      let t = '';
      for (let j = 0; j < 9; j++) t += clave[p[j]];
      s += '  "' + t + '"' + (t === can ? '   ← la menor: forma canónica' : '') + '\n';
    }
    s += '\n' + titulo('REDUCCIÓN');
    s += '  posición real     "' + clave + '"\n';
    s += '  forma canónica    "' + can + '"\n';
    s += '  permutación       [' + permutacion.join(',') + ']\n\n';

    const enCanonica = tabla.get(can) || [];
    const claves = Array.from(tabla.keys());
    const i = claves.indexOf(can);

    s += titulo('TABLA DE CLASES EN MEMORIA');
    s += '  clases            ' + tabla.size.toLocaleString('es-ES')
      + '   (frente a ' + PFC.tablas.construirTablaA().size.toLocaleString('es-ES') + ' de A)\n';
    s += '  clase número      ' + (i >= 0 ? (i + 1) + ' de ' + tabla.size : '—') + '\n';
    s += '  jugada en canónica  ' + (enCanonica.join(', ') || '—') + '\n';
    s += '  girada de vuelta    ' + enCanonica.map(j => permutacion[j]).join(', ') + '\n\n';

    s += titulo('SIETE VECES MENOS CASOS. Y SIGUE SIENDO UNA LISTA');
    s += '  La reducción es real: 4 520 → 627. Pero pasar de 4 520 casos a\n'
      + '  627 es una reducción cuantitativa: la lista es más corta.\n'
      + '  Sigues sin poder leerla entera.\n';
    return s;
  }

  /* ==================================================================
   * M — El árbol explorado
   * ================================================================== */

  function dentroDeMinimax(propias, ajenas) {
    const libres = PFC.libres(propias, ajenas);
    let s = titulo('EXPLORACIÓN DEL ÁRBOL — valor de cada jugada');
    s += '  El valor lleva la profundidad dentro: ganar en la jugada k vale\n'
      + '  10 − k. Así ganar ya es mejor que ganar más tarde.\n\n';
    const valores = PFC.valorDeCadaJugada(propias, ajenas);
    const mejor = Math.max.apply(null, Object.keys(valores).map(c => valores[c]));
    for (const c of libres) {
      const v = valores[c];
      s += '  casilla ' + c + '  →  ' + (v > 0 ? 'gano' : v < 0 ? 'pierdo' : 'tablas')
        + '   valor ' + String(v).padStart(3)
        + '   ' + (v === mejor ? '← mejor' : '') + '\n';
    }
    s += '\n' + titulo('QUÉ HAY EN MEMORIA');
    s += '  No hay tabla de casos ni cuadrado mágico. Hay una pila de\n'
      + '  llamadas recursivas y las posiciones ya evaluadas.\n\n';
    s += titulo('LA PREGUNTA INCÓMODA');
    s += '  ¿Por qué ha jugado ahí? «Porque exploré el árbol y esta rama\n'
      + '  daba el mejor valor.» Es cierto, es correcto, y no es una\n'
      + '  explicación que puedas seguir con la cabeza.\n';
    return s;
  }

  /* ==================================================================
   * LAS MATRICES DE LA DECISIÓN
   * ==================================================================
   *
   * La regla que se disparó, vista como matrices y no como prosa. Una por
   * cada cosa que el algoritmo mira para decidir, y una última con la
   * decisión. Puestas en fila, se lee de izquierda a derecha por qué juega
   * donde juega.
   *
   * Las matrices no son las mismas para todos, y eso es el asunto del libro:
   *   C  y V2  mira dos conjuntos de números y una resta;
   *   V1       mira una matriz codificada y ocho sumas;
   *   A  y B   mira una clave y una fila de tabla;
   *   M        mira el valor de cada rama del árbol.
   */

  function matrizMarcada(marcas, mias, suyas) {
    const celdas = [];
    for (let c = 0; c < 9; c++) {
      celdas.push(marcas[c] !== undefined ? marcas[c]
        : mias.includes(c) ? 'M' : suyas.includes(c) ? 'r' : '·');
    }
    return celdas;
  }

  function bloqueMatriz(titulo, celdas, ancho, pie) {
    return [titulo, ''].concat(rejillaPequena(celdas, ancho || 3), pie || []);
  }

  DM.matrices = function (alg, propias, ajenas, decision) {
    if (!alg || !decision) return '';
    const elegidas = decision.casillas;
    let s = '── ' + decision.regla.toUpperCase() + ' '
      + '─'.repeat(Math.max(0, 58 - decision.regla.length)) + '\n\n';
    const bloques = [];
    const notas = [];

    // Qué regla se ha disparado, para mostrar solo las matrices que importan.
    const regla = decision.regla.match(/Regla (\d)/);
    const cual = regla ? Number(regla[1]) : 0;

    if (alg.id === 'C' || alg.id === 'V2') {
      const K = PFC.CONSTANTE_MAGICA;
      const mias = PFC.aNumeros(propias), suyas = PFC.aNumeros(ajenas);
      const ocupados = mias.concat(suyas);
      const libres = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !ocupados.includes(n));
      const mCierres = PFC.magico.cierres(mias, libres);
      const sCierres = PFC.magico.cierres(suyas, libres);

      // Siempre: el reparto, sobre los números del cuadrado.
      const reparto = [];
      for (let c = 0; c < 9; c++) {
        reparto.push(propias.includes(c) ? 'M' : ajenas.includes(c) ? 'r' : String(PFC.MU[c]));
      }
      bloques.push(bloqueMatriz('reparto', reparto, 3,
        ['P {' + mias.join(',') + '}', 'R {' + suyas.join(',') + '}']));

      if (cual === 1 || cual === 2) {
        const m1 = {};
        for (const n of mCierres) m1[PFC.MU_INV[n]] = '✓';
        bloques.push(bloqueMatriz('cierro yo', matrizMarcada(m1, propias, ajenas), 3,
          [mCierres.length ? '{' + mCierres.join(',') + '}' : '—']));

        const m2 = {};
        for (const n of sCierres) m2[PFC.MU_INV[n]] = '!';
        bloques.push(bloqueMatriz('cierra él', matrizMarcada(m2, propias, ajenas), 3,
          [sCierres.length ? '{' + sCierres.join(',') + '}' : '—']));

        for (const [a, b] of PFC.parejas(mias)) {
          const f = K - a - b;
          if (mCierres.includes(f)) notas.push('  mía:   15 − (' + a + ' + ' + b + ') = ' + f + '  libre  ✓  cierro');
        }
        for (const [a, b] of PFC.parejas(suyas)) {
          const f = K - a - b;
          if (sCierres.includes(f)) notas.push('  suya:  15 − (' + a + ' + ' + b + ') = ' + f + '  libre  !  bloqueo');
        }

      } else if (cual === 3) {
        // Ni cierro ni bloqueo: lo que importa es dónde el rival alcanzaría
        // DOS amenazas de una sola jugada.
        const peligro = {};
        for (const x of libres) {
          const dos = PFC.magico.cierres(suyas.concat(x), PFC.quitar(libres, x));
          if (dos.length >= 2) {
            peligro[PFC.MU_INV[x]] = '‼';
            notas.push('  si el rival toma el ' + x + ' →  amenaza {' + dos.join(',')
              + '}   dos a la vez: solo se puede bloquear una');
          }
        }
        bloques.push(bloqueMatriz('doble amenaza suya',
          matrizMarcada(peligro, propias, ajenas), 3, ['‼ dos de una']));

        const ataque = {};
        for (const c of elegidas) ataque[c] = '→';
        bloques.push(bloqueMatriz('mis ataques válidos',
          matrizMarcada(ataque, propias, ajenas), 3,
          ['{' + PFC.aNumeros(elegidas).join(',') + '}']));
        notas.push('  ataco para forzar su respuesta, y solo donde su bloqueo obligado');
        notas.push('  no le construya esa doble amenaza.');

      } else {
        // Regla 4: la preferencia posicional, que en aritmética es paridad.
        const pref = {};
        for (const n of libres) {
          const c = PFC.MU_INV[n];
          pref[c] = n === 5 ? 'C' : (n % 2 === 0 ? 'e' : 'l');
        }
        bloques.push(bloqueMatriz('preferencia', matrizMarcada(pref, propias, ajenas), 3,
          ['C centro (el 5)', 'e esquina (par)', 'l lado (impar)']));
        notas.push('  nada que ganar ni bloquear, y ninguna doble amenaza en camino.');
        notas.push('  centro → esquinas → lados, que aquí es: el 5, los pares, los impares.');
      }

      // Siempre: la decisión.
      const m3 = {};
      for (const c of elegidas) m3[c] = '★';
      bloques.push(bloqueMatriz('decisión', matrizMarcada(m3, propias, ajenas), 3,
        ['{' + PFC.aNumeros(elegidas).join(',') + '}']));

    } else if (alg.id === 'V1') {
      const G = PFC.geometrico;
      const t = G.tablero(propias, ajenas);
      const loc = G.localizarRecorriendo;
      const mCierres = G.cierres(t, G.AMENAZA_PROPIA, loc);
      const sCierres = G.cierres(t, G.AMENAZA_AJENA, loc);

      bloques.push(bloqueMatriz('codificada', t.map(String), 4,
        ['0 libre', '1 mía', '10 suya']));

      // Cuántas de las tres rectas de cada casilla están a 2 o a 20.
      const conteo = [];
      for (let c = 0; c < 9; c++) {
        let n2 = 0, n20 = 0;
        for (const r of PFC.RECTAS) {
          if (!r.includes(c)) continue;
          const v = G.sumaRecta(t, r);
          if (v === G.AMENAZA_PROPIA) n2++;
          if (v === G.AMENAZA_AJENA) n20++;
        }
        conteo.push(t[c] !== G.LIBRE ? (t[c] === G.PROPIA ? 'M' : 'r')
          : (n2 || n20) ? n2 + '/' + n20 : '·');
      }
      bloques.push(bloqueMatriz('rectas 2/20', conteo, 4, ['a 2 / a 20']));

      if (cual === 3) {
        const peligro = {};
        for (const x of PFC.libres(propias, ajenas)) {
          const t2 = G.tablero(propias, ajenas.concat(x));
          const dos = G.cierres(t2, G.AMENAZA_AJENA, loc);
          if (dos.length >= 2) {
            peligro[x] = '‼';
            notas.push('  si el rival toma la casilla ' + x + ' → amenazaría ['
              + dos.join(',') + ']: dos a la vez');
          }
        }
        bloques.push(bloqueMatriz('doble amenaza suya',
          matrizMarcada(peligro, propias, ajenas), 3, ['‼ dos de una']));
      }

      const m3 = {};
      for (const c of elegidas) m3[c] = '★';
      bloques.push(bloqueMatriz('decisión', matrizMarcada(m3, propias, ajenas), 3,
        ['[' + elegidas.join(',') + ']']));

      for (let i = 0; i < PFC.RECTAS.length; i++) {
        const r = PFC.RECTAS[i], v = G.sumaRecta(t, r);
        if (v === G.AMENAZA_PROPIA || v === G.AMENAZA_AJENA) {
          notas.push('  ' + G.NOMBRES_RECTA[i].padEnd(8) + '[' + r.join(',') + '] = '
            + String(v).padStart(2) + '  → hueco en la casilla ' + loc(t, r)
            + (v === 2 ? '  (cierro)' : '  (bloqueo)'));
        }
      }
      if (!mCierres.length && !sCierres.length) notas.push('  ninguna recta a 2 ni a 20.');

    } else if (alg.id === 'A' || alg.id === 'B') {
      const clave = PFC.clave(propias, ajenas);
      bloques.push(bloqueMatriz('la clave',
        clave.split('').map(c => c === '.' ? '·' : c === 'X' ? 'M' : 'r'), 3,
        ['"' + clave + '"']));

      if (alg.id === 'B') {
        const can = PFC.tablas.canonicaConSimetria(clave);
        bloques.push(bloqueMatriz('forma canónica',
          can.clave.split('').map(c => c === '.' ? '·' : c === 'X' ? 'M' : 'r'), 3,
          ['"' + can.clave + '"']));
        notas.push('  permutación aplicada: [' + can.permutacion.join(',') + ']');
        notas.push('  la jugada se lee en la canónica y se gira de vuelta.');
      }

      const m3 = {};
      for (const c of elegidas) m3[c] = '★';
      bloques.push(bloqueMatriz('lo que dice la tabla',
        matrizMarcada(m3, propias, ajenas), 3, ['[' + elegidas.join(',') + ']']));
      notas.push('  no hay aritmética que mirar: hay una fila que leer.');

    } else {
      // Minimax: el valor de cada rama, sobre el tablero.
      const valores = PFC.valorDeCadaJugada(propias, ajenas);
      const marcas = {};
      for (const c in valores) {
        const v = valores[c];
        marcas[c] = v > 0 ? '+' + v : v < 0 ? '−' + (-v) : '0';
      }
      bloques.push(bloqueMatriz('valor de cada rama', matrizMarcada(marcas, propias, ajenas), 4,
        ['+ gano, y antes', 'cuanto más alto', '0 tablas · − pierdo']));
      const m3 = {};
      for (const c of elegidas) m3[c] = '★';
      bloques.push(bloqueMatriz('decisión', matrizMarcada(m3, propias, ajenas), 3,
        ['[' + elegidas.join(',') + ']']));
      notas.push('  se ha explorado el árbol hasta el final de la partida.');
    }

    s += enFila(bloques, 3).join('\n') + '\n';
    if (notas.length) s += '\n' + notas.join('\n') + '\n';
    s += '\n  M ficha del algoritmo · r ficha del rival · ★ jugada elegida\n';
    return s;
  };

  /* ==================================================================
   * LA TRAZA: cómo se ha ido llenando la memoria, jugada a jugada
   * ==================================================================
   *
   * Una foto del estado actual no deja ver el llenado. Esto sí: una
   * instantánea de la memoria del algoritmo después de cada jugada, puestas
   * en fila para poder leerlas de izquierda a derecha.
   *
   * Y cada algoritmo la muestra en SU formato, que es el asunto del libro:
   * C llena dos conjuntos de números; V1 y V2 llenan una matriz codificada;
   * A y B no llenan nada, solo cambian de clave en una tabla que ya estaba
   * entera en memoria antes de empezar la partida.
   */

  // Pega bloques de líneas uno al lado del otro, alineados por arriba.
  function enFila(bloques, separacion) {
    const sep = ' '.repeat(separacion || 2);
    const altura = bloques.reduce((m, b) => Math.max(m, b.length), 0);
    const anchos = bloques.map(b => b.reduce((m, l) => Math.max(m, l.length), 0));
    const salida = [];
    for (let f = 0; f < altura; f++) {
      salida.push(bloques.map(function (b, i) {
        return centrar((b[f] || ''), anchos[i]).replace(/\s+$/, '')
          .padEnd(anchos[i], ' ');
      }).join(sep).replace(/\s+$/, ''));
    }
    return salida;
  }

  // Alinea a la izquierda, sin centrar (para bloques de texto).
  function bloqueIzquierda(lineas, ancho) {
    return lineas.map(l => l.padEnd(ancho, ' '));
  }

  function rejillaPequena(celdas, ancho) {
    const h = '─'.repeat(ancho);
    const out = ['┌' + h + '┬' + h + '┬' + h + '┐'];
    for (let f = 0; f < 3; f++) {
      out.push('│' + celdas.slice(f * 3, f * 3 + 3).map(c => centrar(c, ancho)).join('│') + '│');
      if (f < 2) out.push('├' + h + '┼' + h + '┼' + h + '┤');
    }
    out.push('└' + h + '┴' + h + '┴' + h + '┘');
    return out;
  }

  // Una instantánea, en el formato propio del algoritmo.
  function instantanea(alg, paso, indice, suMarca) {
    const mias = paso[suMarca === 'X' ? 'x' : 'o'];
    const suyas = paso[suMarca === 'X' ? 'o' : 'x'];
    const cab = indice === 0 ? 'inicio' : 'jugada ' + indice;

    if (alg.id === 'C' || alg.id === 'V2') {
      // Cada casilla libre muestra su número mágico; las ocupadas, su dueño.
      const celdas = [];
      for (let c = 0; c < 9; c++) {
        celdas.push(mias.includes(c) ? 'M' : suyas.includes(c) ? 'r' : String(PFC.MU[c]));
      }
      const P = PFC.aNumeros(mias), R = PFC.aNumeros(suyas);
      return [cab, ''].concat(rejillaPequena(celdas, 3), [
        'P {' + P.join(',') + '}',
        'R {' + R.join(',') + '}'
      ]);
    }

    if (alg.id === 'V1') {
      const t = PFC.geometrico.tablero(mias, suyas);
      const avisos = [];
      for (let i = 0; i < PFC.RECTAS.length; i++) {
        const v = PFC.geometrico.sumaRecta(t, PFC.RECTAS[i]);
        if (v === 2) avisos.push('r' + i + '=2');
        else if (v === 20) avisos.push('r' + i + '=20');
      }
      return [cab, ''].concat(rejillaPequena(t.map(String), 4), [
        avisos.length ? avisos.join(' ') : '—'
      ]);
    }

    if (alg.id === 'A' || alg.id === 'B') {
      const tabla = alg.id === 'A'
        ? PFC.tablas.construirTablaA() : PFC.tablas.construirTablaB();
      const clave = PFC.clave(mias, suyas);
      const buscada = alg.id === 'B'
        ? PFC.tablas.canonicaConSimetria(clave).clave : clave;
      const claves = Array.from(tabla.keys());
      const i = claves.indexOf(buscada);
      const celdas = clave.split('').map(c => c === '.' ? '·' : c === 'X' ? 'M' : 'r');
      return [cab, ''].concat(rejillaPequena(celdas, 3), [
        i >= 0 ? 'nº ' + (i + 1) : 'terminada',
        'de ' + tabla.size
      ]);
    }

    // Minimax
    const celdas = [];
    for (let c = 0; c < 9; c++) {
      celdas.push(mias.includes(c) ? 'M' : suyas.includes(c) ? 'r' : '·');
    }
    let v = '—';
    if (!PFC.haGanado(mias) && !PFC.haGanado(suyas) && mias.length + suyas.length < 9) {
      const n = PFC.desenlace(mias, suyas);
      v = n > 0 ? 'gano' : n < 0 ? 'pierdo' : 'tablas';
    }
    return [cab, ''].concat(rejillaPequena(celdas, 3), ['valor ' + v]);
  }

  DM.traza = function (alg, historial, suMarca) {
    if (!alg || !historial || !historial.length) {
      return 'La traza aparece en cuanto empiece la partida.';
    }
    let s = titulo('TRAZA DE LA MEMORIA, JUGADA A JUGADA');
    s += '  M = ficha del algoritmo · r = ficha del rival\n';
    if (alg.id === 'C' || alg.id === 'V2') {
      s += '  Las casillas libres siguen mostrando su número mágico: son los que\n'
        + '  quedan por repartir. La memoria son los dos conjuntos P y R.\n\n';
    } else if (alg.id === 'V1') {
      s += '  La matriz codificada: 0 libre, 1 mía, 10 del rival. Debajo, las\n'
        + '  rectas que valen 2 (puedo cerrar) o 20 (debo bloquear).\n\n';
    } else if (alg.id === 'A' || alg.id === 'B') {
      s += '  Fíjate en que aquí no se llena nada: la tabla estaba entera en\n'
        + '  memoria antes de empezar. Lo único que cambia es qué fila se lee.\n\n';
    } else {
      s += '  El valor de la posición para quien mueve, según el árbol.\n\n';
    }

    // En grupos, para que quepan a lo ancho.
    const porFila = (alg.id === 'V1') ? 4 : 5;
    const bloques = historial.map((paso, i) => instantanea(alg, paso, i, suMarca));
    for (let i = 0; i < bloques.length; i += porFila) {
      s += enFila(bloques.slice(i, i + porFila), 3).join('\n') + '\n\n';
    }
    return s.replace(/\n+$/, '\n');
  };

  /* ================================================================== */

  DM.pintar = function (alg, propias, ajenas, quienSoy, quienEsElOtro) {
    try {
      switch (alg.id) {
        case 'C':  return dentroDeC(propias, ajenas, quienSoy, quienEsElOtro);
        case 'V1': return dentroDeGeometrico(propias, ajenas, quienSoy, quienEsElOtro, false);
        case 'V2': return dentroDeGeometrico(propias, ajenas, quienSoy, quienEsElOtro, true);
        case 'A':  return dentroDeTablaA(propias, ajenas);
        case 'B':  return dentroDeTablaB(propias, ajenas);
        case 'M':  return dentroDeMinimax(propias, ajenas);
      }
    } catch (e) {
      return 'No se puede mirar dentro ahora mismo: ' + e.message;
    }
    return '';
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
