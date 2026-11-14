import { AZUL, BLANCO, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { decisionCoste, matrizCoste, umbralCoste } from '../../nucleo/ia.js';
import { marco, poligono, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { barra, coma } from '../parte9/comun.js';

const R = String.raw;
const P = [0.1, 0.25, 0.4, 0.15, 0.1], L = 5, MAS = P.indexOf(Math.max(...P));
const costes = (b) => { const C = matrizCoste(L, b); return C[0].map((_, j) => P.reduce((s, p, y) => s + p * C[y][j], 0)); };
const ESI = (i) => `${i + 1}`;

export default {
  id: '13-1-coste',
  titulo: 'Errores que no pesan igual',
  puente: 'El sistema ya decide, y sabes por qué. Pero alguien preguntará algo más exigente: ¿qué tendría que haber sido distinto para que decidiera otra cosa?',
  pregunta: 'Si el modelo reparte así, lo más probable es el nivel 3 de urgencia. ¿Es lo que debes decidir? No, si equivocarse hacia un lado cuesta mucho más que hacia el otro.',
  escena: {
    id: 'coste', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [0, 5], y: [0, 0.5], caja: { x: 60, y: 70, w: 300, h: 340 } },
    entradas: [{ id: 'b', tipo: 'deslizador', etiqueta: 'β: cuánto más cuesta quedarse corto', min: 1, max: 8, paso: 0.1, valor: 4 }],
    pasos: [
      { dur: 2800, texto: 'Un paciente de juguete. El reparto entre los cinco niveles de urgencia: 1 es lo más urgente; 5, lo menos. El mayor es <b style="color:#58c4dd;font-weight:400">el nivel 3</b>.' },
      { dur: 3400, texto: 'Ahora, lo que cuesta cada error. Fila: la verdad. Columna: lo que decides. Abajo a la izquierda, pasarse de urgente. Arriba a la derecha, <b style="color:#f05a5a;font-weight:400">quedarse corto</b>: vale $\\beta$ veces más.' },
      { dur: 3000, texto: 'Se multiplica el reparto por cada columna: el <b>coste esperado</b> de cada decisión. Con $\\beta = 1$, gana el nivel 3: lo más probable, y lo más barato, coinciden.' },
      { dur: 3400, texto: 'Sube $\\beta$. Cuando quedarse corto duele cuatro veces más, <b style="color:#f4d345;font-weight:400">la mejor decisión es el nivel 2</b>, aunque no sea el más probable. La decisión no es el reparto.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, b = paso <= 2 ? 1 : mix(1, e.b, ev(q(3), 0.05, 0.9)), C = matrizCoste(L, b), c = costes(b), d = decisionCoste(P, C), top = Math.max(...costes(8));
      const A = [marco({ x: [0, 5], y: [0, 0.5] }, { alfa: al, ticks: { x: [], y: [0, 0.5] }, etiquetas: { y: R`\text{probabilidad}` } })];
      P.forEach((p, i) => A.push(barra(i + 0.14, i + 0.86, p * ev(q(0), i / 10, i / 10 + 0.5), { color: i === MAS ? AZUL : GRIS2, alfa: al * (i === MAS ? 0.9 : 0.55) }), rotulo([i + 0.5, 0], ESI(i), { clave: `pe${i}`, dy: 16, tam: 17, color: GRIS2, alfa: al }), rotulo([i + 0.5, p], coma(p), { clave: `pv${i}`, dy: -13, tam: 15, alfa: al })));
      const M = [];
      if (g1 > 0) { const mx = 8 * 4; for (let y = 0; y < L; y++) for (let j = 0; j < L; j++) { const v = C[y][j], sube = j > y, X = j, Y = L - 1 - y; M.push(poligono([[X + 0.04, Y + 0.04], [X + 0.96, Y + 0.04], [X + 0.96, Y + 0.96], [X + 0.04, Y + 0.96]], { color: j === y ? BLANCO : sube ? ROJO : AZUL, alfa: g1 * (j === y ? 0.08 : 0.14 + 0.7 * Math.min(1, v / (sube ? mx * 0.45 : 8))) }), rotulo([X + 0.5, Y + 0.5], v === Math.round(v) ? String(v) : coma(v, 1), { clave: `c${y}${j}`, tam: 14, alfa: g1 })); } M.push(rotulo([2.5, 5], R`\text{decides} \to`, { clave: 'mx', dy: -14, tam: 15, color: GRIS2, alfa: g1 }), rotulo([0, 2.5], R`\text{verdad}`, { clave: 'my', ancla: 'r', dx: -10, tam: 15, color: GRIS2, alfa: g1 })); }
      const G = [marco({ x: [0, 5], y: [0, top] }, { alfa: g2, ticks: { x: [], y: [0] }, etiquetas: { y: R`\text{coste esperado}` } })];
      if (g2 > 0) c.forEach((v, i) => G.push(barra(i + 0.14, i + 0.86, v, { color: i === d ? ORO : GRIS2, alfa: g2 * (i === d ? 0.95 : 0.5) }), rotulo([i + 0.5, 0], ESI(i), { clave: `ge${i}`, dy: 16, tam: 17, color: i === d ? ORO : GRIS2, alfa: g2 }), rotulo([i + 0.5, v], coma(v), { clave: `gv${i}`, dy: -13, tam: 15, color: i === d ? ORO : BLANCO, alfa: g2 })));
      G.push(rotulo([5, top], R`\beta = ${coma(b, 1)}`, { clave: 'be', ancla: 'r', dy: -6, tam: 21, color: ROJO, alfa: g1 }));
      return { principal: A, paneles: [{ ejes: { x: [0, 5], y: [0, 5], caja: { x: 430, y: 90, w: 230, h: 230 } }, prims: M }, { ejes: { x: [0, 5], y: [0, top], caja: { x: 730, y: 70, w: 320, h: 340 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Mueve $\\beta$, y mira qué barra es la más baja.</li><li>Busca el punto exacto donde la decisión salta de un nivel a otro.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Separa dos preguntas. «¿Qué creo?» es el reparto de probabilidad. «¿Qué hago?» depende además de lo que cuesta equivocarse. Elegir lo más probable solo es lo mejor si todos los errores pesan igual. En urgencias no pesan igual: mandar a casa a alguien grave es mucho peor que hacer esperar en una sala a alguien sano.' },
    { tipo: 'ejemplo', texto: 'Dos opciones, y $p$ es la probabilidad de que sea grave. Dejar pasar un caso grave cuesta 4; alarmar sin motivo cuesta 1.', tabla: [['Decisión', 'Coste esperado', 'Con p = 0,3'], ['Alarmar', '1 − p', '0,7'], ['No alarmar', '4p', '1,2']], cierre: 'Con solo un 30 % de que sea grave, conviene alarmar. El umbral no es 0,5, sino 0,2.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`p_y`, dice: 'La probabilidad de que la verdad sea el nivel $y$.' },
      { tex: R`C_{y j}`, dice: 'Lo que cuesta decidir $j$ cuando la verdad es $y$.' },
      { tex: R`\beta`, dice: 'Cuánto más cuesta quedarse corto. En nuestra matriz, $C_{y j} = \\beta (j - y)$ si $j > y$, y $C_{y j} = y - j$ si $j < y$.' },
    ], todo: R`\hat{j} = \arg\min_j \sum_y p_y\, C_{y j}`, lee: '«Decide lo que menos cuesta de media, teniendo en cuenta lo que crees». Se llama decisión de Bayes.' },
    { tipo: 'formal', titulo: 'Decisión de mínimo coste', tex: R`Dada una matriz de costes $C$ y un reparto $p$, la decisión de Bayes es $\arg\min_j \sum_y p_y C_{y j}$. Si $p$ está calibrado, minimiza el coste esperado real. Con dos clases, y costes $c_{FN}$ y $c_{FP}$, equivale a alarmar cuando $p > \frac{c_{FP}}{c_{FP} + c_{FN}}$.`, lee: 'Aquí se ve por qué calibrar importa: esta fórmula usa $p$ como una probabilidad de verdad. Con un modelo que exagera, el umbral queda mal puesto. Los valores de $\\beta$ son una decisión clínica y ética, no técnica.' },
    { tipo: 'demo', titulo: 'De dónde sale el umbral', plan: 'Se igualan los dos costes esperados y se despeja.', tex: R`Conviene alarmar si, y solo si, $p > \frac{c_{FP}}{c_{FP} + c_{FN}}$.`, pasos: [
      { texto: R`Alarmar cuesta $c_{FP}$ cuando no es grave: de media, $(1 - p)\, c_{FP}$.`, porque: 'Solo se paga si la alarma era falsa.' },
      { texto: R`No alarmar cuesta $c_{FN}$ cuando es grave: de media, $p\, c_{FN}$.`, porque: 'Solo se paga si se deja pasar.' },
      { texto: R`Alarmar es mejor si $(1 - p)\, c_{FP} < p\, c_{FN}$, es decir, si $c_{FP} < p\,(c_{FP} + c_{FN})$.`, porque: 'Se pasa $p\, c_{FP}$ al otro lado.' },
      { texto: R`Dividiendo por $c_{FP} + c_{FN} > 0$, queda la fórmula.`, porque: 'Con $c_{FN} = 4$ y $c_{FP} = 1$, el umbral es $\\frac{1}{5}$.' },
    ] },
    { tipo: 'nota', titulo: 'Juguete', texto: 'Estos números son inventados, para ver el mecanismo. Un sistema real de triaje necesita datos reales, validación clínica y personas que respondan por él. Nada de este curso sirve para decidir sobre pacientes.' },
  ],
  tecnicas: [{ titulo: 'Separa creer de decidir', texto: 'Primero estima probabilidades, y luego elige con los costes. Así, si cambian los costes, no hay que volver a entrenar nada.' }],
  retos: [
    { id: 'baja-beta', tipo: 'manipular', enunciado: R`Baja $\beta$ hasta que la mejor decisión vuelva a ser el nivel 3, el más probable.`, precision: (e) => (decisionCoste(P, matrizCoste(L, e.b)) === MAS ? 1 : 0), prueba: { b: 1 }, pendiente: (e) => `Con este β, la mejor decisión es el nivel ${decisionCoste(P, matrizCoste(L, e.b)) + 1}.`, pistas: ['Cuando los errores pesan casi igual, gana lo más probable.'], explicacion: 'La decisión depende de los costes tanto como de las creencias.' },
    { id: 'umbral-calc', tipo: 'calcular', enunciado: R`Si dejar pasar un caso grave cuesta 9 y alarmar sin motivo cuesta 1, ¿a partir de qué $p$ conviene alarmar?`, respuesta: umbralCoste(9, 1), tol: 0.001, pistas: [R`$\frac{c_{FP}}{c_{FP} + c_{FN}}$.`], explicacion: R`$\frac{1}{10} = 0{,}1$.` },
    { id: 'dec-elegir', tipo: 'elegir', enunciado: 'Tu modelo exagera su seguridad. ¿Qué le pasa a la decisión de mínimo coste?', opciones: ['Nada: solo usa el orden', 'Puede ser mala: usa las probabilidades como si fueran ciertas', 'Mejora', 'Deja de existir'], correcta: 1, explicacion: 'Por eso se calibra antes de decidir.' },
    { id: 'demuestra-iguales', tipo: 'demostrar', enunciado: R`Demuestra que, si todos los errores cuestan 1 y acertar cuesta 0, la decisión de Bayes es la clase más probable.`, pistas: [R`Escribe $\sum_y p_y C_{y j}$ con esos costes.`], solucion: [{ texto: R`$\sum_y p_y C_{y j} = \sum_{y \ne j} p_y = 1 - p_j$.`, porque: 'Solo se paga si la verdad no es $j$, y las probabilidades suman 1.' }, { texto: R`Minimizar $1 - p_j$ es maximizar $p_j$.`, porque: 'Así, «elegir lo más probable» es un caso particular, con unos costes muy concretos.' }] },
  ],
  referencias: ['C. Elkan, «The Foundations of Cost-Sensitive Learning», <em>IJCAI</em> (2001).', 'C. Guo et al., <em>ICML</em> (2017).'],
};
