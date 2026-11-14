import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { EJEMPLO, sugenoEjemplo } from '../../nucleo/fuzzython.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { barra, tramo } from '../parte9/comun.js';
import { PREP_TEMP, codigo, coma } from '../parte14/comun.js';

const R = String.raw;
const D = [0, 40], Y = [0, 28], T = EJEMPLO.temp, LIN = [(t) => t * 0.1, (t) => t * 0.3 + 1, (t) => t * 0.6 + 2], COL = [AZUL, ORO, ROSA], W = (t) => [T.cold.val(t), T.normal.val(t), T.hot.val(t)];
export default {
  id: '16-2-sugeno',
  titulo: 'Sugeno: una recta por regla',
  puente: 'Sugeno usa una fórmula por regla. Tsukamoto hace otra cosa: usa la propia curva, leída al revés.',
  pregunta: 'En la región 6 viste a Sugeno cambiar la forma por una fórmula. En fuzzython la regla dice <code>then z = temp*0.3 + 1</code>, y eso se ejecuta tal cual. Sin integrar nada. ¿Qué dibuja el sistema entero?',
  escena: {
    id: 'sugeno', formato: 'plano', W: 1100, H: 520,
    ejes: { x: D, y: Y, caja: { x: 70, y: 50, w: 640, h: 390 } },
    entradas: [{ id: 't', tipo: 'deslizador', etiqueta: 'temperatura', min: 0, max: 40, paso: 0.5, valor: 33 }],
    pasos: [
      { dur: 2800, texto: 'Cada regla tiene su propia recta: lo que respondería, si fuese la única que manda. <b style="color:#58c4dd;font-weight:400">Frío</b>, <b style="color:#f4d345;font-weight:400">normal</b> y <b style="color:#fc6282;font-weight:400">caliente</b>.' },
      { dur: 2800, texto: 'Para la temperatura elegida, cada recta da su número. A la derecha, cuánto manda cada regla: su fuerza.' },
      { dur: 3000, texto: 'La respuesta es su media, ponderada por esas fuerzas. Solo una división: por eso Sugeno es mucho más rápido.' },
      { dur: 2800, texto: 'Recorrida entera, esa media es la curva blanca: <b>va pasando de una recta a la siguiente</b>. Pega trozos de recta, sin saltos. Por eso se le llama interpolador.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, t = e.t, w = W(t), s = sugenoEjemplo(t), N = [marco({ x: D, y: Y }, { alfa: al, ticks: { x: [0, 20, 40], y: [0, 10, 20] }, etiquetas: { x: R`\text{grados}`, y: 'z' } })];
      LIN.forEach((f, i) => N.push(curva((x) => [x, f(x)], D, { n: 2, color: COL[i], ancho: 1 + 2.2 * (g1 > 0 ? w[i] : 1), alfa: al * (g1 > 0 ? 0.35 + 0.65 * w[i] : 1) })));
      if (g1 > 0) { N.push(...tramo([t, 0], [t, 28], { color: GRIS2, ancho: 1, alfa: g1, discontinua: true })); LIN.forEach((f, i) => N.push(punto([t, f(t)], { color: COL[i], radio: 3 + 5 * w[i], alfa: g1 }))); }
      if (g3 > 0) N.push(curva((x) => [x, sugenoEjemplo(x)], D, { n: 200, color: [255, 255, 255], ancho: 3, alfa: g3, tol: 1 }));
      if (g2 > 0) N.push(punto([t, s], { color: [255, 255, 255], radio: 8, alfa: g2, halo: 1 }), rotulo([t, s], R`${coma(s, 2)}`, { clave: 's', dx: -32, dy: -16, tam: 24, color: [255, 255, 255], alfa: g2 }));
      const B = [marco({ x: [0, 3], y: [0, 1] }, { alfa: g1, ticks: { x: [], y: [0, 1] } })]; w.forEach((v, i) => B.push(barra(i + 0.2, i + 0.8, v, { color: COL[i], alfa: 0.8 * g1 }), rotulo([i + 0.5, v], R`${coma(v)}`, { clave: 'w' + i, dy: -14, tam: 18, color: COL[i], alfa: g1 })));
      return { principal: N, paneles: [{ ejes: { x: [0, 3], y: [0, 1], caja: { x: 800, y: 110, w: 250, h: 320 } }, prims: B }] };
    },
  },
  manipulacion: '<ul><li>Mueve la temperatura hasta una zona de cruce: el punto blanco queda entre dos rectas.</li><li>En una meseta, cae justo sobre una de ellas.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'El antecedente sigue siendo difuso. Lo que cambia es el consecuente: un número calculado con una fórmula de las entradas. El sistema decide, punto a punto, cuánto caso le hace a cada fórmula. Es un programa con varios modos que se mezclan suavemente, en lugar de cambiar de golpe.' },
    codigo('En Python', 'La <code>z</code> es un adorno: no se usa. Y la salida va por bloque, no por variable.', "from systems.sugeno import SugenoSystem\n\nb = RuleBlock('b')\nb.add_rules('if temp is cold then z = temp*0.1',\n            'if temp is normal then z = temp*0.3 + 1',\n            'if temp is hot then z = temp*0.6 + 2', scope=locals())\nprint(SugenoSystem('s', b).compute({'temp': 33}))", undefined, { prefacio: PREP_TEMP }),
    codigo('Dos trampas', 'Ambas vienen de cómo calcula. Solo ve las variables de <em>su</em> antecedente, y busca «is» como texto:', "def prueba(regla, **entradas):\n    b = RuleBlock('t')\n    try:\n        b.add_rules(regla, scope=globals())\n        print(SugenoSystem('s', b).compute(entradas))\n    except Exception as e:\n        print(type(e).__name__, e)\n\nprueba('if temp is hot then z = vel*2', temp=33, vel=5)\nprueba('if temp is hot then z = dist*2', temp=33, dist=5)", 'Arreglo: menciona en el antecedente toda variable que uses, y evita nombres con «is». Y una advertencia seria: esa expresión pasa por <code>eval</code>, así que ejecuta cualquier código. Nunca cargues reglas de un desconocido.', { prefacio: "far = Adjective('far', Polygon((0, 0), (10, 1)))\ndist = Variable('dist', 'm', far)\nfast = Adjective('fast', Polygon((0, 0), (10, 1)))\nvel = Variable('vel', 'm/s', fast)" }),
    { tipo: 'ejemplo', texto: 'A 33 grados:', tabla: [['Regla', 'Fuerza', 'Fórmula', 'Vale'], ['cold', '0', '$0{,}1 \\cdot 33$', '3,3'], ['normal', '0,4', '$0{,}3 \\cdot 33 + 1$', '10,9'], ['hot', '0,6', '$0{,}6 \\cdot 33 + 2$', '21,8']], cierre: '$\\frac{0{,}4 \\cdot 10{,}9 + 0{,}6 \\cdot 21{,}8}{0{,}4 + 0{,}6} = 17{,}44$. Es lo que imprime el programa.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`w_r`, dice: 'La fuerza de la regla: antecedente por peso.' },
      { tex: R`z_r(x)`, dice: 'Su fórmula, evaluada en la entrada.' },
    ], todo: R`y = \frac{\sum_r w_r\, z_r(x)}{\sum_r w_r}`, lee: '«La media de las respuestas, ponderada por cuánto se cumple cada regla». Si todas las $w_r$ son 0, fuzzython devuelve 0.' },
    { tipo: 'formal', titulo: 'Combinación convexa', tex: R`Con $\lambda_r = \frac{w_r}{\sum_s w_s}$ se tiene $\lambda_r \ge 0$, $\sum_r \lambda_r = 1$, e $y = \sum_r \lambda_r z_r$.`, lee: 'Los pesos normalizados suman 1. Por eso la salida queda siempre entre la menor y la mayor de las rectas.' },
    { tipo: 'demo', titulo: 'La salida no se sale de las rectas', plan: 'Se acota cada término de la suma.', tex: R`$\min_r z_r \le y \le \max_r z_r$, tomando solo las reglas con $w_r > 0$.`, pasos: [
      { texto: R`Sea $M = \max_r z_r$. Para cada regla, $\lambda_r z_r \le \lambda_r M$.`, porque: 'Multiplicar por $\\lambda_r \\ge 0$ conserva la desigualdad.' },
      { texto: R`Sumando: $y \le M \sum_r \lambda_r = M$.`, porque: 'Los $\\lambda_r$ suman 1. Lo mismo vale para el mínimo.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Reescribe un cociente como una mezcla', texto: 'Si ves $\\frac{\\sum w_i z_i}{\\sum w_i}$, escribe $\\lambda_i = \\frac{w_i}{\\sum w}$. De golpe es una media, y todo lo que sabes de las medias te sirve.' }],
  retos: [
    { id: 'sug-10', tipo: 'manipular', enunciado: R`Busca una temperatura para la que la salida esté entre $9{,}8$ y $10{,}2$.`, precision: (e) => (Math.abs(sugenoEjemplo(e.t) - 10) <= 0.2 ? 1 : 0), prueba: { t: 30 }, pendiente: (e) => `La salida es ${sugenoEjemplo(e.t).toFixed(2).replace('.', ',')}.`, pistas: ['Es el final de la meseta de «normal».'], explicacion: 'A 30 grados, solo manda «normal», y su recta da exactamente 10.' },
    { id: 'sug-calc', tipo: 'calcular', enunciado: R`A 17,5 grados, «cold» y «normal» valen $0{,}5$. ¿Cuál es la salida?`, respuesta: 4, tol: 0.001, pistas: [R`Rectas: $1{,}75$ y $6{,}25$.`], explicacion: R`$\frac{1{,}75 + 6{,}25}{2} = 4$.` },
    { id: 'sug-elegir', tipo: 'elegir', enunciado: 'La regla <code>if temp is hot then z = vel*2</code> falla. ¿Por qué?', opciones: ['Falta un peso', 'vel no está en el antecedente de esa regla', 'No se puede multiplicar', 'z no existe'], correcta: 1, explicacion: 'Solo ve las variables de su antecedente.' },
    { id: 'demuestra-meseta', tipo: 'demostrar', enunciado: R`Demuestra que si solo una regla tiene $w > 0$, la salida es su fórmula, sea cual sea $w$.`, pistas: ['Sustituye.'], solucion: [{ texto: R`$y = \frac{w\, z}{w}$.`, porque: 'Los demás términos son 0.' }, { texto: R`Con $w > 0$, se cancela: $y = z$.`, porque: 'Por eso el peso no importa si solo actúa una regla.' }] },
  ],
  referencias: ['T. Takagi, M. Sugeno, <em>IEEE Trans. SMC</em> 15 (1985).', '<em>fuzzython</em>: systems/sugeno.py y rules/srule.py.'],
};
