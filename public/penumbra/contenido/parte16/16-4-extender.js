import { GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { curva, mapaCalor, marco, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { codigo, coma } from '../parte14/comun.js';

const R = String.raw;
const U = [0, 1], H = (x, y, p) => { const d = p + (1 - p) * (x + y - x * y); return d === 0 ? 0 : (x * y) / d; };
export default {
  id: '16-4-extender',
  titulo: 'Archivos y piezas propias',
  puente: 'Tienes la órbita entera. Queda el último paso, en el que todo lo difuso se convierte en un solo número. Ahí está el horizonte.',
  pregunta: '¿Y si quieres un «y» que no trae? Añadirlo son pocas líneas: fuzzython lo buscará por su nombre. Y un sistema entero se puede guardar en un archivo FCL, el formato estándar. Pero antes de fiarte de un «y» nuevo, ¿cómo sabes que se porta bien?',
  escena: {
    id: 'extender', formato: 'plano', W: 1100, H: 520,
    ejes: { x: U, y: U, caja: { x: 90, y: 60, w: 390, h: 390 } },
    entradas: [{ id: 'p', tipo: 'deslizador', etiqueta: 'el parámetro de tu norma', min: 0, max: 6, paso: 0.1, valor: 2 }],
    pasos: [
      { dur: 2800, texto: 'Esta es una familia conocida, la de <code>Hamacher</code>. El mapa de calor muestra su valor para cada pareja de grados.' },
      { dur: 3000, texto: 'A la derecha, el corte en $y = 1$. Una [[norma T]] debe dar ahí <b style="color:#f4d345;font-weight:400">la diagonal exacta</b>: $T(x, 1) = x$. Esta la cumple, con cualquier parámetro.' },
      { dur: 3000, texto: 'En <b style="color:#f05a5a;font-weight:400">rojo</b>, <code>FAND</code>, la que trae fuzzython con ese nombre: no pasa por la diagonal. Es la prueba de un segundo. Mueve el parámetro.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, p = e.p;
      const N = [mapaCalor((x, y) => H(x, y, p), { clave: 'h' + p.toFixed(1) }), marco({ x: U, y: U }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x', y: 'y' } }), rotulo([1, 1], R`p = ${coma(p, 1)}`, { clave: 'p', ancla: 'r', dy: -14, tam: 21, color: ORO, alfa: al })];
      const G = [marco({ x: U, y: U }, { alfa: g1, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x', y: R`T(x, 1)` } })];
      if (g1 > 0) G.push(curva((x) => [x, H(x, 1, p)], U, { n: 80, color: ORO, ancho: 3, alfa: g1 }), curva((x) => [x, H(x, 0.5, p)], U, { n: 80, color: GRIS2, ancho: 1.6, alfa: 0.8 * g1 }));
      if (g2 > 0) G.push(curva((x) => [x, 0.5 * Math.min(x, 1) + 0.25 * (x + 1)], U, { n: 80, color: ROJO, ancho: 2.4, alfa: g2 }));
      return { principal: N, paneles: [{ ejes: { x: U, y: U, caja: { x: 620, y: 80, w: 360, h: 360 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Mueve el parámetro: el mapa cambia, y la curva dorada sigue en su sitio.</li><li>La curva gris, $T(x;\\ 0{,}5)$, sí se mueve.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'fuzzython busca sus operadores por su nombre: la tuya se declara con <code>@norm</code> y se registra, y ya está disponible en cualquier bloque. Es la misma idea para los conjuntos: heredas de <code>FuzzySet</code>, y defines cómo se evalúa. Y si quieres guardar el sistema entero, tienes FCL, un formato del estándar IEC 61131-7.' },
    codigo('Tu propio «y»', 'El decorador solo le pone nombre. Para que <code>get_norm</code> la encuentre, o se guarda como <code>norms/hamacher2.py</code>, o se registra en el módulo, como aquí:', "import norms.norms as registro\nfrom norms.norms import get_norm\nfrom utils import norm\n\n@norm(type_='TNORM', name='HAMACHER2')\ndef hamacher2(x, y):\n    d = 2 + (1 - 2) * (x + y - x * y)\n    return 0 if d == 0 else x * y / d\n\nregistro.hamacher2 = hamacher2\nt = get_norm('HAMACHER2')\nprint(t(0.5, 1), t(0.7, 1), t(0.5, 0.5))"),
    codigo('Tu propio conjunto', 'Hay que definir <code>__call__</code> <b>y también</b> <code>membership</code>: es un error de la librería, y si no lo haces, las entradas difusas dan valores falsos.', "from fsets.fuzzy_set import FuzzySet\nfrom interval import Interval\nimport math\n\nclass Logistica(FuzzySet):\n    def __init__(self, c, k, intervalo):\n        super().__init__(None, intervalo)\n        self.c, self.k = c, k\n    def __call__(self, x):\n        return 1 / (1 + math.exp(-self.k * (x - self.c)))\n    membership = __call__\n\nf = Logistica(5, 2, Interval(0, 10))\nprint(round(f(5), 3), round(f(7), 3))\nprint(round(f.COG(), 3))"),
    codigo('FCL', 'Un sistema en un archivo. Este bloque no se ha ejecutado aquí: leer FCL necesita <code>antlr3</code> versión 3.5, con un parche a mano que indica el propio código. La sintaxis sale del archivo <code>store/FCL.g</code> de la librería.', "FUNCTION_BLOCK cocina\n    VAR_INPUT temp: REAL; END_VAR\n    VAR_OUTPUT tiempo: REAL; END_VAR\n    FUZZIFY temp\n        TERM frio := (0, 1) (15, 1) (20, 0);\n    END_FUZZIFY\n    DEFUZZIFY tiempo\n        TERM corto := (0, 1) (10, 1) (15, 0);\n        METHOD: COG;\n        DEFAULT := 0;\n    END_DEFUZZIFY\n    RULEBLOCK primero\n        AND: MIN;\n        ACT: MIN;\n        ACCU: MAX;\n        RULE 1: IF temp IS frio THEN tiempo IS corto;\n    END_RULEBLOCK\nEND_FUNCTION_BLOCK", 'Y lo más importante: FCL ejecuta código con <code>eval</code>. Nunca cargues un archivo de un desconocido.', { ejecutado: false }),
    { tipo: 'ejemplo', texto: 'Las pruebas que debe pasar una [[norma T]], con la de Hamacher, $p = 2$:', tabla: [['Propiedad', 'Se pide', 'Prueba'], ['Neutro', '$T(x, 1) = x$', '$T(0{,}7;\\ 1) = 0{,}7$'], ['Conmutativa', '$T(x, y) = T(y, x)$', 'La fórmula es simétrica'], ['Monótona', 'Crece con $x$', 'Se ve en el mapa'], ['Asociativa', '$T(T(x, y), z) = T(x, T(y, z))$', 'Compruébala con tres valores']], cierre: 'Si falla el neutro, ni te molestes con los demás.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`p`, dice: 'El parámetro de la familia. Con $p = 1$ es el producto.' },
      { tex: R`x + y - x y`, dice: 'La suma algebraica: aparece en el denominador.' },
    ], todo: R`H_p(x, y) = \frac{x y}{p + (1 - p)(x + y - x y)}`, lee: '«El producto, corregido por un denominador que depende de $p$».' },
    { tipo: 'formal', titulo: 'Casos conocidos', tex: R`$H_1(x, y) = x y$, el producto. $H_0$ se conoce como producto de Hamacher, y $H_2 = \frac{x y}{2 - (x + y - x y)}$ es el producto de Einstein, el <code>EPROD</code> de fuzzython.`, lee: 'Comprueba $H_2$ con la fórmula de <code>EPROD</code>: $1 + (1 - x)(1 - y) = 2 - x - y + x y$. Son la misma función.' },
    { tipo: 'demo', titulo: 'El neutro se cumple para todo $p$', plan: 'Se sustituye $y = 1$.', tex: R`$H_p(x, 1) = x$ para todo $p$ y todo $x$.`, pasos: [
      { texto: R`Con $y = 1$: $x + 1 - x = 1$.`, porque: 'El término $x + y - x y$ se simplifica.' },
      { texto: R`El denominador vale $p + 1 - p = 1$.`, porque: 'El parámetro se cancela.' },
      { texto: R`Queda $\frac{x \cdot 1}{1} = x$.`, porque: 'Por eso la curva dorada no se mueve, aunque muevas el parámetro.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Reconoce la misma función con otro nombre', texto: 'Antes de añadir algo nuevo, simplifica su fórmula. Hamacher con $p = 2$ es <code>EPROD</code>, que ya existía. Te ahorras una función, y un error.' }],
  retos: [
    { id: 'hama-prod', tipo: 'manipular', enunciado: 'Busca el parámetro que convierte este «y» en el producto.', precision: (e) => (Math.abs(e.p - 1) < 1e-6 ? 1 : 0), prueba: { p: 1 }, pendiente: (e) => `Con $p = ${e.p.toFixed(1).replace('.', ',')}$, $T(0{,}5;\\ 0{,}5) = ${H(0.5, 0.5, e.p).toFixed(3).replace('.', ',')}$.`, pistas: ['Con él, el denominador vale 1 siempre.'], explicacion: 'Con $p = 1$, el denominador es 1.' },
    { id: 'hama-calc', tipo: 'calcular', enunciado: R`Calcula $H_2(0{,}5;\ 0{,}5)$. Redondea a 3 decimales.`, respuesta: 0.2, tol: 0.001, pistas: [R`$\frac{0{,}25}{2 - 0{,}75}$.`], explicacion: R`$\frac{0{,}25}{1{,}25} = 0{,}2$.` },
    { id: 'fcl-elegir', tipo: 'elegir', enunciado: '¿Por qué nunca hay que cargar un FCL de un desconocido?', opciones: ['Puede ser muy largo', 'Porque ejecuta código con eval', 'Porque tiene errores', 'Porque no es estándar'], correcta: 1, explicacion: 'Un consecuente Sugeno puede ser cualquier expresión de Python.' },
    { id: 'demuestra-conm', tipo: 'demostrar', enunciado: R`Demuestra que $H_p$ es conmutativa.`, pistas: ['Mira qué aparece en la fórmula.'], solucion: [{ texto: R`$x y = y x$, y $x + y - x y = y + x - y x$.`, porque: 'Son conmutativas la suma y el producto.' }, { texto: R`Luego numerador y denominador no cambian al intercambiar $x$ e $y$.`, porque: 'Y por eso tampoco cambia el cociente.' }] },
  ],
  referencias: ['H. Hamacher, «Über logische Aggregationen nicht-binär explizierter Entscheidungskriterien» (1978).', 'IEC 61131-7, <em>Fuzzy control programming</em> (2000).'],
};
