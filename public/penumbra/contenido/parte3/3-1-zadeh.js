import { AZUL, ORO, ROSA } from '../../motor/colores.js';
import { punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const RADIO = 165, K = 1.45, OPS = ['ambos', 'min', 'max', 'neg'];
const NOMBRE = { ambos: R`A \text{ y } B`, min: R`A \cap B:\ \min(\mu_A, \mu_B)`, max: R`A \cup B:\ \max(\mu_A, \mu_B)`, neg: R`\text{no } A:\ 1 - \mu_A` };
const bell = (p, c) => 1 / (1 + (((p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2) / (RADIO * RADIO)) ** K);
const enMedio = (e) => { const m = [(e.A[0] + e.B[0]) / 2, (e.A[1] + e.B[1]) / 2]; return Math.min(bell(m, e.A), bell(m, e.B)); };

export default {
  id: '3-1-zadeh',
  titulo: 'Y, o, no: las operaciones de Zadeh',
  puente: 'Tienes «y», «o» y «no». La pregunta ahora es cuánto se parecen a los de siempre. ¿Siguen valiendo las leyes que usabas en lógica?',
  pregunta: 'Una casa es bastante cómoda, y no muy grande. ¿Cuánto es «cómoda y grande»? ¿Cuánto es «no grande»? Con grados, «y», «o» y «no» necesitan una nueva definición.',
  escena: {
    id: 'zadeh', formato: 'niebla', W: 1100, H: 560,
    entradas: [
      { id: 'op', tipo: 'deslizador', etiqueta: 'operación (0 ambos, 1 y, 2 o, 3 no)', min: 0, max: 3, paso: 1, valor: 1 },
      { id: 'A', tipo: 'arrastre', valor: [400, 290], region: { x: [60, 1040], y: [60, 500] } },
      { id: 'B', tipo: 'arrastre', valor: [720, 290], region: { x: [60, 1040], y: [60, 500] } },
    ],
    pasos: [
      { dur: 1800, texto: 'Dos conjuntos difusos, dos nieblas: <b style="color:#58c4dd;font-weight:400">A</b> y <b style="color:#fc6282;font-weight:400">B</b>. En cada punto, cada una tiene su densidad.' },
      { dur: 2400, texto: '<b style="color:#f4d345;font-weight:400">«A y B»</b>: en cada punto, la menor de las dos densidades. Solo queda niebla donde hay de las dos.' },
      { dur: 2400, texto: '<b style="color:#f4d345;font-weight:400">«A o B»</b>: en cada punto, la mayor. Basta con que haya de una de ellas.' },
      { dur: 2400, texto: '<b style="color:#f4d345;font-weight:400">«No A»</b>: lo que le falta a A para llegar a 1. Es la niebla al revés: densa donde A no está.' },
      { dur: 1500, texto: 'Las tres reglas actúan punto a punto: cada punto se calcula sin mirar a sus vecinos.' },
    ],
    primitivas({ q, paso, e }) {
      const op = paso === 4 ? OPS[Math.round(e.op)] : OPS[Math.min(paso, 3)], prev = paso === 4 ? 'neg' : OPS[Math.max(0, paso - 1)];
      const mezcla = paso === 0 ? 1 : ev(q(paso), 0, 0.75), A = e.A, B = e.B, ent = ev(q(0), 0, 0.5);
      const c = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], a = bell(c, A), b = bell(c, B);
      const v = { ambos: null, min: Math.min(a, b), max: Math.max(a, b), neg: 1 - a }[op];
      const P = [rotulo([A[0] - 90, A[1]], 'A', { clave: 'A', tam: 44, alfa: ent }), rotulo([B[0] + 90, B[1]], 'B', { clave: 'B', tam: 44, alfa: ent }), punto(c, { color: [255, 255, 255], radio: 5, alfa: ent })];
      P.push(rotulo([c[0], c[1] - 26], R`{\color{#58c4dd}${coma(a)}},\ {\color{#fc6282}${coma(b)}}${v === null ? '' : R`\ \to\ {\color{#f4d345}${coma(v)}}`}`, { clave: 'lee', tam: 22, alfa: ent }));
      P.push(rotulo([550, 34], NOMBRE[op], { clave: 'nom', tam: 28, color: op === 'ambos' ? [232, 228, 216] : ORO, alfa: ent }));
      return { niebla: { nubes: [{ x: A[0], y: A[1], r: RADIO, color: AZUL }, { x: B[0], y: B[1], r: RADIO, color: ROSA }], k: K, operacion: op, previa: prev, mezcla, entrada: ent }, principal: P };
    },
  },
  manipulacion: '<ul><li>Arrastra las nieblas por sus centros, y acércalas.</li><li>Cambia la operación y mira el punto blanco, justo entre las dos: lee sus tres números.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'El problema', texto: 'En el mundo clásico, «y» es fácil: estás en los dos, o no. Pero si perteneces a uno con grado 0,7 y al otro con 0,4, ¿con cuánto perteneces a los dos a la vez?' },
    { tipo: 'idea', etiqueta: 'La propuesta', texto: 'Zadeh propuso en 1965 algo muy simple. Una cadena es tan fuerte como su eslabón más débil: para «y», toma el <b>menor</b>. Para «o», basta con uno: toma el <b>mayor</b>. Para «no», lo que falta hasta 1.' },
    { tipo: 'ejemplo', texto: '«Casa cómoda» (A) y «casa grande» (B), según los dormitorios:', tabla: [['Dormitorios', '3', '4', '5', '6', '7'], ['A: cómoda', '0,8', '1', '0,7', '0,3', '0'], ['B: grande', '0,2', '0,4', '0,6', '0,8', '1'], ['Cómoda y grande', '0,2', '0,4', '0,6', '0,3', '0'], ['Cómoda o grande', '0,8', '1', '0,7', '0,8', '1'], ['No grande', '0,8', '0,6', '0,4', '0,2', '0']], cierre: 'Fíjate: con 5 dormitorios, es la casa que mejor cumple las dos. Es lo que buscarías en la vida real.' },
    { tipo: 'simbolos', intro: 'Las tres reglas son muy cortas.', piezas: [
      { tex: R`A \cap B`, dice: 'La [[intersección]]: «A y B». El símbolo parece una U al revés.' },
      { tex: R`\mu_{A \cap B}(x) = \min(\mu_A(x), \mu_B(x))`, dice: 'Su grado es el menor de los dos.' },
      { tex: R`A \cup B`, dice: 'La [[unión]]: «A o B». Es la U de «unión».' },
      { tex: R`\mu_{A \cup B}(x) = \max(\mu_A(x), \mu_B(x))`, dice: 'Su grado es el mayor de los dos.' },
      { tex: R`\overline{A}`, dice: 'El [[complemento]]: «no A». Se escribe con una raya encima.' },
      { tex: R`\mu_{\overline{A}}(x) = 1 - \mu_A(x)`, dice: 'Su grado es lo que le falta a $x$ para llegar a 1.' },
    ], todo: R`\min \qquad \max \qquad 1 - \mu`, lee: 'Tres reglas de una línea, para «y», «o» y «no». Con ellas está casi todo lo que viene.' },
    { tipo: 'formal', titulo: 'Las operaciones de Zadeh', tex: R`Para todo $x \in X$: $\mu_{A \cap B}(x) = \min(\mu_A(x), \mu_B(x))$, $\ \mu_{A \cup B}(x) = \max(\mu_A(x), \mu_B(x))$, $\ \mu_{\overline{A}}(x) = 1 - \mu_A(x)$.`, lee: 'Todas actúan punto a punto, igual que una operación entre listas de números.' },
    { tipo: 'demo', titulo: 'Con conjuntos clásicos, dan lo de siempre', plan: 'Toda definición nueva debe respetar la vieja. Basta probar los pocos casos posibles, porque un conjunto clásico solo usa 0 y 1.', tex: R`Si $\mu_A$ y $\mu_B$ solo valen 0 o 1, las reglas de Zadeh coinciden con «y», «o» y «no» de siempre.`, pasos: [
      { texto: R`$\min(a, b) = 1$ si y solo si $a = b = 1$, y si no, vale 0.`, porque: 'Basta mirar las cuatro combinaciones de $a$, $b$ en $\\{0, 1\\}$. Esto es la tabla del «y».' },
      { texto: R`$\max(a, b) = 0$ si y solo si $a = b = 0$, y si no, vale 1.`, porque: 'Las mismas cuatro combinaciones. Esto es la tabla del «o».' },
      { texto: R`$1 - a$ cambia 0 por 1, y 1 por 0.`, porque: 'Esto es la tabla del «no».' },
    ] },
    { tipo: 'nota', titulo: 'No es la única opción', texto: 'Zadeh ya mencionó otras formas de combinar grados. El mínimo tiene una rareza: si el grado menor no cambia, el mayor puede subir sin que el resultado se entere. Más adelante verás que hay toda una familia de «y» posibles.' },
  ],
  tecnicas: [
    { titulo: 'Punto a punto', texto: 'Casi todo con conjuntos difusos se reduce a mirar un solo $x$ y razonar con dos números $a$ y $b$ entre 0 y 1.' },
    { titulo: 'Prueba con 0 y 1', texto: 'Para comprobar una operación nueva, mira primero qué hace con los valores extremos: debe devolver lo clásico.' },
  ],
  retos: [
    { id: 'acerca-nubes', tipo: 'manipular', enunciado: R`Mueve las nieblas hasta que el punto que hay justo entre ellas tenga grado de «A y B» de al menos $0{,}9$.`,
      precision: (e) => (enMedio(e) >= 0.9 ? 1 : 0), pendiente: (e) => `Ahora vale ${enMedio(e).toFixed(2).replace('.', ',')}. Hace falta 0,9.`, prueba: { A: [480, 290], B: [620, 290] }, pistas: ['Cuanto más cerca del centro de las dos, mayor es la menor densidad.'], explicacion: 'Para que «A y B» sea alto, tienen que ser altas las dos.' },
    { id: 'casa-interseccion', tipo: 'calcular', enunciado: R`Con la tabla: con 6 dormitorios, ¿cuánto vale «cómoda y grande» si cómoda es $0{,}3$ y grande es $0{,}8$?`, respuesta: 0.3, tol: 0.001, pistas: ['«Y» toma el menor.'], explicacion: R`$\min(0{,}3;\ 0{,}8) = 0{,}3$.` },
    { id: 'casa-complemento', tipo: 'calcular', enunciado: R`Una casa tiene grado $0{,}7$ en «cómoda» y $0{,}6$ en «grande». ¿Cuánto vale «no cómoda o grande»?`, respuesta: 0.6, tol: 0.001, pistas: [R`Primero «no cómoda»: $1 - 0{,}7$.`, 'Luego «o» toma el mayor.'], explicacion: R`$\max(0{,}3;\ 0{,}6) = 0{,}6$.` },
  ],
  referencias: ['L. A. Zadeh, «Fuzzy sets» (1965).', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 2.2: el ejemplo de las casas.'],
};
