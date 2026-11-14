import { AZUL, BLANCO, GRIS2, ORO } from '../../motor/colores.js';
import { sigma } from '../../nucleo/ia.js';
import { curva, linea, mapaCalor, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { coma } from './comun.js';

const R = String.raw;
const DX = [-4, 4], U = [0, 1];
const neurona2 = (w, b) => (x, y) => sigma(w * x + w * y + b);
export const hace = (w, b) => { const f = neurona2(w, b); return { oo: f(0, 0), oi: f(0, 1), io: f(1, 0), ii: f(1, 1) }; };

export default {
  id: '9-1-neurona',
  titulo: 'Una neurona es una curva de pertenencia',
  puente: 'Una neurona da un grado. Pero muchas neuronas juntas tienen que escoger entre varias opciones, y esa elección también puede hacerse con suavidad.',
  pregunta: 'Al otro lado del mapa, las redes neuronales parecen otro mundo. ¿Y si cada neurona estuviera haciendo algo que ya conoces desde la región 2?',
  escena: {
    id: 'neurona', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DX, y: U, caja: { x: 70, y: 50, w: 470, h: 390 } },
    entradas: [
      { id: 'w', tipo: 'deslizador', etiqueta: 'peso w: cuánto le importa la entrada', min: 0.5, max: 16, paso: 0.25, valor: 10 },
      { id: 'b', tipo: 'deslizador', etiqueta: 'sesgo b: dónde se decide', min: -24, max: 4, paso: 0.25, valor: -5 },
    ],
    pasos: [
      { dur: 2800, texto: 'Una neurona hace dos cosas: <b>multiplica</b> la entrada por un peso y le suma un sesgo, y luego <b>aplasta</b> el resultado entre 0 y 1. Mira la curva: es la sigmoidal de la región 2.' },
      { dur: 3000, texto: 'El peso controla lo <b style="color:#58c4dd;font-weight:400">abrupta</b> que es. Con un peso enorme, es casi un escalón: lo clásico. Con uno pequeño, una transición suave: lo difuso.' },
      { dur: 3200, texto: 'Con dos entradas, a la derecha, el corte se vuelve <b>una recta</b> sobre el plano. A un lado, «sí»; al otro, «no»; y en medio, una franja de <b style="color:#f4d345;font-weight:400">penumbra</b>.' },
      { dur: 3200, texto: 'Mueve el sesgo, y la misma neurona hace un <b>«o»</b> o un <b>«y»</b>: pide una entrada o exige las dos. Una neurona ya es un conectivo difuso.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), w1 = paso === 0 ? 4 : paso === 1 ? mix(mix(4, 16, ev(q(1), 0, 0.45)), 1.2, ev(q(1), 0.5, 0.95)) : mix(1.2, e.w, ev(q(2), 0, 0.5));
      const f = (x) => sigma(w1 * x), b2 = paso >= 3 ? mix(-5, e.b, ev(q(3), 0.5, 1)) : -5, g = neurona2(paso >= 2 ? mix(1.2, e.w, ev(q(2), 0, 0.5)) : w1, b2), plano = ev(q(2), 0, 0.5);
      const N = [marco({ x: DX, y: U }, { alfa: al, ticks: { x: [-4, 0, 4], y: [0, 1] }, etiquetas: { x: 'x', y: R`\sigma` } }), linea([-4, 0.5], [4, 0.5], { color: GRIS2, ancho: 1, alfa: 0.4 * al, discontinua: true })];
      N.push(curva((x) => [x, f(x)], DX, { hasta: Math.max(ev(q(0), 0, 1), 1e-3), n: 300, color: AZUL, ancho: 3.2, brillo: true }));
      N.push(rotulo([-3.8, 0.92], R`\sigma(w\,x),\ \ w = ${coma(w1, 1)}`, { clave: 'f', ancla: 'l', tam: 21, color: AZUL, alfa: al }), punto([0, 0.5], { color: ORO, radio: 6, alfa: al }));
      const P = [];
      if (plano > 0) {
        P.push(mapaCalor(g, { clave: `n${(paso >= 2 ? mix(1.2, e.w, ev(q(2), 0, 0.5)) : w1).toFixed(2)}|${b2.toFixed(2)}` }), marco({ x: U, y: U }, { alfa: plano, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: R`x_1`, y: R`x_2` } }));
        for (const [x, y] of [[0, 0], [0, 1], [1, 0], [1, 1]]) { P.push(punto([x, y], { color: g(x, y) > 0.5 ? ORO : BLANCO, radio: 7, alfa: plano }), rotulo([x, y], coma(g(x, y)), { clave: `v${x}${y}`, dx: x ? -30 : 30, dy: y ? 16 : -16, tam: 18, alfa: plano , color: g(x, y) > 0.5 ? [20, 20, 31] : BLANCO })); }
        P.push(rotulo([0.5, 1], R`\sigma(w x_1 + w x_2 + b)`, { clave: 'tp', dy: -18, tam: 18, color: GRIS2, alfa: plano }));
      }
      return { principal: N, paneles: [{ ejes: { x: U, y: U, caja: { x: 640, y: 80, w: 360, h: 360 } }, prims: P }] };
    },
  },
  manipulacion: '<ul><li>Sube y baja el peso: de lo difuso a lo nítido.</li><li>Mueve el sesgo y observa las cuatro esquinas: con $b \\approx -\\frac{w}{2}$ hace un «o»; con $b \\approx -\\frac{3w}{2}$, un «y».</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una [[neurona]] artificial combina sus entradas y da un número entre 0 y 1. Eso es exactamente un grado. La curva con la que lo aplasta, la [[sigmoide]], es una función de pertenencia de las que dibujaste. Una red neuronal es, leída así, un sistema enorme de grados que se alimentan unos a otros.' },
    { tipo: 'ejemplo', texto: 'Una neurona con $w = 10$ y $b = -15$, en las cuatro esquinas. Calcula $10 x_1 + 10 x_2 - 15$, y aplasta:', tabla: [['x₁', 'x₂', 'Suma', 'Sale'], ['0', '0', '−15', '0,00'], ['0', '1', '−5', '0,01'], ['1', '0', '−5', '0,01'], ['1', '1', '5', '0,99']], cierre: 'Es un «y». Con $b = -5$, la misma neurona da 0,01; 0,99; 0,99; 1,00: un «o».' },
    { tipo: 'simbolos', piezas: [
      { tex: R`w`, dice: 'El peso. Mide cuánto cuenta esa entrada. La inicial viene de «weight».' },
      { tex: R`b`, dice: 'El sesgo: «bias». Desplaza dónde se decide.' },
      { tex: R`\sigma(u) = \frac{1}{1 + e^{-u}}`, dice: 'La [[sigmoide]]: lleva cualquier número a $(0, 1)$. $u$ se llama su logit.' },
    ], todo: R`\mu(x) = \sigma(w \cdot x + b)`, lee: '«El grado es la sigmoide de la suma pesada». El punto $w \\cdot x$ es sumar cada entrada por su peso.' },
    { tipo: 'formal', titulo: 'Neurona sigmoidal', tex: R`Dados $w \in \mathbb{R}^n$ y $b \in \mathbb{R}$, es la función $\mu : \mathbb{R}^n \to (0, 1)$, $\ \mu(x) = \sigma(w \cdot x + b)$. Su conjunto de nivel $\mu = \frac{1}{2}$ es el hiperplano $w \cdot x + b = 0$.`, lee: 'Es un conjunto difuso sobre $\\mathbb{R}^n$, con frontera recta. En una dimensión, es la sigmoidal de la región 2, con centro $c = -\\frac{b}{w}$.' },
    { tipo: 'demo', titulo: 'La sigmoide trae su propio «no»', plan: 'Negar la entrada equivale a tomar el complemento del grado. Es una propiedad de esta curva, y conviene saberlo.', tex: R`$\sigma(-u) = 1 - \sigma(u)$.`, pasos: [
      { texto: R`$\sigma(-u) = \dfrac{1}{1 + e^{u}}$. Multiplicando arriba y abajo por $e^{-u}$: $\dfrac{e^{-u}}{e^{-u} + 1}$.`, porque: 'No cambia el valor, porque es multiplicar por 1.' },
      { texto: R`$1 - \sigma(u) = \dfrac{1 + e^{-u} - 1}{1 + e^{-u}} = \dfrac{e^{-u}}{1 + e^{-u}}$.`, porque: 'Se pone todo con el mismo denominador.' },
      { texto: 'Las dos expresiones son iguales.', porque: 'Por eso, cambiar el signo de los pesos y del sesgo convierte una neurona en su [[complemento]].' },
    ] },
    { tipo: 'nota', titulo: 'Hasta dónde llega la analogía', texto: 'Una sola neurona solo traza fronteras rectas: no puede hacer un «o exclusivo». Y en la práctica muchas redes usan otras curvas, como ReLU, y sus números ya no se leen como grados. Por eso esta ruta no dice que toda red sea lógica difusa: dice dónde los dos mundos se pueden unir de verdad.' },
  ],
  tecnicas: [{ titulo: 'Lee cada pieza como algo conocido', texto: 'Ante una fórmula nueva, busca lo que ya sabes dentro. Aquí, $\\sigma$ es una curva de pertenencia, y $w \\cdot x + b$ dice dónde está su frontera.' }],
  retos: [
    { id: 'haz-un-y', tipo: 'manipular', enunciado: 'Ajusta el peso y el sesgo para que la neurona haga un «y»: en $(1, 1)$, por encima de 0,9; en $(1, 0)$, por debajo de 0,1.', precision: (e) => { const h = hace(e.w, e.b); return h.ii > 0.9 && h.io < 0.1 ? 1 : 0; }, prueba: { w: 10, b: -15 }, pendiente: (e) => { const h = hace(e.w, e.b); return `Ahora: (1, 1) da ${h.ii.toFixed(2).replace('.', ',')}, y (1, 0) da ${h.io.toFixed(2).replace('.', ',')}.`; }, pistas: ['El sesgo tiene que dejar la frontera más allá de una sola entrada.', 'Prueba con $b$ cerca de $-\\frac{3w}{2}$.'], explicacion: 'La frontera pasa entre $(1, 0)$ y $(1, 1)$: solo con las dos entradas se llega.' },
    { id: 'sigmoide-calc', tipo: 'calcular', enunciado: R`Si $\sigma(u) = 0{,}8$, ¿cuánto vale $\sigma(-u)$?`, respuesta: 0.2, tol: 0.001, pistas: ['Usa la propiedad demostrada.'], explicacion: R`$1 - 0{,}8 = 0{,}2$.` },
    { id: 'centro-calc', tipo: 'calcular', enunciado: R`Una neurona de una entrada tiene $w = 4$, $b = -6$. ¿En qué $x$ da exactamente $0{,}5$?`, respuesta: 1.5, tol: 0.001, pistas: [R`$\sigma(u) = 0{,}5$ cuando $u = 0$.`], explicacion: R`$4x - 6 = 0$, luego $x = 1{,}5$.` },
    { id: 'demuestra-pendiente', tipo: 'demostrar', enunciado: R`Demuestra que $\sigma'(u) = \sigma(u)(1 - \sigma(u))$, y que la pendiente de $\sigma(wx + b)$ en su centro vale $\frac{w}{4}$.`, pistas: ['Deriva $(1 + e^{-u})^{-1}$ con la regla de la cadena.'],
      solucion: [
        { texto: R`$\sigma'(u) = \dfrac{e^{-u}}{(1 + e^{-u})^2} = \dfrac{1}{1 + e^{-u}} \cdot \dfrac{e^{-u}}{1 + e^{-u}} = \sigma(u)(1 - \sigma(u))$.`, porque: 'Regla de la cadena; y el segundo factor es $1 - \\sigma(u)$, como se vio.' },
        { texto: R`En el centro, $u = 0$: $\sigma = \frac{1}{2}$, luego $\sigma'(0) = \frac{1}{4}$.`, porque: 'Se sustituye.' },
        { texto: R`Por la cadena, $\frac{d}{dx}\sigma(wx + b) = w\, \sigma'(wx + b)$, que en el centro vale $\frac{w}{4}$.`, porque: 'Por eso un peso grande da una transición abrupta.' },
      ] },
  ],
  referencias: ['W. McCulloch, W. Pitts, «A logical calculus of the ideas immanent in nervous activity» (1943).', 'I. Goodfellow, Y. Bengio, A. Courville, <em>Deep Learning</em>, MIT Press, 2016, cap. 6.'],
};
