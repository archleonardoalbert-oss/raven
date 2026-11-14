import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v, d = 1) => v.toFixed(d).replace('.', '{,}');
const orden = (e) => [e.a[0], e.b[0], e.c[0]].sort((p, q) => p - q);
const tri = (a, b, c) => (x) => Math.max(0, Math.min(b > a ? (x - a) / (b - a) : 1, c > b ? (c - x) / (c - b) : 1));
const DOM = [0, 10];

export default {
  id: '2-1-parametrizadas',
  titulo: 'Una curva con pocos botones',
  puente: 'Ya sabes describir una curva con tres números. Pero el triángulo no es la única forma: hay un pequeño catálogo, y cada forma sirve para algo.',
  pregunta: 'Para describir «cerca de 7» habría que dar un grado a cada número, y hay infinitos. ¿Se puede guardar toda esa curva en solo tres números?',
  escena: {
    id: 'parametrizadas', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: [0, 1], caja: { x: 110, y: 70, w: 860, h: 390 } },
    entradas: [
      { id: 'a', tipo: 'arrastre', eje: 'x', valor: [2, 0], region: { x: DOM, y: [0, 1] } },
      { id: 'b', tipo: 'arrastre', eje: 'x', valor: [5, 0], region: { x: DOM, y: [0, 1] } },
      { id: 'c', tipo: 'arrastre', eje: 'x', valor: [8, 0], region: { x: DOM, y: [0, 1] } },
    ],
    pasos: [
      { dur: 2000, texto: 'Un conjunto difuso es una curva. Podríamos apuntar su grado punto a punto, pero no acabaríamos nunca.' },
      { dur: 2200, texto: 'Fíjate en esta curva. Para saberlo todo de ella basta un número: <b style="color:#58c4dd;font-weight:400">dónde empieza</b>, $a$.' },
      { dur: 2200, texto: 'Otro: <b style="color:#f4d345;font-weight:400">dónde está la cima</b>, $b$. Allí el grado vale 1.' },
      { dur: 2200, texto: 'Y otro: <b style="color:#fc6282;font-weight:400">dónde termina</b>, $c$. Con esos tres queda decidida toda la curva.' },
      { dur: 3000, texto: 'Cada trío de números es un conjunto distinto, y todos salen de la misma fórmula. A esos números se les llama parámetros: son los botones de la curva.' },
    ],
    primitivas({ q, paso, e }) {
      const [a, b, c] = orden(e), f = tri(a, b, c);
      const N = [marco({ x: DOM, y: [0, 1] }, { alfa: ev(q(0), 0, 0.3), ticks: { x: [0, 2, 4, 6, 8, 10], y: [0, 1] }, etiquetas: { x: 'x', y: R`\mu` }, colorY: ORO })];
      const t = ev(q(0), 0.1, 1);
      if (t > 0) N.push(curva((x) => [x, f(x)], DOM, { hasta: t, n: 300, color: BLANCO, ancho: 3.2, brillo: true }));
      const marca = (v, y, color, nombre, al) => {
        if (al <= 0) return;
        N.push(linea([v, y], [v, 0], { color, ancho: 1.4, alfa: 0.7 * al, discontinua: true }), punto([v, y], { color, radio: 7, alfa: al }), rotulo([v, 0], R`${nombre} = ${coma(v)}`, { clave: nombre, dy: 34, tam: 20, color, alfa: al }));
      };
      marca(a, f(a), AZUL, 'a', ev(q(1), 0, 0.6));
      marca(b, f(b), ORO, 'b', ev(q(2), 0, 0.6));
      marca(c, f(c), ROSA, 'c', ev(q(3), 0, 0.6));
      if (paso === 4) {
        const al = ev(q(4), 0, 0.3);
        [[0.5, 2, 3.5], [3, 3.5, 9.5], [6, 8.5, 9.5]].forEach(([u, v, w], i) => {
          const m = ev(q(4), 0.15 + i * 0.2, 0.45 + i * 0.2), g = tri(mix(a, u, m), mix(b, v, m), mix(c, w, m));
          N.push(curva((x) => [x, g(x)], DOM, { n: 200, color: GRIS2, ancho: 1.6, alfa: 0.5 * al }));
        });
      }
      if (paso >= 3) N.push(rotulo([9.8, 0.92], R`\text{tres números: }(${coma(a)};\ ${coma(b)};\ ${coma(c)})`, { clave: 'trio', ancla: 'r', tam: 22, color: BLANCO, alfa: ev(q(3), 0.5, 1) }));
      return N;
    },
  },
  manipulacion: '<ul><li>Arrastra por la gráfica las líneas de $a$, $b$ y $c$: la curva entera les obedece.</li><li>Junta $a$ y $b$: el lado izquierdo se vuelve un acantilado.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una tabla de grados sirve con unas pocas cosas, como los dormitorios de una casa. Pero si hablamos de temperaturas o de alturas, hay infinitos valores. Necesitamos una regla corta que los cubra todos.' },
    { tipo: 'idea', etiqueta: 'El truco', texto: 'Se elige una <em>forma</em> de curva y se deja que unos pocos números la ajusten. Esos números se llaman [[parámetros|parámetro]]. Lo que guardas ya no son infinitos grados, sino solo esos números.' },
    { tipo: 'ejemplo', texto: 'El triángulo con $a = 2$, $b = 5$, $c = 9$. Sube recto de 2 a 5, y baja recto de 5 a 9:', tabla: [['x', '2', '3,5', '5', '7', '8', '9'], ['Grado', '0', '0,5', '1', '0,5', '0,25', '0']], cierre: 'Cada grado sale de contar: en $x = 8$ quedan 1 de los 4 pasos de la bajada: 0,25.' },
    { tipo: 'simbolos', intro: 'La fórmula es corta si la lees por partes.', piezas: [
      { tex: R`\dfrac{x - a}{b - a}`, dice: 'La subida. Vale 0 en $a$ y 1 en $b$: qué fracción del camino llevas.' },
      { tex: R`\dfrac{c - x}{c - b}`, dice: 'La bajada. Vale 1 en $b$ y 0 en $c$: qué fracción te queda.' },
      { tex: R`\min(\ \cdot\ ,\ \cdot\ )`, dice: 'El menor de los dos. A la izquierda de la cima, manda la subida; a la derecha, la bajada.' },
      { tex: R`\max(\ \cdot\ ,\ 0)`, dice: 'Fuera del triángulo, las fracciones se hacen negativas. Esto las deja en 0.' },
    ], todo: R`\mu(x) = \max\left(\min\left(\dfrac{x - a}{b - a},\ \dfrac{c - x}{c - b}\right),\ 0\right)`, lee: '«El grado es el menor entre subida y bajada, sin bajar de 0». Y son solo tres botones: $a$, $b$ y $c$.' },
    { tipo: 'formal', titulo: 'Función de pertenencia parametrizada', tex: R`Una familia parametrizada es una regla $\mu(x;\ \theta)$ que da una función de pertenencia para cada valor de los parámetros $\theta$. En la triangular, $\theta = (a, b, c)$ con $a < b < c$.`, lee: 'La letra griega $\\theta$, «theta», representa todos los parámetros juntos. El punto y coma separa lo que varía, $x$, de lo que se fija antes, $\\theta$.' },
    { tipo: 'idea', etiqueta: 'Sus cortes', texto: 'Una ventaja de las formas simples: sus cortes salen con una cuenta. Pon el listón en $\\alpha$ y mira dónde corta las dos rectas.' },
    { tipo: 'demo', titulo: 'El corte de un triángulo', plan: 'Es la cuenta que hiciste a mano en la región 1, dicha en general. La usarás al operar con números difusos.', tex: R`Para $\alpha \in (0, 1]$, el corte es el intervalo $A_\alpha = [\,a + \alpha(b - a),\ c - \alpha(c - b)\,]$.`, pasos: [
      { texto: R`$x \in A_\alpha$ quiere decir $\min\left(\frac{x - a}{b - a},\ \frac{c - x}{c - b}\right) \ge \alpha$, pues con $\alpha > 0$ el $\max$ con 0 no cambia nada.`, porque: 'Definición de corte y fórmula de la triangular. Un número mayor o igual que $\\alpha > 0$ ya es positivo.' },
      { texto: R`Eso equivale a $\frac{x - a}{b - a} \ge \alpha$ y $\frac{c - x}{c - b} \ge \alpha$.`, porque: 'El menor de dos números llega a $\\alpha$ si y solo si llegan los dos: lo demostraste en «α-cortes».' },
      { texto: R`Multiplicando por los denominadores, que son positivos: $x \ge a + \alpha(b - a)$ y $x \le c - \alpha(c - b)$.`, porque: 'Multiplicar por un positivo conserva la desigualdad; luego se despeja $x$.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Lee una fórmula por sus trozos', texto: 'Antes de intentar entender una fórmula entera, aísla cada trozo y pregúntate cuánto vale en los puntos clave.' },
    { titulo: 'Min y máx como interruptores', texto: 'Con $\\min$ y $\\max$ puedes escribir en una línea lo que parecen varios casos: el que manda en cada zona se elige solo.' },
  ],
  retos: [
    { id: 'ajusta-triangulo', tipo: 'manipular', enunciado: R`Moldea «cerca de 7»: que empiece en 5, tenga la cima en 7 y termine en 9, con error menor que $0{,}25$.`,
      precision: (e) => { const [a, b, c] = orden(e); return [Math.abs(a - 5) < 0.25, Math.abs(b - 7) < 0.25, Math.abs(c - 9) < 0.25].filter(Boolean).length / 3; },
      prueba: { a: [5, 0], b: [7, 0], c: [9, 0] }, pistas: ['Arrastra cada línea: $a$ es el primer pie, $b$ la cima, $c$ el último pie.'], explicacion: 'Tres números, y toda la curva queda decidida.' },
    { id: 'punto-triangulo', tipo: 'calcular', enunciado: R`Con $a = 2$, $b = 5$, $c = 9$, ¿cuánto vale $\mu(6)$?`, respuesta: 0.75, tol: 0.006, pistas: ['Como 6 está a la derecha de la cima, manda la bajada.', R`$\frac{c - x}{c - b} = \frac{9 - 6}{4}$.`], explicacion: R`$\frac{3}{4} = 0{,}75$.` },
    { id: 'cuantos-numeros', tipo: 'elegir', enunciado: '¿Qué ganamos al usar una forma con parámetros?', opciones: ['Que los grados ya son exactos', 'Que toda la curva se guarda y se ajusta con pocos números', 'Que ya no hace falta elegir la curva', 'Que los grados suman 1'], correcta: 1, explicacion: 'Elegir sigue siendo modelar, pero ahora hay solo unos botones que ajustar. Más adelante, un programa podrá ajustarlos solo.' },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001.', 'J.-S. R. Jang, C.-T. Sun, E. Mizutani, <em>Neuro-Fuzzy and Soft Computing</em>, Prentice Hall, 1997, cap. 2.'],
};
