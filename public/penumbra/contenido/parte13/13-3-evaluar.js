import { AZUL, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { potenciaNoInferioridad, tamanoNoInferioridad } from '../../nucleo/ia.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { coma, tramo } from '../parte9/comun.js';

const R = String.raw;
const D_ = 0.15, Z = 1.645, CASOS = [['A', 0.012], ['B', -0.004], ['C', -0.018], ['D', -0.05]];

export default {
  id: '13-3-evaluar',
  titulo: '¿Funciona de verdad?',
  puente: 'Ya tienes todas las piezas: de un texto a un grado calibrado, a una regla que se lee, a una decisión con costes, a un experimento que la pone a prueba. Falta verlas juntas.',
  pregunta: 'Tu sistema con reglas legibles acierta un 1 % menos que el modelo opaco. ¿Es peor? ¿O es igual, y lo has medido con pocos casos? La pregunta correcta no es la que se hace casi siempre.',
  escena: {
    id: 'evaluar', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [-0.1, 0.05], y: [0, 4.4], caja: { x: 60, y: 50, w: 560, h: 420 } },
    entradas: [
      { id: 'n', tipo: 'deslizador', etiqueta: 'casos del experimento', min: 100, max: 3000, paso: 10, valor: 300 },
      { id: 'd', tipo: 'deslizador', etiqueta: 'δ: lo que se admite perder', min: 0.01, max: 0.06, paso: 0.001, valor: 0.03 },
    ],
    pasos: [
      { dur: 3200, texto: 'Cuatro experimentos posibles. Cada barra es la <b>diferencia de acierto</b> frente al modelo de comparación, con su margen de duda. A la derecha del 0, mejor; a la izquierda, peor.' },
      { dur: 3400, texto: 'Se decide <b>antes</b> cuánto se admite perder a cambio de poder leer el modelo: el margen $\\delta$, la línea <b style="color:#f05a5a;font-weight:400">roja</b>. Si toda la barra queda a su derecha, se llama <b style="color:#f4d345;font-weight:400">no inferior</b>.' },
      { dur: 3400, texto: 'Con más casos, las barras se acortan. El experimento B, que no decía nada, pasa a demostrar algo. <b>El mismo dato, con más casos, vale más</b>.' },
      { dur: 3000, texto: 'Por eso se calcula antes de empezar: la curva da la probabilidad de poder afirmarlo, si los dos son igual de buenos. Con $\\delta = 3$ puntos, hacen falta unos 1030 casos.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, n = paso <= 1 ? 300 : paso === 2 ? mix(300, 2000, ev(q(2), 0.05, 0.85)) : mix(2000, e.n, ev(q(3), 0.2, 0.7)), d = paso >= 3 ? e.d : 0.03, se = Math.sqrt(D_ / n), mg = Z * se;
      const P = [marco({ x: [-0.1, 0.05], y: [0, 4.4] }, { alfa: al, soloBase: true, ticks: { x: [-0.1, 0.05], y: [] }, etiquetas: { x: R`\text{diferencia de acierto, frente al modelo opaco}` } }), ...tramo([0, 0], [0, 4.4], { color: GRIS2, ancho: 1.2, alfa: al, discontinua: true }), rotulo([0, 4.4], '0', { clave: 'cero', dy: -14, tam: 16, color: GRIS2, alfa: al })];
      if (g1 > 0) P.push(...tramo([-d, 0], [-d, 4.4], { color: ROJO, ancho: 2.2, alfa: g1 }), rotulo([-d, 4.4], R`-\delta`, { clave: 'dl', dy: -14, tam: 19, color: ROJO, alfa: g1 }));
      CASOS.forEach(([nom, v], i) => { const y = 3.6 - i, lo = v - mg, hi = v + mg, ok = lo > -d, c = g1 > 0.5 ? (ok ? ORO : hi < -d ? ROJO : AZUL) : AZUL; P.push(...tramo([Math.max(-0.1, lo), y], [Math.min(0.05, hi), y], { color: c, ancho: 3, alfa: al, radio: 3 }), punto([v, y], { color: c, radio: 7, alfa: al }), rotulo([-0.1, y], R`\text{${nom}}`, { clave: `n${i}`, ancla: 'l', dy: -14, tam: 17, color: GRIS2, alfa: al }), rotulo([0.05, y], R`\text{${ok ? 'no inferior' : hi < -d ? 'inferior' : 'no se sabe'}}`, { clave: `ve${i}`, ancla: 'r', dy: -14, tam: 15, color: c, alfa: g1 })); });
      const G = [marco({ x: [100, 3000], y: [0, 1] }, { alfa: g3, ticks: { x: [100, 1000, 3000], y: [0, 0.8, 1] }, etiquetas: { x: R`\text{casos}`, y: R`\text{potencia}` } })];
      if (g3 > 0) { const pw = potenciaNoInferioridad(n, d, D_), nec = tamanoNoInferioridad(d, D_); G.push(curva((u) => [u, potenciaNoInferioridad(u, d, D_)], [100, 3000], { n: 90, color: ORO, ancho: 2.8, alfa: g3 }), punto([n, pw], { color: ORO, radio: 7, alfa: g3 }), rotulo([3000, 0.42], R`\text{potencia } ${coma(pw)}`, { clave: 'pw', ancla: 'r', tam: 19, alfa: g3 }), rotulo([3000, 0.28], R`\text{hacen falta } ${Math.ceil(nec)}`, { clave: 'nc', ancla: 'r', tam: 17, color: ORO, alfa: g3 })); }
      P.push(rotulo([0.05, 4.4], R`n = ${Math.round(n)}`, { clave: 'n', ancla: 'r', dy: -14, tam: 19, color: ORO, alfa: al }));
      return { principal: P, paneles: [{ ejes: { x: [100, 3000], y: [0, 1], caja: { x: 710, y: 90, w: 340, h: 320 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Sube los casos, y mira cómo «no se sabe» se convierte en una respuesta.</li><li>Haz más exigente el margen: la cantidad de casos necesaria crece muy deprisa.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un modelo legible no tiene que ganar; tiene que no perder demasiado, a cambio de que se pueda entender. Eso es otra pregunta, y se responde con otro experimento: se fija antes un margen, y se intenta demostrar que la diferencia no lo supera. Lo que no vale es no encontrar diferencia y concluir que son iguales: con pocos casos, nunca se encuentra nada.' },
    { tipo: 'ejemplo', texto: 'Un plan posible, con casos reales y etiquetados por expertos. Es una propuesta, no un resultado:', tabla: [['Elemento', 'Qué se decide'], ['Hipótesis', 'No inferior a un árbol de profundidad ≤ 5, con δ = 3 puntos'], ['Tamaño', 'n ≳ 1030 por la fórmula; unos 1500 por simulación'], ['Comparación', 'McNemar, que usa solo los casos en que discrepan'], ['Incertidumbre', 'Bootstrap: repetir la medida remuestreando los casos'], ['Ablaciones', 'Quitar cada parte y ver cuánto se pierde']], cierre: 'También se mide el acuerdo con el kappa ponderado cuadrático, que castiga más los errores grandes en una escala ordenada.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\delta`, dice: 'El margen de no inferioridad: cuánto se admite perder. Se fija antes, con criterio clínico.' },
      { tex: R`d`, dice: 'La fracción de casos en que los dos sistemas discrepan.' },
      { tex: R`z_\alpha,\ z_\beta`, dice: 'Dos números de la campana normal. $z_\\alpha = 1{,}645$ da un 5 % de falsas alarmas; $z_\\beta = 0{,}842$ da un 80 % de potencia.' },
    ], todo: R`n \gtrsim \frac{(z_\alpha + z_\beta)^2\, d}{\delta^2}`, lee: 'Con $d = 0{,}15$ y $\\delta = 0{,}03$: unos 1030 casos. Reducir $\\delta$ a la mitad multiplica por cuatro. Es una aproximación: por eso conviene simularlo.' },
    { tipo: 'formal', titulo: 'Prueba de no inferioridad', tex: R`Sea $\Delta$ la diferencia de acierto. Se contrasta $H_0: \Delta \le -\delta$ frente a $H_1: \Delta > -\delta$. Se rechaza $H_0$ si el extremo inferior del intervalo de confianza unilateral al 95 % queda por encima de $-\delta$. Potencia, con $\Delta = 0$: $\Phi\left(\frac{\delta \sqrt{n}}{\sqrt{d}} - z_\alpha\right)$.`, lee: '$\\Phi$ es la función acumulada de la campana normal. La carga de la prueba recae en demostrar que no es peor, y no al revés.' },
    { tipo: 'demo', titulo: 'De dónde sale el tamaño', plan: 'Se pide que la potencia llegue a su objetivo, y se despeja $n$.', tex: R`Si se pide potencia $\Phi(z_\beta)$, entonces $n = \frac{(z_\alpha + z_\beta)^2\, d}{\delta^2}$.`, pasos: [
      { texto: R`La potencia es $\Phi\left(\frac{\delta \sqrt{n}}{\sqrt{d}} - z_\alpha\right)$, y se pide que sea $\Phi(z_\beta)$.`, porque: 'Es la fórmula de arriba, igualada al objetivo.' },
      { texto: R`Como $\Phi$ es creciente, los argumentos son iguales: $\frac{\delta \sqrt{n}}{\sqrt{d}} - z_\alpha = z_\beta$.`, porque: 'Una función creciente nunca da dos veces lo mismo.' },
      { texto: R`Se despeja: $\sqrt{n} = \frac{(z_\alpha + z_\beta) \sqrt{d}}{\delta}$, y se eleva al cuadrado.`, porque: 'El cuadrado de $\\delta$ abajo explica que un margen pequeño salga tan caro.' },
    ] },
    { tipo: 'nota', titulo: 'Una trampa circular', texto: 'Si las etiquetas de los conceptos salen del mismo modelo que evalúas, te estás midiendo contigo mismo. Y una desigualdad ayuda a repartir la culpa: si $f$ es correcta con los conceptos verdaderos, $P(f(\\hat{c}) \\ne y) \\le P(\\exists k \\in A : \\hat{c}_k \\ne c_k)$, donde $A$ son los conceptos activos. El error del sistema no pasa del de sus conceptos activos; por eso hay que anotarlos por separado.' },
  ],
  tecnicas: [{ titulo: 'Decide el margen antes de ver los datos', texto: 'Un margen elegido después se ajusta, sin querer, a lo que salió. Y calcula el tamaño antes de empezar: un experimento pequeño no demuestra nada.' }],
  retos: [
    { id: 'potencia-80', tipo: 'manipular', enunciado: R`Con $\delta = 0{,}03$, sube los casos hasta llegar a una potencia del 80 %.`, precision: (e) => (Math.abs(e.d - 0.03) < 0.0011 && potenciaNoInferioridad(e.n, e.d, D_) >= 0.8 ? 1 : 0), prueba: { n: 1100, d: 0.03 }, pendiente: (e) => `Ahora, la potencia es ${potenciaNoInferioridad(e.n, e.d, D_).toFixed(2).replace('.', ',')}.`, pistas: ['Son unos mil casos.'], explicacion: 'Por debajo de eso, lo más probable es no poder afirmar nada, incluso si el sistema es bueno.' },
    { id: 'tam-calc', tipo: 'calcular', enunciado: R`Con $z_\alpha + z_\beta \approx 2{,}487$, $d = 0{,}15$ y $\delta = 0{,}05$, ¿cuántos casos hacen falta? Redondea al entero más cercano.`, respuesta: Math.round(tamanoNoInferioridad(0.05, 0.15)), tol: 2, pistas: [R`$\frac{2{,}487^2 \cdot 0{,}15}{0{,}05^2}$.`], explicacion: R`Unos ${Math.round(tamanoNoInferioridad(0.05, 0.15))}.` },
    { id: 'eval-elegir', tipo: 'elegir', enunciado: 'Un estudio con 40 casos no encuentra diferencia entre dos sistemas. ¿Qué se puede concluir?', opciones: ['Que son iguales', 'Casi nada: con tan pocos casos, no encontrarla es lo esperado', 'Que el nuevo es mejor', 'Que el antiguo es mejor'], correcta: 1, explicacion: 'No encontrar una diferencia no demuestra que no exista.' },
    { id: 'demuestra-circular', tipo: 'demostrar', enunciado: R`Si $f(c) = y$ siempre, demuestra que $P(f(\hat{c}) \ne y) \le P(\exists k \in A : \hat{c}_k \ne c_k)$, donde $f$ depende solo de los conceptos $A$.`, pistas: ['Si todos los conceptos de $A$ están bien, ¿qué decide $f$?'], solucion: [{ texto: R`Si $\hat{c}_k = c_k$ para todo $k \in A$, entonces $f(\hat{c}) = f(c) = y$.`, porque: '$f$ solo mira $A$.' }, { texto: R`Por tanto, el suceso $f(\hat{c}) \ne y$ está contenido en el suceso «algún concepto de $A$ falla».`, porque: 'Es la frase anterior, dicha al revés.' }, { texto: R`Y un suceso contenido en otro no es más probable que él.`, porque: 'Por eso medir los conceptos activos pone un límite al error del sistema.' }] },
  ],
  referencias: ['E. Walker, A. S. Nowacki, «Understanding Equivalence and Noninferiority Testing», <em>J. Gen. Intern. Med.</em> 26 (2011).', 'Q. McNemar, <em>Psychometrika</em> 12 (1947).', 'J. Cohen, «Weighted kappa», <em>Psychological Bulletin</em> 70 (1968).'],
};
