import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { EJEMPLO, conjuntoEjemplo, fuerzasEjemplo, mamdaniEjemplo } from '../../nucleo/fuzzython.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { coma, relleno, trazar } from './comun.js';
import { tramo } from '../parte9/comun.js';

import { SALIDAS } from './salidas.js';

const R = String.raw;
const DT = [0, 40], DM = [0, 40], C = { cold: AZUL, normal: ORO, hot: ROSA }, S = { short: AZUL, usual: ORO, large: ROSA };

export default {
  id: '14-1-encender',
  titulo: 'Encender fuzzython',
  puente: 'Ya lo has visto funcionar entero. Ahora, pieza a pieza: lo primero es qué es un conjunto para fuzzython.',
  pregunta: 'Ya sabes lo que es un sistema difuso: lo montaste a mano en la región 6. fuzzython es una librería de Python que lo hace por ti, escrita en MATCOM. No traía documentación, y además no arranca. La documentación ya la tienes: el botón <b>Documentación</b>, arriba, la abre en cualquier momento. ¿Empezamos arreglando lo otro?',
  escena: {
    id: 'encender', formato: 'plano', W: 1100, H: 560,
    ejes: { x: DT, y: [0, 1], caja: { x: 70, y: 60, w: 450, h: 180 } },
    entradas: [{ id: 't', tipo: 'deslizador', etiqueta: 'temperatura del agua, en grados', min: 0, max: 40, paso: 0.5, valor: 22 }],
    pasos: [
      { dur: 2800, texto: 'El ejemplo que trae fuzzython: según la temperatura, cuántos minutos dejar algo al fuego. Arriba, sus tres palabras: <b style="color:#58c4dd;font-weight:400">frío</b>, <b style="color:#f4d345;font-weight:400">normal</b> y <b style="color:#fc6282;font-weight:400">caliente</b>.' },
      { dur: 3000, texto: 'Entra una temperatura, y cada palabra se cumple en un grado. Es lo que hiciste en la región 1: la línea vertical corta las tres curvas.' },
      { dur: 3200, texto: 'Las reglas pasan esos grados a la salida, abajo: cada conjunto se recorta a su fuerza. Y todo se une en una sola forma.' },
      { dur: 3000, texto: 'Su centro de gravedad es la respuesta. Esta cuenta es la que da <code>compute()</code>. La curva de la derecha son todas las respuestas posibles, calculadas igual que en el fuzzython real.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, t = e.t, f = fuerzasEjemplo(t);
      const A = [marco({ x: DT, y: [0, 1] }, { alfa: al, ticks: { x: [0, 20, 40], y: [0, 1] }, etiquetas: { x: R`\text{grados}` } })];
      for (const [k, P] of Object.entries(EJEMPLO.temp)) A.push(trazar(P, DT, { color: C[k], alfa: al }));
      if (g1 > 0) { A.push(...tramo([t, 0], [t, 1], { color: GRIS2, ancho: 1.2, alfa: 0.8 * g1, discontinua: true })); for (const [k, P] of Object.entries(EJEMPLO.temp)) A.push(punto([t, P.val(t)], { color: C[k], radio: 6, alfa: g1 })); }
      const B = [marco({ x: DM, y: [0, 1] }, { alfa: g2, ticks: { x: [0, 20, 40], y: [0, 1] }, etiquetas: { x: R`\text{minutos}` } })], cj = conjuntoEjemplo(t);
      if (g2 > 0) { for (const [k, P] of Object.entries(EJEMPLO.min)) B.push(trazar(P, DM, { color: S[k], ancho: 1.2, alfa: 0.45 * g2 })); if (cj) B.push(relleno(cj, DM, { color: ORO, alfa: 0.45 * g2 }), trazar(cj, DM, { color: ORO, ancho: 2.6, alfa: g2 })); }
      const G = [marco({ x: DT, y: DM }, { alfa: g3, ticks: { x: [0, 20, 40], y: [0, 20, 40] }, etiquetas: { x: R`\text{grados}`, y: R`\text{minutos}` } })], res = cj ? mamdaniEjemplo(t) : 0;
      if (g3 > 0) { if (cj) B.push(...tramo([res, 0], [res, 1], { color: [255, 255, 255], ancho: 2, alfa: g3 })); G.push(curva((u) => [u, mamdaniEjemplo(u)], DT, { n: 160, color: ORO, ancho: 2.6, alfa: g3, tol: 1 }), punto([t, res], { color: ORO, radio: 7, alfa: g3 }), rotulo([40, 40], R`${coma(res, 1)}\ \text{minutos}`, { clave: 'res', ancla: 'r', dy: -14, tam: 22, color: ORO, alfa: g3 })); }
      return { principal: A, paneles: [{ ejes: { x: DM, y: [0, 1], caja: { x: 70, y: 310, w: 450, h: 180 } }, prims: B }, { ejes: { x: DT, y: DM, caja: { x: 640, y: 110, w: 400, h: 340 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Mueve la temperatura: la forma de abajo cambia, y el punto recorre la curva.</li><li>Busca dónde la curva se queda plana: cuando solo actúa una regla, la respuesta no cambia.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'fuzzython no trae nada nuevo que no hayas visto en la región 6: conjuntos, reglas, activación, acumulación y desdifusión. Lo que aporta es escribirlo en pocas líneas. Pero es de 2013, y no se ha actualizado para el Python de hoy: hace falta un pequeño arreglo para que funcione.' },
    { tipo: 'codigo', etiqueta: 'Arrancar', texto: 'Se descarga con <code>git clone https://github.com/yudivian/fuzzython</code>. Sin instalar nada, basta con esto al principio de tu programa:', codigo: "import sys, time\ntime.clock = time.perf_counter           # Python lo retiró en la versión 3.8\nsys.path.insert(0, 'ruta/a/fuzzython')   # la carpeta del repositorio", salida: SALIDAS["import sys, time\ntime.clock = time.perf_counter           # Python lo retiró en la versión 3.8\nsys.path.insert(0, 'ruta/a/fuzzython')   # la carpeta del repositorio"], cierre: 'Sin la primera línea, <code>compute()</code> falla con un <code>AttributeError</code>. Y <code>pip install</code> no sirve: deja fuera módulos necesarios.' },
    { tipo: 'codigo', etiqueta: 'Las palabras', texto: 'El sistema de la escena, en Python. Primero, las dos variables con sus palabras:', codigo: "from adjective import Adjective\nfrom fsets.polygon import Polygon\nfrom fsets.trapezoid import Trapezoid\nfrom variable import Variable\n\ncold   = Adjective('cold',   Polygon((0, 1), (15, 1), (20, 0)))\nnormal = Adjective('normal', Trapezoid((15, 0), (20, 1), (30, 1), (35, 0)))\nhot    = Adjective('hot',    Polygon((30, 0), (35, 1), (40, 1)))\ntemp   = Variable('temp', 'C', cold, normal, hot)\n\nshort = Adjective('short', Polygon((0, 1), (10, 1), (15, 0)))\nusual = Adjective('usual', Trapezoid((10, 0), (15, 1), (25, 1), (30, 0)))\nlarge = Adjective('large', Polygon((25, 0), (30, 1), (40, 1)))\nminutes = Variable('minutes', 'min', short, usual, large,\n                   defuzzification='COG', default=0)", salida: SALIDAS["from adjective import Adjective\nfrom fsets.polygon import Polygon\nfrom fsets.trapezoid import Trapezoid\nfrom variable import Variable\n\ncold   = Adjective('cold',   Polygon((0, 1), (15, 1), (20, 0)))\nnormal = Adjective('normal', Trapezoid((15, 0), (20, 1), (30, 1), (35, 0)))\nhot    = Adjective('hot',    Polygon((30, 0), (35, 1), (40, 1)))\ntemp   = Variable('temp', 'C', cold, normal, hot)\n\nshort = Adjective('short', Polygon((0, 1), (10, 1), (15, 0)))\nusual = Adjective('usual', Trapezoid((10, 0), (15, 1), (25, 1), (30, 0)))\nlarge = Adjective('large', Polygon((25, 0), (30, 1), (40, 1)))\nminutes = Variable('minutes', 'min', short, usual, large,\n                   defuzzification='COG', default=0)"] },
    { tipo: 'codigo', etiqueta: 'Las reglas', texto: 'Después, las reglas, y a calcular:', codigo: "from ruleblock import RuleBlock\nfrom systems.mamdani import MamdaniSystem\n\nblock = RuleBlock('b', operators=('MIN', 'MAX', 'ZADEH'),\n                  activation='MIN', accumulation='MAX')\nblock.add_rules(\n    'if temp is cold or temp is normal then minutes is short with 0.5',\n    'if temp is normal then minutes is usual',\n    'if temp is hot then minutes is large',\n    scope=locals())\n\nprint(MamdaniSystem('m', block).compute({'temp': 33}))", salida: SALIDAS["from ruleblock import RuleBlock\nfrom systems.mamdani import MamdaniSystem\n\nblock = RuleBlock('b', operators=('MIN', 'MAX', 'ZADEH'),\n                  activation='MIN', accumulation='MAX')\nblock.add_rules(\n    'if temp is cold or temp is normal then minutes is short with 0.5',\n    'if temp is normal then minutes is usual',\n    'if temp is hot then minutes is large',\n    scope=locals())\n\nprint(MamdaniSystem('m', block).compute({'temp': 33}))"], cierre: 'Cada línea es algo que ya sabes hacer. La salida es un diccionario: primero el bloque, y dentro, cada variable. La línea de arriba es el tiempo que tardó: sale siempre, y en adelante la omitimos.' },
    { tipo: 'ejemplo', texto: 'Lo que sale para algunas temperaturas, ejecutando fuzzython:', tabla: [['Grados', 'Frío', 'Normal', 'Caliente', 'Minutos'], ['5', '1', '0', '0', '6,89'], ['17,5', '0,5', '0,5', '0', '16,58'], ['25', '0', '1', '0', '16,09'], ['33', '0', '0,4', '0,6', '24,14'], ['39', '0', '0', '1', '33,67']], cierre: 'Entre 20 y 30 grados la respuesta no se mueve: lo vas a demostrar abajo.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\text{Adjective}`, dice: 'Una palabra y su conjunto: «caliente».' },
      { tex: R`\text{Variable}`, dice: 'Una magnitud y sus palabras: la temperatura.' },
      { tex: R`\text{RuleBlock}`, dice: 'Las reglas, y las [[normas T|norma T]] con que se calculan.' },
      { tex: R`\text{System}`, dice: 'Quien lo ejecuta todo: <code>MamdaniSystem</code>, <code>SugenoSystem</code> o <code>TsukamotoSystem</code>.' },
    ], todo: R`\text{compute} = \text{reset} \to \text{fuzzify} \to \text{inference} \to \text{defuzzify}`, lee: 'Ojo con el nombre: aquí <code>fuzzify</code> solo guarda el valor. Los grados se calculan al evaluar cada regla, dentro de <code>inference</code>.' },
    { tipo: 'formal', titulo: 'Qué calcula', tex: R`Con $t = 33$: $\ \mu_{\text{normal}} = \frac{35 - 33}{5} = 0{,}4$ y $\mu_{\text{hot}} = \frac{33 - 30}{5} = 0{,}6$. Las fuerzas son $0{,}4 \cdot 0{,}5$, $0{,}4$ y $0{,}6$. La salida es $\frac{\int x\, \mu(x)\, dx}{\int \mu(x)\, dx}$ sobre el máximo de los tres recortes: $\frac{391{,}13}{16{,}2} \approx 24{,}144$.`, lee: 'Un polígono se integra exacto, tramo a tramo. Se comprobó de dos formas: ejecutando fuzzython, y con un cálculo aparte que no lo usa.' },
    { tipo: 'demo', titulo: 'Por qué la curva se queda plana', plan: 'Si solo actúa una regla, con fuerza 1, el conjunto ya no depende de la entrada.', tex: R`Si, en un intervalo de temperaturas, las fuerzas no cambian, la salida es constante en ese intervalo.`, pasos: [
      { texto: R`La salida depende de $t$ solo a través de las fuerzas: el conjunto acumulado se construye con ellas y nada más.`, porque: 'Los conjuntos de salida están fijos.' },
      { texto: R`Entre $20$ y $30$ grados, $\mu_{\text{normal}} = 1$, $\mu_{\text{cold}} = 0$, y $\mu_{\text{hot}} = 0$.`, porque: 'Se lee de las curvas.' },
      { texto: R`Las fuerzas valen $0{,}5$, $1$ y $0$ en todo el intervalo, luego la salida no cambia: $16{,}086$ minutos.`, porque: 'Mismas fuerzas, mismo conjunto, mismo centro de gravedad. Un sistema difuso tiene mesetas donde sus reglas no cambian.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Si una librería vieja no arranca, lee el error', texto: 'Muchas veces basta una línea. Aquí, <code>time.clock</code> ya no existe, y su sustituto hace lo mismo. Pero compruébalo: con un ejemplo cuyo resultado conozcas.' }],
  retos: [
    { id: 'treinta-minutos', tipo: 'manipular', enunciado: R`Busca una temperatura que dé al menos $30$ minutos.`, precision: (e) => (mamdaniEjemplo(e.t) >= 30 ? 1 : 0), prueba: { t: 37 }, pendiente: (e) => `Ahora salen ${mamdaniEjemplo(e.t).toFixed(1).replace('.', ',')} minutos.`, pistas: ['Hace falta que solo actúe la regla de «caliente».'], explicacion: 'Por encima de 35 grados, la salida se queda en 33,67 minutos.' },
    { id: 'parche-elegir', tipo: 'elegir', enunciado: '¿Por qué <code>compute()</code> falla en un Python actual?', opciones: ['Porque le faltan reglas', 'Porque usa time.clock, retirado en Python 3.8', 'Porque Mamdani ya no existe', 'Porque hay que instalar scipy'], correcta: 1, explicacion: 'Lo usa solo para medir el tiempo. El cálculo está bien.' },
    { id: 'cuenta-333', tipo: 'calcular', enunciado: R`Con $t = 32$, ¿cuánto vale la fuerza de la regla «hot»? Es $\frac{t - 30}{5}$.`, respuesta: 0.4, tol: 0.001, pistas: [R`$\frac{2}{5}$.`], explicacion: R`$0{,}4$.` },
    { id: 'demuestra-orden', tipo: 'demostrar', enunciado: 'Demuestra que, si la regla de «hot» se dispara con fuerza 1 y las demás con 0, la salida es el centro de gravedad de <code>large</code>.', pistas: ['Recortar a 1 no cambia nada.'], solucion: [{ texto: R`Con fuerza 1, $\min(1, \mu_{\text{large}}(x)) = \mu_{\text{large}}(x)$. Las demás reglas no aportan conjunto.`, porque: 'El recorte a 1 es la identidad, y una fuerza 0 no crea ningún conjunto.' }, { texto: R`Luego lo acumulado es $\mu_{\text{large}}$, y la salida es su centro de gravedad.`, porque: 'Con eso sale $33{,}67$, el valor de la meseta alta.' }] },
  ],
  referencias: ['C. E. Rodríguez Pérez, Y. Almeida Cruz, N. López Gil, <em>fuzzython</em>, github.com/yudivian/fuzzython (2013).', 'E. H. Mamdani, S. Assilian, <em>Int. J. Man-Machine Studies</em> 7 (1975).'],
};
