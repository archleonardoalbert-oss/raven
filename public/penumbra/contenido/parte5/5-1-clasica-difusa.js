import { AZUL, GRIS2, ORO, ROSA, TEXTO, escalaGrado } from '../../motor/colores.js';
import { poligono, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { LIENZO } from '../parte4/matriz.js';

const R = String.raw;
const OPS = [
  { nombre: 'y', tex: R`a \wedge b`, f: Math.min, regla: R`\min(a, b)` },
  { nombre: 'o', tex: R`a \vee b`, f: Math.max, regla: R`\max(a, b)` },
  { nombre: 'si… entonces', tex: R`a \to b`, f: (a, b) => Math.max(1 - a, b), regla: R`\max(1 - a,\ b)` },
];

/** La tabla de una operación con n valores por lado: de 2 (lo clásico) a muchos (lo difuso). */
function tabla(op, n, x, y, lado, al, id, N) {
  const s = lado / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = n === 1 ? 0 : i / (n - 1), b = n === 1 ? 0 : j / (n - 1), v = op.f(a, b), X = x + i * s, Y = y + (n - 1 - j) * s;
    N.push(poligono([[X + 0.5, Y + 0.5], [X + s - 0.5, Y + 0.5], [X + s - 0.5, Y + s - 0.5], [X + 0.5, Y + s - 0.5]], { color: escalaGrado(v), alfa: al }));
    if (n <= 3) N.push(rotulo([X + s / 2, Y + s / 2], String(v).replace('.', '{,}'), { clave: `${id}${i}${j}`, tam: 22, color: v > 0.55 ? [0, 0, 0] : [255, 255, 255], alfa: al }));
  }
  N.push(rotulo([x + lado / 2, y + lado + 16], 'a', { clave: `${id}a`, tam: 18, color: AZUL, alfa: al }), rotulo([x - 14, y + lado / 2], 'b', { clave: `${id}b`, tam: 18, color: ROSA, alfa: al }));
  N.push(rotulo([x + lado / 2, y - 24], op.tex, { clave: `${id}t`, tam: 26, color: TEXTO, alfa: al }));
}

export default {
  id: '5-1-clasica-difusa',
  titulo: 'De dos valores a infinitos',
  puente: 'De las tres operaciones, la más delicada es «si… entonces». Hay varias formas razonables de extenderla, y elegir bien importa mucho.',
  pregunta: 'La lógica clásica solo conoce verdadero y falso. Pero «hoy hace calor» es verdad a medias. ¿Se puede razonar en serio con medias verdades?',
  escena: {
    id: 'clasica', formato: 'plano', W: 1100, H: 500, ejes: LIENZO(1100, 500),
    entradas: [{ id: 'n', tipo: 'deslizador', etiqueta: 'cuántos valores de verdad', min: 2, max: 40, paso: 1, valor: 40 }],
    pasos: [
      { dur: 2200, texto: 'La lógica clásica cabe en tres tablitas. Solo hay dos valores: 0 es falso, y 1 es verdadero. Cada casilla es el resultado.' },
      { dur: 2400, texto: 'Hace un siglo, Łukasiewicz se preguntó: ¿y si hubiera un tercer valor, 0,5, para lo que no es ni cierto ni falso? La tabla crece, y sus esquinas no cambian.' },
      { dur: 3400, texto: 'Sigue añadiendo valores. La cuadrícula se va afinando, hasta volverse un mapa continuo. Eso es la lógica difusa: <b style="color:#f4d345;font-weight:400">infinitos valores de verdad</b>.' },
      { dur: 2000, texto: 'Fíjate en las cuatro esquinas de cada mapa: siguen siendo la tabla clásica. Lo difuso no la borra: la rellena por dentro.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.5);
      const n = paso === 0 ? 2 : paso === 1 ? (ev(q(1), 0, 0.4) >= 1 ? 3 : 2) : paso === 2 ? Math.round(mix(3, 40, ev(q(2), 0, 1))) : Math.round(e.n);
      const N = [];
      OPS.forEach((op, k) => tabla(op, n, 110 + k * 330, 100, 250, al, `t${k}`, N));
      if (paso >= 3) OPS.forEach((op, k) => N.push(rotulo([235 + k * 330, 400], op.regla, { clave: `r${k}`, tam: 24, color: ORO, alfa: ev(q(3), 0, 0.5) })));
      N.push(rotulo([550, 450], R`\text{${n} valores de verdad}`, { clave: 'n', tam: 21, color: GRIS2, alfa: al }));
      return N;
    },
  },
  manipulacion: '<ul><li>Mueve el número de valores: con 2, la lógica de toda la vida; con 40, ya casi continua.</li><li>Fíjate en cómo las esquinas no cambian nunca.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Aristóteles dejó dos reglas: toda frase es cierta o falsa, nunca las dos. Durante más de dos mil años fue suficiente. Pero ya en 1923 Bertrand Russell avisaba: la lógica de siempre supone símbolos precisos, y por eso sirve para un mundo imaginario, no para este.' },
    { tipo: 'ejemplo', texto: 'Las tablas clásicas, con 0 falso y 1 verdadero:', tabla: [['a', 'b', 'a y b', 'a o b', 'si a, entonces b'], ['0', '0', '0', '0', '1'], ['0', '1', '0', '1', '1'], ['1', '0', '0', '1', '0'], ['1', '1', '1', '1', '1']], cierre: 'Fíjate en la última columna: «si a, entonces b» solo es falsa cuando a es cierta y b es falsa.' },
    { tipo: 'idea', etiqueta: 'Abrir el intervalo', texto: 'Lo difuso cambia una sola cosa: los valores de verdad ya no son {0, 1}, sino todo el [[intervalo]] [0, 1]. Las tablas se convierten en fórmulas. La condición es que, en las esquinas, sigan dando lo clásico.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\wedge`, dice: 'El «y» lógico. Parece la $\\cap$ de los conjuntos, y no es casualidad.' },
      { tex: R`\vee`, dice: 'El «o» lógico. Parece la $\\cup$.' },
      { tex: R`\neg`, dice: 'El «no» lógico.' },
      { tex: R`\to`, dice: 'La [[implicación]]: «si…, entonces…».' },
    ], todo: R`v(a \wedge b) = \min(v(a),\ v(b))`, lee: '«La verdad de “a y b” es la menor de sus verdades». La $v$ es de «valor de verdad». Son las operaciones de los conjuntos, escritas de otra forma.' },
    { tipo: 'formal', titulo: 'Lógica difusa, en sentido estricto', tex: R`Es una lógica cuyos valores de verdad son $[0, 1]$. Cada conectiva se define por una función sobre esos valores, que coincide con la clásica en $\{0, 1\}$: una [[norma T]] para «y», una [[norma S]] para «o», y un [[complemento]] para «no».`, lee: 'La correspondencia es exacta: pertenecer a un conjunto es que sea verdad la frase «$x$ es $A$».' },
    { tipo: 'nota', titulo: 'No es «lógica de lo vago»', texto: 'Lo que tiene grados es la verdad de las frases, no el razonamiento. Las reglas para deducir son tan exactas como las clásicas: la región 8 las estudia con todo el rigor.' },
  ],
  tecnicas: [
    { titulo: 'Comprueba las esquinas', texto: 'Toda extensión de la lógica debe coincidir con la clásica en los extremos. Es la primera prueba que se le hace a cualquier fórmula nueva.' },
  ],
  retos: [
    { id: 'tabla-verdad', tipo: 'calcular', enunciado: R`Si «hace calor» tiene verdad $0{,}8$ y «hay humedad» tiene $0{,}3$, ¿qué verdad tiene «hace calor y no hay humedad», con mínimo y $1 - a$?`, respuesta: 0.7, tol: 0.001, pistas: [R`«No hay humedad» vale $0{,}7$.`], explicacion: R`$\min(0{,}8;\ 0{,}7) = 0{,}7$.` },
    { id: 'dos-valores', tipo: 'elegir', enunciado: '¿Qué condición debe cumplir cualquier fórmula para una conectiva difusa?', opciones: ['Que dé siempre un valor intermedio', 'Que en las esquinas, con 0 y 1, coincida con la tabla clásica', 'Que sume 1', 'Que sea una recta'], correcta: 1, explicacion: 'Lo difuso generaliza a lo clásico: no lo contradice.' },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 1 (la cita de Russell) y cap. 9.', 'Stanford Encyclopedia of Philosophy, «Fuzzy Logic».', 'J. Łukasiewicz (1920): lógica de tres valores.'],
};
