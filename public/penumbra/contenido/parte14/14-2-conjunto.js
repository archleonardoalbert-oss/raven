import { AZUL, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { areaDiscreta } from '../../nucleo/fuzzython.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { barra, tramo } from '../parte9/comun.js';
import { coma } from './comun.js';

import { SALIDAS } from './salidas.js';

const R = String.raw;
const U = [0, 1.2], f = () => 1, g = (x) => x;
export default {
  id: '14-2-conjunto',
  titulo: 'FuzzySet e Interval',
  puente: 'Una función y un intervalo, y ya hay conjunto. Pero escribir la función cada vez es pesado: por eso fuzzython trae sus diez formas.',
  pregunta: 'En la región 1 un conjunto difuso era una función que da un grado. En fuzzython también, con un añadido que parece un detalle: un intervalo. ¿Para qué? Y ojo: de ese detalle sale uno de sus errores más curiosos.',
  escena: {
    id: 'conjunto', formato: 'plano', W: 1100, H: 540,
    ejes: { x: U, y: [0, 1.15], caja: { x: 80, y: 60, w: 620, h: 400 } },
    entradas: [{ id: 'res', tipo: 'deslizador', etiqueta: 'resolución: cuántos tramos pedimos', min: 3, max: 40, paso: 1, valor: 20 }],
    pasos: [
      { dur: 2800, texto: 'Un conjunto sencillo: vale 1 en todo el intervalo de 0 a 1. Su área es exactamente <b>1</b>. La línea discontinua marca el final del intervalo.' },
      { dur: 3000, texto: 'fuzzython integra con trapecios: avanza un paso cada vez, sumando <code>a += step</code>, hasta que deja de cumplirse <code>a &lt; b</code>.' },
      { dur: 3200, texto: 'Pero los ordenadores no suman décimas con exactitud. A veces, tras el último paso, <code>a</code> se queda un pelo por debajo de <code>b</code>, y <b style="color:#f05a5a;font-weight:400">se cuela un tramo de más</b>, fuera del intervalo.' },
      { dur: 2800, texto: 'Mueve la resolución. Con unas da 1 exacto. Con otras, se pasa mucho. Con los 100 tramos de serie, el error es despreciable. Por eso casi nadie lo nota.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, res = paso <= 1 ? 10 : paso === 2 ? 7 : Math.round(e.res), { area, tramos } = areaDiscreta(f, 0, 1, res), h = 1 / res;
      const N = [marco({ x: U, y: [0, 1.15] }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] } }), ...tramo([1, 0], [1, 1.15], { color: GRIS2, ancho: 1.2, alfa: al, discontinua: true }), curva((x) => [x, 1], [0, 1], { n: 2, color: AZUL, ancho: 2.8, alfa: al })];
      if (g1 > 0) for (let i = 0; i < tramos; i++) { const fuera = i >= res; N.push(barra(i * h, (i + 1) * h - h * 0.05, 1, { color: fuera ? ROJO : ORO, alfa: (fuera ? 0.85 * Math.max(g2, 0) : 0.4) * g1 })); }
      N.push(rotulo([1.2, 1.15], R`\text{${tramos} tramos, área} = ${coma(area, 4)}`, { clave: 'a', ancla: 'r', dy: -14, tam: 21, color: Math.abs(area - 1) > 0.001 ? ROJO : ORO, alfa: g1 }));
      const G = [marco({ x: [3, 40], y: [0.95, 1.2] }, { alfa: g2, ticks: { x: [3, 40], y: [1, 1.2] }, etiquetas: { x: R`\text{tramos}` } })];
      if (g2 > 0) for (let r = 3; r <= 40; r++) { const a = areaDiscreta(f, 0, 1, r).area; G.push(punto([r, Math.min(1.2, a)], { color: a > 1.001 ? ROJO : ORO, radio: 3.4, alfa: g2, halo: 0 })); }
      return { principal: N, paneles: [{ ejes: { x: [3, 40], y: [0.95, 1.2], caja: { x: 790, y: 120, w: 260, h: 280 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Mueve la resolución y mira los tramos rojos.</li><li>En la gráfica pequeña, cada punto es una resolución: los rojos son los que se pasan.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Para fuzzython un conjunto son dos cosas: una función y un <b>intervalo</b>, que dice dónde mirar. Para saber un grado basta la función. Pero para integrar o para buscar el máximo hay que recorrer algo, y una función no dice dónde empieza ni dónde acaba. Eso es lo que da el intervalo.' },
    { tipo: 'codigo', etiqueta: 'Crear un conjunto', texto: 'Cualquier función de un número sirve:', codigo: "from fsets.fuzzy_set import FuzzySet\nfrom interval import Interval\n\nalto = FuzzySet(lambda x: min(1, max(0, (x - 160) / 20)), Interval(150, 190))\nprint(alto(170))\nprint(alto.area())\n\nprint(Interval(0, 1).union(Interval(2, 3)))\nprint(Interval(0, 1).intersect(Interval(0.5, 3)))", salida: SALIDAS["from fsets.fuzzy_set import FuzzySet\nfrom interval import Interval\n\nalto = FuzzySet(lambda x: min(1, max(0, (x - 160) / 20)), Interval(150, 190))\nprint(alto(170))\nprint(alto.area())\n\nprint(Interval(0, 1).union(Interval(2, 3)))\nprint(Interval(0, 1).intersect(Interval(0.5, 3)))"], cierre: 'La unión de dos intervalos separados da un <code>Compound</code>. Recuérdalo: da problemas más adelante.' },
    { tipo: 'ejemplo', texto: 'El área de la función 1 en $[0, 1]$, que debería ser 1, ejecutando fuzzython:', tabla: [['Tramos pedidos', 'Tramos dados', 'Área'], ['3', '3', '1'], ['7', '8', '1,1429'], ['10', '11', '1,1'], ['100', '100', '1,0000000000000007']], cierre: 'Con 100 pasan los 100 que tocan: el error es solo el redondeo de la suma.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\text{Interval}(a, b)`, dice: 'El intervalo. Tiene <code>size</code>, <code>empty()</code>, <code>union</code>, <code>intersect</code>.' },
      { tex: R`\text{resolution}`, dice: 'Cuántos tramos se usan al integrar. De serie, 100.' },
      { tex: R`h = \frac{b - a}{n}`, dice: 'El paso. Es lo que se suma una y otra vez.' },
    ], todo: R`\int_a^b f(x)\, dx \approx \sum_{i} \frac{f(x_i) + f(x_{i + 1})}{2}\, h`, lee: '«El área se aproxima con trapecios». Es lo que hace <code>area()</code>; los polígonos, en cambio, integran exacto.' },
    { tipo: 'formal', titulo: 'El tramo de más', tex: R`El bucle es: mientras $x < b$, hacer $x \leftarrow x + h$. En aritmética exacta da $n$ pasos. Con coma flotante, $x_n$ puede quedar por debajo de $b$, y se da el paso $n + 1$, con un error de hasta $\frac{b - a}{n}$ por la altura de la función.`, lee: 'Probado ejecutando fuzzython: el área de 1 en $[0, 1]$ da $1{,}1429$ con $n = 7$ y $1{,}1$ con $n = 10$. Con $n = 100$, el error está en el decimal 15, y por eso pasa inadvertido.' },
    { tipo: 'demo', titulo: 'Cuánto error puede meter', plan: 'Se acota lo que aporta el tramo de más.', tex: R`Si $0 \le f \le 1$, el tramo de más añade como mucho $h = \frac{b - a}{n}$.`, pasos: [
      { texto: R`Un trapecio aporta $\frac{f(x_i) + f(x_{i + 1})}{2}\, h$.`, porque: 'Es su área.' },
      { texto: R`Con $f \le 1$, el paréntesis partido por dos no pasa de 1.`, porque: 'La media de dos números que no pasan de 1 tampoco pasa de 1.' },
      { texto: R`Luego el tramo extra añade a lo sumo $h$. Con $n = 100$ y $b - a = 1$ podría llegar a $0{,}01$, si se da.`, porque: 'Por eso, cuando necesites exactitud, usa polígonos.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Nunca avances un bucle sumando decimales', texto: 'Calcula cada punto como $a + i\\,h$, y recorre $i$ con un entero. Así no se acumula el error de redondeo, y siempre das los pasos que querías.' }],
  retos: [
    { id: 'area-mala', tipo: 'manipular', enunciado: R`Busca una resolución en la que el área se pase de $1{,}05$.`, precision: (e) => (areaDiscreta(f, 0, 1, Math.round(e.res)).area > 1.05 ? 1 : 0), prueba: { res: 7 }, pendiente: (e) => `Con ${Math.round(e.res)} tramos, el área es ${areaDiscreta(f, 0, 1, Math.round(e.res)).area.toFixed(3).replace('.', ',')}.`, pistas: ['Mira los puntos rojos de la gráfica pequeña.'], explicacion: 'Y fuzzython no avisa de nada: el error está dentro del bucle.' },
    { id: 'res-calc', tipo: 'calcular', enunciado: R`En un conjunto que vale 1 en $[0, 1]$, con $n = 10$ y un tramo de más, ¿cuál es el área?`, respuesta: 1.1, tol: 0.001, pistas: [R`Once trapecios de $0{,}1$.`], explicacion: R`$11 \cdot 0{,}1 = 1{,}1$.` },
    { id: 'interval-elegir', tipo: 'elegir', enunciado: '¿Para qué necesita un conjunto de fuzzython un intervalo?', opciones: ['Para calcular un grado', 'Para saber dónde integrar y buscar el máximo', 'Para guardar las normas', 'Para nada: es opcional'], correcta: 1, explicacion: 'Una función no dice dónde empieza ni dónde acaba.' },
    { id: 'demuestra-area', tipo: 'demostrar', enunciado: R`Demuestra que la regla del trapecio es exacta en una función lineal: $\int_a^c f = \frac{f(a) + f(c)}{2}(c - a)$.`, pistas: ['Escribe $f(x) = m x + n$.'], solucion: [{ texto: R`$\int_a^c (m x + n)\, dx = m \frac{c^2 - a^2}{2} + n (c - a) = (c - a)\left(m \frac{a + c}{2} + n\right)$.`, porque: 'Se integra y se saca factor común.' }, { texto: R`Y $\frac{f(a) + f(c)}{2} = m \frac{a + c}{2} + n$.`, porque: 'Por eso los polígonos no pierden nada: son lineales a tramos.' }] },
  ],
  referencias: ['<em>fuzzython</em>: fsets/fuzzy_set.py e interval.py.', 'D. Goldberg, «What Every Computer Scientist Should Know About Floating-Point Arithmetic», <em>ACM Computing Surveys</em> 23 (1991).'],
};
