import { BLANCO, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { IMPLICACIONES } from '../../nucleo/razonar.js';
import { linea, mapaCalor, marco, punto, rotulo, terreno } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const LISTA = [IMPLICACIONES.kleene, IMPLICACIONES.lukasiewicz, IMPLICACIONES.godel];
const NOMBRES = ['Kleene-Dienes', 'Łukasiewicz', 'Gödel'];
const FORMULA = [R`\max(1 - a,\ b)`, R`\min(1,\ 1 - a + b)`, R`1 \text{ si } a \le b;\ b \text{ si no}`];
const GLSL = 'float k=max(1.-x,y);float l=min(1.,1.-x+y);float g=x<=y?1.:y;float p=uP<.5?k:uP<1.5?l:g;float c=uC<.5?k:uC<1.5?l:g;return mix(p,c,uM);';
const ESQUINAS = [[0, 0, 1], [0, 1, 1], [1, 0, 0], [1, 1, 1]];

export default {
  id: '5-2-implicaciones',
  titulo: '«Si… entonces», con grados',
  puente: 'Ya sabes combinar verdades. Pero las reglas no hablan de verdades sueltas, sino de palabras: «si la velocidad es alta». ¿Qué es exactamente una palabra así?',
  pregunta: '«Si estudias, apruebas». Si estudias bastante, y apruebas por poco, ¿la frase se cumple? ¿Cuánto? Es la operación más delicada de todas.',
  escena: {
    id: 'implicaciones', formato: '3d', W: 1100, H: 690, render3d: { cx: 365, cy: 372, S: 335 },
    entradas: [
      { id: 'cual', tipo: 'deslizador', etiqueta: 'implicación (0 Kleene, 1 Łukasiewicz, 2 Gödel)', min: 0, max: 2, paso: 1, valor: 2 },
      { id: 'p', tipo: 'arrastre', panel: 0, valor: [0.7, 0.4], region: { x: [0, 1], y: [0, 1] } },
    ],
    pasos: [
      { dur: 2600, texto: 'Sobre el suelo, todas las parejas de verdades: $a$ a lo largo de un eje, y $b$ del otro. Las cuatro agujas son la tabla clásica. Solo una esquina vale 0: si $a$ es cierta y $b$ falsa.' },
      { dur: 3000, texto: 'Hay que rellenar el interior. Una forma: «no $a$, o $b$». Es la implicación de <b style="color:#f4d345;font-weight:400">Kleene-Dienes</b>. El terreno pasa por las cuatro agujas.' },
      { dur: 2800, texto: 'Otra: cuanto menos le falte a $b$ para llegar a $a$, más cierta es la frase. Es la de <b style="color:#f4d345;font-weight:400">Łukasiewicz</b>. Las mismas agujas, otro terreno.' },
      { dur: 2800, texto: 'Otra más, la de <b style="color:#f4d345;font-weight:400">Gödel</b>: si $b$ llega a $a$, es del todo cierta. Si no, vale $b$. Tiene un acantilado: un salto brusco.' },
    ],
    primitivas({ q, paso, e }) {
      const reposo = paso === 3 && q(3) >= 1, cur = reposo ? Math.round(e.cual) : paso === 0 ? 0 : paso - 1, prev = reposo ? cur : Math.max(0, cur - 1), m = reposo || paso <= 1 ? 1 : ev(q(paso), 0, 0.7);
      const f = (a, b) => mix(LISTA[prev](a, b), LISTA[cur](a, b), m), ba = ev(q(0), 0, 0.3), s = paso === 0 ? 0 : paso === 1 ? ev(q(1), 0, 1) : 1;
      const P = [marco({ x: [0, 1], y: [0, 1], z: [0, 1] }, { alfa: ba, paredX: GRIS2, paredY: GRIS2, etiquetas: { x: 'a', y: 'b' } })];
      if (s > 0) P.push(terreno(f, { glsl: GLSL, uniformes: { uP: prev, uC: cur, uM: m }, desde: 1 - s }));
      const ag = ev(q(0), 0.3, 0.9);
      for (const [a, b, v] of ESQUINAS) {
        const c = v === 0 ? ROJO : BLANCO;
        P.push(linea([a, b, 0], [a, b, Math.max(v, 0.0001)], { color: c, ancho: 2.4, alfa: ag }), punto([a, b, v], { color: c, radio: 7, alfa: ag }));
        P.push(rotulo([a, b, v], R`(${a}, ${b}) \to ${v}`, { clave: `e${a}${b}`, dy: -18, tam: 16, color: c, alfa: ag, siempre: true }));
      }
      const M = [], pa = ev(q(1), 0.5, 1), [xa, xb] = reposo ? e.p : [0.7, 0.4];
      if (pa > 0) {
        M.push(mapaCalor(f, { clave: `imp${prev}${cur}${m.toFixed(2)}` }), marco({ x: [0, 1], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'a', y: 'b' } }));
        M.push(rotulo([0.5, 1], R`\text{Desde arriba}`, { clave: 'tm', dy: -18, tam: 16, color: GRIS2, alfa: pa }), punto([xa, xb], { color: BLANCO, radio: 6, alfa: pa }));
        P.push(linea([xa, xb, 0], [xa, xb, f(xa, xb)], { color: ORO, ancho: 2.2, alfa: pa }), punto([xa, xb, f(xa, xb)], { color: ORO, radio: 7, alfa: pa }));
      }
      const T = [];
      T.push(rotulo([550, 20], R`\text{La altura es la verdad de la frase}`, { clave: 'alt', tam: 15, color: GRIS2, alfa: pa }), rotulo([550, 60], R`\text{${NOMBRES[cur]}}`, { clave: 'n', tam: 26, color: ORO, alfa: pa }), rotulo([550, 104], FORMULA[cur], { clave: 'f', tam: 24, alfa: pa }));
      T.push(rotulo([550, 170], R`{\color{#58c4dd}a = ${coma(xa)}},\ {\color{#fc6282}b = ${coma(xb)}}`, { clave: 'c', tam: 22, alfa: pa }), rotulo([550, 212], R`\to\ {\color{#f4d345}${coma(f(xa, xb))}}`, { clave: 'r', tam: 28, alfa: pa }));
      return { principal: P, paneles: [{ ejes: { x: [0, 1], y: [0, 1], caja: { x: 810, y: 90, w: 216, h: 216 } }, prims: M }, { ejes: { x: [300, 800], y: [260, 0], caja: { x: 786, y: 370, w: 280, h: 240 } }, prims: T }] };
    },
  },
  manipulacion: '<ul><li>Elige la implicación, y gira la vista 3D: las cuatro agujas siempre tocan el terreno.</li><li>Arrastra en el mapa: lee el valor de una misma pareja con cada implicación.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'En lógica clásica, «si a, entonces b» se puede escribir de varias formas equivalentes. Al pasar a grados, esas formas dejan de ser iguales. De ahí salen las distintas familias de [[implicaciones|implicación]]. Ninguna es la correcta: dependen de qué quieres modelar.' },
    { tipo: 'ejemplo', texto: 'Con $a = 0{,}7$ y $b = 0{,}4$:', tabla: [['Implicación', 'Cuenta', 'Valor'], ['Kleene-Dienes', 'máx(0,3; 0,4)', '0,4'], ['Łukasiewicz', 'mín(1; 1 − 0,7 + 0,4)', '0,7'], ['Gödel', 'como 0,7 > 0,4, vale b', '0,4']], cierre: 'Cada una mide algo distinto. Kleene mira si $a$ es falsa o $b$ cierta. Łukasiewicz, cuánto le falta a $b$ para llegar a $a$.' },
    { tipo: 'simbolos', intro: 'Dos ideas de las que salen las familias.', piezas: [
      { tex: R`\neg a \vee b`, dice: 'La familia S: «no a, o b». Clásicamente es lo mismo que la implicación. Con [[norma S]] y [[complemento]]: $S(1 - a,\\ b)$.' },
      { tex: R`\sup \{ c : T(a, c) \le b \}`, dice: 'La familia R: el mayor grado $c$ que, combinado con $a$, no supera a $b$. Es decir: cuánto hay que añadir a $a$, sin pasarse de $b$. Se llama residuo.' },
      { tex: R`\neg a \vee (a \wedge b)`, dice: 'La familia QL, de la lógica cuántica: «no a, o bien a y b».' },
    ], todo: R`I(a, b) = \max(1 - a,\ b)`, lee: 'Es la familia S con el máximo: Kleene-Dienes. Con la [[norma S]] de Łukasiewicz, la misma receta da $\\min(1, 1 - a + b)$.' },
    { tipo: 'formal', titulo: 'Implicación difusa', tex: R`Una implicación es una función $I : [0,1]^2 \to [0,1]$ con $I(0, 0) = I(0, 1) = I(1, 1) = 1$ e $I(1, 0) = 0$, que no sube si aumenta $a$ y no baja si aumenta $b$.`, lee: 'Es decir: si la condición es más fuerte, es más difícil de cumplir; si la conclusión es más cierta, más fácil.' },
    { tipo: 'demo', titulo: 'Las tres cumplen la tabla clásica', plan: 'Se comprueba en las cuatro esquinas. Por ejemplo, con Kleene-Dienes.', tex: R`$I(a, b) = \max(1 - a,\ b)$ coincide con la tabla clásica en las esquinas.`, pasos: [
      { texto: R`$I(0, 0) = \max(1, 0) = 1$ e $I(0, 1) = \max(1, 1) = 1$.`, porque: 'Si la condición es falsa, la frase se cumple.' },
      { texto: R`$I(1, 1) = \max(0, 1) = 1$.`, porque: 'Condición y conclusión ciertas.' },
      { texto: R`$I(1, 0) = \max(0, 0) = 0$.`, porque: 'La única forma de romper la frase.' },
    ] },
    { tipo: 'nota', titulo: 'Cuál usar', texto: 'Para razonar con rigor, las de la familia R tienen las mejores propiedades matemáticas: es la base de la región 8. En cambio, los controladores suelen usar algo más simple, que no es una implicación verdadera, y que verás en la parada de las reglas.' },
  ],
  tecnicas: [
    { titulo: 'Equivalente en lo clásico no es equivalente aquí', texto: 'Dos fórmulas que coinciden con 0 y 1 pueden separarse con grados. Cada forma clásica es una opción distinta.' },
  ],
  retos: [
    { id: 'busca-diferencia', tipo: 'manipular', enunciado: R`Con Gödel y Kleene, busca en el mapa una pareja donde Gödel valga 1 y Kleene valga menos de $0{,}6$.`, precision: (e) => { const [a, b] = e.p; return IMPLICACIONES.godel(a, b) === 1 && IMPLICACIONES.kleene(a, b) < 0.6 ? 1 : 0; }, prueba: { p: [0.5, 0.52] }, pistas: ['Gödel vale 1 si $b \\ge a$.', 'Para que Kleene sea bajo, $a$ debe ser alto y $b$ bajo. Busca un término medio.'], explicacion: 'Con $a \\approx b \\approx 0{,}5$: Gödel dice «la conclusión llega», Kleene dice «ni condición falsa ni conclusión cierta».' },
    { id: 'implica-calc', tipo: 'calcular', enunciado: R`¿Cuánto vale la de Łukasiewicz con $a = 0{,}9$ y $b = 0{,}5$?`, respuesta: 0.6, tol: 0.001, pistas: [R`$\min(1,\ 1 - 0{,}9 + 0{,}5)$.`], explicacion: R`$\min(1;\ 0{,}6) = 0{,}6$.` },
    { id: 'demuestra-esquinas', tipo: 'demostrar', enunciado: R`Comprueba que la de Gödel, $I(a, b) = 1$ si $a \le b$ y $= b$ si no, cumple la tabla clásica.`, pistas: ['Mira las cuatro esquinas y, en cada una, si se cumple $a \\le b$.'],
      solucion: [
        { texto: R`$(0, 0)$, $(0, 1)$ y $(1, 1)$ cumplen $a \le b$, luego valen 1.`, porque: 'Primer caso de la definición.' },
        { texto: R`$(1, 0)$ no lo cumple, y vale $b = 0$.`, porque: 'Segundo caso.' },
      ] },
  ],
  referencias: ['G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 11.', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 9.', 'P. Hájek, <em>Metamathematics of Fuzzy Logic</em>, 1998.'],
};
