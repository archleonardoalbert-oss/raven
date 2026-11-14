import { AZUL, BLANCO, ORO, ROJO } from '../../motor/colores.js';
import { triangular } from '../../nucleo/difuso.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const f = (x) => x * x, XM = 2, YM = 4;
const entrada = (c) => triangular(c - 1, c, c + 1);
const salida = (c) => (y) => (y < 0 ? 0 : Math.max(entrada(c)(Math.sqrt(y)), entrada(c)(-Math.sqrt(y))));

export default {
  id: '4-6-extension-1d',
  titulo: 'El principio de extensión',
  puente: 'Has extendido una función de una entrada. Lo natural ahora: ¿y si la función tiene dos, como una suma? El truco es el mismo, con un terreno.',
  pregunta: 'Si $x$ es «cerca de 1», ¿cuánto vale $x^2$? No un número: otro conjunto difuso. ¿Cómo lleva una función la niebla de un lado a otro?',
  escena: {
    id: 'extension', formato: 'plano', W: 1100, H: 620,
    ejes: { x: [-XM, XM], y: [0, YM], caja: { x: 90, y: 40, w: 560, h: 390 } },
    entradas: [
      { id: 'c', tipo: 'deslizador', etiqueta: 'la entrada es «cerca de…»', min: -1.5, max: 1.5, paso: 0.01, valor: 0.3 },
      { id: 'x', tipo: 'arrastre', eje: 'x', valor: [0.6, 0], region: { x: [-XM, XM], y: [0, 1] } },
    ],
    pasos: [
      { dur: 2200, texto: 'Una función, $f(x) = x^2$. Abajo, la entrada: un conjunto difuso, <b style="color:#58c4dd;font-weight:400">«cerca de $c$»</b>. A la derecha, se irá formando la salida.' },
      { dur: 2600, texto: 'Toma un $x$, con su grado. Súbelo a la curva y llévalo al eje de la salida. Su <b style="color:#f4d345;font-weight:400">imagen hereda su grado</b>. Así de simple.' },
      { dur: 3400, texto: 'Hazlo con todos los $x$. El conjunto de la derecha se va dibujando: es «$x^2$, si $x$ es cerca de $c$».' },
      { dur: 3000, texto: 'Pero $x^2$ da lo mismo con $x$ y con $-x$: dos orígenes para una sola imagen, con grados distintos. <b style="color:#f05a5a;font-weight:400">¿Cuál gana?</b> El mayor: basta con que un origen sea plausible.' },
    ],
    primitivas({ q, paso, e }) {
      const c = e.c, A = entrada(c), B = salida(c), al = ev(q(0), 0, 0.4), x = paso === 1 ? 0.6 : paso === 2 ? -XM + ev(q(2), 0, 1) * 2 * XM : e.x[0], y = f(x), g = A(x);
      const P = [marco({ x: [-XM, XM], y: [0, YM] }, { alfa: al, ticks: { x: [-2, -1, 0, 1, 2], y: [0, 2, 4] }, etiquetas: { x: 'x', y: R`f(x)` } })];
      P.push(curva((u) => [u, f(u)], [-XM, XM], { hasta: Math.max(ev(q(0), 0, 1), 1e-3), n: 200, color: BLANCO, ancho: 3 }));
      const a = ev(q(1), 0, 0.4);
      if (a > 0) P.push(linea([x, 0], [x, y], { color: AZUL, ancho: 2, alfa: a }), linea([x, y], [XM, y], { color: ORO, ancho: 1.6, alfa: 0.9 * a, discontinua: true }), punto([x, y], { color: BLANCO, radio: 5, alfa: a }));
      if (paso === 3) {
        const m = -x, s = ev(q(3), 0, 0.5);
        P.push(linea([m, 0], [m, y], { color: ROJO, ancho: 2, alfa: s }), punto([m, y], { color: ROJO, radio: 5, alfa: s }), linea([m, y], [x, y], { color: ROJO, ancho: 1.2, alfa: 0.6 * s, discontinua: true }));
      }
      const AB = [marco({ x: [-XM, XM], y: [0, 1] }, { alfa: al, ticks: { x: [-2, 0, 2], y: [0, 1] }, etiquetas: { y: R`\mu_A` }, colorY: AZUL })];
      AB.push(curva((u) => [u, A(u)], [-XM, XM], { n: 200, color: AZUL, ancho: 3, brillo: true, alfa: al }));
      if (a > 0) {
        AB.push(linea([x, 0], [x, g], { color: AZUL, ancho: 1.6, alfa: a, discontinua: true }), punto([x, g], { color: AZUL, radio: 6, alfa: a }));
        if (paso === 3) { const m = -x, gm = A(m), s = ev(q(3), 0, 0.5); AB.push(linea([m, 0], [m, gm], { color: ROJO, ancho: 1.6, alfa: s, discontinua: true }), punto([m, gm], { color: ROJO, radio: 6, alfa: s }), rotulo([x, g], coma(g), { clave: 'g1', dy: -18, tam: 19, color: AZUL, alfa: s }), rotulo([m, gm], coma(gm), { clave: 'g2', dy: -18, tam: 19, color: ROJO, alfa: s })); }
      }
      const SAL = [marco({ x: [0, 1], y: [0, YM] }, { alfa: al, ticks: { x: [0, 1], y: [] }, etiquetas: { x: R`\mu_B` } })];
      const hasta = paso === 1 ? 0 : paso === 2 ? ev(q(2), 0, 1) : 1;
      if (paso >= 2) SAL.push(curva((u) => [B(u), u], [0, YM], { hasta: Math.max(hasta, 1e-3), n: 400, color: ORO, ancho: 3.2, brillo: true }));
      if (a > 0) { const v = B(y); SAL.push(linea([0, y], [v, y], { color: ORO, ancho: 2, alfa: a }), punto([v, y], { color: ORO, radio: 6, alfa: a })); SAL.push(rotulo([v, y], coma(v), { clave: 'sal', dx: 26, tam: 20, color: ORO, alfa: paso >= 1 ? a : 0 })); }
      return { principal: P, paneles: [
        { ejes: { x: [-XM, XM], y: [0, 1], caja: { x: 90, y: 470, w: 560, h: 120 } }, prims: AB },
        { ejes: { x: [0, 1], y: [0, YM], caja: { x: 720, y: 40, w: 300, h: 390 } }, prims: SAL },
      ] };
    },
  },
  manipulacion: '<ul><li>Mueve la entrada $c$: si la llevas a 0, la salida se aplasta contra 0, porque $x^2$ es plano ahí.</li><li>Arrastra la línea azul por la gráfica grande: mira de dónde viene cada grado de la salida.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Sabes aplicar una función a un número. Pero si solo sabes que el número es «más o menos 1», ¿qué da? El principio de extensión responde, y sirve con cualquier función: la entrada se lleva a la salida punto a punto, y cada [[imagen]] hereda el grado de su origen.' },
    { tipo: 'ejemplo', texto: 'Con $f(x) = x^2$, y como entrada los pares (número, grado): (−1; 0,5), (0; 1), (1; 0,7):', tabla: [['x', 'Grado', 'x²'], ['−1', '0,5', '1'], ['0', '1', '0'], ['1', '0,7', '1']], cierre: 'El 0 sale con grado 1. Y el 1 sale dos veces: con 0,5 y con 0,7. Nos quedamos con el mayor: el 1 tiene grado 0,7. Salida: (0; 1), (1; 0,7).' },
    { tipo: 'idea', etiqueta: 'Por qué el mayor', texto: '«¿Con cuánta razón puede salir 1?». Sale si $x = -1$, <em>o</em> si $x = 1$. Y ese «o» es un máximo. Es la misma regla de siempre: para que algo sea posible, basta con un camino bueno.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`f(x) = y`, dice: 'Los $x$ cuya imagen es $y$: sus orígenes.' },
      { tex: R`\sup_{x\, :\, f(x) = y}`, dice: 'De entre esos orígenes, el mejor grado. Es un [[supremo]]: «el mayor».' },
      { tex: R`\mu_A(x)`, dice: 'El grado de cada origen.' },
    ], todo: R`\mu_B(y) = \sup_{x\, :\, f(x) = y} \mu_A(x)`, lee: '«El grado de $y$ es el mejor grado entre todos los $x$ que dan $y$». Y si ningún $x$ da $y$, el grado es 0.' },
    { tipo: 'formal', titulo: 'Principio de extensión', tex: R`Dada $f : X \to Y$ y un conjunto difuso $A$ de $X$, su imagen es el conjunto $B$ de $Y$ con $\mu_B(y) = \sup_{x : f(x) = y} \mu_A(x)$ si $y$ tiene algún origen, y $\mu_B(y) = 0$ si no.`, lee: 'Zadeh lo introdujo en 1975. Es la herramienta que permite «hacer difuso» cualquier cálculo.' },
    { tipo: 'demo', titulo: 'Con conjuntos clásicos, da la imagen de siempre', plan: 'Una comprobación obligatoria: si $A$ es un conjunto normal, debe dar la imagen de toda la vida.', tex: R`Si $A$ es clásico, $\mu_B(y) = 1$ si y solo si $y = f(x)$ para algún $x \in A$.`, pasos: [
      { texto: R`Si existe $x \in A$ con $f(x) = y$, entonces $\mu_A(x) = 1$ está entre los valores del [[supremo]]: $\mu_B(y) = 1$.`, porque: 'Ningún grado pasa de 1, y este lo alcanza.' },
      { texto: R`Si no existe, todos los orígenes de $y$ tienen grado 0, o no hay orígenes: $\mu_B(y) = 0$.`, porque: 'Cada origen está fuera de $A$.' },
    ] },
    { tipo: 'nota', titulo: 'Si f es de ida y vuelta', texto: 'Si $f$ nunca repite resultados, cada $y$ tiene un solo origen y el máximo no hace nada: la curva solo se deforma. Por ejemplo, $f(x) = x + 3$ desplaza el conjunto 3 unidades.' },
  ],
  tecnicas: [
    { titulo: 'Busca los orígenes', texto: 'Para aplicar el principio a mano, para cada salida $y$, encuentra todos los $x$ que la producen, y quédate con el mayor grado.' },
    { titulo: 'Usa los cortes', texto: 'Si la función es continua y los cortes son intervalos, el corte de la imagen es la imagen del corte. Hace las cuentas mucho más fáciles.' },
  ],
  retos: [
    { id: 'centra-entrada', tipo: 'manipular', enunciado: R`Mueve la entrada para que la cima de la salida esté en $y = 1$.`, precision: (e) => (Math.abs(Math.abs(e.c) - 1) < 0.03 ? 1 : 0), prueba: { c: 1 }, pistas: ['La cima de la salida es la imagen de la cima de la entrada. ¿Qué $x$ cumple $x^2 = 1$?'], explicacion: 'La cima de la salida viene de la cima de la entrada. Y hay dos soluciones: 1 y −1.' },
    { id: 'extiende-calc', tipo: 'calcular', enunciado: R`Sea $A = \{(-2;\ 0{,}3),\ (2;\ 0{,}9),\ (3;\ 0{,}4)\}$ y $f(x) = x^2$. ¿Qué grado tiene $y = 4$?`, respuesta: 0.9, tol: 0.001, pistas: [R`Los orígenes de 4 son $-2$ y $2$.`], explicacion: R`$\max(0{,}3;\ 0{,}9) = 0{,}9$.` },
    { id: 'por-que-max', tipo: 'elegir', enunciado: 'Si varios $x$ dan la misma $y$, ¿por qué se toma el mayor grado?', opciones: ['Porque es más simple', '«$y$ sale de $x_1$ o de $x_2$», y el «o» es un máximo', 'Porque suman más de 1', 'Es una convención sin motivo'], correcta: 1, explicacion: 'Para que $y$ sea posible, basta con que lo sea uno de sus orígenes.' },
  ],
  referencias: ['L. A. Zadeh, «The concept of a linguistic variable…», <em>Information Sciences</em> 8 (1975).', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 5.1.'],
};
