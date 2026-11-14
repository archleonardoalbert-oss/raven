import { AZUL, BLANCO, ORO, ROSA } from '../../motor/colores.js';
import { GENERADORES, sumaCon } from '../../nucleo/operadores.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const G = [GENERADORES.producto, GENERADORES.lukasiewicz], NOM = ['producto', 'Łukasiewicz'];
const YMAX = 2.6;

export default {
  id: '3-7-generadores',
  titulo: 'Fabricar un «y» con una sola curva',
  puente: 'Una curva da un «y». Si esa curva depende de un botón, obtienes toda una familia de «y» que puedes ajustar. Eso es lo que se usa en la práctica.',
  pregunta: 'Multiplicar es más difícil que sumar. Con los logaritmos, una multiplicación se convierte en una suma. ¿Y si cualquier «y» se pudiera convertir en una suma?',
  escena: {
    id: 'generadores', formato: 'plano', W: 1100, H: 600,
    ejes: { x: [0, 1], y: [0, YMAX], caja: { x: 170, y: 40, w: 720, h: 480 } },
    entradas: [
      { id: 'g', tipo: 'deslizador', etiqueta: 'curva (0 producto, 1 Łukasiewicz)', min: 0, max: 1, paso: 1, valor: 0 },
      { id: 'a', tipo: 'arrastre', eje: 'x', valor: [0.6, 0], region: { x: [0.12, 1], y: [0, 1] } },
      { id: 'b', tipo: 'arrastre', eje: 'x', valor: [0.8, 0], region: { x: [0.12, 1], y: [0, 1] } },
    ],
    pasos: [
      { dur: 2200, texto: 'Esta curva, $f$, se llama <em>generador</em>. Cambia un grado por una <b>distancia</b>. El grado 1 está a distancia 0. Cuanto menor es el grado, más lejos está.' },
      { dur: 2400, texto: 'Toma dos grados, <b style="color:#58c4dd;font-weight:400">a</b> y <b style="color:#fc6282;font-weight:400">b</b>. Sube cada uno a la curva, y lleva su altura al eje: son dos distancias.' },
      { dur: 2400, texto: 'Ahora, lo más simple del mundo: <b>apila</b> una distancia sobre la otra. Es una suma.' },
      { dur: 2600, texto: 'Vuelve: desde esa altura, cruza a la curva y baja. El grado al que llegas es <b style="color:#f4d345;font-weight:400">«a y b»</b>. Esta curva da el producto. Y si la suma se pasa del todo, el resultado es 0.' },
    ],
    primitivas({ q, paso, e }) {
      const g = G[paso === 3 && q(3) >= 1 ? Math.round(e.g) : 0], a = e.a[0], b = e.b[0], al = ev(q(0), 0, 0.3), f = (u) => Math.min(YMAX, g.f(u));
      const N = [marco({ x: [0, 1], y: [0, YMAX] }, { alfa: al, ticks: { x: [0, 0.5, 1], y: [0, 1, 2] }, etiquetas: { x: R`\text{grado}`, y: R`\text{distancia}` } })];
      const inicio = Math.max(0.0001, Math.exp(-YMAX));
      N.push(curva((u) => [u, f(u)], [g === G[0] ? inicio : 0, 1], { hasta: Math.max(ev(q(0), 0.1, 0.9), 1e-3), n: 200, color: BLANCO, ancho: 3, brillo: true }));
      const fa = g.f(a), fb = g.f(b), s = ev(q(1), 0, 0.5);
      if (s > 0) {
        N.push(linea([a, 0], [a, fa], { color: AZUL, ancho: 2, alfa: s }), linea([a, fa], [0, fa], { color: AZUL, ancho: 1.5, alfa: 0.7 * s, discontinua: true }), punto([a, fa], { color: AZUL, radio: 6, alfa: s }));
        N.push(linea([b, 0], [b, fb], { color: ROSA, ancho: 2, alfa: s }), linea([b, fb], [0, fb], { color: ROSA, ancho: 1.5, alfa: 0.7 * s, discontinua: true }), punto([b, fb], { color: ROSA, radio: 6, alfa: s }));
        N.push(rotulo([a, 0], 'a', { clave: 'a', dy: 38, tam: 20, color: AZUL, alfa: s }), rotulo([b, 0], 'b', { clave: 'b', dy: 38, tam: 20, color: ROSA, alfa: s }));
      }
      const ap = ev(q(2), 0, 0.8), total = fa + fb;
      if (ap > 0) {
        N.push(linea([0, 0], [0, fa], { color: AZUL, ancho: 7 }), linea([0, fa], [0, fa + fb * ap], { color: ROSA, ancho: 7 }));
        N.push(rotulo([0, fa + fb * ap], R`f(a) + f(b)`, { clave: 'sum', dx: -14, dy: -16, ancla: 'r', tam: 20, alfa: ap }));
      }
      const vu = ev(q(3), 0, 0.8);
      if (vu > 0) {
        const t = sumaCon(g)(a, b);
        if (t > 0) {
          const y = Math.min(YMAX, total);
          N.push(linea([0, y], [mix(0, t, ev(vu, 0, 0.6)), y], { color: ORO, ancho: 2, alfa: 0.95 }));
          if (vu > 0.6) N.push(linea([t, y], [t, mix(y, 0, ev(vu, 0.6, 1))], { color: ORO, ancho: 2, alfa: 0.95 }), punto([t, mix(y, 0, ev(vu, 0.6, 1))], { color: ORO, radio: 4, halo: 0 }));
          N.push(punto([mix(0, t, ev(vu, 0, 0.6)), y], { color: ORO, radio: 5, alfa: vu }), punto([t, y], { color: ORO, radio: 2, alfa: 0, halo: 0 }));
        }
        N.push(rotulo([1, YMAX], R`\text{${NOM[G.indexOf(g)]}: } T(a, b) = ${coma(t)}`, { clave: 'res', ancla: 'r', dy: 6, tam: 25, color: ORO, alfa: ev(vu, 0.6, 1) }));
      }
      return N;
    },
  },
  manipulacion: '<ul><li>Arrastra las líneas azul y rosa: mira cómo se apilan las distancias, y dónde cae el resultado.</li><li>Cambia de curva. Con la recta, sale Łukasiewicz: si la suma se pasa de 1, el resultado es 0.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Hay un viejo truco para multiplicar: con los [[logaritmos|logaritmo]], una multiplicación se convierte en una suma. El [[generador]] hace eso con cualquier «y»: pasa los grados a distancias, las suma, y vuelve.' },
    { tipo: 'ejemplo', texto: 'Con $f(a) = -\\ln a$, calcula «0,5 y 0,4»:', tabla: [['Paso', 'Cuenta', 'Resultado'], ['Distancia de 0,5', '−ln 0,5', '0,69'], ['Distancia de 0,4', '−ln 0,4', '0,92'], ['Apilar', '0,69 + 0,92', '1,61'], ['Volver', 'e elevado a −1,61', '0,2']], cierre: 'Da 0,2, que es exactamente 0,5 · 0,4. Es el producto.' },
    { tipo: 'simbolos', intro: 'La receta completa.', piezas: [
      { tex: R`f(a)`, dice: 'Convierte el grado en distancia. $f(1) = 0$, y $f$ siempre baja: cuanto más grado, menos distancia.' },
      { tex: R`f(a) + f(b)`, dice: 'Apila las dos distancias.' },
      { tex: R`f^{-1}`, dice: 'La inversa: el camino de vuelta, de la distancia al grado.' },
    ], todo: R`T(a, b) = f^{-1}(f(a) + f(b))`, lee: '«Pasa a distancias, suma, y vuelve». Si la suma se pasa de $f(0)$, no hay vuelta posible, y el resultado es 0.' },
    { tipo: 'formal', titulo: 'Generador aditivo', tex: R`Un generador es una función continua y estrictamente decreciente $f : [0, 1] \to [0, \infty]$, con $f(1) = 0$. La [[norma T]] que genera es $T(a, b) = f^{-1}(\min(f(a) + f(b),\ f(0)))$.`, lee: 'Las normas T que salen así se llaman arquimedianas. Con $f(a) = -\\ln a$ sale el producto. Con $f(a) = 1 - a$, Łukasiewicz. El mínimo no se puede generar así.' },
    { tipo: 'demo', titulo: 'Toda T generada es asociativa', plan: 'Es la gran ventaja de pasar a sumas: la asociatividad, que era difícil de comprobar a mano, se hereda de la suma. La demostramos en el caso más simple: cuando la suma no se pasa.', tex: R`Si las sumas no llegan a $f(0)$: $\ T(T(a, b), c) = f^{-1}(f(a) + f(b) + f(c))$, y lo mismo $T(a, T(b, c))$.`, pasos: [
      { texto: R`$T(a, b) = f^{-1}(f(a) + f(b))$, luego $f(T(a, b)) = f(a) + f(b)$.`, porque: 'Aplicar $f$ deshace $f^{-1}$.' },
      { texto: R`$T(T(a, b), c) = f^{-1}(f(T(a, b)) + f(c)) = f^{-1}(f(a) + f(b) + f(c))$.`, porque: 'Definición de $T$, y sustituir lo anterior.' },
      { texto: R`Por el otro lado sale lo mismo: la suma de tres distancias no depende de cómo las agrupes.`, porque: 'La suma es [[asociativa]]. Toda la dificultad ha desaparecido.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Cambia de mundo', texto: 'Si un problema es difícil aquí, transfórmalo a un sitio donde sea fácil, resuélvelo, y vuelve. Es la idea de los logaritmos, y de muchas otras cosas.' },
    { titulo: 'Hereda propiedades', texto: 'Si tu operación es una suma disfrazada, hereda gratis las propiedades de la suma.' },
  ],
  retos: [
    { id: 'generador-suma', tipo: 'manipular', enunciado: R`Con la curva del producto, mueve $a$ y $b$ para que el resultado sea $0{,}25$, con error menor que $0{,}01$.`, precision: (e) => (Math.round(e.g) === 0 && Math.abs(e.a[0] * e.b[0] - 0.25) < 0.01 ? 1 : 0), prueba: { a: [0.5, 0], b: [0.5, 0] }, pistas: ['¿Qué dos números se multiplican para dar 0,25?'], explicacion: 'Dos distancias iguales, apiladas.' },
    { id: 'calcula-generador', tipo: 'calcular', enunciado: R`Con $f(a) = 1 - a$, ¿cuánto da «0,8 y 0,7»?`, respuesta: 0.5, tol: 0.001, pistas: [R`Distancias: $0{,}2$ y $0{,}3$.`, R`Volver: la inversa de $1 - a$ también es $1 - u$.`], explicacion: R`$1 - (0{,}2 + 0{,}3) = 0{,}5$, justo Łukasiewicz.` },
    { id: 'demuestra-asociativa', tipo: 'demostrar', enunciado: R`Demuestra que un generado cumple $T(a, 1) = a$.`, pistas: ['¿Cuánto vale $f(1)$?'],
      solucion: [
        { texto: R`$T(a, 1) = f^{-1}(f(a) + f(1)) = f^{-1}(f(a) + 0)$.`, porque: 'Definición de $T$, y $f(1) = 0$.' },
        { texto: R`$f^{-1}(f(a)) = a$.`, porque: 'La inversa deshace a $f$. Geométricamente: el grado 1 está a distancia 0, y apilar nada no cambia nada.' },
      ] },
  ],
  referencias: ['E. P. Klement, R. Mesiar, E. Pap, <em>Triangular Norms</em>, 2000.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 3 (generadores).'],
};
