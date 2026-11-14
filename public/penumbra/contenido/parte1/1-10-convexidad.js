import { AZUL, BLANCO, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { curva, linea, mapaCalor, marco, punto, rotulo, terreno } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const DS2 = 0.03;
const pico = (x, y, c) => Math.exp(-((x - c) ** 2 + (y - 0.5) ** 2) / DS2);
const f = (s) => (x, y) => Math.max(pico(x, y, 0.5 - s), pico(x, y, 0.5 + s));
const GLSL = 'float dy=(y-.5)*(y-.5);float a=x-(.5-sep);float b=x-(.5+sep);return max(exp(-(a*a+dy)/.03),exp(-(b*b+dy)/.03));';

/** Separación efectiva: el paso de una sola cima a dos islas se anima. */
/** Los puntos que se ven y que se puntúan: en las cimas hasta que la persona arrastra uno. */
const puntos = (e, s) => (e.x1[0] !== 0.45 || e.x2[0] !== 0.55 ? [e.x1[0], e.x2[0]] : [0.5 - s, 0.5 + s]);
/** Tramos del borde exterior de dos discos: lo que queda dentro del otro disco no es curva de nivel. */
function arcos(s, r) {
  if (s >= r) return [[0.5 - s, 0, 6.28319], [0.5 + s, 0, 6.28319]];
  const f = Math.acos(s / r);
  return [[0.5 - s, f, 6.28319 - f], [0.5 + s, f - Math.PI, Math.PI - f]];
}
const hondura = (e) => { const F = f(e.sep), g = (x) => F(x, 0.5), [a, b] = puntos(e, e.sep); return Math.min(g(a), g(b)) - g((a + b) / 2); };
const separacion = (paso, q, e) => (paso >= 2 ? mix(0, e.sep, ev(q(2), 0, 0.7)) : 0);

export default {
  id: '1-10-convexidad',
  titulo: 'Convexidad',
  puente: 'Has terminado «El borde». Ya sabes qué es un conjunto difuso. La siguiente región trata de elegir su forma.',
  pregunta: '«Cerca de 5» tiene una sola cima. «Cerca de 3 o cerca de 7» tiene dos. ¿Cómo se dice eso con rigor, sin hablar de dibujos?',
  escena: {
    id: 'convexidad', formato: '3d', W: 1100, H: 690,
    render3d: { cx: 365, cy: 372, S: 335 },
    entradas: [
      { id: 'sep', tipo: 'deslizador', etiqueta: 'separación de las cimas', min: 0, max: 0.3, paso: 0.005, valor: 0.16 },
      { id: 'alfa', tipo: 'deslizador', etiqueta: 'nivel α', min: 0.1, max: 0.95, paso: 0.01, valor: 0.5 },
      { id: 'x1', tipo: 'arrastre', eje: 'x', panel: 1, valor: [0.45, 0], region: { x: [0, 1], y: [0, 1] } },
      { id: 'x2', tipo: 'arrastre', eje: 'x', panel: 1, valor: [0.55, 0], region: { x: [0, 1], y: [0, 1] } },
    ],
    pasos: [
      { dur: 2600, texto: 'Un conjunto con una sola cima. Abajo a la derecha, su perfil: toma dos puntos $x_1$ y $x_2$, y mira su punto medio.' },
      { dur: 2600, texto: 'La curva nunca baja de la menor de las dos alturas. Esa línea horizontal es $\\min(\\mu(x_1), \\mu(x_2))$, y el punto dorado queda por encima. Eso es ser <em>convexo</em>.' },
      { dur: 3000, texto: 'Ahora separa la cima en dos, y coloca $x_1$ y $x_2$ uno en cada una. El punto medio cae al valle, por debajo de la línea: en rojo, la convexidad se rompe.' },
      { dur: 2600, texto: 'Mira el mapa: en cuanto hay valle, un corte a la altura adecuada se parte en dos islas. Un conjunto es convexo si y solo si <b style="color:#f4d345;font-weight:400">todos sus cortes son convexos</b>.' },
    ],
    primitivas({ q, paso, e }) {
      const s = separacion(paso, q, e), F = f(s), de = ev(q(0), 0.1, 1), M = [], C = [];
      const P = [marco({ x: [0, 1], y: [0, 1], z: [0, 1] }, { alfa: ev(q(0), 0, 0.3), paredX: GRIS2, paredY: GRIS2, etiquetas: { x: 'x', y: 'y', z: R`\mu` } })];
      if (de > 0) P.push(terreno(F, { glsl: GLSL, desde: 1 - de, uniformes: { sep: s } }));
      const a = paso >= 3 ? e.alfa : 0;
      const g = (x) => F(x, 0.5), pa = ev(q(0), 0.2, 0.8);
      const coloca = paso >= 2 ? ev(q(2), 0.3, 0.9) : 0;
      // se colocan solos en las cimas; en cuanto la persona arrastra uno, manda ella
      const destino = puntos(e, s), tocados = e.x1[0] !== 0.45 || e.x2[0] !== 0.55;
      const px1 = tocados ? destino[0] : mix(e.x1[0], destino[0], coloca), px2 = tocados ? destino[1] : mix(e.x2[0], destino[1], coloca);
      const med = (px1 + px2) / 2, y1 = g(px1), y2 = g(px2), ym = g(med), mn = Math.min(y1, y2), roto = ym < mn - 1e-6;

      C.push(marco({ x: [0, 1], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x', y: R`\mu` } }));
      C.push(curva((x) => [x, g(x)], [0, 1], { n: 240, color: AZUL, ancho: 2.8 }));
      C.push(rotulo([0.5, 1], R`\text{Perfil en } y = 0{,}5`, { clave: 'tc', dy: -20, tam: 17, color: GRIS2, alfa: pa }));
      const pu = ev(q(0), 0.6, 1);
      if (pu > 0) {
        C.push(punto([px1, y1], { color: BLANCO, radio: 5, alfa: pu }), punto([px2, y2], { color: BLANCO, radio: 5, alfa: pu }), punto([med, ym], { color: roto ? ROJO : ORO, radio: 6.5, alfa: pu }));
        C.push(linea([px1, y1], [px1, 0], { color: GRIS2, ancho: 1, alfa: 0.5 * pu, discontinua: true }), linea([px2, y2], [px2, 0], { color: GRIS2, ancho: 1, alfa: 0.5 * pu, discontinua: true }));
        C.push(rotulo([px1, 0], R`x_1`, { clave: 'x1', dy: 30, tam: 16, alfa: pu }), rotulo([px2, 0], R`x_2`, { clave: 'x2', dy: 30, tam: 16, alfa: pu }));
      }
      const ln = ev(q(1), 0, 0.5);
      if (ln > 0) {
        const cLinea = roto ? ROJO : BLANCO;
        C.push(punto([px1, mn], { radio: 2, color: cLinea, alfa: ln, halo: 0 }), punto([px2, mn], { radio: 2, color: cLinea, alfa: ln, halo: 0 }));
        C.push(linea([px1, mn], [px2, mn], { color: cLinea, ancho: 1.8, alfa: 0.9 * ln }));
        if (ln > 0.5) C.push(rotulo([0.98, 0.9], roto ? R`\text{no convexo}` : R`\text{se cumple}`, { clave: 'est', ancla: 'r', tam: 19, color: roto ? ROJO : ORO, alfa: ln }));
      }
      const pm = ev(q(0), 0.3, 0.9);
      M.push(mapaCalor((x, y) => F(x, y), { clave: `conv${s.toFixed(4)}` }), marco({ x: [0, 1], y: [0, 1] }, { alfa: pm, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: {} }));
      M.push(rotulo([0.5, 1], R`\text{Desde arriba}`, { clave: 'tm', dy: -18, tam: 17, color: GRIS2, alfa: pm }));
      if (paso >= 3) {
        const cor = ev(q(3), 0, 0.6), radio = Math.sqrt(-DS2 * Math.log(a));
        for (const [c, u0, u1] of arcos(s, radio)) {
          M.push(curva((u) => [c + radio * Math.cos(u), 0.5 + radio * Math.sin(u)], [u0, u1], { hasta: Math.max(cor, 1e-3), n: 100, color: ORO, ancho: 2.6 }));
          P.push(curva((u) => [c + radio * Math.cos(u), 0.5 + radio * Math.sin(u), a], [u0, u1], { hasta: Math.max(cor, 1e-3), n: 100, color: ORO, ancho: 2.6 }));
        }
        C.push(linea([0, a], [1, a], { color: ORO, ancho: 1.2, alfa: 0.75 * cor, discontinua: true }));
        const islas = 2 * s > 2 * radio;
        M.push(rotulo([0.5, 0], islas ? R`\text{dos islas}` : R`\text{una sola pieza}`, { clave: 'isl', dy: 22, tam: 17, color: ORO, alfa: cor }));
      }
      return { principal: P, paneles: [
        { ejes: { x: [0, 1], y: [0, 1], caja: { x: 810, y: 92, w: 216, h: 216 } }, prims: M },
        { ejes: { x: [0, 1], y: [0, 1], caja: { x: 786, y: 410, w: 280, h: 210 } }, prims: C },
      ] };
    },
  },
  manipulacion: '<ul><li>Separa las cimas con el deslizador, y arrastra $x_1$ y $x_2$ sobre el perfil.</li><li>Cambia «nivel α» y encuentra la altura a partir de la que el corte se parte en dos.</li><li>Gira la vista 3D para ver el valle de cerca.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Queremos decir «tiene una sola cima» sin hablar de dibujos. La traducción: si dos cosas pertenecen al conjunto, cualquier cosa <em>entre</em> ellas pertenece al menos tanto como la peor de las dos.' },
    { tipo: 'ejemplo', texto: 'Con una sola cima, ningún punto queda por debajo de lo que tiene a ambos lados:', tabla: [['x', '1', '2', '3', '4', '5'], ['Grado', '0,2', '0,7', '1', '0,6', '0,1']], cierre: 'Toma 2 y 4: grados 0,7 y 0,6. El peor es 0,6, y el 3, que está en medio, tiene 1. Se cumple.' },
    { tipo: 'ejemplo', texto: 'Con dos cimas, falla:', tabla: [['x', '1', '2', '3', '4', '5'], ['Grado', '0,2', '0,9', '0,3', '0,9', '0,2']], cierre: 'Toma 2 y 4: los dos con 0,9. El 3, en medio, solo tiene 0,3. Se ha caído al valle.' },
    { tipo: 'simbolos', intro: 'Para escribirlo hace falta decir «un punto entre dos».', piezas: [
      { tex: R`x_1,\ x_2`, dice: 'Dos puntos cualesquiera.' },
      { tex: R`\lambda`, dice: '«Lambda», un número entre 0 y 1. Dice dónde estás entre los dos.' },
      { tex: R`\lambda x_1 + (1 - \lambda) x_2`, dice: 'Un punto entre $x_1$ y $x_2$. Con $\\lambda = 1$ estás en $x_1$; con $\\lambda = 0$, en $x_2$; con $\\lambda = 0{,}5$, justo en medio.' },
      { tex: R`\min(\mu_A(x_1),\ \mu_A(x_2))`, dice: 'El peor grado de los dos.' },
    ], todo: R`\mu_A(\lambda x_1 + (1 - \lambda) x_2) \ge \min(\mu_A(x_1),\ \mu_A(x_2))`, lee: '«El grado de cualquier punto intermedio llega, al menos, al peor de los dos extremos». Es la frase de arriba, sin cambiar nada.' },
    { tipo: 'formal', titulo: 'Conjunto difuso convexo', tex: R`En un [[espacio vectorial]] $X$, como la recta o el plano, $A$ es convexo si para todos $x_1, x_2 \in X$ y todo $\lambda \in [0, 1]$: $\ \mu_A(\lambda x_1 + (1 - \lambda) x_2) \ge \min(\mu_A(x_1),\ \mu_A(x_2))$.`, lee: 'Se mira la función de pertenencia, no el soporte: la convexidad es una propiedad de toda la forma.' },
    { tipo: 'nota', titulo: 'Un nombre que confunde', texto: R`Que el conjunto sea convexo no significa que la función lo sea. Una campana es un conjunto convexo, aunque su curva tiene tramos curvados hacia arriba y hacia abajo. En los libros de optimización, esta propiedad de la función se llama [[cuasi-cóncava]].` },
    { tipo: 'idea', etiqueta: 'Sin islas', texto: 'Recuerda los cortes. Con dos cimas, el listón adecuado deja dos islas, y eso rompe la convexidad. Pero en el plano no basta con ser de una pieza: un corte con forma de judía tampoco es convexo. Lo que hay que pedir es que cada corte contenga el segmento entre dos puntos suyos.' },
    { tipo: 'demo', titulo: 'Convexo si y solo si todos sus cortes lo son', plan: 'Hay que probar los dos sentidos. El truco de la vuelta es elegir bien el listón: exactamente el peor de los dos grados.', tex: R`$A$ es convexo [[si y solo si|implicacion]] cada corte $A_\alpha$, con $\alpha \in (0, 1]$, es un conjunto convexo clásico: contiene el segmento entre dos puntos suyos cualesquiera.`, pasos: [
      { texto: R`Ida. Sean $\alpha \in (0, 1]$, $x_1, x_2 \in A_\alpha$ y $\lambda \in [0, 1]$. Sus grados son $\ge \alpha$, luego $\min(\mu_A(x_1), \mu_A(x_2)) \ge \alpha$.`, porque: 'Definición de corte. El menor de dos números que llegan a $\\alpha$, también llega.' },
      { texto: R`Por ser $A$ convexo, $\mu_A(\lambda x_1 + (1 - \lambda) x_2) \ge \min(\mu_A(x_1), \mu_A(x_2)) \ge \alpha$. El punto intermedio está en $A_\alpha$.`, porque: 'Definición de convexidad, y encadenar desigualdades.' },
      { texto: R`Vuelta. Sean $x_1, x_2 \in X$, $\lambda \in [0, 1]$ y $\alpha = \min(\mu_A(x_1), \mu_A(x_2))$. Si $\alpha = 0$, no hay nada que probar.`, porque: 'Todo grado es $\\ge 0$. Se separa este caso porque los cortes se toman con $\\alpha > 0$.' },
      { texto: R`Si $\alpha > 0$, los dos puntos están en $A_\alpha$. Ese corte es convexo, así que el punto intermedio también está: su grado es $\ge \alpha$.`, porque: 'Es la clave: $\\alpha$ es el corte más alto que contiene a los dos.' },
    ] },
    { tipo: 'demo', titulo: 'La intersección de convexos es convexa', plan: 'Con el teorema anterior, sale casi gratis. Para la unión es falso: dos colinas separadas, cada una convexa, forman un conjunto de dos cimas.', tex: R`Si $A$ y $B$ son convexos, $A \cap B$ también, con $\mu_{A \cap B} = \min(\mu_A, \mu_B)$.`, pasos: [
      { texto: R`$(A \cap B)_\alpha = A_\alpha \cap B_\alpha$.`, porque: 'Lo demostraste en «α-cortes».' },
      { texto: R`Los cortes de $A$ y $B$ son convexos, y la intersección de convexos clásicos es convexa.`, porque: 'Por el teorema anterior; y si dos puntos están en ambos, su segmento también.' },
      { texto: R`Todos los cortes de $A \cap B$ son convexos, luego $A \cap B$ es convexo.`, porque: 'El teorema anterior, en el sentido de vuelta.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Elige el nivel adecuado', texto: 'En una demostración por cortes, el truco suele ser tomar $\\alpha$ igual a la cantidad que quieres acotar: aquí, el mínimo de los dos grados.' },
    { titulo: 'Reduce a lo clásico', texto: 'Si una propiedad difusa equivale a la misma propiedad en todos los cortes , sus resultados se heredan gratis del caso clásico.' },
    { titulo: 'Cuida el nivel 0', texto: 'Los cortes se toman con $\\alpha > 0$; cuando el nivel que eliges pueda valer 0, trátalo como caso aparte.' },
  ],
  retos: [
    { id: 'contraejemplo', tipo: 'manipular', enunciado: R`Separa las cimas y coloca $x_1$ y $x_2$ de modo que el punto medio quede claramente por debajo de la línea: al menos $0{,}8$ de grado.`,
      precision: (e) => (hondura(e) >= 0.8 ? 1 : 0),
      pendiente: (e) => `Ahora la diferencia es ${Math.max(0, hondura(e)).toFixed(2).replace('.', ',')}. Hace falta 0,8.`,
      prueba: { sep: 0.25, x1: [0.25, 0], x2: [0.75, 0] }, pistas: ['Cuanto más separadas las cimas, más hondo el valle.', 'Pon cada punto en lo alto de una cima, a la misma distancia del centro.'], explicacion: 'Un solo trío de puntos basta para refutar la convexidad: eso es un contraejemplo.' },
    { id: 'interseccion', tipo: 'elegir', enunciado: R`$A$ y $B$ son convexos. ¿Qué podemos asegurar, con mínimo y máximo?`, opciones: [R`$A \cap B$ y $A \cup B$ son convexos`, R`Solo $A \cap B$ es convexo`, R`Solo $A \cup B$ es convexo`, 'Ninguno de los dos'], correcta: 1,
      explicacion: 'Los cortes de la intersección son intersecciones de convexos. Los de la unión pueden ser dos islas: dos cimas separadas.' },
    { id: 'demostrar-cortes-convexos', tipo: 'demostrar', enunciado: R`Demuestra que si $A$ es convexo, también lo es su corte fuerte $A_{\alpha^+}$, para cualquier $\alpha \in [0, 1)$.`,
      pistas: ['Copia el sentido $(\\Rightarrow)$ del teorema, con $>$.', 'El mínimo de dos números mayores que $\\alpha$ también es mayor que $\\alpha$.'],
      solucion: [
        { texto: R`Sean $x_1, x_2 \in A_{\alpha^+}$ y $\lambda \in [0, 1]$. Entonces $\mu_A(x_1) > \alpha$ y $\mu_A(x_2) > \alpha$, luego $\min(\mu_A(x_1), \mu_A(x_2)) > \alpha$.`, porque: 'Definición de corte fuerte. El mínimo es uno de los dos números, y ambos superan a $\\alpha$.' },
        { texto: R`Por convexidad, $\mu_A(\lambda x_1 + (1 - \lambda) x_2) \ge \min(\mu_A(x_1), \mu_A(x_2)) > \alpha$.`, porque: 'Definición de conjunto difuso convexo, y encadenar desigualdades.' },
        { texto: R`Luego $\lambda x_1 + (1 - \lambda) x_2 \in A_{\alpha^+}$: el corte fuerte es convexo.`, porque: 'Definición de corte fuerte y de convexidad clásica.' },
      ] },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., Kluwer, 2001, caps. 1–2.', 'L. A. Zadeh, «Fuzzy sets» (1965): definición de convexidad.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 1.', 'M. Navara, temario del curso <em>Fuzzy Logic</em>, CTU Praga.'],
};
