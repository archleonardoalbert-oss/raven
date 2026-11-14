import { ORO, ROJO } from '../../motor/colores.js';
import { alfaOp, componerAlfa } from '../../nucleo/razonar.js';
import { componer } from '../../nucleo/relaciones.js';
import { rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { LIENZO, matriz } from '../parte4/matriz.js';

const R = String.raw;
const coma = (v) => String(+v.toFixed(2)).replace('.', '{,}');
const P = [[0.8, 0.3], [0.5, 1]], Q = [[0.4, 0.9], [0.6, 0.2]], RES = componer(P, Q), G = componerAlfa(P, RES);
const iguales = (A, B) => A.every((f, i) => f.every((v, j) => Math.abs(v - B[i][j]) < 1e-9));

export default {
  id: '5-7-ecuaciones',
  titulo: 'Razonar hacia atrás: ecuaciones relacionales',
  puente: 'Puedes usar una regla, en las dos direcciones. Es hora de escribir la primera regla de tu péndulo.',
  pregunta: 'Sabes cómo cada enfermedad causa síntomas, y ves los síntomas de un paciente. ¿Qué enfermedad tiene? Es encadenar relaciones, pero al revés.',
  escena: {
    id: 'ecuaciones', formato: 'plano', W: 1100, H: 480, ejes: LIENZO(1100, 480),
    entradas: [
      { id: 'u', tipo: 'deslizador', etiqueta: 'prueba otro valor: casilla de abajo a la derecha de Q', min: 0, max: 1, paso: 0.1, valor: 0.5 },
    ],
    pasos: [
      { dur: 2400, texto: 'Conoces $P$ y conoces el resultado $R$ de componer. Lo que falta es <b style="color:#f4d345;font-weight:400">$Q$</b>: es como una división, pero con mínimos y máximos.' },
      { dur: 3000, texto: 'Hay una receta: para cada casilla de $Q$, mira qué le permite cada casilla de $P$ y de $R$, y quédate con lo más restrictivo. Sale <b style="color:#f4d345;font-weight:400">la mayor solución posible</b>.' },
      { dur: 2600, texto: 'Comprueba: al componer $P$ con esa $Q$, sale exactamente $R$. Pero, ojo: puede haber otras soluciones menores, y a veces ninguna.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.5), a = ev(q(1), 0, 0.7), b = ev(q(2), 0, 0.7), N = [];
      N.push(...matriz(P, { x: 110, y: 90, lado: 74, filas: ['p₁', 'p₂'], cols: ['s₁', 's₂'], alfa: al, id: 'P' }), rotulo([184, 54], 'P', { clave: 'lP', tam: 26, alfa: al, dy: -14 }));
      N.push(rotulo([310, 164], R`\circ`, { clave: 'op', tam: 34, alfa: al }), rotulo([680, 164], '=', { clave: 'ig', tam: 30, alfa: al }));
      const prueba = paso === 2 && q(2) >= 1 ? [[G[0][0], G[0][1]], [G[1][0], e.u]] : G, mostrar = prueba.map((f) => f.map((v) => +v.toFixed(2)));
      N.push(...matriz(mostrar, { x: 420, y: 90, lado: 74, filas: ['s₁', 's₂'], cols: ['d₁', 'd₂'], alfa: Math.max(0.15, a), id: 'Q' }), rotulo([494, 54], 'Q', { clave: 'lQ', tam: 26, color: ORO, alfa: al, dy: -14 }));
      N.push(...matriz(RES, { x: 780, y: 90, lado: 74, filas: ['p₁', 'p₂'], cols: ['d₁', 'd₂'], alfa: al, id: 'R' }), rotulo([854, 54], 'R', { clave: 'lR', tam: 26, alfa: al, dy: -14 }));
      if (a > 0 && paso === 1) N.push(rotulo([550, 330], R`Q_{11} = \min(\ {\color{#58c4dd}\alpha}(0{,}8;\ ${coma(RES[0][0])}),\ {\color{#58c4dd}\alpha}(0{,}5;\ ${coma(RES[1][0])})\ ) = ${coma(G[0][0])}`, { clave: 'rec', tam: 24, alfa: a }));
      if (b > 0) {
        const c = componer(P, prueba), ok = iguales(c, RES);
        N.push(rotulo([550, 330], R`P \circ Q = \begin{pmatrix} ${coma(c[0][0])} & ${coma(c[0][1])} \\ ${coma(c[1][0])} & ${coma(c[1][1])} \end{pmatrix}`, { clave: 'com', tam: 24, alfa: b }));
        N.push(rotulo([550, 410], ok ? R`\text{es una solución}` : R`\text{no da } R`, { clave: 'ok', tam: 26, color: ok ? ORO : ROJO, alfa: b }));
      }
      return N;
    },
  },
  manipulacion: '<ul><li>Baja la casilla por debajo de 0,5: sigue dando $R$. Hay muchas soluciones menores.</li><li>Súbela por encima de 0,5: se rompe. Por eso la candidata es la mayor.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Hasta ahora: conoces las dos relaciones y calculas la composición. Una [[ecuación relacional|ecuación relacional]] da la vuelta al problema: conoces el resultado y una de las piezas, y buscas la otra. Sirve para diagnosticar, y para deducir reglas a partir de ejemplos.' },
    { tipo: 'ejemplo', texto: 'La herramienta es una pregunta muy concreta: ¿cuál es el mayor $c$ tal que $\\min(a, c)$ no se pase de $b$?', tabla: [['a', 'b', 'Mayor c', 'Por qué'], ['0,3', '0,7', '1', 'a ya no se pasa: c puede ser todo'], ['0,7', '0,3', '0,3', 'c tiene que limitar: no puede pasar de b'], ['0,5', '0,5', '1', 'a llega justo: c puede ser todo']], cierre: 'Esta operación se escribe $a \\,\\alpha\\, b$. Fíjate: es la implicación de Gödel.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`P \circ Q = R`, dice: 'La ecuación: $P$ y $R$ conocidas, $Q$ desconocida.' },
      { tex: R`a \,\alpha\, b`, dice: 'El mayor $c$ con $\\min(a, c) \\le b$: es 1 si $a \\le b$, y $b$ si no.' },
      { tex: R`\inf_x`, dice: 'De todas las $x$, lo más restrictivo. Es el [[ínfimo]], parecido a un mínimo: lo contrario del [[supremo]].' },
    ], todo: R`\mu_{\hat{Q}}(y, z) = \inf_x \big(\mu_P(x, y) \,\alpha\, \mu_R(x, z)\big)`, lee: '«Para cada casilla de $Q$, mira qué permite cada fila, y quédate con lo más restrictivo». El sombrero en $\\hat{Q}$ indica que es la solución calculada.' },
    { tipo: 'formal', titulo: 'Teorema de Sanchez (1976)', tex: R`La ecuación $P \circ Q = R$ tiene solución si y solo si $\hat{Q}$ lo es. Y en ese caso, $\hat{Q}$ es la mayor de todas las soluciones.`, lee: 'Basta con probar una sola candidata. Si esa no funciona, no funciona ninguna.' },
    { tipo: 'demo', titulo: 'Toda solución cabe en la candidata', plan: 'Es la mitad más interesante del teorema. Sale directamente de cómo se ha definido $\\alpha$.', tex: R`Si $P \circ Q = R$, entonces $Q \subseteq \hat{Q}$.`, pasos: [
      { texto: R`Fijemos $x$, $y$, $z$. Como $\mu_R(x, z)$ es el [[supremo]] de los caminos, el camino por $y$ no lo supera: $\min(\mu_P(x, y), \mu_Q(y, z)) \le \mu_R(x, z)$.`, porque: 'Definición de composición: $R = P \\circ Q$.' },
      { texto: R`Por definición de $\alpha$ como el <em>mayor</em> número con esa propiedad: $\mu_Q(y, z) \le \mu_P(x, y) \,\alpha\, \mu_R(x, z)$.`, porque: '$\\mu_Q(y, z)$ es uno de los candidatos, y $\\alpha$ es el mayor.' },
      { texto: R`Esto vale para todo $x$. Luego $\mu_Q(y, z)$ no supera a ninguno, ni a lo más restrictivo: $\mu_Q(y, z) \le \mu_{\hat{Q}}(y, z)$.`, porque: 'Si un número no supera a ninguno de los valores, no supera a su [[ínfimo]].' },
    ] },
    { tipo: 'nota', titulo: 'Y la otra mitad', texto: 'También se cumple siempre $P \\circ \\hat{Q} \\subseteq R$, por definición de $\\alpha$. Con eso, si hay alguna solución $Q$: $R = P \\circ Q \\subseteq P \\circ \\hat{Q} \\subseteq R$, y por tanto $\\hat{Q}$ también es solución.' },
  ],
  tecnicas: [
    { titulo: 'Define por lo que quieres que cumpla', texto: 'El operador $\\alpha$ se define como «el mayor que cumple tal cosa». Cuando algo se define así, la propiedad clave sale gratis.' },
    { titulo: 'Si existe, es esta', texto: 'Un truco muy potente: encontrar una candidata que, si hay solución, tiene que serlo. Así se cambia «¿existe?» por «¿funciona esta?».' },
  ],
  retos: [
    { id: 'alfa-calc', tipo: 'calcular', enunciado: R`¿Cuánto vale $0{,}9 \,\alpha\, 0{,}4$?`, respuesta: alfaOp(0.9, 0.4), tol: 0.001, pistas: ['¿Se cumple $a \\le b$?'], explicacion: R`Como $0{,}9 > 0{,}4$, vale $b = 0{,}4$.` },
    { id: 'hay-solucion', tipo: 'elegir', enunciado: R`Calculas $\hat{Q}$, y $P \circ \hat{Q}$ no da $R$. ¿Qué concluyes?`, opciones: ['Que hay otra solución menor', 'Que hay otra solución mayor', 'Que la ecuación no tiene solución', 'Que hay que repetir la cuenta con otro $\\alpha$'], correcta: 2, explicacion: 'Por el teorema: si alguna funcionara, $\\hat{Q}$ también funcionaría.' },
    { id: 'demuestra-sanchez', tipo: 'demostrar', enunciado: R`Demuestra que $\min(a,\ a \,\alpha\, b) \le b$.`, pistas: ['Separa dos casos: $a \\le b$ y $a > b$.'],
      solucion: [
        { texto: R`Si $a \le b$: $a \,\alpha\, b = 1$, y $\min(a, 1) = a \le b$.`, porque: 'Definición de $\\alpha$, y la hipótesis.' },
        { texto: R`Si $a > b$: $a \,\alpha\, b = b$, y $\min(a, b) = b \le b$.`, porque: 'Definición de $\\alpha$; el menor es $b$.' },
      ] },
  ],
  referencias: ['E. Sanchez, «Resolution of composite fuzzy relation equations», <em>Information and Control</em> 30 (1976).', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 6.'],
};
