import { AZUL, GRIS2, ORO, ROSA, TEXTO } from '../../motor/colores.js';
import { curva, linea, mapaCalor, marco, poligono, rotulo, terreno } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const g1 = (u) => 0.9 * Math.exp(-((u - 0.3) ** 2) / 0.03), g2 = (u) => Math.exp(-((u - 0.7) ** 2) / 0.04);
const h1 = (u) => 0.9 * Math.exp(-((u - 0.65) ** 2) / 0.03), h2 = (u) => Math.exp(-((u - 0.35) ** 2) / 0.04);
const Rel = (x, y) => Math.max(0.9 * Math.exp(-((x - 0.3) ** 2 + (y - 0.65) ** 2) / 0.03), Math.exp(-((x - 0.7) ** 2 + (y - 0.35) ** 2) / 0.04));
const sombraX = (x) => Math.max(g1(x), g2(x)), sombraY = (y) => Math.max(h1(y), h2(y));
const GLSL = 'float a=x-.3;float b=y-.65;float c=x-.7;float d=y-.35;float r=max(.9*exp(-(a*a+b*b)/.03),exp(-(c*c+d*d)/.04));float s=max(.9*exp(-(a*a)/.03),exp(-(c*c)/.04));return mix(r,s,uM);';

export default {
  id: '4-3-proyeccion',
  titulo: 'Sombras y cortinas: proyección y extensión',
  puente: 'Ya sabes pasar de terrenos a curvas y al revés. Ahora, el paso clave para razonar: encadenar dos relaciones en una.',
  pregunta: 'Tienes una relación entre horas y notas. ¿Qué te dice solo de las horas? Si la iluminas de frente, la sombra sobre la pared es una curva: esa es la respuesta.',
  escena: {
    id: 'proyeccion', formato: '3d', W: 1100, H: 690, render3d: { cx: 365, cy: 372, S: 335 },
    entradas: [
      { id: 'barre', tipo: 'deslizador', etiqueta: 'corte en y', min: 0, max: 1, paso: 0.01, valor: 0.65 },
      { id: 'cortina', tipo: 'deslizador', etiqueta: 'de relación a cortina', min: 0, max: 1, paso: 0.01, valor: 1 },
    ],
    pasos: [
      { dur: 2400, texto: 'Una relación con dos colinas. Queremos saber qué dice sobre $x$, olvidándonos de $y$.' },
      { dur: 4400, texto: 'Pasa un plano por todos los cortes, y quédate, para cada $x$, con la mayor altura que haya aparecido. Es la sombra sobre la pared: la <b style="color:#58c4dd;font-weight:400">proyección</b> sobre $x$.' },
      { dur: 2400, texto: 'Lo mismo en la otra pared: es la <b style="color:#fc6282;font-weight:400">proyección</b> sobre $y$. Ojo: de una sombra no se puede reconstruir el terreno: muchos terrenos dan la misma.' },
      { dur: 3000, texto: 'El viaje de vuelta: toma la sombra y estírala a lo largo de $y$, como una cortina. Es la <b style="color:#f4d345;font-weight:400">extensión cilíndrica</b>: el terreno más grande que tiene esa sombra.' },
    ],
    primitivas({ q, paso, e }) {
      const reposo = paso === 3 && q(3) >= 1, m = reposo ? e.cortina : paso === 3 ? ev(q(3), 0, 0.8) : 0, ba = ev(q(0), 0, 0.3), de = ev(q(0), 0.1, 1);
      const P = [marco({ x: [0, 1], y: [0, 1], z: [0, 1] }, { alfa: ba, etiquetas: { x: 'x', y: 'y', z: R`\text{grado}` } })];
      const F = (x, y) => mix(Rel(x, y), sombraX(x), m);
      if (de > 0) P.push(terreno(F, { glsl: GLSL, uniformes: { uM: m }, desde: 1 - de }));
      const pb = paso >= 1 ? ev(q(1), 0, 1) : 0, v = reposo ? e.barre : paso === 1 ? 1 - pb : 0.65;
      if (paso >= 1 && m < 0.05) {
        const K = 50;
        for (let i = 0; i < K; i++) { const x0 = i / K, x1 = (i + 1) / K; P.push(poligono([[x0, v, 0], [x1, v, 0], [x1, v, Rel(x1, v)], [x0, v, Rel(x0, v)]], { color: ORO, alfa: 0.3 })); }
        P.push(curva((u) => [u, v, Rel(u, v)], [0, 1], { n: 100, color: ORO, ancho: 3 }));
      }
      const sx = paso === 1 ? pb : paso > 1 ? 1 : 0, acumulada = (x) => { let s = 0; for (let y = 1; y >= 1 - sx - 1e-9; y -= 0.02) s = Math.max(s, Rel(x, Math.max(y, 0))); return s; };
      if (sx > 0) P.push(curva((u) => [u, 1, paso === 1 ? acumulada(u) : sombraX(u)], [0, 1], { n: 80, color: AZUL, ancho: 3.2, brillo: true }), rotulo([0.86, 1, 1.07], R`\text{proy}_x`, { clave: 'px', tam: 21, color: AZUL, siempre: true }));
      const sy = ev(q(2), 0, 0.8);
      if (sy > 0) P.push(curva((u) => [0, u, sombraY(u)], [0, 1], { hasta: sy, n: 100, color: ROSA, ancho: 3.2, brillo: true }), rotulo([0, 0.2, 0.8], R`\text{proy}_y`, { clave: 'py', tam: 21, color: ROSA, dx: -26, siempre: true }));
      const M = [], C = [], pa = ev(q(1), 0, 0.3);
      if (pa > 0) {
        M.push(mapaCalor(F, { clave: `pr${m.toFixed(2)}` }), marco({ x: [0, 1], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x', y: 'y' } }), rotulo([0.5, 1], R`\text{El suelo, desde arriba}`, { clave: 'tm', dy: -18, tam: 16, color: GRIS2, alfa: pa }));
        M.push(linea([0, v], [1, v], { color: TEXTO, ancho: 1.2, alfa: 0.7 * pa, discontinua: true }));
        C.push(marco({ x: [0, 1], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x' } }), rotulo([0.5, 1], R`\text{El corte, y la sombra}`, { clave: 'tc', dy: -20, tam: 16, color: GRIS2, alfa: pa }));
        C.push(curva((u) => [u, sombraX(u)], [0, 1], { n: 120, color: AZUL, ancho: 2.6, alfa: pa }), curva((u) => [u, Rel(u, v)], [0, 1], { n: 120, color: ORO, ancho: 2.6, alfa: pa }));
      }
      return { principal: P, paneles: [{ ejes: { x: [0, 1], y: [0, 1], caja: { x: 810, y: 90, w: 216, h: 216 } }, prims: M }, { ejes: { x: [0, 1], y: [0, 1], caja: { x: 786, y: 400, w: 280, h: 190 } }, prims: C }] };
    },
  },
  manipulacion: '<ul><li>Mueve «corte en y»: el corte dorado nunca se sale por encima de la sombra azul.</li><li>Mueve «de relación a cortina»: el terreno se convierte en su extensión, y la sombra no cambia.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una relación habla de dos cosas a la vez. A veces solo te interesa una. La [[proyección]] responde: ¿cuál es el mejor grado que tiene cada $x$, sea cual sea su pareja?' },
    { tipo: 'ejemplo', texto: 'De una tabla, proyectar es quedarse con el máximo de cada fila, o de cada columna:', tabla: [['', 'y₁', 'y₂', 'y₃', 'mejor de la fila'], ['x₁', '0,1', '0,8', '0,3', '0,8'], ['x₂', '0,5', '0,2', '0,9', '0,9'], ['mejor de la columna', '0,5', '0,8', '0,9', '']], cierre: 'Cada fila se resume en un número. Se pierde información: ya no sabes con quién alcanzó ese 0,8.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\sup_y`, dice: 'De todos los $y$ posibles, el mayor valor: el [[supremo]]. Si hay una tabla, es el máximo de la fila.' },
      { tex: R`\mu_R(x, y)`, dice: 'El grado de la pareja.' },
      { tex: R`\mu_{\text{proy}_x}(x)`, dice: 'El resultado: un grado para cada $x$, sin $y$.' },
    ], todo: R`\mu_{\text{proy}_x R}(x) = \sup_y\ \mu_R(x, y)`, lee: '«El grado de $x$ es el mejor que alcanza con alguna pareja».' },
    { tipo: 'formal', titulo: 'Proyección y extensión cilíndrica', tex: R`La proyección de $R$ sobre $X$ es $\mu(x) = \sup_y \mu_R(x, y)$. La [[extensión cilíndrica]] de un $A$ de $X$ a $X \times Y$ es $\mu(x, y) = \mu_A(x)$, para todo $y$.`, lee: 'La primera aplana. La segunda estira. Y no son inversas: aplanar y estirar da un terreno mayor que el original.' },
    { tipo: 'demo', titulo: 'Toda relación cabe en la cortina de su sombra', plan: 'Se compara punto a punto. Es casi inmediato: una altura no puede superar al mayor valor de su propia fila.', tex: R`Si $C$ es la extensión cilíndrica de $\text{proy}_x R$, entonces $R \subseteq C$.`, pasos: [
      { texto: R`Fijemos $(x, y)$. El grado en $C$ es $\mu_C(x, y) = \sup_{y'} \mu_R(x, y')$.`, porque: 'Definición de extensión y de proyección. $y\'$ recorre todos los valores.' },
      { texto: R`El [[supremo]] de una lista no baja de ninguno de sus valores, y $\mu_R(x, y)$ es uno de ellos. Luego $\mu_R(x, y) \le \mu_C(x, y)$.`, porque: 'Propiedad del [[supremo]].' },
    ] },
    { tipo: 'nota', titulo: 'Para qué sirve', texto: 'La extensión es la que permite operar cosas que viven en dimensiones distintas: para combinar un conjunto de $X$ con una relación de $X \\times Y$, primero se le pone la cortina. Luego se proyecta. Esa es la receta del razonamiento difuso que viene.' },
  ],
  tecnicas: [
    { titulo: 'Sube, opera y baja', texto: 'Para combinar cosas de distinta dimensión: extiende a la grande, opera allí, y proyecta de vuelta.' },
  ],
  retos: [
    { id: 'proyecta-calc', tipo: 'calcular', enunciado: R`Sea una relación con filas $(0{,}2;\ 0{,}7)$ y $(0{,}6;\ 0{,}4)$. ¿Cuál es la proyección de la segunda columna?`, respuesta: 0.7, tol: 0.001, pistas: [R`La segunda columna tiene $0{,}7$ y $0{,}4$.`], explicacion: 'El mayor de la columna.' },
    { id: 'proyecta-pierde', tipo: 'elegir', enunciado: '¿Se puede recuperar la relación a partir de sus dos proyecciones?', opciones: ['Sí, siempre', 'Solo si los grados son 0 y 1', 'No: muchas relaciones distintas tienen las mismas sombras', 'Solo con el mínimo'], correcta: 2, explicacion: 'Lo único que se recupera, en general, es un terreno que contiene a la relación original.' },
    { id: 'demuestra-cilindro', tipo: 'demostrar', enunciado: R`Demuestra que proyectar la extensión cilíndrica de $A$ devuelve $A$.`, pistas: ['Escribe la definición: ¿cuánto vale $\\sup_y \\mu_A(x)$, si no depende de $y$?'],
      solucion: [
        { texto: R`La extensión cilíndrica es $\mu(x, y) = \mu_A(x)$, para todo $y$.`, porque: 'Definición.' },
        { texto: R`Proyectando: $\sup_y \mu(x, y) = \sup_y \mu_A(x) = \mu_A(x)$.`, porque: 'El valor no depende de $y$: el mayor de una lista de valores iguales es ese mismo valor.' },
      ] },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 6.1.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 5.'],
};
