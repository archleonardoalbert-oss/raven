import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { EJEMPLO } from '../../nucleo/fuzzython.js';
import { marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { barra, tramo } from '../parte9/comun.js';
import { codigo, coma, trazar } from '../parte14/comun.js';

const R = String.raw;
const D = [0, 40], T = EJEMPLO.temp, C = { cold: AZUL, normal: ORO, hot: ROSA }, E = { cold: 'frío', normal: 'normal', hot: 'caliente' };
export default {
  id: '15-1-palabras',
  titulo: 'Adjetivos y variables',
  puente: 'Ya hablas en palabras. Ahora, a escribir frases con ellas: las reglas.',
  pregunta: 'En la región 5 viste que una variable lingüística toma palabras en vez de números. fuzzython lo escribe tal cual: un <code>Adjective</code> es una palabra, una <code>Variable</code> es lo que se mide. ¿Y qué ocurre cuando le das un número a una variable?',
  escena: {
    id: 'palabras', formato: 'plano', W: 1100, H: 500,
    ejes: { x: D, y: [0, 1], caja: { x: 70, y: 60, w: 620, h: 370 } },
    entradas: [{ id: 't', tipo: 'deslizador', etiqueta: 'la temperatura', min: 0, max: 40, paso: 0.5, valor: 18 }],
    pasos: [
      { dur: 2600, texto: 'Una variable, <code>temp</code>, y sus tres palabras. Cada <code>Adjective</code> es un nombre y un conjunto.' },
      { dur: 2800, texto: 'Un número activa las tres palabras a la vez: es la fila de la derecha. A 18 grados, el agua es «fría» en parte y «normal» en parte.' },
      { dur: 2800, texto: 'Ojo: las tres palabras <b style="color:#f4d345;font-weight:400">no tienen por qué sumar 1</b>. Las dibujamos así por costumbre, pero nadie lo exige ni fuzzython lo comprueba.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, t = e.t, N = [marco({ x: D, y: [0, 1] }, { alfa: al, ticks: { x: [0, 20, 40], y: [0, 1] }, etiquetas: { x: R`\text{grados}` } })];
      for (const [k, P] of Object.entries(T)) N.push(trazar(P, D, { color: C[k], alfa: al }), rotulo(k === 'cold' ? [5, 1] : k === 'normal' ? [25, 1] : [38, 1], R`\text{${E[k]}}`, { clave: k, dy: -14, tam: 20, color: C[k], alfa: al }));
      if (g1 > 0) { N.push(...tramo([t, 0], [t, 1], { color: GRIS2, ancho: 1.2, alfa: g1, discontinua: true })); for (const [k, P] of Object.entries(T)) N.push(punto([t, P.val(t)], { color: C[k], radio: 6, alfa: g1 })); }
      const B = [marco({ x: [0, 3], y: [0, 1] }, { alfa: g1, ticks: { x: [], y: [0, 1] } })];
      Object.entries(T).forEach(([k, P], i) => { const v = P.val(t); B.push(barra(i + 0.2, i + 0.8, v, { color: C[k], alfa: 0.8 * g1 }), rotulo([i + 0.5, v], R`${coma(v)}`, { clave: 'v' + k, dy: -14, tam: 19, color: C[k], alfa: g1 })); });
      const s = T.cold.val(t) + T.normal.val(t) + T.hot.val(t);
      B.push(rotulo([3, 1], R`\text{suma} = ${coma(s)}`, { clave: 's', ancla: 'r', dy: -34, tam: 19, color: ORO, alfa: g2 }));
      return { principal: N, paneles: [{ ejes: { x: [0, 3], y: [0, 1], caja: { x: 790, y: 90, w: 260, h: 340 } }, prims: B }] };
    },
  },
  manipulacion: '<ul><li>Mueve la temperatura y mira cómo cambian las tres barras.</li><li>Busca una temperatura donde dos palabras se cumplan por igual.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una palabra necesita dos cosas: su nombre y su conjunto. Eso es un <code>Adjective</code>. Una magnitud reúne sus palabras: eso es una <code>Variable</code>. Si la variable es de salida, además le dices cómo convertir el resultado en un número y qué responder si nada se activa.' },
    codigo('En Python', 'Las palabras de la escena. <code>membership</code> da el grado de un valor:', "from adjective import Adjective\nfrom fsets.polygon import Polygon\nfrom variable import Variable\n\ncold = Adjective('cold', Polygon((0, 1), (15, 1), (20, 0)))\nnormal = Adjective('normal', Polygon((15, 0), (20, 1), (30, 1), (35, 0)))\nhot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))\ntemp = Variable('temp', 'C', cold, normal, hot)\n\nprint(cold.membership(18))\nprint(normal.membership(18))\nprint(hot.membership(18))", 'Fuera de sus puntos, un polígono sigue constante: <code>cold</code> a −5 grados vale 1, sin haber dicho nada.'),
    { tipo: 'ejemplo', texto: 'Los grados que da fuzzython a cada temperatura:', tabla: [['Grados', 'cold', 'normal', 'hot', 'Suma'], ['10', '1', '0', '0', '1'], ['18', '0,4', '0,6', '0', '1'], ['25', '0', '1', '0', '1'], ['32', '0', '0,6', '0,4', '1']], cierre: 'Aquí la suma da 1, porque estas curvas se diseñaron así. Con otras, no.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\text{Adjective}(n, A)`, dice: 'La palabra $n$ y su conjunto $A$.' },
      { tex: R`\text{Variable}(n, u, a_1, \dots, a_k)`, dice: 'Nombre, unidad y palabras.' },
      { tex: R`\text{defuzzification}`, dice: 'Solo en la salida: <code>COG</code>, <code>COA</code>, <code>MM</code>…' },
      { tex: R`\text{default}`, dice: 'Solo en la salida: lo que responde si no hay nada que calcular.' },
    ], todo: R`\mu_{\text{normal}}(18) = 0 + \frac{(18 - 15)(1 - 0)}{20 - 15} = 0{,}6`, lee: '«El grado de “normal” en 18 es 0,6»: se interpola en el tramo que va de $(15, 0)$ a $(20, 1)$.' },
    { tipo: 'formal', titulo: 'Partición', tex: R`Las palabras $A_1, \dots, A_k$ forman una partición difusa si $\sum_i \mu_{A_i}(x) = 1$ para todo $x$.`, lee: 'Es una buena costumbre: ningún valor queda sin palabra. Pero fuzzython no la exige. Es tuya la responsabilidad de no dejar huecos.' },
    { tipo: 'demo', titulo: 'Estas tres palabras suman 1', plan: 'Se comprueba tramo a tramo.', tex: R`Para todo $x \in [0, 40]$, $\mu_{\text{cold}}(x) + \mu_{\text{normal}}(x) + \mu_{\text{hot}}(x) = 1$.`, pasos: [
      { texto: R`En $[15, 20]$: $\frac{20 - x}{5} + \frac{x - 15}{5} = 1$, y «hot» vale 0.`, porque: 'Una baja lo que la otra sube, con la misma pendiente.' },
      { texto: R`En $[30, 35]$: $\frac{35 - x}{5} + \frac{x - 30}{5} = 1$, y «cold» vale 0.`, porque: 'Lo mismo en el otro cruce.' },
      { texto: R`En el resto, una vale 1 y las otras, 0.`, porque: 'Son las mesetas. Se cubren todos los casos, luego la suma es 1 siempre.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Un truco para el diseño', texto: 'Haz que cada curva acabe donde empieza la meseta de la siguiente. Así obtienes una partición sin hacer cuentas, y nunca te queda un valor sin palabra.' }],
  retos: [
    { id: 'palabras-iguales', tipo: 'manipular', enunciado: 'Busca la temperatura, por encima de 25 grados, donde «normal» y «caliente» se cumplen por igual.', precision: (e) => (Math.abs(T.normal.val(e.t) - T.hot.val(e.t)) < 0.01 && e.t > 25 ? 1 : 0), prueba: { t: 32.5 }, pendiente: (e) => `«normal» vale ${T.normal.val(e.t).toFixed(2).replace('.', ',')} y «caliente», ${T.hot.val(e.t).toFixed(2).replace('.', ',')}.`, pistas: ['Se cruzan en mitad de la bajada.'], explicacion: 'A 32,5 grados, las dos valen 0,5.' },
    { id: 'grado-calc', tipo: 'calcular', enunciado: R`¿Cuánto da \verb|normal.membership(17)|?`.replace('\\verb|normal.membership(17)|', '<code>normal.membership(17)</code>'), respuesta: 0.4, tol: 0.001, pistas: [R`$\frac{17 - 15}{5}$.`], explicacion: R`$0{,}4$.` },
    { id: 'default-elegir', tipo: 'elegir', enunciado: '¿Qué le pasa a una salida que no tiene <code>default</code>, si nada se activa?', opciones: ['Lanza un error', 'Devuelve None', 'Devuelve 0', 'Devuelve el centro del intervalo'], correcta: 1, explicacion: 'Y el mismo <code>None</code> sale si la cuenta falla. Lo mejor: <code>default=float(\'nan\')</code>, para distinguirlo.' },
    { id: 'demuestra-part', tipo: 'demostrar', enunciado: R`Demuestra que si $\mu_A$ baja de 1 a 0 y $\mu_B$ sube de 0 a 1 en el mismo intervalo $[a, b]$, rectas ambas, suman 1 allí.`, pistas: ['Escríbelas.'], solucion: [{ texto: R`$\mu_A(x) = \frac{b - x}{b - a}$ y $\mu_B(x) = \frac{x - a}{b - a}$.`, porque: 'Son las rectas que pasan por esos puntos.' }, { texto: R`Suman $\frac{b - x + x - a}{b - a} = 1$.`, porque: 'Se cancela $x$.' }] },
  ],
  referencias: ['L. A. Zadeh, «The concept of a linguistic variable», <em>Information Sciences</em> 8 (1975).', '<em>fuzzython</em>: adjective.py y variable.py.'],
};
