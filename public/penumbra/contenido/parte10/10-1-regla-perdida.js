import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { ETIQUETADOS, entrenarConRegla, lejos, predecir, puntosJuguete } from '../../nucleo/ia.js';
import { curva, mapaCalor, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { coma } from '../parte9/comun.js';

const R = String.raw;
const D = [-1, 1], E = 300;
const CON = entrenarConRegla({ conRegla: true, epocas: E }), SIN = entrenarConRegla({ conRegla: false, epocas: E });
const estado = (h, ep) => h[Math.min(h.length - 1, Math.round(ep / 3))];

export default {
  id: '10-1-regla-perdida',
  titulo: 'Una regla como función de pérdida',
  puente: 'Tu regla habla de todos los puntos. ¿Cómo se pasa de «este punto cumple» a «todos cumplen»? Con un «para todo» suave, y el modo de hacerlo importa mucho.',
  pregunta: 'Solo tienes cuatro ejemplos etiquetados: la red no puede adivinar el resto. Pero sabes algo más: «lo que está lejos del centro no es de la clase». ¿Se puede enseñar eso, tal cual, en forma de regla?',
  escena: {
    id: 'regla-perdida', formato: 'plano', W: 1100, H: 560,
    ejes: { x: D, y: D, caja: { x: 70, y: 56, w: 440, h: 440 } },
    entradas: [
      { id: 'conRegla', tipo: 'deslizador', etiqueta: 'la regla (0 sin ella, 1 con ella)', min: 0, max: 1, paso: 1, valor: 1 },
      { id: 'ep', tipo: 'deslizador', etiqueta: 'vueltas de entrenamiento', min: 0, max: E, paso: 3, valor: E },
    ],
    pasos: [
      { dur: 2800, texto: 'Puntos de dos clases, que el modelo no conoce. Solo cuatro tienen etiqueta: los grandes, en <b style="color:#f4d345;font-weight:400">oro</b> los de la clase, y en <b style="color:#58c4dd;font-weight:400">azul</b> los que no. Entrena solo con ellos.' },
      { dur: 3200, texto: 'Acierta sus cuatro ejemplos, y <b>se equivoca en casi todo lo demás</b>: nadie le ha dicho nada de esa zona. La exactitud se queda en la mitad.' },
      { dur: 3000, texto: 'Ahora la regla, en grados. A la derecha, «$x$ está lejos». Y se pide: «si está lejos, entonces no es de la clase». No hace falta ninguna etiqueta para evaluarla: vale para <b>todos</b> los puntos.' },
      { dur: 4400, texto: 'Se entrena sumando esa regla a la pérdida. Cada punto que la viola empuja a corregir. La frontera se cierra sola alrededor del centro: <b style="color:#f4d345;font-weight:400">ha aprendido de la regla</b>.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), usa = paso >= 3 ? 1 : 0, reposo = paso === 3 && q(3) >= 1, h = reposo ? (Math.round(e.conRegla) ? CON : SIN) : usa ? CON : SIN, ep = paso === 0 ? ev(q(0), 0.3, 1) * 0 : paso === 1 ? ev(q(1), 0, 0.85) * E : paso === 2 ? E : reposo ? e.ep : ev(q(3), 0, 0.9) * E, st = estado(h, ep);
      const P = [mapaCalor((x, y) => predecir(st.w, [x, y]), { clave: `r${h === CON ? 1 : 0}${st.epoca}` }), marco({ x: D, y: D }, { alfa: al, ticks: { x: [-1, 0, 1], y: [-1, 0, 1] } })];
      puntosJuguete.forEach(({ p, y }) => P.push(punto(p, { color: y ? ORO : AZUL, radio: 3.2, alfa: al * 0.85, halo: 0 })));
      ETIQUETADOS.forEach(({ p, y }) => P.push(punto(p, { color: y ? ORO : AZUL, radio: 9, alfa: al }), punto(p, { color: BLANCO, radio: 2.5, alfa: al, halo: 0 })));
      const M = [], reg = ev(q(2), 0, 0.5);
      if (reg > 0) { M.push(mapaCalor((x, y) => lejos([x, y]), { clave: 'lejos' }), marco({ x: D, y: D }, { alfa: reg, ticks: { x: [-1, 1], y: [-1, 1] } }), rotulo([0, 1], R`\text{Grado de «está lejos»}`, { clave: 'tl', dy: -16, tam: 16, color: GRIS2, alfa: reg })); }
      const G = [marco({ x: [0, E], y: [0, 1] }, { alfa: ev(q(1), 0, 0.4), ticks: { x: [0, E], y: [0, 0.5, 1] }, etiquetas: { x: R`\text{vueltas}` } })], sub = h.filter((x) => x.epoca <= ep);
      if (sub.length > 1) { G.push(curva((u) => { const j = Math.min(sub.length - 1, Math.round(u * (sub.length - 1))); return [sub[j].epoca, sub[j].exactitud]; }, [0, 1], { n: Math.min(100, sub.length - 1), color: ORO, ancho: 2.8 })); G.push(curva((u) => { const j = Math.min(sub.length - 1, Math.round(u * (sub.length - 1))); return [sub[j].epoca, sub[j].satisfaccion]; }, [0, 1], { n: Math.min(100, sub.length - 1), color: ROSA, ancho: 2.2 })); }
      const t1 = ev(q(1), 0, 0.4);
      G.push(rotulo([E, 1], R`{\color{#f4d345}\text{exactitud } ${coma(st.exactitud)}}\quad {\color{#fc6282}\text{regla } ${coma(st.satisfaccion)}}`, { clave: 'val', ancla: 'r', dy: -16, tam: 17, alfa: t1 }));
      return { principal: P, paneles: [{ ejes: { x: D, y: D, caja: { x: 620, y: 40, w: 200, h: 200 } }, prims: M }, { ejes: { x: [0, E], y: [0, 1], caja: { x: 620, y: 300, w: 420, h: 190 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Quita y pon la regla, con todas las vueltas: compara la frontera.</li><li>Mueve las vueltas despacio: mira que la regla sube antes de que la exactitud se estabilice.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una regla se puede evaluar sin etiquetas: basta con la salida de la red. Su verdad es un número derivable. Por tanto, «1 menos esa verdad» es una [[pérdida|función de pérdida]]: cuanto peor se cumple la regla, mayor es. Sumada a la pérdida normal, la red aprende de los datos y de lo que ya sabías. Logic Tensor Networks y la lógica difusa diferenciable se basan en esto.' },
    { tipo: 'ejemplo', texto: 'La regla: «si lejos, entonces no es de la clase». Si la red da $q$, y el grado de lejos es $a$, con Reichenbach vale $1 - a + a(1 - q) = 1 - a q$.', tabla: [['Punto', 'a (lejos)', 'q (red)', 'Verdad', 'Pérdida'], ['Cerca del centro', '0,1', '0,9', '0,91', '0,09'], ['Lejos, y la red dice que no', '0,9', '0,1', '0,91', '0,09'], ['Lejos, y la red dice que sí', '0,9', '0,8', '0,28', '0,72']], cierre: 'Solo el tercero paga: es el único que viola la regla. Y paga sin que nadie haya etiquetado ese punto.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\mathcal{G}_\theta(P)`, dice: 'El predicado $P$ es una red con pesos $\\theta$, que da un número en $[0, 1]$. Se dice que es su «interpretación».' },
      { tex: R`\mathcal{G}_\theta(\varphi)`, dice: 'La verdad de toda la fórmula: se calcula de dentro afuera, con [[normas T|norma T]], implicación, «para todo» y «existe».' },
      { tex: R`\mathrm{SatAgg}`, dice: 'Une la verdad de todas las reglas en un número: cuánto satisface la red lo que sabes.' },
    ], todo: R`L(\theta) = 1 - \mathrm{SatAgg}_{\varphi \in \mathcal{K}}\ \mathcal{G}_\theta(\varphi)`, lee: '«La pérdida es lo que le falta a la red para cumplir toda la base de conocimiento $\\mathcal{K}$». Las etiquetas son reglas también: $\\forall x_+\\ A(x_+)$.' },
    { tipo: 'formal', titulo: 'Logic Tensor Networks', tex: R`Badreddine et al. (2022) proponen, como configuración simétrica: $\wedge$ producto, $\vee$ $a + b - ab$, $\neg$ $1 - a$, $\to$ Reichenbach $1 - a + ab$, y medias generalizadas para $\forall$, $\exists$. El aprendizaje es $\hat\theta = \arg\max_\theta \mathrm{SatAgg}\ \mathcal{G}_\theta(\mathcal{K})$.`, lee: 'Un detalle honesto del artículo: se puede tener 100 % de exactitud sin satisfacción máxima. Con confianza 0,7 en cada acierto, la regla $\\forall x_+\\ A(x_+)$ vale solo 0,7.' },
    { tipo: 'demo', titulo: 'Solo pagan los que violan la regla', plan: 'Se deriva la pérdida de un punto y se ve de qué depende el empujón.', tex: R`Con $L = a q$ (pérdida de «si $a$, entonces no $q$»): $\frac{\partial L}{\partial \theta} = a\, q(1 - q)\, \frac{\partial u}{\partial \theta}$, si $q = \sigma(u)$.`, pasos: [
      { texto: R`$1 - I = 1 - (1 - a q) = a q$.`, porque: 'Reichenbach aplicada a «no $q$».' },
      { texto: R`Por la regla de la cadena: $\frac{\partial (a q)}{\partial \theta} = a\, \sigma'(u)\, \frac{\partial u}{\partial \theta}$.`, porque: '$a$ no depende de la red: viene de los datos.' },
      { texto: R`Y $\sigma'(u) = q(1 - q)$, demostrado en la primera parada.`, porque: 'Por tanto, si $a \\approx 0$, el punto no empuja nada: la regla no habla de él. Y si $q \\approx 0$, tampoco: ya cumple.' },
    ] },
    { tipo: 'nota', titulo: 'Juguete, con honradez', texto: 'Aquí el modelo es pequeño y los datos, de juguete: se calcula de verdad en tu navegador, para que lo veas. En problemas reales la mejora suele ser mucho menor, como verás dentro de dos paradas.' },
  ],
  tecnicas: [{ titulo: 'Convierte el conocimiento en una penalización', texto: 'Lo que sepas de antemano, si se puede evaluar sobre la salida del modelo, se puede sumar a la pérdida. No hace falta tocar la arquitectura.' }],
  retos: [
    { id: 'apaga-regla', tipo: 'manipular', enunciado: R`Quita la regla y deja todas las vueltas. Comprueba que la exactitud se hunde por debajo de $0{,}6$.`, precision: (e) => (!Math.round(e.conRegla) && e.ep >= 240 && estado(SIN, e.ep).exactitud < 0.6 ? 1 : 0), prueba: { conRegla: 0, ep: 300 }, pendiente: (e) => `Ahora, la exactitud es ${estado(Math.round(e.conRegla) ? CON : SIN, e.ep).exactitud.toFixed(2).replace('.', ',')}.`, pistas: ['Lleva el primer deslizador a 0.'], explicacion: 'Mismos cuatro ejemplos, mismas vueltas. La única diferencia es una frase verdadera.' },
    { id: 'perdida-calc', tipo: 'calcular', enunciado: R`Con $a = 0{,}5$ y $q = 0{,}6$, ¿cuál es la pérdida de la regla?`, respuesta: 0.3, tol: 0.001, pistas: [R`Es $a q$.`], explicacion: R`$0{,}5 \cdot 0{,}6 = 0{,}3$.` },
    { id: 'regla-elegir', tipo: 'elegir', enunciado: '¿Por qué una regla sirve con datos sin etiquetar?', opciones: ['Porque las inventa', 'Porque su verdad se calcula con la salida de la red, sin saber la clase real', 'Porque usa el mínimo', 'Porque solo mira los etiquetados'], correcta: 1, explicacion: 'Solo necesita saber qué dice la red y cuánto se cumple la condición.' },
    { id: 'demuestra-cumple', tipo: 'demostrar', enunciado: R`Demuestra que, si $a q = 0$ en todos los puntos, la regla se cumple del todo, y la pérdida es 0.`, pistas: ['Sustituye en $1 - a q$.'], solucion: [{ texto: R`La verdad de la regla en cada punto es $1 - a q = 1$.`, porque: 'Por hipótesis.' }, { texto: R`Cualquier agregador con $A(1, \dots, 1) = 1$ da 1, y la pérdida es 0.`, porque: 'Es la condición que se pide a todo «para todo».' }] },
  ],
  referencias: ['S. Badreddine, A. d\'Avila Garcez, L. Serafini, M. Spranger, «Logic Tensor Networks», <em>Artificial Intelligence</em> 303 (2022).', 'E. van Krieken, E. Acar, F. van Harmelen, <em>Artificial Intelligence</em> 302 (2022).'],
};
