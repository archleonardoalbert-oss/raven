import { AZUL, BLANCO, GRIS2, ORO, ROJO, ROSA } from '../../motor/colores.js';
import { conjuncionReal } from '../../nucleo/ia.js';
import { punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { barra, coma, tramo } from '../parte9/comun.js';

const R = String.raw;
/** Dónde colocar la franja B en la población para que se solape justo lo pedido con A = [0, a]. */
function colocar(a, b, solape) {
  const s0 = (s) => Math.max(0, Math.min(a, s + b) - s); let lo = 0, hi = 1 - b;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (s0(m) > solape) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

export default {
  id: '11-1-probabilidad',
  titulo: 'Cuándo una probabilidad es un grado',
  puente: 'El producto solo es una probabilidad si los números de entrada ya lo eran. Y un modelo que dice «80 %», ¿acierta de verdad ocho de cada diez veces? Vamos a medirlo.',
  pregunta: 'Un modelo dice 0,7 a «tiene dolor» y 0,6 a «suda». Si multiplicas, sale 0,42. ¿Es esa la probabilidad de que le pasen las dos cosas? Depende de algo que los números no dicen.',
  escena: {
    id: 'probabilidad', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [0, 1], y: [0, 3], caja: { x: 70, y: 70, w: 960, h: 210 } },
    entradas: [
      { id: 'a', tipo: 'deslizador', etiqueta: 'a', min: 0.05, max: 0.95, paso: 0.01, valor: 0.7 },
      { id: 'b', tipo: 'deslizador', etiqueta: 'b', min: 0.05, max: 0.95, paso: 0.01, valor: 0.6 },
      { id: 'r', tipo: 'deslizador', etiqueta: 'relación entre ellas (−1 se evitan, 1 van juntas)', min: -1, max: 1, paso: 0.01, valor: 0 },
    ],
    pasos: [
      { dur: 2800, texto: 'Mira a toda la población como una franja. El <b style="color:#58c4dd;font-weight:400">70 %</b> tiene dolor. El <b style="color:#fc6282;font-weight:400">60 %</b> suda. La pregunta es <b>cuánto se solapan</b>.' },
      { dur: 3000, texto: 'Si una cosa no dice nada sobre la otra, el solape es el producto: <b style="color:#f4d345;font-weight:400">0,42</b>. Es lo que supone la [[norma T]] del producto, sin decirlo.' },
      { dur: 4200, texto: 'Pero mueve la franja. Si van juntas, el solape sube hasta <b>el mínimo</b>. Si se evitan, baja hasta <b>Łukasiewicz</b>. Con los mismos dos números, cualquier valor intermedio es posible.' },
      { dur: 2800, texto: 'Abajo, la recta: esas dos normas son los <b>límites de lo posible</b>, y el producto es solo un punto entre ellas. Dos grados, por sí solos, no fijan la probabilidad del «y».' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.45), g1 = ev(q(1), 0, 0.5), g3 = ev(q(3), 0, 0.5);
      const r = paso <= 1 ? 0 : paso === 2 ? Math.sin(ev(q(2), 0, 1) * 6.2832) * 1 : mix(0, e.r, ev(q(3), 0, 0.5)), a = paso === 3 ? e.a : 0.7, b = paso === 3 ? e.b : 0.6;
      const real = conjuncionReal(a, b, r), s = colocar(a, b, real), lo = Math.max(0, a + b - 1), hi = Math.min(a, b), ini = Math.max(0, s), fin = Math.min(a, s + b);
      const N = [
        barra(0, 1, 2.8, { color: BLANCO, alfa: 0.06 * al }, 2.2), barra(0, a, 2.8, { color: AZUL, alfa: 0.55 * al }, 2.2), rotulo([0, 2.8], R`A:\ \text{tiene dolor},\ ${coma(a)}`, { clave: 'A', ancla: 'l', dy: -16, tam: 18, color: AZUL, alfa: al }),
        barra(0, 1, 1.5, { color: BLANCO, alfa: 0.06 * al }, 0.9), barra(s, s + b, 1.5, { color: ROSA, alfa: 0.55 * al }, 0.9), rotulo([0, 1.5], R`B:\ \text{suda},\ ${coma(b)}`, { clave: 'B', ancla: 'l', dy: -16, tam: 18, color: ROSA, alfa: al }),
      ];
      if (g1 > 0 && fin > ini) N.push(barra(ini, fin, 0.5, { color: ORO, alfa: 0.9 * g1 }, 0.05), ...tramo([ini, 0.5], [ini, 2.8], { color: ORO, ancho: 1, alfa: 0.5 * g1, discontinua: true }), ...tramo([fin, 0.5], [fin, 2.8], { color: ORO, ancho: 1, alfa: 0.5 * g1, discontinua: true }));
      N.push(rotulo([1, 0.28], R`\text{las dos cosas:}\ \ ${coma(real)}`, { clave: 'real', ancla: 'r', tam: 22, color: ORO, alfa: g1 }));
      const P = [...tramo([0, 0.5], [1, 0.5], { color: GRIS2, ancho: 1.4, alfa: g3 }), barra(lo, hi, 0.68, { color: BLANCO, alfa: 0.12 * g3 }, 0.32)];
      if (g3 > 0) { for (const [v, c, t, dy] of [[lo, ROJO, 'Łukasiewicz', 30], [hi, AZUL, 'mínimo', 30], [a * b, ROSA, 'producto', -24]]) P.push(punto([v, 0.5], { color: c, radio: 6, alfa: g3 }), rotulo([v, 0.5], R`\text{${t}}\ ${coma(v)}`, { clave: t, dy, tam: 16, color: c, alfa: g3 })); P.push(punto([real, 0.5], { color: ORO, radio: 9, alfa: g3 })); }
      return { principal: N, paneles: [{ ejes: { x: [0, 1], y: [0, 1], caja: { x: 70, y: 340, w: 960, h: 140 } }, prims: P }] };
    },
  },
  manipulacion: '<ul><li>Mueve la relación: la franja rosa se desliza, sin cambiar de tamaño.</li><li>Lleva $a$ y $b$ a valores pequeños: si se evitan, el solape llega a 0.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un grado y una probabilidad se escriben igual y no significan lo mismo. «Alto, con grado 0,7» habla de lo borroso de la palabra. «Probabilidad 0,7» habla de lo que no sabes. Pero un modelo de lenguaje da un número que se usa como las dos cosas. Por eso hay que preguntar: ¿cuándo se puede multiplicar y leer una probabilidad? Solo bajo condiciones. Y hay que escribirlas.' },
    { tipo: 'ejemplo', texto: 'Con $a = 0{,}7$ y $b = 0{,}6$, de cada 100 personas:', tabla: [['Situación', 'Con las dos cosas', 'Coincide con'], ['Van siempre juntas', '60', 'el mínimo'], ['Una no dice nada de la otra', '42', 'el producto'], ['Se evitan todo lo posible', '30', 'Łukasiewicz']], cierre: 'Ni con todo el empeño bajan de 30: entre las dos suman 130, y solo hay 100 personas.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`P(A \wedge B)`, dice: 'La probabilidad de que pasen $A$ y $B$ a la vez.' },
      { tex: R`P(A \mid x)`, dice: 'La probabilidad de $A$, sabiendo el caso $x$. La barra se lee «sabiendo».' },
      { tex: R`\mu_k(x)`, dice: 'El grado que da el modelo al concepto $k$ en el caso $x$.' },
    ], todo: R`\max(0,\ a + b - 1) \ \le\ P(A \wedge B) \ \le\ \min(a, b)`, lee: '«Sea cual sea la relación entre $A$ y $B$, el "y" queda entre esos dos valores». Son los límites de Fréchet-Hoeffding: Łukasiewicz por debajo, Gödel por encima.' },
    { tipo: 'formal', titulo: 'Cuándo el producto es una probabilidad', tex: R`Sean conceptos binarios $c_1, \dots, c_K$, y grados $\mu_k(x)$. Si (1) los grados están calibrados, $\mu_k(x) = P(c_k = 1 \mid x)$, y (2) los conceptos son independientes sabiendo $x$, entonces $\prod_k \mu_k(x) = P(c_1 = \dots = c_K = 1 \mid x)$.`, lee: 'Dos hipótesis, y las dos se pueden romper. La primera se mide y se corrige: es lo que sigue. La segunda rara vez se cumple del todo, así que el producto es un modelo, no una verdad.' },
    { tipo: 'demo', titulo: 'Los límites del «y»', plan: 'Dos desigualdades, cada una con un solo argumento.', tex: R`Para sucesos cualesquiera con $P(A) = a$ y $P(B) = b$: $\ \max(0, a + b - 1) \le P(A \wedge B) \le \min(a, b)$.`, pasos: [
      { texto: R`$A \wedge B$ está contenido en $A$, y también en $B$. Luego $P(A \wedge B) \le a$ y $P(A \wedge B) \le b$.`, porque: 'Una parte nunca es más probable que el todo. Por tanto, no pasa del mínimo.' },
      { texto: R`Por otro lado, $P(A \vee B) = a + b - P(A \wedge B)$, y una probabilidad no pasa de 1.`, porque: 'Al sumar $a$ y $b$, el solape se cuenta dos veces.' },
      { texto: R`Luego $a + b - P(A \wedge B) \le 1$, es decir, $P(A \wedge B) \ge a + b - 1$. Y además $P(A \wedge B) \ge 0$.`, porque: 'Se despeja, y se toma el mayor de los dos topes por abajo.' },
      { texto: R`Los dos extremos se alcanzan: basta colocar las franjas pegadas al mismo lado, o en lados opuestos.`, porque: 'Por eso no se pueden mejorar: son exactos.' },
    ] },
    { tipo: 'nota', titulo: 'Atención', texto: 'Que un modelo sume bien sus números no los convierte en probabilidades de nada. Una probabilidad afirma algo que se puede comprobar con frecuencias. Y un grado de «alto» no: nadie «resulta ser» alto con frecuencia 0,7.' },
  ],
  tecnicas: [{ titulo: 'Escribe las hipótesis del producto', texto: 'Cada vez que multipliques grados y lo llames probabilidad, di qué estás suponiendo. Casi siempre es independencia, y casi nunca es del todo cierta.' }],
  retos: [
    { id: 'van-juntas', tipo: 'manipular', enunciado: R`Sin tocar $a$ ni $b$, consigue que las dos cosas pasen a la vez en más del 58 %.`, precision: (e) => (conjuncionReal(e.a, e.b, e.r) > 0.58 ? 1 : 0), prueba: { r: 1 }, pendiente: (e) => `Ahora, el solape es ${conjuncionReal(e.a, e.b, e.r).toFixed(2).replace('.', ',')}.`, pistas: ['Tienen que ir casi siempre juntas.'], explicacion: 'Es casi el mínimo: el producto se queda muy corto cuando los conceptos se acompañan.' },
    { id: 'limite-calc', tipo: 'calcular', enunciado: R`Con $a = 0{,}8$ y $b = 0{,}5$, ¿cuál es el menor valor posible de $P(A \wedge B)$?`, respuesta: 0.3, tol: 0.001, pistas: [R`$\max(0, a + b - 1)$.`], explicacion: R`$0{,}8 + 0{,}5 - 1 = 0{,}3$.` },
    { id: 'prod-elegir', tipo: 'elegir', enunciado: 'Dolor en el pecho y sudor suelen ir juntos. Si multiplicas sus grados calibrados, ¿qué esperas?', opciones: ['Sale exacto', 'Sale por debajo de la probabilidad real', 'Sale por encima de la real', 'No se puede saber nada'], correcta: 1, explicacion: 'Si tienden a coincidir, el solape real supera lo que daría la independencia.' },
    { id: 'demuestra-prop', tipo: 'demostrar', enunciado: R`Demuestra que, con grados calibrados y conceptos independientes sabiendo $x$, $\mu_1(x)\,\mu_2(x) = P(c_1 = 1, c_2 = 1 \mid x)$.`, pistas: ['Empieza por la definición de independencia, y sustituye después.'], solucion: [{ texto: R`Por independencia sabiendo $x$: $P(c_1 = 1, c_2 = 1 \mid x) = P(c_1 = 1 \mid x)\, P(c_2 = 1 \mid x)$.`, porque: 'Es lo que significa esa hipótesis.' }, { texto: R`Por calibración, cada factor es $\mu_k(x)$.`, porque: 'Y la cuenta está hecha. Si cae cualquiera de las dos hipótesis, cae la igualdad.' }] },
  ],
  referencias: ['M. Fréchet, «Sur les tableaux de corrélation dont les marges sont données» (1951); W. Hoeffding (1940).', 'P. Barbiero et al., «Interpretable Neural-Symbolic Concept Reasoning», <em>ICML</em> (2023).'],
};
