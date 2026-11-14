import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { orness, owa, pesosOwa } from '../../nucleo/ia.js';
import { linea, marco, punto, rotulo, curva } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { barra, coma } from '../parte9/comun.js';

const R = String.raw;
const V = [0.9, 0.7, 0.45, 0.3, 0.15], n = V.length;

export default {
  id: '11-5-owa',
  titulo: 'Preguntar de varias formas: OWA',
  puente: 'Ya tienes grados en los que confiar, salidos de un texto. Falta usarlos: que la decisión pase por conceptos y reglas que una persona pueda leer.',
  pregunta: 'Haces la misma pregunta de cinco formas, y un modelo responde con cinco grados distintos. ¿Basta con que una lo diga? ¿Hacen falta todas? ¿O «la mayoría»? Hay un solo botón que recorre todo ese camino.',
  escena: {
    id: 'owa', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [0, 5], y: [0, 1], caja: { x: 70, y: 60, w: 480, h: 180 } },
    entradas: [{ id: 'o', tipo: 'deslizador', etiqueta: 'orness: de «todos» (0) a «alguno» (1)', min: 0, max: 1, paso: 0.01, valor: 0.5 }],
    pasos: [
      { dur: 2800, texto: 'Cinco formas de preguntar, cinco grados. Lo primero: <b>ordenarlos de mayor a menor</b>. Aquí está lo distinto. Los pesos no van unidos a una pregunta, sino a una posición: «el mayor», «el segundo»...' },
      { dur: 3000, texto: 'Abajo, los pesos. Cada grado se multiplica por el peso de su posición, y se suma. Con todos iguales, sale <b>la media</b>.' },
      { dur: 3400, texto: 'Pon todo el peso en el primero: es <b style="color:#58c4dd;font-weight:400">el máximo</b>, «alguno». Y todo en el último: <b style="color:#fc6282;font-weight:400">el mínimo</b>, «todos». Entre ellos, cualquier actitud.' },
      { dur: 2800, texto: 'El número que resume esa actitud se llama <b style="color:#f4d345;font-weight:400">orness</b>. A la derecha, el resultado según él: una sola curva, del «y» al «o», que pasa por la media.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, o = paso <= 1 ? 0.5 : paso === 2 ? 0.5 + 0.5 * Math.sin(ev(q(2), 0, 1) * 6.2832) : mix(0.5, e.o, ev(q(3), 0, 0.5)), w = pesosOwa(n, Math.max(0.005, Math.min(0.995, o))), res = owa(V, w);
      const A = [marco({ x: [0, 5], y: [0, 1] }, { alfa: al, soloBase: true, ticks: { x: [], y: [0, 1] }, etiquetas: { y: R`\text{grados}` } })];
      V.forEach((v, i) => A.push(barra(i + 0.14, i + 0.86, v * ev(q(0), i / 10, i / 10 + 0.5), { color: GRIS2, alfa: 0.5 * al }), rotulo([i + 0.5, v], coma(v), { clave: `v${i}`, dy: -13, tam: 15, alfa: al })));
      if (g1 > 0) A.push(linea([0, res], [5, res], { color: ORO, ancho: 2.6, alfa: g1 }), rotulo([5, res], R`${coma(res)}`, { clave: 'r', ancla: 'l', dx: 8, tam: 22, color: ORO, alfa: g1 }));
      const W = [marco({ x: [0, 5], y: [0, 1] }, { alfa: g1, soloBase: true, ticks: { x: [], y: [0, 1] }, etiquetas: { y: R`\text{pesos}` } })];
      if (g1 > 0) w.forEach((p, i) => W.push(barra(i + 0.14, i + 0.86, Math.min(1, p), { color: ORO, alfa: 0.85 * g1 }), rotulo([i + 0.5, 0], R`w_{${i + 1}}`, { clave: `w${i}`, dy: 15, tam: 15, color: GRIS2, alfa: g1 }), rotulo([i + 0.5, Math.min(1, p)], coma(p), { clave: `pw${i}`, dy: -12, tam: 14, alfa: g1 })));
      const g3 = paso >= 2 ? ev(q(2), 0, 0.4) : 0, G = [marco({ x: [0, 1], y: [0, 1] }, { alfa: g3, ticks: { x: [0, 0.5, 1], y: [0, 1] }, etiquetas: { x: R`\text{orness}`, y: R`\text{resultado}` } })];
      if (g3 > 0) { G.push(curva((u) => [u, owa(V, pesosOwa(n, Math.max(0.005, Math.min(0.995, u))))], [0, 1], { n: 100, color: ORO, ancho: 2.8, alfa: g3 }), punto([o, res], { color: ORO, radio: 7, alfa: g3 })); G.push(linea([0, 0.15], [1, 0.15], { color: ROSA, ancho: 1, alfa: 0.7 * g3, discontinua: true }), linea([0, 0.9], [1, 0.9], { color: AZUL, ancho: 1, alfa: 0.7 * g3, discontinua: true }), rotulo([1, 0.15], R`\min`, { clave: 'mn', ancla: 'r', dy: 14, tam: 15, color: ROSA, alfa: g3 }), rotulo([0, 0.9], R`\max`, { clave: 'mx', ancla: 'l', dy: -13, dx: 6, tam: 15, color: AZUL, alfa: g3 }), rotulo([1, 1], R`\text{orness} = ${coma(orness(w))}`, { clave: 'on', ancla: 'r', dy: -16, tam: 19, alfa: g3 })); }
      return { principal: A, paneles: [{ ejes: { x: [0, 5], y: [0, 1], caja: { x: 70, y: 300, w: 480, h: 180 } }, prims: W }, { ejes: { x: [0, 1], y: [0, 1], caja: { x: 680, y: 90, w: 340, h: 340 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Lleva el orness a los extremos: el resultado llega al mayor y al menor de los grados.</li><li>En 0,5, compara el resultado con la media de los cinco.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una media ponderada dice: «esta fuente pesa más». Un OWA dice otra cosa: «el mejor resultado pesa más, venga de donde venga». Eso permite escribir frases como «la mayoría de las formas de preguntar lo apoyan». Sirve para unir varias redacciones de una pregunta, o varios modelos, en un solo grado más estable. Y así, el «y» y el «o» dejan de ser dos operaciones aparte: son los extremos de una misma familia.' },
    { tipo: 'ejemplo', texto: 'Con los grados $0{,}2;\\ 0{,}9;\\ 0{,}5$, que ordenados son $0{,}9;\\ 0{,}5;\\ 0{,}2$:', tabla: [['Pesos', 'Cuenta', 'Resultado', 'Actitud'], ['1, 0, 0', '0,9', '0,9', 'alguno'], ['⅓, ⅓, ⅓', '(0,9 + 0,5 + 0,2) entre 3', '0,533', 'la media'], ['0, 1, 0', '0,5', '0,5', 'la mediana'], ['0, 0, 1', '0,2', '0,2', 'todos']], cierre: 'Los mismos grados, y cuatro respuestas distintas, según lo que se le pida al consenso.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`b_j`, dice: 'El grado que ocupa la posición $j$ una vez ordenados de mayor a menor.' },
      { tex: R`w_j`, dice: 'El peso de esa posición. Son positivos, y suman 1.' },
      { tex: R`\mathrm{orness}`, dice: 'De la palabra inglesa <em>or</em>: cuánto se parece a un «o». Vale 1 en el máximo y 0 en el mínimo.' },
    ], todo: R`\mathrm{OWA}(a_1, \dots, a_n) = \sum_{j = 1}^n w_j\, b_j`, lee: 'OWA significa <em>ordered weighted averaging</em>: media ponderada ordenada.' },
    { tipo: 'formal', titulo: 'Operadores OWA (Yager, 1988)', tex: R`Dados pesos $w_j \ge 0$ con $\sum_j w_j = 1$, se define $\mathrm{OWA}(a) = \sum_j w_j b_j$, donde $b$ es $a$ ordenado de mayor a menor. Y su actitud es $\mathrm{orness}(w) = \frac{1}{n - 1} \sum_{j = 1}^n (n - j)\, w_j$.`, lee: 'Es simétrico: da igual el orden de las preguntas. Y siempre queda entre el mínimo y el máximo.' },
    { tipo: 'demo', titulo: 'Los tres puntos clave del orness', plan: 'Se sustituye cada caso en la definición.', tex: R`El máximo tiene orness 1; el mínimo, 0; y la media, $\frac{1}{2}$.`, pasos: [
      { texto: R`Máximo: $w_1 = 1$. Solo queda el término $j = 1$: $\frac{1}{n - 1}(n - 1) = 1$.`, porque: 'Los demás pesos son 0.' },
      { texto: R`Mínimo: $w_n = 1$. Solo queda $j = n$, con factor $n - n = 0$.`, porque: 'Luego el orness es 0.' },
      { texto: R`Media: $w_j = \frac{1}{n}$. Queda $\frac{1}{n(n - 1)} \sum_{j = 1}^n (n - j) = \frac{1}{n(n - 1)} \cdot \frac{n(n - 1)}{2} = \frac{1}{2}$.`, porque: 'La suma $0 + 1 + \\dots + (n - 1)$ vale $\\frac{n(n - 1)}{2}$.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Pesa posiciones, no fuentes', texto: 'Si no sabes en quién confiar pero sí qué actitud quieres, pesa por el orden. Es lo que convierte «la mayoría» en una fórmula.' }],
  retos: [
    { id: 'optimista', tipo: 'manipular', enunciado: R`Ajusta la actitud para que el resultado llegue al menos a $0{,}75$.`, precision: (e) => (owa(V, pesosOwa(n, Math.max(0.005, Math.min(0.995, e.o)))) >= 0.75 ? 1 : 0), prueba: { o: 0.95 }, pendiente: (e) => `Ahora, el resultado es ${owa(V, pesosOwa(n, Math.max(0.005, Math.min(0.995, e.o)))).toFixed(2).replace('.', ',')}.`, pistas: ['Se parece más a «alguno» que a «todos».'], explicacion: 'Con una actitud optimista, los grados altos dominan.' },
    { id: 'owa-calc', tipo: 'calcular', enunciado: R`Grados $0{,}4;\ 0{,}8;\ 0{,}6$, con pesos $0{,}5;\ 0{,}3;\ 0{,}2$. ¿Cuánto vale el OWA?`, respuesta: 0.66, tol: 0.001, pistas: ['Ordena primero: 0,8; 0,6; 0,4.'], explicacion: R`$0{,}5 \cdot 0{,}8 + 0{,}3 \cdot 0{,}6 + 0{,}2 \cdot 0{,}4 = 0{,}66$.` },
    { id: 'owa-elegir', tipo: 'elegir', enunciado: 'Cambias de sitio dos preguntas. ¿Qué le pasa al OWA?', opciones: ['Cambia', 'Nada: ordena antes de pesar', 'Se vuelve el mínimo', 'Depende de los pesos'], correcta: 1, explicacion: 'Lo que cuenta es la posición en el orden, no la pregunta.' },
    { id: 'demuestra-entre-owa', tipo: 'demostrar', enunciado: R`Demuestra que $\min_i a_i \le \mathrm{OWA}(a) \le \max_i a_i$.`, pistas: ['Cada $b_j$ está entre el mínimo y el máximo.'], solucion: [{ texto: R`Para todo $j$: $\min_i a_i \le b_j \le \max_i a_i$.`, porque: 'Los $b_j$ son los mismos números, reordenados.' }, { texto: R`Multiplicando por $w_j \ge 0$ y sumando, con $\sum_j w_j = 1$, queda lo pedido.`, porque: 'Una media ponderada no se sale del rango de sus valores.' }] },
  ],
  referencias: ['R. R. Yager, «On ordered weighted averaging aggregation operators in multicriteria decisionmaking», <em>IEEE Trans. SMC</em> 18 (1988).'],
};
