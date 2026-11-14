import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { triangular } from '../../nucleo/difuso.js';
import { curva, linea, mapaCalor, marco, punto, rotulo, terreno } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const A = triangular(0.1, 0.3, 0.6), B = triangular(0.15, 0.45, 0.7);
const Rel = (x, y) => Math.min(A(x), B(y));
const GLSL = 'float a=max(0.,min((x-.1)/.2,(.6-x)/.3));float b=max(0.,min((y-.15)/.3,(.7-y)/.25));return min(a,b);';
/** El mejor punto sobre la recta x + y = z, y su grado. */
function mejor(z) {
  let m = 0, xb = Math.max(0, z - 1);
  const a = Math.max(0, z - 1), b = Math.min(1, z);
  for (let i = 0; i <= 600; i++) { const x = a + ((b - a) * i) / 600, v = Rel(x, z - x); if (v > m) { m = v; xb = x; } }
  return { grado: m, x: xb, y: z - xb };
}

export default {
  id: '4-7-extension-nd',
  titulo: 'Extensión con varias entradas',
  puente: 'Con esto puedes operar con cantidades vagas. La pregunta obvia: ¿y si quieres hacer aritmética de verdad con ellas, de forma sencilla? «Unos 2 más unos 5» es la última parada de esta región.',
  pregunta: '«Unos 30 minutos más unos 45». ¿Cuánto da? Hay infinitas parejas que suman lo mismo, y cada una tiene su grado. ¿Cuál cuenta?',
  escena: {
    id: 'extension-nd', formato: '3d', W: 1100, H: 690, render3d: { cx: 365, cy: 372, S: 335 },
    entradas: [{ id: 'z', tipo: 'deslizador', etiqueta: 'la suma z', min: 0.2, max: 1.3, paso: 0.005, valor: 0.4 }],
    pasos: [
      { dur: 3000, texto: 'Dos cantidades vagas, $x$ y $y$. Sus grados, en las paredes. Sobre el suelo se forma el terreno de todas las parejas: su grado es el <em>menor</em> de los dos.' },
      { dur: 2800, texto: 'Elige una suma, $z$. En el suelo, todas las parejas que suman $z$ forman una recta. Sobre ella, el terreno tiene un perfil, y cada punto, un grado.' },
      { dur: 2600, texto: 'De todas esas parejas, ¿cuál cuenta? La mejor: el <b style="color:#f4d345;font-weight:400">punto más alto del perfil</b>. Es el grado de $z$. Es el mismo principio: «el mejor origen».' },
      { dur: 3600, texto: 'Barre todas las sumas. La altura máxima dibuja, a la derecha, la curva de la suma.' },
    ],
    primitivas({ q, paso, e }) {
      const ba = ev(q(0), 0, 0.3), de = ev(q(0), 0.4, 1), z = paso === 3 ? mix(mix(0.25, 1.3, ev(q(3), 0, 0.75)), e.z, ev(q(3), 0.75, 1)) : e.z;
      const P = [marco({ x: [0, 1], y: [0, 1], z: [0, 1] }, { alfa: ba, etiquetas: { x: 'x', y: 'y', z: R`\text{grado}` } })];
      if (de > 0) P.push(terreno(Rel, { glsl: GLSL, desde: 1 - de }));
      P.push(curva((u) => [u, 1, A(u)], [0, 1], { n: 150, hasta: Math.max(ev(q(0), 0, 0.4), 1e-3), color: AZUL, ancho: 3, brillo: true }), curva((u) => [0, u, B(u)], [0, 1], { n: 150, hasta: Math.max(ev(q(0), 0, 0.4), 1e-3), color: ROSA, ancho: 3, brillo: true }));
      const M = [], C = [], pl = ev(q(1), 0, 0.5);
      if (pl > 0) {
        const x0 = Math.max(0, z - 1), x1 = Math.min(1, z);
        P.push(linea([x0, z - x0, 0], [x1, z - x1, 0], { color: BLANCO, ancho: 2, alfa: pl }));
        P.push(curva((u) => [u, z - u, Rel(u, z - u)], [x0, x1], { n: 150, color: ORO, ancho: 3.6, alfa: pl }));
        P.push(rotulo([x1, z - x1, 0], R`x + y = ${coma(z)}`, { clave: 'rec', dx: 18, dy: 14, ancla: 'l', tam: 19, alfa: pl, siempre: true }));
        M.push(mapaCalor(Rel, { clave: 'exnd' }), marco({ x: [0, 1], y: [0, 1] }, { alfa: pl, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x', y: 'y' } }), rotulo([0.5, 1], R`\text{El suelo, desde arriba}`, { clave: 'tm', dy: -18, tam: 16, color: GRIS2, alfa: pl }));
        M.push(linea([x0, z - x0], [x1, z - x1], { color: BLANCO, ancho: 2, alfa: pl }));
        C.push(marco({ x: [0, 1.3], y: [0, 1] }, { alfa: pl, ticks: { x: [0, 1.3], y: [0, 1] }, etiquetas: { x: R`z = x + y` } }));
        C.push(rotulo([0.65, 1], R`\text{La suma}`, { clave: 'tc', dy: -20, tam: 16, color: GRIS2, alfa: pl }));
        const b = mejor(z), mp = ev(q(2), 0, 0.5);
        if (mp > 0) {
          P.push(linea([b.x, b.y, 0], [b.x, b.y, b.grado], { color: BLANCO, ancho: 2.2, alfa: mp }), punto([b.x, b.y, b.grado], { color: ORO, radio: 8, alfa: mp }), rotulo([b.x, b.y, b.grado], coma(b.grado), { clave: 'gr', dx: 20, dy: -14, tam: 22, color: ORO, alfa: mp }));
          M.push(punto([b.x, b.y], { color: ORO, radio: 6, alfa: mp }));
          C.push(linea([z, 0], [z, b.grado], { color: BLANCO, ancho: 1.4, alfa: 0.6 * mp, discontinua: true }), punto([z, b.grado], { color: ORO, radio: 7, alfa: mp }));
        }
        const dib = paso < 3 ? 0 : ev(q(3), 0, 0.75);
        if (dib > 0) C.push(curva((u) => [u, mejor(u).grado], [0.25, 1.3], { hasta: dib, n: 120, color: ORO, ancho: 3.2, brillo: true }));
      }
      return { principal: P, paneles: [{ ejes: { x: [0, 1], y: [0, 1], caja: { x: 810, y: 90, w: 216, h: 216 } }, prims: M }, { ejes: { x: [0, 1.3], y: [0, 1], caja: { x: 786, y: 400, w: 280, h: 190 } }, prims: C }] };
    },
  },
  manipulacion: '<ul><li>Mueve la suma $z$: la recta se desliza por el suelo y el punto dorado recorre el terreno.</li><li>Gira la vista 3D para ver la cresta del terreno sobre la recta.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Con varias entradas, lo único que cambia es que un origen es ahora una <em>pareja</em>. Una pareja vale lo que su entrada más débil. Y de todas las parejas que dan el mismo resultado, gana la mejor. Las dos reglas de siempre.' },
    { tipo: 'ejemplo', texto: 'Suma $A = \\{(1;\\ 0{,}5),\\ (2;\\ 1)\\}$ y $B = \\{(1;\\ 0{,}6),\\ (2;\\ 0{,}8)\\}$:', tabla: [['Pareja', 'Suma', 'Grado (menor)'], ['1 + 1', '2', '0,5'], ['1 + 2', '3', '0,5'], ['2 + 1', '3', '0,6'], ['2 + 2', '4', '0,8']], cierre: 'El 3 sale dos veces: gana 0,6. Resultado: (2; 0,5), (3; 0,6), (4; 0,8).' },
    { tipo: 'simbolos', piezas: [
      { tex: R`f(x, y) = z`, dice: 'Las parejas que dan $z$.' },
      { tex: R`\min(\mu_A(x),\ \mu_B(y))`, dice: 'Lo que vale una pareja: la más débil de sus partes. Es el [[producto cartesiano]] del terreno.' },
      { tex: R`\sup_{(x, y)\, :\, f(x, y) = z}`, dice: 'De todas ellas, la mejor. Es un [[supremo]].' },
    ], todo: R`\mu_C(z) = \sup_{(x, y)\, :\, f(x, y) = z} \min(\mu_A(x),\ \mu_B(y))`, lee: '«El grado de $z$ es el de la mejor pareja que lo produce».' },
    { tipo: 'formal', titulo: 'Principio de extensión multidimensional', tex: R`Dada $f : X_1 \times \dots \times X_n \to Y$, y conjuntos $A_1, \dots, A_n$: $\ \mu_B(y) = \sup \min(\mu_{A_1}(x_1), \dots, \mu_{A_n}(x_n))$, sobre todas las listas con $f(x_1, \dots, x_n) = y$; y 0 si no hay ninguna.`, lee: 'Es el principio de una sola entrada, aplicado al conjunto $A_1 \\times \\dots \\times A_n$.' },
    { tipo: 'demo', titulo: 'Con grados 0 y 1, es la suma de siempre', plan: 'Si $A$ y $B$ son conjuntos clásicos, el principio debe dar el conjunto de todas las sumas posibles.', tex: R`Si $A$, $B$ son clásicos, $\mu_C(z) = 1$ si y solo si $z = x + y$, con $x \in A$ e $y \in B$.`, pasos: [
      { texto: R`El mínimo de dos grados en $\{0, 1\}$ vale 1 si y solo si los dos valen 1.`, porque: 'Tabla del «y» clásico.' },
      { texto: R`El [[supremo]] de valores en $\{0, 1\}$ vale 1 si y solo si alguno vale 1.`, porque: 'Los valores solo pueden ser 0 o 1.' },
      { texto: R`Por tanto, $\mu_C(z) = 1$ si y solo si hay una pareja con $x + y = z$, $x \in A$ e $y \in B$.`, porque: 'Se combinan las dos frases: es la suma de intervalos, o de listas, de siempre.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'El resultado de un cálculo difuso es un conjunto', texto: 'Cuando alguien te dé un único número como resultado de datos vagos, pregúntale qué ha perdido por el camino.' },
  ],
  retos: [
    { id: 'busca-z', tipo: 'manipular', enunciado: R`Mueve la suma $z$ hasta que su grado llegue a 1.`, precision: (e) => (mejor(e.z).grado > 0.97 ? 1 : 0), prueba: { z: 0.75 }, pendiente: (e) => `Con esa suma, el grado es ${mejor(e.z).grado.toFixed(2).replace('.', ',')}.`, pistas: ['Solo hay una pareja con grado 1: la cima de cada conjunto.', 'Las cimas están en 0,3 y 0,45.'], explicacion: 'La cima de la suma es la suma de las cimas: 0,75.' },
    { id: 'suma-discreta', tipo: 'calcular', enunciado: R`Con $A = \{(1;\ 0{,}5),\ (2;\ 1)\}$ y $B = \{(1;\ 0{,}6),\ (2;\ 0{,}8)\}$, ¿qué grado tiene la suma $z = 3$?`, respuesta: 0.6, tol: 0.001, pistas: ['Dos parejas suman 3: 1 + 2 y 2 + 1.'], explicacion: R`$\max(\min(0{,}5;\ 0{,}8),\ \min(1;\ 0{,}6)) = \max(0{,}5;\ 0{,}6) = 0{,}6$.` },
    { id: 'demuestra-clasico', tipo: 'demostrar', enunciado: R`Si $\mu_A(x_0) = 1$ y $\mu_B(y_0) = 1$, demuestra que la suma tiene grado 1 en $z_0 = x_0 + y_0$.`, pistas: ['$(x_0, y_0)$ es una de las parejas que dan $z_0$.'],
      solucion: [
        { texto: R`La pareja $(x_0, y_0)$ da $z_0$, y su valor es $\min(1, 1) = 1$.`, porque: 'Es una de las candidatas del [[supremo]].' },
        { texto: R`El [[supremo]] no baja de ninguna candidata, y ningún grado pasa de 1: $\mu_C(z_0) = 1$.`, porque: 'Por tanto, la cima de la suma es la suma de las cimas.' },
      ] },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 5.1 y 5.3.', 'L. A. Zadeh (1975).'],
};
