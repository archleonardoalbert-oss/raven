import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { curva, mapaCalor, marco, poligono, rotulo, terreno } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const gA = (x) => Math.exp(-((x - 0.35) ** 2) / 0.03), gB = (y) => Math.exp(-((y - 0.55) ** 2) / 0.03), Regla = (x, y) => Math.min(gA(x), gB(y));
const dato = (c) => (x) => Math.exp(-((x - c) ** 2) / 0.02);
const GLSL = 'float a=exp(-((x-.35)*(x-.35))/.03);float b=exp(-((y-.55)*(y-.55))/.03);float r=min(a,b);float d=exp(-((x-uC)*(x-uC))/.02);return mix(r,min(r,d),uM);';
const tablas = new Map();
/** La sombra, calculada una vez por cada c: se pide muchas veces en cada fotograma. */
const salida = (y, c) => {
  const k = c.toFixed(2);
  if (!tablas.has(k)) { const d = dato(c); tablas.set(k, Array.from({ length: 161 }, (_, j) => { let m = 0; for (let i = 0; i <= 200; i++) { const x = i / 200; m = Math.max(m, Math.min(d(x), Regla(x, j / 160))); } return m; })); }
  const T = tablas.get(k), u = Math.min(159.999, y * 160), i = Math.floor(u);
  return T[i] + (T[i + 1] - T[i]) * (u - i);
};

export default {
  id: '5-6-composicional',
  titulo: 'La regla composicional',
  puente: 'Sabes ir de la causa a la consecuencia. ¿Y al revés? Si ves el efecto, ¿qué causa lo produjo? Es un problema distinto, y a veces no tiene solución.',
  pregunta: '¿Cómo sale la fórmula del modus ponens? Se obtiene con tres pasos que ya conoces: estirar, combinar y proyectar. Todo lo aprendido, en un solo gesto.',
  escena: {
    id: 'composicional', formato: '3d', W: 1100, H: 690, render3d: { cx: 365, cy: 372, S: 335 },
    entradas: [{ id: 'c', tipo: 'deslizador', etiqueta: 'lo que sabes: «cerca de…»', min: 0, max: 1, paso: 0.01, valor: 0.45 }],
    pasos: [
      { dur: 2600, texto: 'El terreno es la <b style="color:#f4d345;font-weight:400">regla</b>: una relación entre $x$ e $y$. En las paredes, sus conjuntos A y B.' },
      { dur: 2800, texto: 'Paso 1: <b>estirar</b>. El dato $A\'$ vive solo en $x$. Lo estiramos como una cortina a lo largo de $y$. Ahora vive en todo el suelo.' },
      { dur: 3000, texto: 'Paso 2: <b>combinar</b>. Dato y regla se combinan con un «y», punto a punto. Solo queda lo que cumple las dos: el terreno se recorta por la cortina.' },
      { dur: 3000, texto: 'Paso 3: <b>proyectar</b>. Mira la sombra sobre la pared de $y$. <b style="color:#f4d345;font-weight:400">Esa sombra es la conclusión.</b>' },
    ],
    primitivas({ q, paso, e }) {
      const c = paso === 3 && q(3) >= 1 ? e.c : 0.45, d = dato(c), ba = ev(q(0), 0, 0.3), de = ev(q(0), 0.2, 1), m = paso < 2 ? 0 : paso === 2 ? ev(q(2), 0, 0.8) : 1;
      const F = (x, y) => mix(Regla(x, y), Math.min(Regla(x, y), d(x)), m);
      const P = [marco({ x: [0, 1], y: [0, 1], z: [0, 1] }, { alfa: ba, etiquetas: { x: 'x', y: 'y', z: R`\text{grado}` } })];
      if (de > 0) P.push(terreno(F, { glsl: GLSL, uniformes: { uC: c, uM: m }, desde: 1 - de }));
      P.push(curva((u) => [u, 1, gA(u)], [0, 1], { n: 100, color: AZUL, ancho: 2.4, alfa: ba }), curva((u) => [0, u, gB(u)], [0, 1], { n: 100, color: ROSA, ancho: paso === 3 ? 1.6 : 2.4, alfa: paso === 3 ? 0.55 : ba }));
      const co = ev(q(1), 0, 0.7);
      if (co > 0) {
        const K = 40, altoCort = paso === 1 ? co : paso === 2 ? 1 - 0.6 * ev(q(2), 0, 0.8) : 0.4;
        if (paso >= 1 && paso <= 2) for (let i = 0; i < K; i++) { const x0 = i / K, x1 = (i + 1) / K; for (const y of [0.1, 0.3, 0.5, 0.7, 0.9]) P.push(poligono([[x0, y, 0], [x1, y, 0], [x1, y, d(x1)], [x0, y, d(x0)]], { color: BLANCO, alfa: 0.1 * altoCort })); }
        P.push(curva((u) => [u, 1, d(u)], [0, 1], { n: 100, color: BLANCO, ancho: 2.6, alfa: co }), rotulo([c, 1, 1.08], R`A'`, { clave: 'Ap', tam: 22, siempre: true, alfa: co }));
      }
      const sa = ev(q(3), 0, 0.7);
      if (sa > 0) P.push(curva((y) => [0, y, salida(y, c)], [0, 1], { hasta: Math.max(sa, 1e-3), n: 80, color: ORO, ancho: 3.8, brillo: true }), rotulo([0, 0.55, salida(0.55, c)], R`B'`, { clave: 'Bp', dx: -26, tam: 24, color: ORO, siempre: true }));
      const M = [], C = [], pa = ev(q(0), 0.6, 1);
      M.push(mapaCalor(F, { clave: `cr${c}${m.toFixed(2)}` }), marco({ x: [0, 1], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x', y: 'y' } }), rotulo([0.5, 1], R`\text{Desde arriba}`, { clave: 'tm', dy: -18, tam: 16, color: GRIS2, alfa: pa }));
      C.push(marco({ x: [0, 1], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'y' } }), curva((y) => [y, gB(y)], [0, 1], { n: 100, color: ROSA, ancho: 2.4, alfa: pa }), rotulo([0.5, 1], R`\text{La conclusión}`, { clave: 'tc', dy: -20, tam: 16, color: GRIS2, alfa: pa }));
      if (sa > 0) C.push(curva((y) => [y, salida(y, c)], [0, 1], { hasta: Math.max(sa, 1e-3), n: 80, color: ORO, ancho: 3.2 }));
      return { principal: P, paneles: [{ ejes: { x: [0, 1], y: [0, 1], caja: { x: 810, y: 90, w: 216, h: 216 } }, prims: M }, { ejes: { x: [0, 1], y: [0, 1], caja: { x: 786, y: 400, w: 280, h: 190 } }, prims: C }] };
    },
  },
  manipulacion: '<ul><li>Mueve lo que sabes: la sombra dorada se recorta a otra altura.</li><li>Gira la vista 3D, para ver el terreno recortado desde otro lado.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'En la región 4 aprendiste a estirar, a combinar y a proyectar. Juntos, forman la regla composicional de inferencia de Zadeh. Es la receta general para sacar una conclusión de un dato y una regla, sea cual sea esa regla.' },
    { tipo: 'ejemplo', texto: 'Con tablas. Dato $A\' = (0{,}5;\\ 1)$ y la regla $R$, en dos columnas:', tabla: [['', 'y₁', 'y₂'], ['x₁ (0,5)', '0,8', '0,3'], ['x₂ (1)', '0,4', '0,9']], cierre: 'Combinar: fila de $x_1$ con mínimo de 0,5: (0,5; 0,3); fila de $x_2$ con 1: (0,4; 0,9). Proyectar: el mayor por columna: (0,5; 0,9). Esa es la conclusión.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\mu_{A'}(x)`, dice: 'El dato. Al usarlo con $(x, y)$ ya está estirado: no depende de $y$. Es la [[extensión cilíndrica]].' },
      { tex: R`\min(\mu_{A'}(x),\ \mu_R(x, y))`, dice: 'Combinar dato y regla: un «y» punto a punto.' },
      { tex: R`\sup_x`, dice: 'Proyectar sobre $y$: es la [[proyección]], el [[supremo]] en $x$.' },
    ], todo: R`\mu_{B'}(y) = \sup_x \min(\mu_{A'}(x),\ \mu_R(x, y))`, lee: 'Se escribe, en corto, $B\' = A\' \\circ R$. Sí: es una [[composición]]: la misma que la de las tablas de síntomas.' },
    { tipo: 'formal', titulo: 'Regla composicional de inferencia', tex: R`Dados un conjunto $A'$ en $X$, y una relación $R$ entre $X$ e $Y$, la conclusión es $B' = A' \circ R$: $\ \mu_{B'}(y) = \sup_{x} T(\mu_{A'}(x),\ \mu_R(x, y))$, con una [[norma T]] $T$.`, lee: 'Se aplica igual si $R$ viene de una regla o si viene de datos. Es lo que hace a la teoría tan general.' },
    { tipo: 'demo', titulo: 'Con un dato exacto, es solo leer una fila', plan: 'Lo más común en control: el sensor da un número exacto, $x_0$. Es un conjunto con un solo punto, y entonces toda la fórmula se simplifica.', tex: R`Si $\mu_{A'}(x_0) = 1$ y $\mu_{A'}(x) = 0$ en otro caso, entonces $\mu_{B'}(y) = \mu_R(x_0, y)$.`, pasos: [
      { texto: R`Si $x \neq x_0$: $\min(0,\ \mu_R(x, y)) = 0$.`, porque: 'El mínimo con 0 es 0.' },
      { texto: R`Si $x = x_0$: $\min(1,\ \mu_R(x_0, y)) = \mu_R(x_0, y)$.`, porque: 'El mínimo con 1 deja igual.' },
      { texto: R`El [[supremo]] de todos esos valores es $\mu_R(x_0, y)$.`, porque: 'Los demás valen 0. Por eso los controladores son tan rápidos: solo tienen que leer una fila.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Sube, opera y baja, otra vez', texto: 'Es el mismo gesto que en la proyección: para combinar cosas de distinta dimensión, súbelas a la mayor, opera, y proyecta.' },
    { titulo: 'Busca el caso simple', texto: 'Antes de aplicar una fórmula general, mira si tu dato es un punto: casi todo se simplifica.' },
  ],
  retos: [
    { id: 'cri-calc', tipo: 'calcular', enunciado: R`Dato $A' = (0{,}7;\ 0{,}2)$, y regla con filas $(0{,}5;\ 0{,}9)$ y $(1;\ 0{,}4)$. ¿Cuánto vale $\mu_{B'}(y_1)$, la primera columna?`, respuesta: 0.5, tol: 0.001, pistas: [R`Primera columna: $\min(0{,}7;\ 0{,}5)$ y $\min(0{,}2;\ 1)$.`], explicacion: R`$\max(0{,}5;\ 0{,}2) = 0{,}5$.` },
    { id: 'cri-elegir', tipo: 'elegir', enunciado: '¿En qué orden se hace la regla composicional?', opciones: ['Proyectar, combinar, estirar', 'Estirar el dato, combinar con la regla, proyectar', 'Combinar, proyectar, estirar', 'Da igual el orden'], correcta: 1, explicacion: 'Se sube a la dimensión de la regla, se combina allí, y se vuelve.' },
    { id: 'demuestra-cri', tipo: 'demostrar', enunciado: R`Demuestra que si $A' \subseteq A''$, entonces $A' \circ R \subseteq A'' \circ R$: un dato mayor no da menos conclusión.`, pistas: ['Compara los dos mínimos para un mismo $x$.'],
      solucion: [
        { texto: R`Para cada $x$: $\min(\mu_{A'}(x), \mu_R(x, y)) \le \min(\mu_{A''}(x), \mu_R(x, y))$.`, porque: 'Porque $\\mu_{A\'}(x) \\le \\mu_{A\'\'}(x)$, y el mínimo no baja si sube una entrada.' },
        { texto: R`Y este último no supera a su [[supremo]] en $x$: $\mu_{(A'' \circ R)}(y)$.`, porque: 'El [[supremo]] no baja de ninguno de sus valores.' },
        { texto: R`Por tanto, $\mu_{(A'' \circ R)}(y)$ está por encima de todos los valores de la izquierda, y de su [[supremo]].`, porque: 'El [[supremo]] es el menor número que está por encima de todos.' },
      ] },
  ],
  referencias: ['L. A. Zadeh, «Outline of a new approach to the analysis of complex systems» (1973).', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 9.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 12.'],
};
