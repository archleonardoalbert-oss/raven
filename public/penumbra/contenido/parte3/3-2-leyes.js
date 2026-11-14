import { AZUL, BLANCO, ORO, ROSA } from '../../motor/colores.js';
import { gaussiana } from '../../nucleo/difuso.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const DOM = [0, 10], A = gaussiana(3.8, 1.6), B = gaussiana(6.2, 1.3), C = gaussiana(5, 2.6);
const no = (u) => 1 - u;
const LEYES = [
  { nombre: 'De Morgan', izq: R`\overline{A \cap B}`, der: R`\overline{A} \cup \overline{B}`, fi: (x) => no(Math.min(A(x), B(x))), fd: (x) => Math.max(no(A(x)), no(B(x))) },
  { nombre: 'Distributiva', izq: R`A \cap (B \cup C)`, der: R`(A \cap B) \cup (A \cap C)`, fi: (x) => Math.min(A(x), Math.max(B(x), C(x))), fd: (x) => Math.max(Math.min(A(x), B(x)), Math.min(A(x), C(x))) },
  { nombre: 'Absorción', izq: R`A \cap (A \cup B)`, der: R`A`, fi: (x) => Math.min(A(x), Math.max(A(x), B(x))), fd: (x) => A(x) },
  { nombre: 'Idempotencia', izq: R`A \cap A`, der: R`A`, fi: (x) => Math.min(A(x), A(x)), fd: (x) => A(x) },
];

export default {
  id: '3-2-leyes',
  titulo: 'Las leyes que se conservan',
  puente: 'Casi todo sobrevive. Pero dos leyes muy famosas no. Y su caída no es un defecto: es exactamente lo que hace que esto sea difuso.',
  pregunta: 'En lógica clásica, «no (A y B)» es lo mismo que «no A o no B». ¿Sigue siendo cierto cuando todo es cuestión de grado?',
  escena: {
    id: 'leyes', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: [0, 1], caja: { x: 110, y: 90, w: 860, h: 370 } },
    entradas: [
      { id: 'ley', tipo: 'deslizador', etiqueta: 'ley (0 a 3)', min: 0, max: 3, paso: 1, valor: 0 },
      { id: 'x', tipo: 'arrastre', eje: 'x', valor: [5, 0], region: { x: DOM, y: [0, 1] } },
    ],
    pasos: [
      { dur: 1800, texto: 'Dos conjuntos, <b style="color:#58c4dd;font-weight:400">A</b> y <b style="color:#fc6282;font-weight:400">B</b>. Vamos a comprobar una ley: la de De Morgan.' },
      { dur: 2400, texto: 'El lado izquierdo: «no (A y B)». Se calcula el «y» y luego se le da la vuelta. Es la curva blanca.' },
      { dur: 2400, texto: 'El lado derecho, por su cuenta: «no A o no B». Se dibuja en dorado, y cae exactamente encima.' },
      { dur: 2400, texto: 'No es casualidad de esta curva. En cada punto, los dos lados dan el mismo número. Pasa la línea por donde quieras.' },
    ],
    primitivas({ q, paso, e }) {
      const ley = LEYES[paso >= 3 ? Math.round(e.ley) : 0], al = ev(q(0), 0, 0.4), x = paso >= 3 ? e.x[0] : 5;
      const N = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 5, 10], y: [0, 1] }, etiquetas: { x: 'x', y: R`\mu` } })];
      const t = Math.max(ev(q(0), 0, 1), 1e-3);
      N.push(curva((u) => [u, A(u)], DOM, { hasta: t, n: 200, color: AZUL, ancho: 2, alfa: 0.55 }), curva((u) => [u, B(u)], DOM, { hasta: t, n: 200, color: ROSA, ancho: 2, alfa: 0.55 }));
      if (q(1) > 0) N.push(curva((u) => [u, ley.fi(u)], DOM, { hasta: Math.max(ev(q(1), 0, 1), 1e-3), n: 500, color: BLANCO, ancho: 6, alfa: 0.75 }));
      if (q(2) > 0) N.push(curva((u) => [u, ley.fd(u)], DOM, { hasta: Math.max(ev(q(2), 0, 1), 1e-3), n: 500, color: ORO, ancho: 2.6 }));
      const fa = ev(q(1), 0, 0.4);
      N.push(rotulo([5, 1.14], R`\text{${ley.nombre}:}\quad {${ley.izq}} \ ${q(2) > 0.5 ? '=' : ''}\ ${q(2) > 0.5 ? `{\\color{#f4d345}${ley.der}}` : ''}`, { clave: 'ley', tam: 26, alfa: Math.max(al, fa) }));
      const s = ev(q(3), 0, 0.4);
      if (s > 0) {
        N.push(linea([x, 0], [x, ley.fi(x)], { color: BLANCO, ancho: 1.3, alfa: 0.6 * s, discontinua: true }), punto([x, ley.fi(x)], { color: ORO, radio: 7, alfa: s }));
        N.push(rotulo([x, ley.fi(x)], R`${coma(ley.fi(x))} = ${coma(ley.fd(x))}`, { clave: 'igual', dx: 16, dy: -20, ancla: 'l', tam: 22, color: ORO, alfa: s }));
      }
      return N;
    },
  },
  manipulacion: '<ul><li>Cambia de ley con el deslizador: 0 De Morgan, 1 distributiva, 2 absorción, 3 idempotencia.</li><li>Arrastra la línea: busca un punto donde los dos lados no coincidan. No lo encontrarás.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La pregunta', texto: 'Las leyes de la lógica son lo que permite manipular frases sin cambiar su sentido. Si cambiamos «y», «o» y «no», hay que volver a comprobarlas. La mayoría sobreviven, y la razón es muy simple.' },
    { tipo: 'ejemplo', texto: 'De Morgan con números. Sean $a = 0{,}7$ y $b = 0{,}4$:', tabla: [['Lado', 'Cuenta', 'Resultado'], ['no (a y b)', '1 − mín(0,7; 0,4)', '0,6'], ['(no a) o (no b)', 'máx(0,3; 0,6)', '0,6']], cierre: 'El mismo número, por dos caminos. Y pasa con cualquier pareja.' },
    { tipo: 'idea', etiqueta: 'Por qué funciona', texto: 'Darle la vuelta a un número con $1 - a$ invierte el orden: el mayor pasa a ser el menor. Por eso, al pasar por el «no», el mínimo se convierte en máximo, y al revés.' },
    { tipo: 'simbolos', intro: 'La ley, leída.', piezas: [
      { tex: R`\overline{A \cap B}`, dice: 'La raya tapa todo lo de abajo: «no (A y B)».' },
      { tex: R`\overline{A} \cup \overline{B}`, dice: '«No A, o no B».' },
    ], todo: R`\overline{A \cap B} = \overline{A} \cup \overline{B}`, lee: 'Dos conjuntos son iguales si tienen el mismo grado en cada punto. Eso es lo que hay que comprobar.' },
    { tipo: 'formal', titulo: 'Las leyes que siguen valiendo con mín, máx y 1 − a', tex: R`[[Conmutativa|conmutativa]]: $A \cap B = B \cap A$. &nbsp;[[Asociativa|asociativa]]: $(A \cap B) \cap C = A \cap (B \cap C)$.<br>Idempotencia: $A \cap A = A$. &nbsp;Absorción: $A \cap (A \cup B) = A$.<br>Distributiva: $A \cap (B \cup C) = (A \cap B) \cup (A \cap C)$.<br>De Morgan: $\overline{A \cap B} = \overline{A} \cup \overline{B}$. &nbsp;Doble negación: $\overline{\overline{A}} = A$.`, lee: 'Todas valen también cambiando $\\cap$ por $\\cup$ y al revés.' },
    { tipo: 'demo', titulo: 'De Morgan, con todo el rigor', plan: 'El truco habitual: fija un punto, y separa dos casos según cuál de los dos grados es el menor.', tex: R`Para todo $x$: $\ 1 - \min(\mu_A(x), \mu_B(x)) = \max(1 - \mu_A(x),\ 1 - \mu_B(x))$.`, pasos: [
      { texto: R`Fijemos $x$ y sean $a = \mu_A(x)$, $b = \mu_B(x)$. Supongamos $a \le b$.`, porque: 'Si es al revés, se intercambian los nombres: las dos fórmulas son simétricas.' },
      { texto: R`El lado izquierdo es $1 - \min(a, b) = 1 - a$.`, porque: 'Como $a \le b$, el mínimo es $a$.' },
      { texto: R`Como $a \le b$, restando de 1: $1 - a \ge 1 - b$. Luego el lado derecho es $\max(1 - a,\ 1 - b) = 1 - a$.`, porque: 'Restar de 1 invierte la desigualdad. El máximo es el mayor de los dos.' },
      { texto: R`Los dos lados valen $1 - a$. Como $x$ era cualquiera, los conjuntos son iguales.`, porque: 'Dos conjuntos difusos son iguales si coinciden punto a punto.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Sin perder generalidad', texto: 'Si una fórmula es simétrica en $a$ y $b$, puedes suponer $a \\le b$: el otro caso es igual, cambiando los nombres.' },
    { titulo: 'Min y máx se resuelven ordenando', texto: 'Una vez que sabes cuál es el menor, $\\min$ y $\\max$ desaparecen y queda una cuenta normal.' },
  ],
  retos: [
    { id: 'comprueba-ley', tipo: 'calcular', enunciado: R`Con $a = 0{,}3$ y $b = 0{,}6$, calcula $\max(1 - a,\ 1 - b)$.`, respuesta: 0.7, tol: 0.001, pistas: [R`$1 - a = 0{,}7$ y $1 - b = 0{,}4$.`], explicacion: R`$0{,}7$, igual que $1 - \min(0{,}3;\ 0{,}6)$: se cumple De Morgan.` },
    { id: 'cual-se-conserva', tipo: 'elegir', enunciado: 'Con mínimo, máximo y $1 - a$, ¿cuál de estas leyes sigue valiendo siempre?', opciones: [R`$A \cap \overline{A} = \varnothing$: nada es «A y no A»`, R`$A \cup \overline{A} = X$: todo es «A o no A»`, R`$\overline{A \cup B} = \overline{A} \cap \overline{B}$: De Morgan`, 'Ninguna'], correcta: 2, explicacion: 'Las dos primeras son justo las que caen. Lo verás en la siguiente parada.' },
    { id: 'demuestra-morgan', tipo: 'demostrar', enunciado: R`Demuestra la otra ley de De Morgan: $\ 1 - \max(a, b) = \min(1 - a,\ 1 - b)$.`, pistas: [R`Supón $a \le b$ y mira qué vale cada lado.`],
      solucion: [
        { texto: R`Supongamos $a \le b$. El lado izquierdo es $1 - \max(a, b) = 1 - b$.`, porque: 'Como $a \le b$, el máximo es $b$. Si fuera al revés, basta cambiar los nombres.' },
        { texto: R`Como $a \le b$, $1 - b \le 1 - a$. Luego el lado derecho es $\min(1 - a,\ 1 - b) = 1 - b$.`, porque: 'Restar de 1 invierte el orden.' },
        { texto: R`Los dos lados valen $1 - b$.`, porque: 'Queda demostrado para cada pareja $(a, b)$, y por tanto para cada punto $x$.' },
      ] },
  ],
  referencias: ['G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 1 y 3.', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 2.2.'],
};
