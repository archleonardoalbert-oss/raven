import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { NORMAS_FZ, poligono } from '../../nucleo/fuzzython.js';
import { marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { coma, relleno, trazar } from './comun.js';

import { SALIDAS } from './salidas.js';

const R = String.raw;
const D = [0, 10], A = poligono([[0, 0], [4, 1], [8, 0]]), B = poligono([[2, 0], [6, 1], [10, 0]]);
const T = ['MIN', 'PROD', 'BDIF', 'DPROD', 'EPROD', 'FAND'], S = ['MAX', 'ASUM', 'BSUM', 'DSUM', 'ESUM', 'FOR'];
const inters = (i) => A.combinar(NORMAS_FZ[T[i]], B), uni = (i) => A.combinar(NORMAS_FZ[S[i]], B);
export default {
  id: '14-4-operar',
  titulo: 'Operar conjuntos',
  puente: 'Sabes hacer conjuntos y combinarlos. Toca ponerles nombre: una palabra, una variable y una regla escrita casi como una frase.',
  pregunta: 'En la región 3 definiste el «y» de muchas formas: las normas T. fuzzython las tiene todas, con nombre propio. ¿Y cómo calcula la unión de dos triángulos sin perder exactitud justo donde se cruzan?',
  escena: {
    id: 'operar', formato: 'plano', W: 1100, H: 540,
    ejes: { x: D, y: [0, 1], caja: { x: 70, y: 60, w: 470, h: 390 } },
    entradas: [{ id: 'n', tipo: 'deslizador', etiqueta: 'la norma: MIN, PROD, BDIF, DPROD, EPROD, FAND', min: 0, max: 5, paso: 1, valor: 0 }],
    pasos: [
      { dur: 2600, texto: 'Dos conjuntos, <b style="color:#58c4dd;font-weight:400">A</b> y <b style="color:#fc6282;font-weight:400">B</b>, que se cruzan. El punto de cruce no es ninguno de sus vértices.' },
      { dur: 3000, texto: '<code>A &amp; B</code>: la intersección, con <code>MIN</code>. Un <code>Polygon</code> calcula dónde se cruzan sus rectas y <b style="color:#f4d345;font-weight:400">añade ese vértice</b>. Por eso no pierde nada.' },
      { dur: 3000, texto: 'A la derecha, <code>A | B</code>, la unión, con <code>MAX</code>. Y ahora, cambia de pareja: cada [[norma T]] tiene su [[norma S]].' },
      { dur: 3000, texto: 'Cuanto más baja el «y», más sube su «o»: lo viste en la región 3. Aquí, además, lees el valor en el cruce. Y <code>FAND</code> te dará una sorpresa.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, i = paso >= 3 ? Math.round(e.n) : 0, In = inters(i), Un = uni(i), vt = NORMAS_FZ[T[i]](0.75, 0.75), vs = NORMAS_FZ[S[i]](0.75, 0.75);
      const N = [marco({ x: D, y: [0, 1] }, { alfa: al, ticks: { x: [0, 5, 10], y: [0, 1] } }), trazar(A, D, { color: AZUL, alfa: al }), trazar(B, D, { color: ROSA, alfa: al })];
      if (g1 > 0) N.push(relleno(In, D, { color: ORO, alfa: 0.4 * g1 }), trazar(In, D, { color: ORO, alfa: g1 }), punto([5, vt], { color: ORO, radio: 7, alfa: g1 }), rotulo([10, 1], R`\text{${T[i]}}:\ ${coma(vt, 3)}\ \text{en el cruce}`, { clave: 't', ancla: 'r', dy: -14, tam: 20, color: ORO, alfa: g1 }));
      const G = [marco({ x: D, y: [0, 1] }, { alfa: g2, ticks: { x: [0, 5, 10], y: [0, 1] } })];
      if (g2 > 0) G.push(relleno(Un, D, { color: ORO, alfa: 0.3 * g2 }), trazar(A, D, { color: AZUL, ancho: 1.2, alfa: 0.7 * g2 }), trazar(B, D, { color: ROSA, ancho: 1.2, alfa: 0.7 * g2 }), trazar(Un, D, { color: ORO, alfa: g2 }), rotulo([10, 1], R`\text{${S[i]}}:\ ${coma(vs, 3)}`, { clave: 's', ancla: 'r', dy: -14, tam: 20, color: ORO, alfa: g2 }));
      return { principal: N, paneles: [{ ejes: { x: D, y: [0, 1], caja: { x: 610, y: 60, w: 430, h: 390 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Recorre las seis normas, y compara lo que pasa en el cruce.</li><li>Fíjate en la forma que toma la intersección con <code>DPROD</code>.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Las operaciones son los operadores de Python: <code>&amp;</code>, <code>|</code> y <code>~</code>. Cada conjunto guarda sus normas: por defecto, <code>MIN</code>, <code>MAX</code> y <code>ZADEH</code>. Si necesitas otra, se la pasas: <code>a.intersect(b, tnorm)</code>. Y por nombre, con <code>get_norm(\'PROD\')</code>.' },
    { tipo: 'codigo', etiqueta: 'En Python', codigo: "from fsets.polygon import Polygon\nfrom norms.norms import get_norm\n\na = Polygon((0, 0), (4, 1), (8, 0))\nb = Polygon((2, 0), (6, 1), (10, 0))\nu = a | b\nprint(u)\nprint(u.COG())\nprint(a.intersect(b, get_norm('PROD'))(5))", salida: SALIDAS["from fsets.polygon import Polygon\nfrom norms.norms import get_norm\n\na = Polygon((0, 0), (4, 1), (8, 0))\nb = Polygon((2, 0), (6, 1), (10, 0))\nu = a | b\nprint(u)\nprint(u.COG())\nprint(a.intersect(b, get_norm('PROD'))(5))"], cierre: 'Fíjate en <code>(5.0, 0.75)</code>: es el cruce, añadido por <code>merge_points</code>. Sin él, la unión saldría falsa.' },
    { tipo: 'ejemplo', texto: 'Las normas, en $(0{,}5;\\ 0{,}7)$, con los valores que da fuzzython:', tabla: [['Norma T', 'Valor', 'Norma S', 'Valor'], ['MIN', '0,5', 'MAX', '0,7'], ['PROD', '0,35', 'ASUM', '0,85'], ['BDIF', '0,2', 'BSUM', '1'], ['DPROD', '0', 'DSUM', '1'], ['EPROD', '0,304', 'ESUM', '0,889'], ['FAND', '0,55', 'FOR', '0,65']], cierre: 'Mira <code>FAND</code>: da 0,55, por encima del mínimo. Una [[norma T]] nunca puede hacer eso. No lo es.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\text{FAND}(x, y) = (1 - p) \min(x, y) + p \frac{x + y}{2}`, dice: 'Un «y compensado», con $p = 0{,}5$: mezcla el mínimo con la media.' },
      { tex: R`\text{SUGENO}(x) = \frac{1 - x}{1 + \lambda x}`, dice: 'Complemento con parámetro. Por nombre, $\\lambda = 0$: igual que ZADEH.' },
      { tex: R`\text{YAGER}(x) = (1 - x^w)^{\frac{1}{w}}`, dice: 'Otro complemento. Por nombre, $w = 1$: también igual que ZADEH.' },
    ], todo: R`\text{NSUM}(x, y) = \frac{x + y}{\max(1, x + y)} = \min(1, x + y) = \text{BSUM}(x, y)`, lee: 'Otra sorpresa: con dos argumentos, <code>NSUM</code> y <code>BSUM</code> son la misma función.' },
    { tipo: 'formal', titulo: 'FAND no es una norma T', tex: R`Una [[norma T]] debe cumplir $T(x, 1) = x$. Pero $\text{FAND}(x, 1) = \frac{1}{2} x + \frac{x + 1}{4} = \frac{3 x + 1}{4}$, que solo vale $x$ si $x = 1$.`, lee: 'Es un operador útil, y aparece en la literatura: lo que no es, es una [[norma T]]. Comprobado: <code>FAND(0.5, 1)</code> da 0,625. Y <code>FOR</code> tampoco es una [[norma S]].' },
    { tipo: 'demo', titulo: 'Dónde se cruzan dos rectas', plan: 'Es lo que hace <code>merge_points</code> en cada tramo.', tex: R`Las rectas $y = m_1 x + n_1$ e $y = m_2 x + n_2$, con $m_1 \ne m_2$, se cruzan en $x = \frac{n_2 - n_1}{m_1 - m_2}$.`, pasos: [
      { texto: R`En el cruce, $m_1 x + n_1 = m_2 x + n_2$.`, porque: 'Mismo $x$, misma altura.' },
      { texto: R`Agrupando: $(m_1 - m_2)\, x = n_2 - n_1$.`, porque: 'Se pasan términos de lado.' },
      { texto: R`Se divide por $m_1 - m_2 \ne 0$. Si $x$ cae dentro del tramo, se añade como vértice.`, porque: 'Con ese vértice, $\\min$ y $\\max$ siguen siendo lineales a tramos, y el resultado es exacto.' },
    ] },
    { tipo: 'nota', titulo: 'Un detalle del polígono', texto: 'Dos fallos que conviene conocer: <code>Polygon.complement(mi_funcion)</code> ignora el argumento y usa la suya; y unir dos polígonos separados, con bordes que no llegan a 0, inventa área en el hueco, porque une sus puntos con una recta.' },
  ],
  tecnicas: [{ titulo: 'Comprueba los axiomas', texto: 'Antes de llamar [[norma T]] a una función, evalúa $T(x, 1)$. Una línea basta para descubrir que no lo es.' }],
  retos: [
    { id: 'norma-baja', tipo: 'manipular', enunciado: R`Busca la [[norma T]] que da exactamente $0{,}5$ en el cruce.`, precision: (e) => (Math.abs(NORMAS_FZ[T[Math.round(e.n)]](0.75, 0.75) - 0.5) < 1e-9 ? 1 : 0), prueba: { n: 2 }, pendiente: (e) => `${T[Math.round(e.n)]} da ${NORMAS_FZ[T[Math.round(e.n)]](0.75, 0.75).toFixed(3).replace('.', ',')}.`, pistas: [R`$\max(0;\ 0{,}75 + 0{,}75 - 1)$.`], explicacion: 'Es <code>BDIF</code>: Łukasiewicz.' },
    { id: 'cruce-calc', tipo: 'calcular', enunciado: R`Con $y = x$ e $y = 2 - x$, ¿en qué $x$ se cruzan?`, respuesta: 1, tol: 0.001, pistas: [R`$x = 2 - x$.`], explicacion: R`$x = 1$.` },
    { id: 'operar-elegir', tipo: 'elegir', enunciado: '¿Qué devuelve <code>get_norm(\'NOEXISTE\')</code>?', opciones: ['Lanza un error', 'Imprime un aviso y devuelve None', 'Devuelve MIN', 'Se cierra el programa'], correcta: 1, explicacion: 'Por eso una errata puede pasar inadvertida: <code>And</code> recurre a <code>MIN</code> en silencio.' },
    { id: 'demuestra-comp', tipo: 'demostrar', enunciado: R`Demuestra que, con $\lambda = 0$, el complemento de Sugeno es el de Zadeh.`, pistas: ['Sustituye.'], solucion: [{ texto: R`$\frac{1 - x}{1 + 0 \cdot x} = \frac{1 - x}{1} = 1 - x$.`, porque: 'Se sustituye $\\lambda = 0$.' }, { texto: R`Por tanto, <code>get_norm('SUGENO')</code>, que usa $\lambda = 0$, equivale a <code>ZADEH</code>.`, porque: 'Para otro $\\lambda$, hay que escribir tu propia función.' }] },
  ],
  referencias: ['<em>fuzzython</em>: norms/norms.py y fsets/polygon.py.', 'E. P. Klement, R. Mesiar, E. Pap, <em>Triangular Norms</em>, Kluwer (2000).'],
};
