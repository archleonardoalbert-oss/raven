import { ev, mix } from '../../motor/tiempo.js';
import { RENDER3D, mA, mB, paisaje } from '../parte3/paisaje.js';

const R = String.raw;
const MAMDANI = Math.min, KLEENE = (a, b) => Math.max(1 - a, b);
const GLSL = 'return mix(min(a,b),max(1.-a,b),uM);';

export default {
  id: '5-4-reglas',
  titulo: 'Reglas si-entonces',
  puente: 'Ya tienes la regla convertida en un terreno. Falta lo importante: usarla. Si sabes algo parecido a la condición, ¿qué concluyes?',
  pregunta: '«Si estudio mucho, soy buen estudiante». Una frase, con palabras vagas. ¿Cómo se convierte en algo que se pueda calcular?',
  escena: {
    id: 'reglas', formato: '3d', W: 1100, H: 690, render3d: RENDER3D,
    entradas: [
      { id: 'tipo', tipo: 'deslizador', etiqueta: 'la regla como «y» (0) o como «implica» (1)', min: 0, max: 1, paso: 1, valor: 1 },
      { id: 'p', tipo: 'arrastre', panel: 0, valor: [0.62, 0.4], region: { x: [0, 1], y: [0, 1] } },
    ],
    pasos: [
      { dur: 2800, texto: 'La regla: «si $x$ es <b style="color:#58c4dd;font-weight:400">A</b>, entonces $y$ es <b style="color:#fc6282;font-weight:400">B</b>». Cada palabra es un conjunto difuso. La regla es una relación entre $x$ e $y$: un terreno.' },
      { dur: 3000, texto: 'Una forma: <b style="color:#f4d345;font-weight:400">como un «y»</b>, $\\min(A, B)$. Solo es alto donde se cumplen las dos cosas. Es la que usan casi todos los controladores: es la regla de Mamdani.' },
      { dur: 3600, texto: 'Otra: <b style="color:#f4d345;font-weight:400">como una implicación</b>, «no A, o B». Mira qué cambia: donde A no se cumple, la frase vale 1. La regla no dice nada ahí, así que no la contradice.' },
      { dur: 2000, texto: 'Son dos lecturas distintas. La primera dice «qué parejas ocurren a la vez». La segunda, «qué parejas no violan la regla».' },
    ],
    primitivas({ q, paso, e }) {
      const reposo = paso === 3 && q(3) >= 1, m = reposo ? Math.round(e.tipo) : paso < 2 ? 0 : paso === 2 ? ev(q(2), 0, 0.85) : 1;
      const f = (a, b) => mix(MAMDANI(a, b), KLEENE(a, b), m), de = paso === 0 ? 0 : paso === 1 ? ev(q(1), 0, 1) : 1;
      return paisaje({ f, glsl: GLSL, uniformes: { uM: m }, v: reposo ? e.p[1] : 0.4, xp: reposo ? e.p[0] : 0.62, rev: 1 - de, ba: ev(q(0), 0, 0.3), pA: ev(q(0), 0.2, 0.6), pB: ev(q(0), 0.6, 1), fr: ev(q(1), 0, 0.3), so: ev(q(1), 0.2, 0.5), claveMapa: `re${m.toFixed(2)}`, nombreCorte: m > 0.5 ? R`A \to B` : R`A \wedge B` });
    },
  },
  manipulacion: '<ul><li>Cambia la lectura de la regla con el deslizador, y mira cómo cambia todo el terreno.</li><li>Arrastra en el mapa hasta una zona donde A sea casi 0, a la izquierda: compara las dos lecturas.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una regla une dos frases: si esto, entonces aquello. Como cada frase es un conjunto difuso, la regla entera es una [[relación]] entre los dos universos. Lo que hay que decidir es qué valor dar a cada pareja $(x, y)$.' },
    { tipo: 'ejemplo', texto: 'Con «si estudio mucho, saco buena nota», y grados $a$ y $b$:', tabla: [['Estudio (a)', 'Nota (b)', 'Como «y»', 'Como implicación'], ['1', '1', '1', '1'], ['1', '0', '0', '0'], ['0', '1', '0', '1'], ['0', '0', '0', '1'], ['0,7', '0,4', '0,4', '0,4']], cierre: 'La diferencia está en las filas donde no estudio. Como implicación, la regla no se rompe. Como «y», esa pareja no es de la que habla la regla.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`R(x, y)`, dice: 'La regla, como una relación: un grado para cada pareja.' },
      { tex: R`\min(\mu_A(x), \mu_B(y))`, dice: 'Lectura de Mamdani. Es el [[producto cartesiano]] $A \\times B$.' },
      { tex: R`\max(1 - \mu_A(x),\ \mu_B(y))`, dice: 'Lectura lógica: una [[implicación]] de verdad.' },
    ], todo: R`\text{si } x \text{ es } A,\ \text{entonces } y \text{ es } B`, lee: 'En cualquiera de las dos lecturas, la frase se convierte en un terreno que luego se puede operar.' },
    { tipo: 'formal', titulo: 'Regla difusa', tex: R`Una regla «si $x$ es $A$, entonces $y$ es $B$» es una relación difusa $R$ entre $X$ e $Y$, con $\mu_R(x, y) = I(\mu_A(x), \mu_B(y))$, donde $I$ es una implicación, o bien una [[norma T]] en el enfoque de Mamdani.`, lee: 'Ojo: llamar «implicación» a $\\min(a, b)$ es incorrecto en sentido estricto. No cumple la tabla: $\\min(0, 0) = 0$. Pero funciona muy bien en control, por razones que verás.' },
    { tipo: 'demo', titulo: 'Mamdani no es una implicación', plan: 'Basta encontrar una esquina de la tabla donde falle: es un contraejemplo.', pasos: [
      { texto: R`La tabla clásica exige $I(0, 0) = 1$: si la condición es falsa, la frase se cumple.`, porque: 'Definición de implicación.' },
      { texto: R`Pero $\min(0, 0) = 0$. Por tanto, $\min$ no es una implicación.`, porque: 'Un solo caso que falla basta para negar algo que debía valer siempre.' },
    ] },
    { tipo: 'nota', titulo: 'Un sistema, muchas reglas', texto: 'Un sistema real tiene muchas reglas. Con Mamdani se unen con «o»: cada regla describe una zona posible. Con implicaciones, se unen con «y»: cada regla restringe más. Esto se verá en detalle en la región «Sistemas».' },
  ],
  tecnicas: [
    { titulo: 'Para negar algo general, un caso', texto: 'Para probar que algo no es cierto siempre, basta un ejemplo. Busca primero en los casos más extremos.' },
  ],
  retos: [
    { id: 'encuentra-verdad', tipo: 'manipular', enunciado: 'Con la lectura de implicación, busca en el mapa una pareja donde A casi no se cumpla (grado menor que 0,1) y la regla valga más de 0,9.', precision: (e) => (Math.round(e.tipo) === 1 && mA(e.p[0]) < 0.1 && KLEENE(mA(e.p[0]), mB(e.p[1])) > 0.9 ? 1 : 0), prueba: { p: [0.1, 0.5], tipo: 1 }, pistas: ['A está en el eje $x$: mira la zona izquierda.'], explicacion: 'Si la condición no se da, la regla no se rompe. Por eso vale casi 1.' },
    { id: 'regla-calc', tipo: 'calcular', enunciado: R`Con $a = 0{,}2$ y $b = 0{,}7$, ¿cuánto vale la regla como implicación de Kleene, menos la regla como «y»?`, respuesta: 0.6, tol: 0.001, pistas: [R`Implicación: $\max(0{,}8;\ 0{,}7) = 0{,}8$.`, R`«Y»: $\min(0{,}2;\ 0{,}7) = 0{,}2$.`], explicacion: R`$0{,}8 - 0{,}2 = 0{,}6$.` },
    { id: 'mamdani-o-implica', tipo: 'elegir', enunciado: 'Si la condición no se cumple en absoluto, ¿qué vale la regla de Mamdani?', opciones: ['1, como en lógica', '0: esa pareja no es de la que habla la regla', 'El grado de la conclusión', 'No está definida'], correcta: 1, explicacion: R`$\min(0, b) = 0$. Es la diferencia con una implicación verdadera.` },
  ],
  referencias: ['E. H. Mamdani, S. Assilian (1975).', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 9 y 11.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 11.'],
};
