import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { aDeLogits } from '../../nucleo/decisor.js';
import { softmax } from '../../nucleo/ia.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { barra, tramo } from '../parte9/comun.js';
import { codigo, coma } from '../parte14/comun.js';

const R = String.raw;
const X = [-6, 6], OTROS = [1.2, 0.4, -0.5];
export default {
  id: '18-1-emular',
  titulo: 'Un decisor con un modelo abierto',
  puente: 'Ya tienes un grado. Pero depende de cómo preguntes. Toca escribir bien la pregunta.',
  pregunta: 'Has cruzado. Aquí dentro, fuzzython ya no basta: ¿de dónde salen los grados cuando la entrada es un texto? Jev, un modelo decisor, responde a preguntas cerradas con una probabilidad, según su fabricante calibrada. Pero es de pago, con acceso incierto. ¿Se puede hacer lo mismo con un modelo abierto, en tu propio ordenador?',
  escena: {
    id: 'emular', formato: 'plano', W: 1100, H: 520,
    ejes: { x: [0, 5], y: [0, 1], caja: { x: 70, y: 70, w: 470, h: 360 } },
    entradas: [{ id: 's', tipo: 'deslizador', etiqueta: 'logit de «Sí»', min: -3, max: 6, paso: 0.1, valor: 1 }, { id: 'n', tipo: 'deslizador', etiqueta: 'logit de «No»', min: -3, max: 6, paso: 0.1, valor: 2.5 }],
    pasos: [
      { dur: 3000, texto: 'Un modelo de lenguaje, justo antes de escribir la primera palabra de su respuesta, da una puntuación a cada palabra posible: su <em>logit</em>. Con ellas se forma una probabilidad. <b>Datos de juguete.</b>' },
      { dur: 3000, texto: 'Solo nos interesan dos: <b style="color:#f4d345;font-weight:400">Sí</b> y <b style="color:#58c4dd;font-weight:400">No</b>. Quitamos las demás, y repartimos el total entre ellas dos.' },
      { dur: 3000, texto: 'Lo importante: el resultado <b style="color:#f4d345;font-weight:400">solo depende de la diferencia</b>. A la derecha, la curva: una sigmoide. Mueve los dos logits.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, P = softmax([e.s, e.n, ...OTROS]), a = aDeLogits(e.s, e.n), nom = ['\\text{Sí}', '\\text{No}', '\\text{El}', '\\text{Según}', '\\text{Quizá}'], col = [ORO, AZUL, GRIS2, GRIS2, GRIS2];
      const N = [marco({ x: [0, 5], y: [0, 1] }, { alfa: al, ticks: { x: [], y: [0, 1] } })]; P.forEach((p, i) => { const v = g1 > 0 && i < 2 ? p + (i === 0 ? a - p : 1 - a - p) * g1 : p * (i < 2 ? 1 : 1 - g1); N.push(barra(i + 0.15, i + 0.85, v, { color: col[i], alfa: 0.8 * al }), rotulo([i + 0.5, 0], nom[i], { clave: 'n' + i, dy: 20, tam: 17, color: col[i], alfa: al }), rotulo([i + 0.5, v], R`${coma(v)}`, { clave: 'v' + i, dy: -14, tam: 17, color: col[i], alfa: al * (i < 2 ? 1 : 1 - g1) })); });
      const d = e.s - e.n, G = [marco({ x: X, y: [0, 1] }, { alfa: g2, ticks: { x: [-6, 0, 6], y: [0, 1] }, etiquetas: { x: R`\ell_{S\acute{\imath}} - \ell_{\text{No}}` } })];
      if (g2 > 0) G.push(curva((x) => [x, 1 / (1 + Math.exp(-x))], X, { n: 120, color: ORO, ancho: 2.8, alfa: g2 }), ...tramo([Math.max(-6, Math.min(6, d)), 0], [Math.max(-6, Math.min(6, d)), a], { color: GRIS2, ancho: 1, alfa: g2, discontinua: true }), punto([Math.max(-6, Math.min(6, d)), a], { color: ORO, radio: 7, alfa: g2 }), rotulo([6, 1], R`a = ${coma(a)}`, { clave: 'a', ancla: 'r', dy: -14, tam: 22, color: ORO, alfa: g2 }));
      return { principal: N, paneles: [{ ejes: { x: X, y: [0, 1], caja: { x: 640, y: 90, w: 410, h: 340 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Sube los dos logits a la vez, en la misma cantidad: el grado no cambia.</li><li>Haz que «Sí» supere a «No» en 2: da 0,88.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'No hace falta que el modelo «sepa» dar probabilidades. Se le pregunta algo que se conteste con Sí o No, se le pide la respuesta, y antes de que escriba nada, se miran sus puntuaciones para esas dos palabras. Esa es toda la emulación. Lo que no da hecho es la calibración: eso viene dos paradas más adelante.' },
    codigo('Con un modelo real', 'Este es un esquema con <code>transformers</code>. <b>No se ha ejecutado aquí</b>, porque exige descargar un modelo. Se pasa por <code>tokenize=False</code> a propósito: la versión 5 cambió lo que devuelve <code>apply_chat_template</code>, y así vale para todas. Comprueba las primeras veces lo que imprime.', "def decidir(texto, pregunta):\n    mensajes = [{'role': 'user', 'content':\n        f'{texto}\\n\\nPregunta: {pregunta}\\nResponde solo Sí o No.'}]\n    prompt = tok.apply_chat_template(mensajes, tokenize=False,\n                                     add_generation_prompt=True)\n    entrada = tok(prompt, return_tensors='pt', add_special_tokens=False)\n    with torch.no_grad():\n        logits = modelo(**entrada).logits[0, -1]\n    si = tok.encode('Sí', add_special_tokens=False)[0]\n    no = tok.encode('No', add_special_tokens=False)[0]\n    return torch.sigmoid(logits[si] - logits[no]).item()", 'Lo que falla con más frecuencia: «Sí» se puede partir en dos piezas al codificarlo, y entonces <code>[0]</code> mira solo la primera. Imprime <code>tok.encode(\'Sí\')</code> y compruébalo.', { ejecutado: false, prefacioTitulo: 'Cargar el modelo', prefacio: "import torch\nfrom transformers import AutoModelForCausalLM, AutoTokenizer\n\nnombre = 'el-modelo-abierto-que-elijas'\ntok = AutoTokenizer.from_pretrained(nombre)\nmodelo = AutoModelForCausalLM.from_pretrained(nombre)" }),
    codigo('La cuenta', 'La última línea, con números de juguete, sin modelo:', "import math\n\ndef a(si, no):\n    return math.exp(si) / (math.exp(si) + math.exp(no))\n\nprint(round(a(1.0, 2.5), 4))\nprint(round(a(11.0, 12.5), 4))\nprint(round(1 / (1 + math.exp(-(1.0 - 2.5))), 4))", 'Las dos primeras coinciden: solo importa la diferencia. Y la tercera es la misma cuenta, con la sigmoide.'),
    { tipo: 'ejemplo', texto: 'Las dos opciones, comparadas. Lo de Jev son datos del fabricante, no medidos aquí:', tabla: [['', 'Jev', 'Modelo abierto local'], ['Probabilidad', 'De fábrica', 'Con la ecuación'], ['Calibración', 'Declarada', 'Hay que hacerla'], ['Coste', 'De pago', 'Gratis, si tienes el equipo'], ['Los datos', 'Salen fuera', 'No salen']], cierre: 'La calibración de fábrica es una comodidad, no un requisito: la puedes conseguir después.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\ell_{S\acute{\imath}},\ \ell_{\text{No}}`, dice: 'Los logits: puntuaciones sin escala, que pueden ser negativas.' },
      { tex: R`a(x, q)`, dice: 'El grado crudo para el texto $x$ y la pregunta $q$.' },
      { tex: R`\sigma`, dice: 'La sigmoide: lleva cualquier número a $(0, 1)$.' },
    ], todo: R`a(x, q) = \frac{e^{\ell_{S\acute{\imath}}}}{e^{\ell_{S\acute{\imath}}} + e^{\ell_{\text{No}}}} = \sigma(\ell_{S\acute{\imath}} - \ell_{\text{No}})`, lee: '«La parte de “Sí” dentro de lo que suman “Sí” y “No”». Es la ecuación (1) del informe.' },
    { tipo: 'formal', titulo: 'Lo que se ignora', tex: R`Si $P$ es la probabilidad del modelo sobre todas las palabras, entonces $a = P(S\acute{\imath} \mid S\acute{\imath} \text{ o No}) = \frac{P(S\acute{\imath})}{P(S\acute{\imath}) + P(\text{No})}$.`, lee: 'Es una probabilidad condicionada. Si el modelo quería decir otra cosa, «Depende», por ejemplo, $a$ no se entera. Conviene mirar también cuánto suman las dos: si es poco, el modelo no ha entendido la pregunta.' },
    { tipo: 'demo', titulo: 'Solo importa la diferencia', plan: 'Se divide arriba y abajo por el mismo número.', tex: R`$\frac{e^{s}}{e^{s} + e^{n}} = \frac{1}{1 + e^{-(s - n)}}$.`, pasos: [
      { texto: R`Se dividen numerador y denominador entre $e^{s}$.`, porque: 'No cambia el valor, y $e^{s} > 0$.' },
      { texto: R`Queda $\frac{1}{1 + e^{n - s}}$.`, porque: 'Propiedades de la exponencial: $\\frac{e^{n}}{e^{s}} = e^{n - s}$.' },
      { texto: R`Y $n - s = -(s - n)$. Si sumas lo mismo a $s$ y a $n$, nada cambia.`, porque: 'Por eso el nivel general de los logits no importa, solo su separación.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Si una herramienta es cara, busca qué hace en realidad', texto: 'Separa la interfaz de lo que hay detrás. «Una probabilidad para una pregunta cerrada» se puede emular con dos logits y una resta. Lo difícil es otra cosa: saber si esa probabilidad es fiable.' }],
  retos: [
    { id: 'logit-08', tipo: 'manipular', enunciado: R`Busca logits para que el grado esté entre $0{,}79$ y $0{,}81$.`, precision: (e) => { const a = aDeLogits(e.s, e.n); return a >= 0.79 && a <= 0.81 ? 1 : 0; }, prueba: { s: 3.9, n: 2.5 }, pendiente: (e) => `El grado es ${aDeLogits(e.s, e.n).toFixed(3).replace('.', ',')}.`, pistas: [R`Hace falta una diferencia de $\ln 4 \approx 1{,}4$.`], explicacion: R`$\sigma(1{,}4) \approx 0{,}80$.` },
    { id: 'logit-calc', tipo: 'calcular', enunciado: R`Si $\ell_{S\acute{\imath}} = \ell_{\text{No}}$, ¿cuánto vale $a$?`, respuesta: 0.5, tol: 0.001, pistas: [R`$\sigma(0)$.`], explicacion: R`$0{,}5$: el modelo no se decide.` },
    { id: 'emular-elegir', tipo: 'elegir', enunciado: 'Qué garantiza por sí sola esta lectura de logits?'.replace('Qué', '¿Qué'), opciones: ['Que la probabilidad esté calibrada', 'Un número entre 0 y 1, sin más', 'Que el modelo haya entendido la pregunta', 'Que coincida con Jev'], correcta: 1, explicacion: 'Es un número de 0 a 1. Que signifique lo que parece hay que comprobarlo.' },
    { id: 'demuestra-simetria', tipo: 'demostrar', enunciado: R`Demuestra que intercambiar «Sí» y «No» da $1 - a$: $\sigma(-d) = 1 - \sigma(d)$.`, pistas: ['Escribe $\\sigma(d) = \\frac{e^d}{1 + e^d}$.'], solucion: [{ texto: R`$\sigma(-d) = \frac{1}{1 + e^{d}}$.`, porque: 'Por la definición.' }, { texto: R`Y $1 - \frac{e^{d}}{1 + e^{d}} = \frac{1}{1 + e^{d}}$.`, porque: 'Mismo denominador. Son iguales.' }] },
  ],
  referencias: ['Informe técnico propio: <em>Modelos decisores, lógica difusa y texto</em>, ecuación (1).', 'Hugging Face, documentación de <em>transformers</em> v5: chat templates.'],
};
