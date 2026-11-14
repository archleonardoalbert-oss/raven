import { AZUL, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { gaussiana, poligono, sFuncion } from '../../nucleo/fuzzython.js';
import { curva, marco, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { coma } from './comun.js';

import { SALIDAS } from './salidas.js';

const R = String.raw;
const D = [0, 10];
const FORMAS = [
  { n: 'Polygon', c: 'Polygon((0, 0), (2, 1), (5, 0.4), (10, 1))', f: poligono([[0, 0], [2, 1], [5, 0.4], [10, 1]]).val, a: 'Puntos unidos por rectas. Es la más fiable: integra exacto.' },
  { n: 'Trapezoid', c: 'Trapezoid((1, 0), (3, 1), (7, 1), (9, 0))', f: poligono([[1, 0], [3, 1], [7, 1], [9, 0]]).val, a: 'Su COG directo falla si la meseta es plana: conviértela a Polygon.' },
  { n: 'Triangular', c: 'Triangular((1, 0), (5, 1), (9, 0))', f: poligono([[1, 0], [5, 1], [9, 0]]).val, a: 'Sin el tercer punto, sale simétrico.' },
  { n: 'Gaussian', c: 'Gaussian(5, 1.5)', f: gaussiana(5, 1.5), a: 'Su intervalo cubre solo una desviación a cada lado: al recortarla, se integra solo ahí.' },
  { n: 'Gamma', c: 'Gamma(3, 0.4, Interval(0, 10))', f: (x) => (x <= 3 ? 0 : 1 - Math.exp(-0.4 * (x - 3) ** 2)), a: 'Su comentario dice que es una V. El código la hace de un solo lado.' },
  { n: 'Singleton', c: 'Singleton(5, 0.8)', f: (x) => (Math.abs(x - 5) < 0.03 ? 0.8 : 0), a: 'Solo vale en un punto. Es lo que usa COGS.' },
  { n: 'SFunction', c: 'SFunction((1, 0), 5, (9, 1))', f: sFuncion(1, 5, 9), a: 'Si b no está en el centro, la curva da un salto. No la recortes: sale mal.' },
  { n: 'ZFunction', c: 'ZFunction((1, 0), 5, (9, 1))', f: (x) => 1 - sFuncion(1, 5, 9)(x), a: 'Para que baje hay que pasarle (a, 0) y (c, 1), al revés de lo que dice su comentario.' },
  { n: 'PiFunction', c: 'PiFunction(5, 4)', f: null, a: 'Rota: lanza TypeError al evaluarla. Usa un Polygon con esa forma.' },
  { n: 'Polynomial', c: 'Polynomial(-0.04, 0.4, 0, interval=Interval(0, 10))', f: (x) => -0.04 * x * x + 0.4 * x, a: 'De mayor a menor grado. Hay que darle un Interval: con una tupla falla.' },
];
const idx = (e) => Math.round(e.forma);
export default {
  id: '14-3-formas',
  titulo: 'Las diez formas',
  puente: 'Ya tienes las piezas. ¿Cómo se combinan? Con las mismas normas de la región 3, y con un detalle que los polígonos hacen especialmente bien.',
  pregunta: 'En la región 2 viste las formas típicas de pertenencia. fuzzython trae diez ya hechas. Pero no todas funcionan igual de bien, y una ni siquiera funciona. ¿Cuáles usar, y de cuáles huir?',
  escena: {
    id: 'formas', formato: 'plano', W: 1100, H: 520,
    ejes: { x: D, y: [0, 1.05], caja: { x: 70, y: 110, w: 950, h: 340 } },
    entradas: [{ id: 'forma', tipo: 'deslizador', etiqueta: 'la forma', min: 0, max: 9, paso: 1, valor: 0 }],
    pasos: [
      { dur: 2600, texto: '<code>Polygon</code>: los puntos que quieras, unidos por rectas. Con esta se puede dibujar casi todo, y es la que mejor calcula.' },
      { dur: 3000, texto: 'Las formas suaves: la <code>Gaussian</code>, una campana. Como en la región 2, su ancho es su parámetro.' },
      { dur: 3000, texto: 'La <code>ZFunction</code>: cuidado. Para que baje de 1 a 0, hay que darle los puntos justo al revés de lo que dice su comentario. Por eso hay que probar siempre.' },
      { dur: 2800, texto: 'Y <code>PiFunction</code> <b style="color:#f05a5a;font-weight:400">está rota</b>: se crea sin problema, y falla al usarla. Recorre las diez con el deslizador y lee el aviso de cada una.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(paso), 0, 0.4), i = paso === 0 ? 0 : paso === 1 ? 3 : paso === 2 ? 7 : paso === 3 && q(3) < 0.75 ? 8 : idx(e), F = FORMAS[i];
      const N = [marco({ x: D, y: [0, 1.05] }, { alfa: 1, ticks: { x: [0, 5, 10], y: [0, 1] } }), rotulo([0, 1.05], R`\text{${F.c.replace(/_/g, '\\_')}}`, { clave: 'c', ancla: 'l', dy: -56, tam: 25, color: F.f ? ORO : ROJO }), rotulo([0, 1.05], R`\text{${F.a}}`, { clave: 'a', ancla: 'l', dy: -22, tam: 18, color: GRIS2 })];
      if (F.f) N.push(curva((x) => [x, F.f(x)], D, { n: 500, color: i === 5 ? ORO : AZUL, ancho: 3, brillo: true, alfa: al, tol: 1 })); else N.push(rotulo([5, 0.5], R`\text{TypeError: 'int' object is not subscriptable}`, { clave: 'e', tam: 26, color: ROJO }));
      return N;
    },
  },
  manipulacion: '<ul><li>Recorre las diez, y lee debajo del nombre lo que hay que saber de cada una.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Todas las formas son <code>FuzzySet</code>, con su propia función. Pero las que heredan de <code>Polygon</code> saben hacer las cuentas de forma exacta, y las demás aproximan con 100 muestras. La regla práctica es sencilla: <b>si dudas, usa Polygon</b>. Puedes muestrear cualquier otra con <code>Polygon.create_from(f, a, b, 100)</code>.' },
    { tipo: 'ejemplo', texto: 'Lo que comprobamos ejecutando cada una:', tabla: [['Forma', '¿Se puede usar?', 'Lo que falla'], ['Polygon', 'Sí, casi siempre', 'Un borde vertical divide por cero'], ['Trapezoid', 'Sí, como antecedente', 'COG, COA, CM y MM, si la meseta es plana'], ['Gaussian', 'Con cuidado', 'Dos separadas rompen COG'], ['SFunction, ZFunction', 'Solo en antecedentes', 'Recortarlas da una forma falsa'], ['PiFunction', 'No', 'Falla al evaluarla']], cierre: 'En la parada «Fragmentos del disco» están todos los fallos, con su arreglo.' },
    { tipo: 'codigo', etiqueta: 'Lo que hace la Z', codigo: "from fsets.zfunction import ZFunction\nz = ZFunction((0, 0), 5, (10, 1))\nprint(z(8))\nprint(z.membership(8))", salida: SALIDAS["from fsets.zfunction import ZFunction\nz = ZFunction((0, 0), 5, (10, 1))\nprint(z(8))\nprint(z.membership(8))"], cierre: 'Dos respuestas distintas para el mismo punto: <code>membership</code> se quedó con la función de su clase madre. Las entradas difusas lo usan: te lo encontrarás.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`e^{-\frac{(x - c)^2}{2 w^2}}`, dice: '<code>Gaussian(c, w)</code>: el mismo que en la región 2.' },
      { tex: R`1 - e^{-k (x - v)^2}`, dice: '<code>Gamma(v, k, intervalo)</code>: vale 0 hasta $v$, y luego sube.' },
      { tex: R`2 \left(\frac{x - a}{c - a}\right)^2`, dice: 'La primera mitad de <code>SFunction</code>.' },
    ], todo: R`\mu(x) = y_1 + \frac{(x - x_1)(y_2 - y_1)}{x_2 - x_1}`, lee: 'Así calcula un <code>Polygon</code> entre dos puntos. Y fuera de sus puntos, sigue constante: no vale 0.' },
    { tipo: 'formal', titulo: 'Fuera de sus puntos', tex: R`Para un polígono con puntos $(x_1, y_1), \dots, (x_n, y_n)$: $\mu(x) = y_1$ si $x \le x_1$, $\mu(x) = y_n$ si $x \ge x_n$. Por eso $\text{Polygon}((0, 1), (10, 0{,}5))(-5) = 1$.`, lee: 'Esto permite escribir «hombros»: basta con no poner el punto de bajada. Pero sorprende: un polígono sin ceros en los extremos no desaparece.' },
    { tipo: 'demo', titulo: 'La S no da un salto si b está en el centro', plan: 'Se igualan las dos ramas en $b$.', tex: R`Las ramas $2 n^2$ y $1 - 2 (n - 1)^2$, con $n = \frac{x - a}{c - a}$, coinciden en $n = \frac{1}{2}$.`, pasos: [
      { texto: R`Con $n = \frac{1}{2}$: $2 \cdot \frac{1}{4} = \frac{1}{2}$.`, porque: 'Primera rama.' },
      { texto: R`Y $1 - 2 \cdot \frac{1}{4} = \frac{1}{2}$.`, porque: 'Segunda rama. Coinciden, luego no hay salto.' },
      { texto: R`En cualquier otro $n$ son distintas: $2 n^2 + 2 (n - 1)^2 - 1 = (2n - 1)^2$, que solo se anula en $n = \frac{1}{2}$.`, porque: 'Por eso, si $b$ no es el centro, la curva salta.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Sin documentación, prueba cada pieza', texto: 'Evalúa cada función en tres o cuatro puntos cuyo resultado conozcas. Es la forma más rápida de descubrir lo que un comentario no dice, o dice mal.' }],
  retos: [
    { id: 'forma-z', tipo: 'manipular', enunciado: 'Busca la forma que baja de 1 a 0.', precision: (e) => (idx(e) === 7 ? 1 : 0), prueba: { forma: 7 }, pendiente: (e) => `Ahora ves ${FORMAS[idx(e)].n}.`, pistas: ['Es la imagen en el espejo de la S.'], explicacion: 'Es <code>ZFunction</code>, con sus parámetros al revés de lo que dice su comentario.' },
    { id: 'gauss-calc', tipo: 'calcular', enunciado: R`¿Cuánto vale \texttt{Gaussian(0, 1)} en $x = 1$? Redondea a 3 decimales.`.replace('\\texttt{Gaussian(0, 1)}', '<code>Gaussian(0, 1)</code>'), respuesta: Math.exp(-0.5), tol: 0.001, pistas: [R`$e^{-\frac{1}{2}}$.`], explicacion: R`$0{,}607$.` },
    { id: 'forma-elegir', tipo: 'elegir', enunciado: 'Necesitas una salida de Mamdani con forma de campana. ¿Qué es lo más seguro?', opciones: ['PiFunction', 'Gaussian tal cual', 'Polygon.create_from(campana, a, b, 100)', 'SFunction'], correcta: 2, explicacion: 'Un polígono recorta bien, y no tiene problemas con los intervalos.' },
    { id: 'demuestra-tri', tipo: 'demostrar', enunciado: R`Demuestra que un triángulo $(a, 0), (b, 1), (c, 0)$ tiene área $\frac{c - a}{2}$.`, pistas: ['Base por altura entre dos.'], solucion: [{ texto: R`La base mide $c - a$, y la altura, 1.`, porque: 'El vértice está en $y = 1$, y los otros dos, en $y = 0$.' }, { texto: R`Área $= \frac{(c - a) \cdot 1}{2}$.`, porque: 'Coincide con lo que da <code>area()</code>: un polígono integra exacto.' }] },
  ],
  referencias: ['<em>fuzzython</em>: carpeta fsets/.', 'Documentación interna: fuentes/referencias/fuzzython/doc.md.'],
};
