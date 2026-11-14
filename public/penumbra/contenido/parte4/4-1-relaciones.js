import { GRIS2, ORO, TEXTO } from '../../motor/colores.js';
import { poligono, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { LIENZO, matriz } from './matriz.js';

const R = String.raw;
const P = ['Ana', 'Beto', 'Cris'], C = ['pizza', 'sopa', 'sushi', 'tacos'];
const NITIDA = [[1, 0, 0, 1], [1, 1, 0, 0], [0, 0, 1, 1]];
const GRADOS = [[0.9, 0.2, 0.4, 0.7], [0.6, 0.8, 0.1, 0.3], [0.3, 0.1, 1, 0.8]];
const r1 = (v) => Math.round(v * 10) / 10;

export default {
  id: '4-1-relaciones',
  titulo: 'Relaciones difusas',
  puente: 'Una relación es una tabla de grados. Pero ¿de dónde sale? La forma más común es combinar dos conjuntos: es el producto cartesiano.',
  pregunta: '«A Ana le gusta la pizza» no es un sí o un no: le gusta bastante. ¿Cómo se guardan todos esos «bastante» entre personas y comidas?',
  escena: {
    id: 'relaciones', formato: 'plano', W: 1100, H: 520, ejes: LIENZO(1100, 520),
    entradas: [
      { id: 'i', tipo: 'deslizador', etiqueta: 'persona (0 a 2)', min: 0, max: 2, paso: 1, valor: 0 },
      { id: 'j', tipo: 'deslizador', etiqueta: 'comida (0 a 3)', min: 0, max: 3, paso: 1, valor: 3 },
    ],
    pasos: [
      { dur: 2000, texto: 'Una relación clásica es una tabla de sí o no. Cada fila es una persona, cada columna una comida. Le gusta, o no le gusta.' },
      { dur: 2800, texto: 'Pero los gustos tienen grados. Cambia cada casilla por un número entre 0 y 1. La misma tabla, ahora con matices.' },
      { dur: 2200, texto: 'Eso es una relación difusa: un grado para cada <em>pareja</em>. Es un conjunto difuso, cuyos elementos son parejas.' },
      { dur: 2200, texto: 'Si las cosas son continuas, la tabla se vuelve un mapa. A la derecha, «$x$ está cerca de $y$»: alto en la diagonal, y cae al alejarse.' },
    ],
    primitivas({ q, paso, e }) {
      const m = ev(q(1), 0, 0.85), M = NITIDA.map((f, i) => f.map((v, j) => r1(mix(v, GRADOS[i][j], m))));
      const i = paso >= 2 ? Math.round(e.i) : 0, j = paso >= 2 ? Math.round(e.j) : 3, marcar = paso >= 2;
      const N = matriz(M, { x: 110, y: 110, lado: 76, filas: P, cols: C, alfa: ev(q(0), 0, 0.5), resalta: marcar ? [[i, j]] : [] });
      if (marcar) N.push(rotulo([262, 400], R`\text{A ${P[i]} le gusta «${C[j]}» con grado } ${String(GRADOS[i][j]).replace('.', '{,}')}`, { clave: 'lee', tam: 23, color: ORO, alfa: ev(q(2), 0, 0.4) }));
      const a = ev(q(3), 0, 0.6);
      if (a > 0) {
        const n = 44, x0 = 660, y0 = 90, lado = 340, s = lado / n;
        for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) {
          const v = Math.exp(-(((u - w) / n) ** 2) / 0.018);
          const c = v < 0.5 ? [mix(26, 58, v * 2), mix(54, 178, v * 2), mix(118, 172, v * 2)] : [mix(58, 244, (v - 0.5) * 2), mix(178, 211, (v - 0.5) * 2), mix(172, 69, (v - 0.5) * 2)];
          N.push(poligono([[x0 + u * s, y0 + (n - w - 1) * s], [x0 + (u + 1) * s, y0 + (n - w - 1) * s], [x0 + (u + 1) * s, y0 + (n - w) * s], [x0 + u * s, y0 + (n - w) * s]], { color: c, alfa: a }));
        }
        N.push(rotulo([x0 + lado / 2, y0 + lado + 18], 'x', { clave: 'ex', tam: 20, color: GRIS2, alfa: a }), rotulo([x0 - 18, y0 + lado / 2], 'y', { clave: 'ey', tam: 20, color: GRIS2, alfa: a }), rotulo([x0 + lado / 2, y0 - 22], R`\text{«}x\text{ cerca de }y\text{»}`, { clave: 'tit', tam: 21, color: TEXTO, alfa: a }));
      }
      return N;
    },
  },
  manipulacion: '<ul><li>Mueve los deslizadores: la casilla marcada cambia, y abajo se lee la frase.</li><li>Fíjate en el mapa de la derecha: cada punto es una pareja $(x, y)$.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Hasta ahora, un conjunto difuso daba un grado a cada <em>cosa</em>. Una [[relación]] difusa da un grado a cada <em>pareja de cosas</em>. No es nada nuevo: es un conjunto difuso cuyo universo son parejas.' },
    { tipo: 'ejemplo', texto: '«A esta persona le gusta esta comida»:', tabla: [['', 'pizza', 'sopa', 'sushi', 'tacos'], ['Ana', '0,9', '0,2', '0,4', '0,7'], ['Beto', '0,6', '0,8', '0,1', '0,3'], ['Cris', '0,3', '0,1', '1', '0,8']], cierre: 'Con pocas cosas, una relación es una tabla: una [[matriz]]. Cada casilla es el grado de una pareja.' },
    { tipo: 'simbolos', intro: 'Cómo se escribe.', piezas: [
      { tex: R`X \times Y`, dice: 'El [[producto cartesiano]]: todas las parejas posibles, con una cosa de $X$ y otra de $Y$.' },
      { tex: R`(x, y)`, dice: 'Una de esas parejas. Por ejemplo, (Ana, pizza).' },
      { tex: R`\mu_R(x, y)`, dice: 'El grado de esa pareja en la relación $R$. Por ejemplo, $\\mu_R(\\text{Ana, pizza}) = 0{,}9$.' },
    ], todo: R`\mu_R : X \times Y \to [0, 1]`, lee: '«A cada pareja, un grado». Es igual que un conjunto difuso: solo ha cambiado de qué está hecho el universo.' },
    { tipo: 'formal', titulo: 'Relación difusa', tex: R`Una relación difusa $R$ entre $X$ e $Y$ es un conjunto difuso de $X \times Y$: una función $\mu_R : X \times Y \to [0, 1]$.`, lee: 'Todo lo que sabes de conjuntos difusos sirve para las relaciones: «y», «o», «no», soporte, cortes… Se aplica casilla a casilla.' },
    { tipo: 'nota', titulo: 'No hace falta que sean dos', texto: 'También hay relaciones entre tres o más grupos: en vez de una tabla, una caja de números. Y si $X$ e $Y$ son continuos, no hay tabla sino un terreno, como los que ya conoces de la región anterior.' },
  ],
  tecnicas: [
    { titulo: 'Reutiliza lo que ya sabes', texto: 'Antes de aprender algo nuevo, pregúntate si no es lo de antes con otro disfraz. Una relación es solo un conjunto de parejas.' },
  ],
  retos: [
    { id: 'leer-relacion', tipo: 'calcular', enunciado: R`En la tabla, ¿cuánto vale el «y» con mínimo de: «a Ana le gusta la sopa» y «a Beto le gusta la sopa»?`, respuesta: 0.2, tol: 0.001, pistas: [R`Los grados son $0{,}2$ y $0{,}8$.`], explicacion: R`$\min(0{,}2;\ 0{,}8) = 0{,}2$. Las relaciones se operan como cualquier conjunto.` },
    { id: 'relacion-o-no', tipo: 'elegir', enunciado: '¿Qué es una relación difusa entre personas y comidas?', opciones: ['Una lista de personas, con un grado cada una', 'Un conjunto difuso de parejas (persona, comida)', 'Un grupo de personas a las que les gusta algo', 'Una función de las comidas a las personas'], correcta: 1, explicacion: 'Cada pareja tiene su propio grado.' },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 6.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 5.'],
};
