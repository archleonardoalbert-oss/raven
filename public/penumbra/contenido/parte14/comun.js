// Piezas de las escenas del Horizonte.
import { curva, poligono as poli } from '../../motor/primitivas.js';
import { SALIDAS } from './salidas.js';
const R = String.raw;
export const coma = (v, d = 2) => v.toFixed(d).replace('.', '{,}');
/** Una curva de fuzzython, dibujada por sus puntos: con sus extremos a la vista. */
export const trazar = (P, dom, op = {}) => curva((x) => [x, P.val(x)], dom, { n: 240, ancho: 2.8, tol: 1, ...op });
export const relleno = (P, dom, op = {}) => { const xs = [dom[0], ...P.puntos.map((q) => q[0]).filter((x) => x > dom[0] && x < dom[1]), dom[1]]; return poli([[dom[0], 0], ...xs.map((x) => [x, P.val(x)]), [dom[1], 0]], op); };
export { R };
/** Un bloque de Python. Su salida es la del fuzzython real, por construcción: sale de salidas.js, y si cambias el código, hay que volver a ejecutarlo. */
export const codigo = (etiqueta, texto, cod, cierre, otros = {}) => ({ tipo: 'codigo', etiqueta, texto, codigo: cod, salida: otros.ejecutado === false ? undefined : SALIDAS[(otros.prefacio ? otros.prefacio + '\n' : '') + cod]?.replace(/^\[.* system time\] compute.*\n?/gm, ''), cierre, ...otros });
/** Lo que se repite de parada en parada: se ejecuta de verdad, pero se muestra plegado. */
export const PREP_TEMP = "from adjective import Adjective\nfrom fsets.polygon import Polygon\nfrom ruleblock import RuleBlock\nfrom variable import Variable\n\ncold = Adjective('cold', Polygon((0, 1), (15, 1), (20, 0)))\nnormal = Adjective('normal', Polygon((15, 0), (20, 1), (30, 1), (35, 0)))\nhot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))\ntemp = Variable('temp', 'C', cold, normal, hot)";
export const PREP_MAMDANI = PREP_TEMP + "\nshort = Adjective('short', Polygon((0, 1), (10, 1), (15, 0)))\nusual = Adjective('usual', Polygon((10, 0), (15, 1), (25, 1), (30, 0)))\nlarge = Adjective('large', Polygon((25, 0), (30, 1), (40, 1)))\nminutes = Variable('minutes', 'min', short, usual, large, defuzzification='COG', default=0)\nb = RuleBlock('b')\nb.add_rules('if temp is cold or temp is normal then minutes is short with 0.5',\n            'if temp is normal then minutes is usual',\n            'if temp is hot then minutes is large', scope=locals())";
