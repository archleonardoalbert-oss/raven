import { GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { LOGICAS, cadena } from '../../nucleo/logicas.js';
import { rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { LIENZO, matriz } from '../parte4/matriz.js';

const R = String.raw;
const L = LOGICAS.lukasiewicz;
const nom = (v) => v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
const coma = (v) => nom(v).replace(',', '{,}');
const tabla = (V, op) => V.map((a) => V.map((b) => +op(a, b).toFixed(2)));

export default {
  id: '8-4-algebra',
  titulo: 'El álgebra detrás de la lógica',
  puente: 'Queda la última pregunta, la más grande: ¿lo que se puede demostrar y lo que es verdad son lo mismo? Si es que sí, la lógica está terminada.',
  pregunta: 'Con 0 y 1 hay un álgebra que ya conoces, la de Boole. ¿Qué pasa si añades valores? ¿Hay un álgebra para cada una de estas lógicas?',
  escena: {
    id: 'algebra', formato: 'plano', W: 1100, H: 560, ejes: LIENZO(1100, 560),
    entradas: [
      { id: 'n', tipo: 'deslizador', etiqueta: 'cuántos valores', min: 2, max: 7, paso: 1, valor: 5 },
      { id: 'ia', tipo: 'deslizador', etiqueta: 'la fila, a (0 es el primero)', min: 0, max: 6, paso: 1, valor: 3 },
      { id: 'ib', tipo: 'deslizador', etiqueta: 'la columna, b (0 es el primero)', min: 0, max: 6, paso: 1, valor: 2 },
    ],
    pasos: [
      { dur: 2600, texto: 'Dos valores, dos tablas: <b>«y»</b> a la izquierda, <b>«implica»</b> a la derecha. Son las de la lógica clásica. Una lógica, vista así, es solo <b style="color:#f4d345;font-weight:400">un conjunto con operaciones</b>.' },
      { dur: 2600, texto: 'Tres valores: 0, 0,5 y 1. Las tablas crecen. Las esquinas, igual. Fíjate en la casilla central de la izquierda: $0{,}5 \\,\\&\\, 0{,}5 = 0$.' },
      { dur: 2600, texto: 'Cinco valores. Se dibujan los mismos patrones: una diagonal que separa zonas. Si sigues subiendo, tiende al mapa continuo de Łukasiewicz.' },
      { dur: 2800, texto: 'Lo importante: las leyes de estas tablas son siempre las mismas. A <b>cualquier</b> estructura que las cumpla se le llama un <b style="color:#f4d345;font-weight:400">álgebra de BL</b>. Son unas pocas ecuaciones.' },
    ],
    primitivas({ q, paso, e }) {
      const n = paso === 0 ? 2 : paso === 1 ? 3 : paso === 2 ? 5 : Math.round(e.n), V = cadena(n), al = ev(q(paso), 0, 0.3), lado = Math.min(62, 300 / n);
      const i = Math.min(n - 1, Math.round(e.ia)), j = Math.min(n - 1, Math.round(e.ib)), nombres = V.map(nom), N = [];
      const marca = paso === 3 ? [[i, j]] : paso === 1 ? [[1, 1]] : [];
      N.push(...matriz(tabla(V, L.t), { x: 150, y: 90, lado, filas: nombres, cols: nombres, alfa: al, id: `y${n}`, resalta: marca }), ...matriz(tabla(V, L.r), { x: 640, y: 90, lado, filas: nombres, cols: nombres, alfa: al, id: `i${n}`, resalta: paso === 3 ? marca : [] }));
      N.push(rotulo([150 + (lado * n) / 2, 40], R`a \,\&\, b`, { clave: 'ty', tam: 26, color: ORO, alfa: al }), rotulo([640 + (lado * n) / 2, 40], R`a \to b`, { clave: 'ti', tam: 26, color: ROSA, alfa: al }));
      const ley = ev(q(3), 0, 0.5);
      if (ley > 0) {
        N.push(rotulo([550, 438], R`${coma(V[i])} \,\&\, ${coma(V[j])} = {\color{#f4d345}${coma(L.t(V[i], V[j]))}},\qquad ${coma(V[i])} \to ${coma(V[j])} = {\color{#fc6282}${coma(L.r(V[i], V[j]))}}`, { clave: 'lec', tam: 23, alfa: ley }));
        N.push(rotulo([550, 490], R`a \wedge b = a \,\&\, (a \to b) \qquad\qquad (a \to b) \vee (b \to a) = 1`, { clave: 'leyes', tam: 21, alfa: ley }));
        N.push(rotulo([550, 524], R`\text{La divisibilidad, a la izquierda. A la derecha, la prelinealidad.}`, { clave: 'nl', tam: 15, color: GRIS2, alfa: ley }));
      }
      return N;
    },
  },
  manipulacion: '<ul><li>Sube el número de valores, y mira cómo las dos tablas van tendiendo a un mapa continuo.</li><li>Mueve la fila y la columna: la casilla marcada es la cuenta que se escribe debajo.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'George Boole convirtió la lógica clásica en un [[álgebra]]: se pueden hacer cuentas con «y» y «o» como con sumas y productos. Lo mismo se puede hacer aquí. En vez de hablar de fórmulas y demostraciones, se habla de estructuras con operaciones y ecuaciones. Y demostrar una fórmula pasa a ser lo mismo que comprobar una ecuación.' },
    { tipo: 'ejemplo', texto: 'Las leyes de un álgebra de BL, comprobadas con los valores $a = 0{,}75$, $b = 0{,}5$ de Łukasiewicz:', tabla: [['Ley', 'Cuenta', 'Da'], ['El «y» combina y su implicación responde', '0,75 & 0,5 = 0,25 ≤ 0,5', 'sí'], ['Divisibilidad', '0,75 & (0,75 → 0,5) = 0,75 & 0,75', '0,5 = mín'], ['Prelinealidad', 'máx(0,75 → 0,5; 0,5 → 0,75)', 'máx(0,75; 1) = 1']], cierre: 'Las tres se cumplen para cualquier pareja de valores. No dependen de los números: son leyes de la forma.' },
    { tipo: 'simbolos', intro: 'Las piezas de la definición.', piezas: [
      { tex: R`(A, \wedge, \vee)`, dice: 'Un conjunto con mínimo y máximo: un retículo. No hace falta que todos sus elementos se puedan comparar.' },
      { tex: R`(A, \odot, 1)`, dice: 'Una operación $\\odot$, asociativa y conmutativa, con el 1 como elemento que no cambia nada.' },
      { tex: R`x \odot z \le y \iff z \le (x \to y)`, dice: 'El corazón: la implicación es el residuo de $\\odot$.' },
      { tex: R`x \wedge y = x \odot (x \to y)`, dice: 'Divisibilidad: el mínimo se obtiene combinando.' },
    ], todo: R`(x \to y) \vee (y \to x) = 1`, lee: 'Prelinealidad: el mayor de los dos siempre es 1. En una cadena, además, uno de los dos vale 1. Lo que separa a BL de MTL es la divisibilidad, no esta ley.' },
    { tipo: 'formal', titulo: 'Álgebra de BL', tex: R`Es una estructura $(A, \odot, \to, \wedge, \vee, 0, 1)$ con: un retículo con mínimo 0 y máximo 1; $\odot$ asociativa y conmutativa, con 1 como neutro; el residuo; divisibilidad; y prelinealidad. [[Las normas T|norma T]] continuas dan las álgebras de BL sobre $[0, 1]$.`, lee: 'Si además cumple $\\neg\\neg x = x$, se llama álgebra MV: es la de Łukasiewicz, estudiada por Chang en 1958.' },
    { tipo: 'demo', titulo: 'En una cadena, la prelinealidad es gratis', plan: 'En una [[cadena]], todos los elementos se comparan. Entonces siempre vale una de las dos desigualdades, y una implicación es 1.', tex: R`Si $A$ es una cadena, entonces $(x \to y) \vee (y \to x) = 1$.`, pasos: [
      { texto: R`Por ser cadena, $x \le y$ o $y \le x$.`, porque: 'Es la definición de cadena.' },
      { texto: R`Si $x \le y$: $x \to y = 1$. Si $y \le x$: $y \to x = 1$.`, porque: 'La implicación vale 1 justo cuando hay orden.' },
      { texto: R`En los dos casos, el máximo de ambas es 1.`, porque: 'Y todo álgebra de BL se puede descomponer en cadenas, por este motivo: es la llave de la completitud.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Olvida qué son, y mira cómo operan', texto: 'Lo que hace el álgebra: fórmulas, números o tablas importan poco si cumplen las mismas ecuaciones. Lo que pruebas para una, vale para todas.' },
    { titulo: 'Comprueba en lo simple, concluye en lo general', texto: 'Si todo objeto se descompone en piezas simples, basta probar una ley para esas piezas. Aquí, las piezas son las cadenas.' },
  ],
  retos: [
    { id: 'busca-tabla', tipo: 'manipular', enunciado: R`Con cinco valores, busca $a$ y $b$, los dos distintos de 0, con $a \,\&\, b = 0$.`, precision: (e) => { const n = Math.round(e.n), V = cadena(n), a = V[Math.min(n - 1, Math.round(e.ia))], b = V[Math.min(n - 1, Math.round(e.ib))]; return n === 5 && a > 0 && b > 0 && L.t(a, b) === 0 ? 1 : 0; }, prueba: { n: 5, ia: 1, ib: 2 }, pistas: [R`Vale 0 cuando $a + b \le 1$.`], explicacion: 'Dos frases que son verdad a medias pueden no dejar nada de verdad al combinarse: es lo que hace esta lógica tan distinta.' },
    { id: 'cadena-calc', tipo: 'calcular', enunciado: R`En la cadena de cinco valores, ¿cuánto vale $0{,}75 \,\&\, 0{,}75$?`, respuesta: 0.5, tol: 0.001, pistas: [R`$0{,}75 + 0{,}75 - 1$.`], explicacion: R`Es $0{,}5$.` },
    { id: 'algebra-elegir', tipo: 'elegir', enunciado: '¿Cuál es la ley que hace que todo se pueda descomponer en cadenas?', opciones: ['La conmutatividad', 'La prelinealidad', 'Que el 1 no cambia nada', 'La divisibilidad'], correcta: 1, explicacion: 'Dice que dos elementos se comportan como si fueran comparables, aunque no lo sean: por eso cada álgebra se descompone en cadenas.' },
    { id: 'demuestra-prelineal', tipo: 'demostrar', enunciado: R`Demuestra que, en un álgebra de BL, $x \to x = 1$.`, pistas: ['Usa el corazón con $z = 1$.'],
      solucion: [
        { texto: R`Por el corazón: $1 \le (x \to x)$ equivale a $x \odot 1 \le x$.`, porque: 'Se toma $z = 1$ e $y = x$.' },
        { texto: R`Como $x \odot 1 = x$, esa desigualdad es cierta.`, porque: 'El 1 no cambia nada.' },
        { texto: R`Por tanto, $x \to x \ge 1$, es decir, vale 1.`, porque: 'Nada pasa del máximo.' },
      ] },
  ],
  referencias: ['P. Hájek, <em>Metamathematics of Fuzzy Logic</em>, 1998, cap. 2.', 'C. C. Chang, «Algebraic analysis of many valued logics», <em>Trans. AMS</em> 88 (1958).', 'Stanford Encyclopedia of Philosophy, «Fuzzy Logic».'],
};
