import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { EJEMPLO, conjuntoEjemplo, mamdaniEjemplo } from '../../nucleo/fuzzython.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { tramo } from '../parte9/comun.js';
import { codigo, coma, relleno, trazar } from '../parte14/comun.js';

const R = String.raw;
const D = [0, 40], S = { short: AZUL, usual: ORO, large: ROSA }, AC = ['MIN', 'PROD'], AU = ['MAX', 'ASUM', 'BSUM'];
const op = (e) => ({ activacion: AC[Math.round(e.ac)], acumulacion: AU[Math.round(e.au)] });
export default {
  id: '15-3-bloque',
  titulo: 'Bloques y normas',
  puente: 'Ya sabes qué hace cada ajuste. Falta lo que entra por el otro lado: ¿y si la entrada no es un número exacto?',
  pregunta: 'En la región 3 viste que hay muchas formas de decir «y» y «o». Un <code>RuleBlock</code> las elige en una sola línea. Pero hay una trampa: la acumulación no hace lo que dice la teoría cuando dos reglas llegan a la misma palabra.',
  escena: {
    id: 'bloque', formato: 'plano', W: 1100, H: 520,
    ejes: { x: D, y: [0, 1], caja: { x: 70, y: 60, w: 520, h: 370 } },
    entradas: [{ id: 't', tipo: 'deslizador', etiqueta: 'temperatura', min: 0, max: 40, paso: 0.5, valor: 33 }, { id: 'ac', tipo: 'deslizador', etiqueta: 'activación: MIN o PROD', min: 0, max: 1, paso: 1, valor: 0 }, { id: 'au', tipo: 'deslizador', etiqueta: 'acumulación: MAX, ASUM o BSUM', min: 0, max: 2, paso: 1, valor: 0 }],
    pasos: [
      { dur: 2600, texto: 'La salida a 33 grados, con los ajustes de serie: se recorta cada conjunto (<code>MIN</code>) y se unen (<code>MAX</code>).' },
      { dur: 3000, texto: 'Con <code>activation=\'PROD\'</code> no se recorta: <b style="color:#f4d345;font-weight:400">se escala</b>, y la forma se conserva. Es el sistema de Larsen. Prueba el deslizador.' },
      { dur: 3000, texto: 'Con <code>accumulation=\'BSUM\'</code>, donde dos conjuntos se solapan, se suman. El resultado cambia poco aquí, porque apenas se solapan.' },
      { dur: 2800, texto: 'A la derecha, todas las respuestas posibles. Los ajustes mueven la curva, pero no su forma general: las reglas mandan más que las normas.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, o = paso === 0 ? { activacion: 'MIN', acumulacion: 'MAX' } : op(e), cj = conjuntoEjemplo(e.t, o), res = cj ? cj.COG() : 0;
      const N = [marco({ x: D, y: [0, 1] }, { alfa: al, ticks: { x: [0, 20, 40], y: [0, 1] }, etiquetas: { x: R`\text{minutos}` } })];
      for (const [k, P] of Object.entries(EJEMPLO.min)) N.push(trazar(P, D, { color: S[k], ancho: 1.2, alfa: 0.4 * al }));
      if (cj) N.push(relleno(cj, D, { color: ORO, alfa: 0.45 * al }), trazar(cj, D, { color: ORO, alfa: al }), ...tramo([res, 0], [res, 1], { color: [255, 255, 255], ancho: 2, alfa: al }));
      N.push(rotulo([40, 1], R`\text{${o.activacion}, ${o.acumulacion}}:\ ${coma(res, 2)}\ \text{min}`, { clave: 'r', ancla: 'r', dy: -14, tam: 21, color: ORO, alfa: al }));
      const G = [marco({ x: D, y: D }, { alfa: g3, ticks: { x: [0, 20, 40], y: [0, 20, 40] }, etiquetas: { x: R`\text{grados}`, y: R`\text{minutos}` } })];
      if (g3 > 0) G.push(curva((u) => [u, mamdaniEjemplo(u)], D, { n: 140, color: GRIS2, ancho: 1.4, alfa: 0.8 * g3, tol: 1 }), curva((u) => [u, mamdaniEjemplo(u, o)], D, { n: 140, color: ORO, ancho: 2.6, alfa: g3, tol: 1 }), punto([e.t, res], { color: ORO, radio: 6, alfa: g3 }));
      return { principal: N, paneles: [{ ejes: { x: D, y: D, caja: { x: 680, y: 80, w: 370, h: 350 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Cambia activación y acumulación, y compara con la curva gris, la de serie.</li><li>Busca la temperatura donde más se separan.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un bloque reúne reglas y decide cuatro cosas: el «y», el «o», el «no» y, para Mamdani, cómo activar y cómo acumular. Las tres primeras son <code>operators</code>, y se aplican <b>al analizar la regla</b>. Por eso, cambiar <code>block.operators</code> después no sirve de nada.' },
    codigo('En Python', 'Tres sistemas iguales, salvo sus ajustes. La función <code>sistema</code> crea las palabras y las reglas de siempre, y pasa los ajustes a <code>RuleBlock</code>:', "for n in ({}, {'activation': 'PROD'}, {'accumulation': 'BSUM'}):\n    print(n, sistema(**n).compute({'temp': 33})['b']['minutes'])", 'Cada sistema crea sus propios adjetivos, y no es por capricho: la fuerza se guarda dentro del <code>Adjective</code>. Dos sistemas que los comparten se pisan.', { prefacio: "from adjective import Adjective\nfrom fsets.polygon import Polygon\nfrom ruleblock import RuleBlock\nfrom systems.mamdani import MamdaniSystem\nfrom variable import Variable\n\ndef sistema(**normas):\n    cold = Adjective('cold', Polygon((0, 1), (15, 1), (20, 0)))\n    normal = Adjective('normal', Polygon((15, 0), (20, 1), (30, 1), (35, 0)))\n    hot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))\n    temp = Variable('temp', 'C', cold, normal, hot)\n    short = Adjective('short', Polygon((0, 1), (10, 1), (15, 0)))\n    usual = Adjective('usual', Polygon((10, 0), (15, 1), (25, 1), (30, 0)))\n    large = Adjective('large', Polygon((25, 0), (30, 1), (40, 1)))\n    minutes = Variable('minutes', 'min', short, usual, large, defuzzification='COG', default=0)\n    b = RuleBlock('b', **normas)\n    b.add_rules('if temp is cold or temp is normal then minutes is short with 0.5',\n                'if temp is normal then minutes is usual',\n                'if temp is hot then minutes is large', scope=locals())\n    return MamdaniSystem('m', b)" }),
    { tipo: 'ejemplo', texto: 'La trampa. Dos reglas llegan a <code>large</code>, con fuerzas 0,6 y 0,3. Lo que hace cada parte:', tabla: [['Paso', 'La teoría, con BSUM', 'fuzzython'], ['Fuerza de large', 'Dos recortes, y se suman', '$\\max(0{,}6;\\ 0{,}3) = 0{,}6$'], ['Conjunto', 'Altura $0{,}9$', 'Altura $0{,}6$'], ['ACCU', 'Entre todas las reglas', 'Solo entre palabras distintas']], cierre: 'Dentro de una misma palabra, siempre gana el máximo: <code>adjective.py</code>, línea 56.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\text{operators} = (T, S, C)`, dice: 'De serie, <code>MIN</code>, <code>MAX</code> y <code>ZADEH</code>. Si das solo <code>AND</code>, se le añade su pareja.' },
      { tex: R`\text{activation}`, dice: 'Cómo actúa la fuerza sobre el conjunto de salida.' },
      { tex: R`\text{accumulation}`, dice: 'Cómo se unen los conjuntos de palabras distintas.' },
    ], todo: R`\mu(x) = \underset{a}{\text{ACCU}}\ \text{ACT}\Big(\max_{r \to a} w_r,\ \mu_a(x)\Big)`, lee: '«Para cada palabra, la mayor fuerza de sus reglas; se activa; y se acumula entre palabras».' },
    { tipo: 'formal', titulo: 'Recortar frente a escalar', tex: R`Con $\text{MIN}$, el conjunto es $\min(w, \mu(x))$. Con $\text{PROD}$, es $w\,\mu(x)$. Si $w = 1$ coinciden. Si $w < 1$, escalar conserva el centro de gravedad del conjunto original; recortar, en general, no.`, lee: 'Por eso Larsen da respuestas algo distintas, y más fáciles de analizar.' },
    { tipo: 'demo', titulo: 'Escalar no mueve el centro de gravedad', plan: 'La constante sale de las dos integrales.', tex: R`Para $w > 0$, el centro de gravedad de $w\,\mu$ es el de $\mu$.`, pasos: [
      { texto: R`$\frac{\int x\, w\, \mu(x)\, dx}{\int w\, \mu(x)\, dx} = \frac{w \int x\, \mu(x)\, dx}{w \int \mu(x)\, dx}$.`, porque: 'Una constante sale fuera de la integral.' },
      { texto: R`Se cancela $w$, y queda el centro de gravedad de $\mu$.`, porque: 'Una salida con una sola regla activa ni siquiera depende de $w$: es lo que da las mesetas de Larsen.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Fíjate en lo que dice el código, no el nombre', texto: 'Un parámetro llamado <code>accumulation</code> sugiere que acumula todas las reglas. La única manera de saber lo que hace es probar un caso en que la respuesta correcta sea obvia.' }],
  retos: [
    { id: 'larsen-30', tipo: 'manipular', enunciado: R`A 33 grados, busca la pareja de ajustes que dé más de $24{,}3$ minutos.`, precision: (e) => (mamdaniEjemplo(33, op(e)) > 24.3 ? 1 : 0), prueba: { ac: 1, au: 0, t: 33 }, pendiente: (e) => `Con ${op(e).activacion} y ${op(e).acumulacion}, a 33 grados salen ${mamdaniEjemplo(33, op(e)).toFixed(2).replace('.', ',')} minutos.`, pistas: ['Prueba a escalar en vez de recortar.'], explicacion: 'Con <code>PROD</code> y <code>MAX</code> salen 24,41. Con los de serie, 24,14.' },
    { id: 'altura-calc', tipo: 'calcular', enunciado: R`En fuzzython, dos reglas llegan a la misma palabra con fuerzas $0{,}7$ y $0{,}2$, y acumulación BSUM. ¿Qué fuerza tiene la palabra?`, respuesta: 0.7, tol: 0.001, pistas: ['Dentro de una palabra, BSUM no actúa.'], explicacion: R`$\max(0{,}7;\ 0{,}2) = 0{,}7$.` },
    { id: 'estado-elegir', tipo: 'elegir', enunciado: 'Dos sistemas comparten el mismo <code>Adjective</code>. ¿Qué puede pasar?', opciones: ['Nada', 'Se interfieren, porque la fuerza se guarda dentro del adjetivo', 'Se copia automáticamente', 'Lanza un error'], correcta: 1, explicacion: 'Un <code>compute</code> solo pone a cero lo de sus propios bloques.' },
    { id: 'demuestra-coinciden', tipo: 'demostrar', enunciado: R`Demuestra que, con $w = 1$ y $\mu \le 1$, recortar y escalar coinciden.`, pistas: ['Sustituye.'], solucion: [{ texto: R`$\min(1, \mu(x)) = \mu(x)$, porque $\mu(x) \le 1$.`, porque: 'Definición de mínimo.' }, { texto: R`Y $1 \cdot \mu(x) = \mu(x)$.`, porque: 'Son iguales.' }] },
  ],
  referencias: ['M. Larsen, «Industrial applications of fuzzy logic control», <em>Int. J. Man-Machine Studies</em> 12 (1980).', '<em>fuzzython</em>: ruleblock.py y adjective.py.'],
};
