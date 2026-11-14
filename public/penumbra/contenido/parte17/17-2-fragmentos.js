import { GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { codigo } from '../parte14/comun.js';

const R = String.raw;
// id, severidad (2 alta, 1 media, 0 baja), qué pasa, cómo evitarlo. Sale de la documentación interna, sección 11.
const F = [
  [1, 2, 'time.clock no existe desde Python 3.8: compute falla', 'time.clock = time.perf_counter'], [2, 2, 'Trapezoid plano: COG, COA, CM y MM fallan', 'Usa Polygon'], [3, 2, 'PiFunction no se puede evaluar', 'Muestréala en un Polygon'], [4, 2, 'membership mal enlazado en Z, Singleton y Pi', 'Evítalas con entradas difusas'],
  [5, 2, 'Recortar S o Z da una forma falsa, sin avisar', 'No las uses en la salida'], [6, 2, 'Cualquier error de desdifusión se vuelve default', 'Usa default = nan, y lee lo impreso'], [7, 1, 'Dentro de una palabra, siempre gana el máximo', 'Conócelo: BSUM no suma ahí'], [8, 2, 'eval ve solo su antecedente, y ejecuta cualquier código', 'No cargues reglas ajenas'],
  [9, 1, 'Busca is como texto: dist se toma por Mamdani', 'Evita nombres con is'], [10, 1, 'El complemento de una Gaussian falla al evaluarlo', 'Pasa por Polygon.create_from'], [11, 1, 'Polygon.complement ignora su argumento', 'Calcula aparte el complemento'], [12, 1, 'Una errata en una norma no da error', 'Comprueba get_norm'],
  [13, 0, 'Errata: input_adj falla con árboles', 'No lo uses con árboles'], [14, 1, 'Polynomial falla con tupla, y al imprimirlo', 'Dale un Interval'], [15, 0, 'Interval.middle da medio ancho', 'Calcula el punto medio'], [16, 0, 'Interval compara mal con tuplas', 'Compara con otro Interval'],
  [17, 2, 'Dos gaussianas separadas rompen COG', 'Pasa a Polygon'], [18, 1, 'Unir polígonos separados inventa área', 'Baja sus bordes a 0'], [19, 1, 'a más step acumula error: un tramo de más', 'Usa Polygon'], [20, 1, 'Polygon.MM promedia vértices', 'Usa CM en mesetas'],
  [21, 1, 'Un borde vertical divide por cero', 'Prolonga con Polygon'], [22, 1, 'Tsukamoto no monótono da 0 o algo arbitrario', 'Comprueba la monotonía'], [23, 1, 'FCL: errata en MAMDAMI, RANGE se descarta', 'Prueba con ejemplos'], [24, 0, 'Comentarios ASCII: aviso en Python 3.14', 'Ignóralo, de momento'],
];
const SEV = [GRIS2, ORO, ROJO], NOM = ['baja', 'media', 'alta'], pos = (i) => { const r = 62 + 28 * ((i * 7) % 3) / 2 + 6 * (i % 2), th = (i / 24) * 2 * Math.PI + 0.2; return [r * Math.cos(th), r * Math.sin(th)]; };
export default {
  id: '17-2-fragmentos',
  titulo: 'Fragmentos del disco',
  puente: 'Has llegado al final de fuzzython. Lo que hay más allá ya no es esta librería: es de dónde pueden venir los grados. Y hay una forma de sacarlos de un texto.',
  pregunta: 'Mientras preparábamos este curso ejecutamos fuzzython pieza a pieza, y encontramos 24 fallos. Son los fragmentos rotos de este disco. Nadie va a cruzar con ellos a ciegas: cada uno tiene su arreglo. ¿Sabrías cuáles te pueden dar un resultado falso sin avisar?',
  escena: {
    id: 'fragmentos', formato: 'plano', W: 1100, H: 520,
    ejes: { x: [-100, 100], y: [-100, 100], caja: { x: 40, y: 20, w: 470, h: 470 } },
    entradas: [{ id: 'f', tipo: 'deslizador', etiqueta: 'el fragmento', min: 1, max: 24, paso: 1, valor: 1 }],
    pasos: [
      { dur: 2600, texto: 'Los 24 fallos, alrededor del horizonte. En <b style="color:#f05a5a;font-weight:400">rojo</b>, los que impiden o falsean un cálculo normal.' },
      { dur: 3000, texto: 'Mueve el deslizador para recorrerlos. Cada uno te dice qué pasa y cómo evitarlo. La mayoría se resuelven igual: <b style="color:#f4d345;font-weight:400">usa Polygon</b>.' },
      { dur: 2800, texto: 'Los peores no son los que dan error. Son los que dan un número falso: mira F5, F6 y F22.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, sel = paso >= 1 ? Math.round(e.f) : 0, N = [punto([0, 0], { color: [0, 0, 0], radio: 54, alfa: al, halo: 0 }), rotulo([0, 0], R`\text{${F.filter((x) => x[1] === 2).length} altos}`, { clave: 'c', tam: 20, color: ROJO, alfa: al })];
      F.forEach(([id, s], i) => { const on = id === sel; N.push(punto(pos(i), { color: SEV[s], radio: on ? 11 : 6, alfa: al * (on ? 1 : 0.8), halo: on ? 1 : 0 })); if (on) N.push(rotulo(pos(i), R`\text{F${id}}`, { clave: 'fi', dy: -22, tam: 20, color: SEV[s], alfa: g1 })); });
      const X = F[Math.max(0, sel - 1)], P = [rotulo([0, 90], R`\text{F${X[0]}: gravedad ${NOM[X[1]]}}`, { clave: 't', ancla: 'l', tam: 26, color: SEV[X[1]], alfa: g1 }), rotulo([0, 60], R`\text{${X[2].replace(/_/g, '\\_')}}`, { clave: 'q', ancla: 'l', tam: 19, color: [235, 228, 212], alfa: g1 }), rotulo([0, 34], R`\text{Arreglo: ${X[3].replace(/_/g, '\\_')}}`, { clave: 'a', ancla: 'l', tam: 19, color: ORO, alfa: g1 })];
      return { principal: N, paneles: [{ ejes: { x: [0, 100], y: [0, 100], caja: { x: 530, y: 120, w: 540, h: 270 } }, prims: P }] };
    },
  },
  manipulacion: '<ul><li>Recórrelos todos, con calma. Son 24.</li><li>Cuenta cuántos se arreglan usando <code>Polygon</code>.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un error que detiene el programa te hace perder un minuto. Uno que devuelve un número creíble te hace perder la confianza en todo lo demás. Por eso esta parada los ordena por lo que hacen, no por dónde están. Casi todos caben en tres recetas.' },
    codigo('Un comprobador', 'Antes de confiar en una instalación, compruébala con casos de resultado conocido. Este se puede copiar tal cual:', "t = Polygon((0, 0), (5, 1), (10, 0))\ncaso('centro del triángulo, 5:', lambda: round(t.COG(), 6))\ncaso('área del triángulo, 5:', lambda: t.area())\ncaso('PiFunction:', lambda: PiFunction(5, 4)(5))\nz = ZFunction((0, 0), 5, (10, 1))\ncaso('Z y membership iguales:', lambda: math.isclose(z(8), z.membership(8)))", 'Cuando alguien arregle la librería, estas líneas lo notarán: dejarán de fallar.', { prefacio: "import math\nfrom fsets.polygon import Polygon\nfrom fsets.pifunction import PiFunction\nfrom fsets.zfunction import ZFunction\n\ndef caso(nombre, f):\n    try:\n        print(nombre, f())\n    except Exception as e:\n        print(nombre, 'FALLA:', type(e).__name__)", prefacioTitulo: 'La función caso' }),
    { tipo: 'ejemplo', texto: 'Las tres recetas, y lo que evitan:', tabla: [['Receta', 'Evita'], ['Usa <code>Polygon</code> para todo', 'F2, F3, F5, F17, F19'], ['<code>default=float(\'nan\')</code> en cada salida', 'F6, F12'], ['Reglas en minúsculas, sin nombres con «is», y solo tuyas', 'F8, F9']], cierre: 'Con solo eso, te libras de casi todos los altos.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\text{alta}`, dice: 'Impide o falsea un cálculo normal.' },
      { tex: R`\text{media}`, dice: 'Afecta a una función concreta.' },
      { tex: R`\text{baja}`, dice: 'Una rareza.' },
    ], todo: R`\text{nan} \ne \text{nan}`, lee: '«NaN no es igual a nada, ni a sí mismo». Por eso, un NaN no se confunde con ningún resultado: se comprueba con <code>math.isnan</code>.' },
    { tipo: 'formal', titulo: 'Qué se comprobó', tex: R`Casi todos se reprodujeron ejecutando la librería con Python 3.14. F23, y la parte de F12 sobre <code>AND</code>, se han leído en el código sin ejecutarlos: leer FCL exige ANTLR 3.5 con un parche a mano. F24 es un aviso de Python, y F6 se confirma por sus efectos.`, lee: 'Los ejemplos de código de este recorrido sí están ejecutados, y lo que ves como salida se generó con el fuzzython real. Los que no se ejecutaron lo dicen.' },
    { tipo: 'demo', titulo: 'Por qué nan delata los errores', plan: 'Toda cuenta con NaN sigue siendo NaN.', tex: R`Si una salida vale NaN, cualquier cálculo que la use también lo valdrá, y el fallo no puede pasar por un resultado normal.`, pasos: [
      { texto: R`$\text{nan} + x = \text{nan}$ y $\text{nan} \cdot x = \text{nan}$, para todo número $x$.`, porque: 'Lo fija el estándar IEEE 754.' },
      { texto: R`Con <code>default=0</code>, un error da 0, que puede ser una respuesta correcta.`, porque: 'Y una media con ese 0 da un número creíble.' },
      { texto: R`Con NaN, la media entera sale NaN.`, porque: 'El error se propaga y se ve. Es lo que quieres mientras desarrollas.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Convierte cada fallo en una prueba', texto: 'Cada vez que encuentres un error en una librería, escribe la línea que lo detecta. Tendrás un comprobador que te avisa, y también de cuándo lo arreglan.' }],
  retos: [
    { id: 'frag-22', tipo: 'manipular', enunciado: 'Busca el fragmento que devuelve 0 con una curva no monótona.', precision: (e) => (Math.round(e.f) === 22 ? 1 : 0), prueba: { f: 22 }, pendiente: (e) => `Estás en F${Math.round(e.f)}.`, pistas: ['Está en Tsukamoto.'], explicacion: 'Es F22. Lo viste con el triángulo.' },
    { id: 'altos-calc', tipo: 'calcular', enunciado: '¿Cuántos de los 24 fallos tienen gravedad alta? Es el número que aparece en el centro de la escena.', respuesta: 8, tol: 0.001, pistas: ['Míralo en el centro del horizonte.'], explicacion: 'Son ocho: F1, F2, F3, F4, F5, F6, F8 y F17. F4 y F17 solo lo son en ciertos usos.' },
    { id: 'frag-elegir', tipo: 'elegir', enunciado: '¿Qué es peor en un sistema real?', opciones: ['Un error que detiene el programa', 'Un número falso sin aviso', 'Un aviso de Python', 'Una errata en un comentario'], correcta: 1, explicacion: 'El primero se ve; el segundo llega hasta la decisión.' },
    { id: 'demuestra-nan', tipo: 'demostrar', enunciado: 'Demuestra que comprobar <code>x == float(\'nan\')</code> no sirve para detectar NaN.', pistas: ['¿Qué devuelve comparar NaN con cualquier cosa?'], solucion: [{ texto: 'Según IEEE 754, cualquier comparación de igualdad con NaN da falso, incluso consigo mismo.', porque: 'Es la definición.' }, { texto: 'Luego <code>x == float(\'nan\')</code> es falso siempre, sea cual sea <code>x</code>.', porque: 'Por eso hay que usar <code>math.isnan(x)</code>.' }] },
  ],
  referencias: ['Documentación interna: fuentes/referencias/fuzzython/doc.md, sección 11.', 'IEEE 754-2019, <em>Standard for Floating-Point Arithmetic</em>.'],
};
