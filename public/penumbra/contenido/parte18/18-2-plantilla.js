import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { promedioLogit } from '../../nucleo/decisor.js';
import { marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { tramo } from '../parte9/comun.js';
import { codigo, coma } from '../parte14/comun.js';

const R = String.raw;
// Lecturas de juguete: la misma pregunta, con ocho redacciones.
const LECT = [0.91, 0.62, 0.78, 0.44, 0.83, 0.7, 0.57, 0.74], VERDAD = promedioLogit(LECT), med = (k) => promedioLogit(LECT.slice(0, k));
export default {
  id: '18-2-plantilla',
  titulo: 'La pregunta bien hecha',
  puente: 'Tienes lecturas más estables. Pero siguen sin significar lo que dicen. Un «0,9» del modelo, ¿acierta el 90 % de las veces? Hay que medirlo.',
  pregunta: 'Mismo texto, misma idea, otras palabras: «¿El paciente refiere dolor torácico?» o «¿Tiene dolor en el pecho?». Un modelo puede responder 0,91 a una y 0,44 a la otra. Entonces, ¿qué grado es el bueno?',
  escena: {
    id: 'plantilla', formato: 'plano', W: 1100, H: 500,
    ejes: { x: [0, 9], y: [0, 1], caja: { x: 70, y: 60, w: 640, h: 370 } },
    entradas: [{ id: 'k', tipo: 'deslizador', etiqueta: 'cuántas redacciones se promedian', min: 1, max: 8, paso: 1, valor: 2 }],
    pasos: [
      { dur: 2800, texto: 'Ocho redacciones de la misma pregunta, y lo que responde el modelo a cada una. Es la <b>misma</b> idea. <b style="color:#58c4dd;font-weight:400">Datos de juguete</b>, para ver el efecto.' },
      { dur: 3000, texto: 'Si solo usas una, tu grado depende de la redacción que elegiste. Eso no es una medida: es una casualidad.' },
      { dur: 3000, texto: 'Se promedian, <b style="color:#f4d345;font-weight:400">en logits</b>, no en probabilidades. La línea dorada se va asentando, a medida que entran redacciones.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, k = paso >= 2 ? Math.round(e.k) : 8, m = med(k), N = [marco({ x: [0, 9], y: [0, 1] }, { alfa: al, ticks: { x: [1, 8], y: [0, 1] }, etiquetas: { x: R`\text{redacción}` } })];
      LECT.forEach((a, i) => N.push(...tramo([i + 1, 0], [i + 1, a], { color: AZUL, ancho: 1.2, alfa: 0.4 * al }), punto([i + 1, a], { color: i < k ? AZUL : GRIS2, radio: 6, alfa: al, halo: 0 })));
      if (g1 > 0) N.push(rotulo([9, 1], R`\text{de }${coma(Math.min(...LECT))}\text{ a }${coma(Math.max(...LECT))}`, { clave: 'r', ancla: 'r', dy: -14, tam: 20, color: ROSA, alfa: g1 * (1 - g2) }));
      if (g2 > 0) N.push(...tramo([0, m], [9, m], { color: ORO, ancho: 2.4, alfa: g2 }), rotulo([9, m], R`${coma(m)}`, { clave: 'm', ancla: 'r', dy: -14, tam: 22, color: ORO, alfa: g2 }));
      const G = [marco({ x: [1, 8], y: [0, 1] }, { alfa: g2, ticks: { x: [1, 8], y: [0, 1] }, etiquetas: { x: R`\text{cuántas}` } })];
      if (g2 > 0) { for (let i = 1; i < 8; i++) G.push(...tramo([i, med(i)], [i + 1, med(i + 1)], { color: ORO, ancho: 2.2, alfa: g2 })); G.push(punto([k, m], { color: ORO, radio: 7, alfa: g2 })); }
      return { principal: N, paneles: [{ ejes: { x: [1, 8], y: [0, 1], caja: { x: 790, y: 90, w: 260, h: 340 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Empieza con una sola redacción, y ve añadiendo.</li><li>Mira a partir de cuántas deja de moverse.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una pregunta para un decisor es como una pregunta de encuesta: la redacción importa. Hay tres reglas. Debe tener una sola idea por pregunta. Debe poder contestarse con lo que dice el texto. Y debe tener una salida prevista para cuando el texto no diga nada. Y si aún dudas, se hace varias veces con otras palabras, y se promedia.' },
    codigo('Promediar', 'En logits, porque un promedio de probabilidades se deja llevar por los extremos:', "import math\n\ndef logit(p): return math.log(p / (1 - p))\ndef sigma(x): return 1 / (1 + math.exp(-x))\n\nlecturas = [0.91, 0.62, 0.78, 0.44, 0.83, 0.70, 0.57, 0.74]   # de juguete\nprint(round(sum(lecturas) / len(lecturas), 4))\nprint(round(sigma(sum(map(logit, lecturas)) / len(lecturas)), 4))\nprint(round(sigma((logit(0.999) + logit(0.5)) / 2), 4), round((0.999 + 0.5) / 2, 4))", 'La última línea enseña la diferencia: 0,999 y 0,5 dan 0,97 en logits, porque 0,999 es una seguridad muy grande, y 0,75 en probabilidades.'),
    { tipo: 'ejemplo', texto: 'Del documento de Células de Concepto: preguntas buenas y malas.', tabla: [['Pregunta', 'Pega'], ['¿El paciente refiere dolor torácico?', 'Bien: una idea, y está en el texto'], ['¿Tiene dolor y sudoración?', 'Dos ideas: separa'], ['¿Es grave?', 'Es la decisión final, no un concepto'], ['¿Hay fiebre?, si no se ha medido', 'El texto no lo dice: prevé esa salida']], cierre: 'Cada concepto es una pregunta, y cada pregunta da un grado. Eso será la entrada de fuzzython.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`q_1, \dots, q_m`, dice: 'Las redacciones de una misma pregunta.' },
      { tex: R`\text{logit}(p) = \ln \frac{p}{1 - p}`, dice: 'La inversa de $\\sigma$.' },
    ], todo: R`\bar{a}(x) = \sigma\left(\frac{1}{m} \sum_{j = 1}^m \text{logit}\, a(x, q_j)\right)`, lee: '«Se pasan a logits, se hace la media, y se vuelve». Es la media geométrica de las apuestas a favor.' },
    { tipo: 'formal', titulo: 'También varias formas de decir sí', tex: R`Si el modelo puede responder «Sí», «sí» o «Si», son palabras distintas para él. Se suman sus masas: $P(S\acute{\imath}) = \sum_{v} P(v)$. En logits: $\ell_{S\acute{\imath}} = \ln \sum_v e^{\ell_v}$, que se calcula con <code>torch.logsumexp</code>.`, lee: 'Sin eso, una parte de «sí» se pierde. Y lo mismo con «No» y sus variantes.' },
    { tipo: 'demo', titulo: 'La media en logits conserva el orden', plan: 'Se usa que logit y σ son crecientes.', tex: R`Si $a_j \le b_j$ para cada $j$, entonces $\bar{a} \le \bar{b}$.`, pasos: [
      { texto: R`$\text{logit}$ es creciente: $\text{logit}\, a_j \le \text{logit}\, b_j$.`, porque: 'Su derivada, $\\frac{1}{p (1 - p)}$, es positiva.' },
      { texto: R`Las medias conservan la desigualdad.`, porque: 'Se suman desigualdades y se divide por $m > 0$.' },
      { texto: R`$\sigma$ también es creciente.`, porque: 'Luego $\\bar{a} \\le \\bar{b}$. Si un caso se puntúa más alto en cada redacción, sigue más alto en la media.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Mide la variación antes de fiarte', texto: 'Antes de usar una pregunta, reformúlala tres veces y mira cuánto cambia el grado. Si cambia mucho, el problema está en la pregunta, y ninguna calibración lo va a arreglar.' }],
  retos: [
    { id: 'plant-estable', tipo: 'manipular', enunciado: R`Busca cuántas redacciones hacen falta para que la media quede a menos de $0{,}01$ de la final.`, precision: (e) => (Math.abs(med(Math.round(e.k)) - VERDAD) < 0.01 ? 1 : 0), prueba: { k: 8 }, pendiente: (e) => `Con ${Math.round(e.k)}, sale ${med(Math.round(e.k)).toFixed(3).replace('.', ',')}; la final es ${VERDAD.toFixed(3).replace('.', ',')}.`, pistas: ['Ve subiendo de una en una.'], explicacion: 'Con estos datos de juguete, unas pocas ya bastan.' },
    { id: 'logit-calc2', tipo: 'calcular', enunciado: R`¿Cuánto vale $\text{logit}(0{,}5)$?`, respuesta: 0, tol: 0.001, pistas: [R`$\ln 1$.`], explicacion: R`$0$.` },
    { id: 'preg-elegir', tipo: 'elegir', enunciado: '¿Cuál es la mejor pregunta para un concepto?', opciones: ['¿Es grave este caso?', '¿Refiere dolor torácico?', '¿Tiene dolor, sudoración o fatiga?', 'Valora el caso del 1 al 5'], correcta: 1, explicacion: 'Una sola idea, que se puede leer en el texto.' },
    { id: 'demuestra-inversa', tipo: 'demostrar', enunciado: R`Demuestra que $\sigma(\text{logit}\, p) = p$.`, pistas: ['Sustituye en $\\frac{1}{1 + e^{-x}}$.'], solucion: [{ texto: R`$e^{-\text{logit}\, p} = \frac{1 - p}{p}$.`, porque: 'La exponencial deshace al logaritmo, y el signo invierte la fracción.' }, { texto: R`$\frac{1}{1 + \frac{1 - p}{p}} = \frac{p}{p + 1 - p} = p$.`, porque: 'Se multiplica arriba y abajo por $p$.' }] },
  ],
  referencias: ['Informe técnico propio: <em>Células de Concepto Difusas</em>.', 'Z. Jiang et al., «How can we know what language models know?», <em>TACL</em> 8 (2020).'],
};
