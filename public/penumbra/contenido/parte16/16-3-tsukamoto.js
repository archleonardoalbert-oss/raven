import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { CORTO_T, LARGO_T, tsukamotoEjemplo, tsukamotoReglas } from '../../nucleo/fuzzython.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { tramo } from '../parte9/comun.js';
import { PREP_TEMP, codigo, coma, trazar } from '../parte14/comun.js';

const R = String.raw;
const D = [0, 40], COL = [AZUL, ORO, ROSA], P = [CORTO_T, LARGO_T, LARGO_T];
export default {
  id: '16-3-tsukamoto',
  titulo: 'Tsukamoto: la curva al revés',
  puente: 'Has visto los tres motores. Ahora, cómo guardar un sistema en un archivo, y cómo añadirle piezas propias.',
  pregunta: 'En la región 6 viste que Tsukamoto necesita curvas que solo suban o solo bajen. fuzzython no calcula la inversa: la busca partiendo el intervalo por la mitad, y no comprueba que la curva sea monótona. ¿Qué pasa si no lo es?',
  escena: {
    id: 'tsuka', formato: 'plano', W: 1100, H: 520,
    ejes: { x: D, y: [0, 1], caja: { x: 70, y: 60, w: 600, h: 380 } },
    entradas: [{ id: 't', tipo: 'deslizador', etiqueta: 'temperatura', min: 0, max: 40, paso: 0.5, valor: 33 }],
    pasos: [
      { dur: 2800, texto: 'Dos consecuentes, ambos monótonos: <b style="color:#58c4dd;font-weight:400">corto</b> baja, <b style="color:#f4d345;font-weight:400">largo</b> sube.' },
      { dur: 3000, texto: 'Cada regla da una fuerza: es una altura. Se traza esa línea horizontal y se busca dónde corta su curva. Eso da un número $x$.' },
      { dur: 3000, texto: 'Como la curva es monótona, el corte es único. Por eso Tsukamoto la exige. fuzzython encuentra ese punto partiendo el intervalo por la mitad.' },
      { dur: 2800, texto: 'La respuesta es la media de esos puntos, ponderada por sus fuerzas. A la derecha, todas las respuestas. Mira qué plana sale: 20 minutos en casi todo.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, r = tsukamotoReglas(e.t), res = tsukamotoEjemplo(e.t), N = [marco({ x: D, y: [0, 1] }, { alfa: al, ticks: { x: [0, 20, 40], y: [0, 1] }, etiquetas: { x: R`\text{minutos}` } }), trazar(CORTO_T, D, { color: AZUL, alfa: al }), trazar(LARGO_T, D, { color: ORO, alfa: al })];
      if (g1 > 0) r.forEach(([w, x], i) => { if (w <= 0) return; N.push(...tramo([0, w], [x, w], { color: COL[i], ancho: 1.4, alfa: g1, discontinua: true }), ...tramo([x, w], [x, 0], { color: COL[i], ancho: 1.4, alfa: g1, discontinua: true }), punto([x, w], { color: COL[i], radio: 7, alfa: g1 }), rotulo([x, 0], R`${coma(x, 1)}`, { clave: 'x' + i, dy: 22, tam: 18, color: COL[i], alfa: g1 })); });
      if (g3 > 0 && res > 0) N.push(...tramo([res, 0], [res, 1], { color: [255, 255, 255], ancho: 2.4, alfa: g3 }));
      N.push(rotulo([40, 1], R`${coma(res, 2)}\ \text{minutos}`, { clave: 'r', ancla: 'r', dy: -14, tam: 22, color: ORO, alfa: g3 }));
      const G = [marco({ x: D, y: D }, { alfa: g3, ticks: { x: [0, 20, 40], y: [0, 20, 40] }, etiquetas: { x: R`\text{grados}`, y: R`\text{minutos}` } })];
      if (g3 > 0) G.push(curva((x) => [x, tsukamotoEjemplo(x)], D, { n: 240, color: ORO, ancho: 2.6, alfa: g3, tol: 1 }), punto([e.t, res], { color: ORO, radio: 6, alfa: g3 }));
      return { principal: N, paneles: [{ ejes: { x: D, y: D, caja: { x: 750, y: 110, w: 300, h: 300 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Mueve la temperatura y sigue las líneas de cada regla.</li><li>Busca el salto: entre 15 y 20 grados la respuesta cambia de golpe.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Sugeno usa una fórmula; Tsukamoto, la inversa de una curva. Cada regla responde: «si estoy activa con fuerza $w$, la salida es el $x$ en que mi curva vale $w$». Es una forma elegante de obtener un número de cada regla, sin perder la forma de la palabra. Pero la inversa solo existe si la curva es monótona.' },
    codigo('En Python', 'El prefijo <code>t:</code> es obligatorio. Sin él se crea otro tipo de regla, y el sistema falla.', "from systems.tsukamoto import TsukamotoSystem\n\nshort = Adjective('short', Polygon((0, 1), (15, 1), (25, 0)))\nlarge = Adjective('large', Polygon((15, 0), (25, 1), (40, 1)))\nminutes = Variable('minutes', 'min', short, large, defuzzification='COG', default=0)\nb = RuleBlock('b')\nb.add_rule('t:if temp is cold then minutes is short', locals())\nb.add_rule('t:if temp is normal then minutes is large with 0.5', locals())\nb.add_rule('t:if temp is hot then minutes is large', locals())\nprint(TsukamotoSystem('t', b).compute({'temp': 33}))", 'Da 20,0000000… y un poco más: la bisección acaba en una tolerancia. Redondea antes de comparar.', { prefacio: PREP_TEMP }),
    codigo('Con una curva que no es monótona', 'Un triángulo sube y baja: hay dos cortes posibles para una misma altura.', "tri = Adjective('tri', Polygon((0, 0), (20, 1), (40, 0)))\nsalida = Variable('salida', 'min', tri, defuzzification='COG', default=0)\nb = RuleBlock('b2')\nb.add_rule('t:if temp is normal then salida is tri', locals())\nfor t in (17, 18, 19):\n    print(t, TsukamotoSystem('t2', b).compute({'temp': t}))", 'Sale 0, en las tres. Como la curva vale lo mismo en sus dos extremos, la búsqueda no encuentra el cambio de signo, y se rinde sin decir nada. Y ese 0 parece una respuesta. Comprueba la monotonía tú.'),
    { tipo: 'ejemplo', texto: 'A 33 grados, regla a regla:', tabla: [['Regla', 'Fuerza', '$x$ con $\\mu(x)$ = fuerza'], ['normal → large, con 0,5', '$0{,}4 \\cdot 0{,}5 = 0{,}2$', '17'], ['hot → large', '0,6', '21']], cierre: '$\\frac{0{,}2 \\cdot 17 + 0{,}6 \\cdot 21}{0{,}8} = 20$. El peso actúa dos veces: mueve el punto, y también cuánto pesa.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`w_r`, dice: 'La fuerza de la regla.' },
      { tex: R`x_r = \mu_{B_r}^{-1}(w_r)`, dice: 'El punto en que la curva vale esa fuerza.' },
    ], todo: R`y = \frac{\sum_r w_r\, x_r}{\sum_r w_r}`, lee: '«La media de los puntos, ponderada por las fuerzas». La misma forma que en Sugeno, con otros $z_r$.' },
    { tipo: 'formal', titulo: 'Bisección', tex: R`Para hallar $x$ con $\mu(x) = w$ en $[a, b]$: se toma $c = \frac{a + b}{2}$; si $\mu(c) - w$ tiene el mismo signo que $\mu(a) - w$, se sigue en $[c, b]$; si no, en $[a, c]$. Cada paso divide el intervalo por 2.`, lee: 'Solo mira los signos: por eso, con una curva no monótona, encuentra un corte cualquiera, o no encuentra nada y devuelve 0, sin darse cuenta.' },
    { tipo: 'demo', titulo: 'Por qué la respuesta se queda en 20', plan: 'Con estas curvas, la inversa en el tramo de «large» resulta lineal.', tex: R`Entre $30$ y $33$ grados, la salida vale $20$.`, pasos: [
      { texto: R`En ese tramo, $x_{\text{normal}} = 15 + 10\, \frac{\mu_n}{2}$ y $x_{\text{hot}} = 15 + 10\, \mu_h$, con $\mu_n + \mu_h = 1$.`, porque: 'La curva de «large» sube de 15 a 25: su inversa es $15 + 10\\,w$.' },
      { texto: R`El numerador es $\frac{\mu_n}{2}(15 + 5 \mu_n) + \mu_h (15 + 10 \mu_h)$ y el denominador, $\frac{\mu_n}{2} + \mu_h$.`, porque: 'Se aplica la fórmula con $w_n = \\frac{\\mu_n}{2}$ y $w_h = \\mu_h$.' },
      { texto: R`Con $\mu_n = 0{,}4$, $\mu_h = 0{,}6$: $\frac{0{,}2 \cdot 17 + 0{,}6 \cdot 21}{0{,}8} = 20$. Y con $\mu_n = 1$: $\frac{0{,}5 \cdot 20}{0{,}5} = 20$.`, porque: 'Coinciden: el diseño de estas reglas produce esa meseta. Ejecutándolo sale 20 entre 20 y 33 grados.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Si un método supone algo, compruébalo', texto: 'La bisección supone monotonía, y no lo comprueba. Antes de usar <code>t:</code>, comprueba tú que los puntos del polígono solo suben o solo bajan. Es una línea de código.' }],
  retos: [
    { id: 'tsk-salto', tipo: 'manipular', enunciado: R`Busca una temperatura donde la salida esté entre $5$ y $18$ minutos.`, precision: (e) => { const r = tsukamotoEjemplo(e.t); return r >= 5 && r <= 18 ? 1 : 0; }, prueba: { t: 16 }, pendiente: (e) => `Salen ${tsukamotoEjemplo(e.t).toFixed(2).replace('.', ',')} minutos.`, pistas: ['Está justo donde «frío» empieza a bajar.'], explicacion: 'Es el salto entre las dos zonas planas: de 0 a 20 minutos en unos pocos grados.' },
    { id: 'tsk-calc', tipo: 'calcular', enunciado: R`Con la curva que sube de $15$ a $25$, ¿dónde vale $0{,}4$?`, respuesta: 19, tol: 0.001, pistas: [R`$15 + 10 \cdot 0{,}4$.`], explicacion: R`$19$.` },
    { id: 'tsk-elegir', tipo: 'elegir', enunciado: '¿Qué hace fuzzython con un consecuente no monótono en Tsukamoto?', opciones: ['Lanza un error', 'Avisa y sigue', 'Da un número, a veces 0, sin avisar', 'Usa el máximo'], correcta: 2, explicacion: 'Por eso es peligroso: el resultado parece bueno. Con un triángulo simétrico da 0.' },
    { id: 'demuestra-unico', tipo: 'demostrar', enunciado: R`Demuestra que si $\mu$ es estrictamente creciente y continua, y $\mu(a) \le w \le \mu(b)$, hay un único $x$ con $\mu(x) = w$.`, pistas: ['Existe por el teorema del valor intermedio; ¿y dos?'], solucion: [{ texto: R`Existe un $x$, por el teorema del valor intermedio.`, porque: '$\\mu$ es continua, y $w$ está entre los dos extremos.' }, { texto: R`Si $x_1 < x_2$ valieran ambos $w$, sería $\mu(x_1) < \mu(x_2)$, contradicción.`, porque: 'Estrictamente creciente no permite repetir valor.' }] },
  ],
  referencias: ['Y. Tsukamoto, «An approach to fuzzy reasoning method», en <em>Advances in Fuzzy Set Theory and Applications</em> (1979).', '<em>fuzzython</em>: systems/tsukamoto.py y rules/trule.py.'],
};
