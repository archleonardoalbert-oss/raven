import { AZUL, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { interpolante, peorError } from '../../nucleo/sistemas.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v, d = 3) => v.toFixed(d).replace('.', '{,}');
const DOM = [0, 1];
const triangulo = (i, n) => { const h = 1 / (n - 1); return (x) => Math.max(0, 1 - Math.abs(x - i * h) / h); };

export default {
  id: '6-5-aproximacion',
  titulo: 'Pueden imitar cualquier curva',
  puente: 'Si estos sistemas pueden imitar casi cualquier cosa, también podrán sostener el palo. Toca comprobarlo. Es el momento que llevas esperando desde el principio.',
  pregunta: 'Un sistema de reglas sencillas, ¿qué puede llegar a hacer? Dibuja la curva que quieras. Con las reglas suficientes, la imitará tan bien como pidas.',
  escena: {
    id: 'aproximacion', formato: 'plano', W: 1100, H: 580,
    ejes: { x: DOM, y: [0, 1], caja: { x: 110, y: 50, w: 880, h: 320 } },
    entradas: [
      { id: 'f', tipo: 'expresion', etiqueta: 'la curva, f(x) =', vars: ['x'], valor: '0.5 + 0.4 * sin(6 * x) * cos(2 * x)', dominio: [0, 1] },
      { id: 'n', tipo: 'deslizador', etiqueta: 'cuántas reglas', min: 2, max: 40, paso: 1, valor: 3 },
    ],
    pasos: [
      { dur: 2200, texto: 'Un reto: imitar <b style="color:#58c4dd;font-weight:400">esta curva</b>, solo con reglas sencillas, de la forma «si $x$ está cerca de aquí, entonces $z$ vale tanto».' },
      { dur: 2800, texto: 'Con tres reglas. Abajo, sus triángulos. Cada regla acierta justo en su cima, y entre dos cimas se mezclan: sale una línea recta. <b style="color:#f4d345;font-weight:400">Es malo, pero es un comienzo.</b>' },
      { dur: 3400, texto: 'Añade reglas. Los triángulos se estrechan, y la imitación se pega a la curva. El error, en rojo, <b>se hunde</b>.' },
      { dur: 2600, texto: 'No es casualidad: es un teorema. Se llama <b style="color:#f4d345;font-weight:400">aproximación universal</b>. Con reglas suficientes, cualquier curva sin saltos se imita tan bien como se pida.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = ev(q(1), 0, 0.5), crece = ev(q(2), 0, 0.7), baja = ev(q(2), 0.82, 1);
      const n = Math.round(paso === 2 ? mix(mix(3, 30, crece), e.n, baja) : paso >= 3 ? e.n : 3), f = e.f, g = interpolante(f, n), err = peorError(f, n, 300);
      const N = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x', y: 'z' } }), curva((x) => [x, f(x)], DOM, { hasta: Math.max(ev(q(0), 0, 1), 1e-3), n: 300, color: AZUL, ancho: 2.6 })];
      const T = [marco({ x: DOM, y: [0, 1] }, { alfa: g1, soloBase: true, ticks: { x: [], y: [] } })];
      if (g1 > 0) {
        N.push(curva((x) => [x, Math.abs(f(x) - g(x))], DOM, { n: 300, color: ROJO, ancho: 1.8, alfa: 0.9 * g1 }), curva((x) => [x, g(x)], DOM, { n: Math.max(100, n * 20), color: ORO, ancho: 3.2, brillo: true, alfa: g1 }));
        for (let i = 0; i < n; i++) {
          const t = triangulo(i, n), cx = i / (n - 1);
          T.push(curva((x) => [x, t(x)], [Math.max(0, cx - 1 / (n - 1)), Math.min(1, cx + 1 / (n - 1))], { n: 2, color: i % 2 ? GRIS2 : ORO, ancho: 1.6, alfa: 0.75 * g1 }));
          if (n <= 16) N.push(punto([cx, f(cx)], { color: ORO, radio: 5, alfa: g1 }));
        }
        N.push(rotulo([0.98, 0.98], R`${n}\ \text{reglas}`, { clave: 'n', ancla: 'r', tam: 26, color: ORO, alfa: g1 }), rotulo([0.98, 0.87], R`\text{peor error} = {\color{#f05a5a}${coma(err)}}`, { clave: 'err', ancla: 'r', tam: 22, alfa: g1 }));
      }
      return { principal: N, paneles: [{ ejes: { x: DOM, y: [0, 1], caja: { x: 110, y: 420, w: 880, h: 110 } }, prims: T }] };
    },
  },
  manipulacion: '<ul><li>Mueve el número de reglas, y mira hundirse la línea roja.</li><li>Escribe tu propia curva, como <code>abs(x - 0.5) * 2</code>: el pico de la mitad se le atraganta un poco, pero al final lo alcanza.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Cada regla dice cuánto vale la curva cerca de un punto. Entre dos reglas vecinas, Sugeno mezcla sus respuestas, y sale una recta. Así que el sistema une con rectas unos puntos de la curva. Si los puntos están cerca unos de otros, una curva sin saltos casi no se separa de esas rectas.' },
    { tipo: 'ejemplo', texto: 'Cuántas reglas hacen falta para imitar una curva de $f(x)$ en una dimensión:', tabla: [['Reglas', '3', '5', '10', '20', '40'], ['Separación entre cimas', '0,5', '0,25', '0,11', '0,05', '0,03']], cierre: 'Aproximadamente, duplicar las reglas parte a la mitad la separación entre ellas. Y con la separación, baja el error.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`g(x)`, dice: 'El sistema de reglas: la curva dorada.' },
      { tex: R`|f(x) - g(x)|`, dice: 'El error en cada punto: la línea roja.' },
      { tex: R`\varepsilon`, dice: 'La letra griega épsilon: un número positivo, tan pequeño como quieras. Es la precisión que exiges.' },
    ], todo: R`\text{para todo } x: \quad |f(x) - g(x)| < \varepsilon`, lee: '«En ningún punto, el error llega a $\\varepsilon$». El teorema dice que siempre existe un $g$ capaz de cumplirlo.' },
    { tipo: 'formal', titulo: 'Aproximación universal (1992)', tex: R`Sea $f$ una función continua en un dominio cerrado y acotado. Para cada $\varepsilon > 0$, existe un sistema difuso $g$ con $|f(x) - g(x)| < \varepsilon$ en todo el dominio.`, lee: 'Lo probaron por separado Wang, Kosko y Buckley. Abajo lo demostramos en un caso cómodo: curvas sin pendientes infinitas, y una entrada.' },
    { tipo: 'demo', titulo: 'Por qué baja el error', plan: 'Supón que la curva no cambia más rápido que cierta pendiente $L$: se llama condición de [[Lipschitz]]. El sistema da, en cada punto, una media de dos valores cercanos de la curva. Una media no se aleja de sus valores, y estos están cerca.', tex: R`Si $|f(u) - f(v)| \le L\, |u - v|$, y las cimas están separadas $h$, entonces $|f(x) - g(x)| \le L\, h$.`, pasos: [
      { texto: R`Sea $x$ entre dos cimas vecinas $c$ y $c + h$. Solo esas dos reglas están encendidas: $g(x) = (1 - t)\, f(c) + t\, f(c + h)$, con $t \in [0, 1]$.`, porque: 'Los dos triángulos suman 1, y solo ellos valen algo en ese tramo.' },
      { texto: R`Como $f(x) = (1 - t)\, f(x) + t\, f(x)$, restando: $f(x) - g(x) = (1 - t)\big(f(x) - f(c)\big) + t\big(f(x) - f(c + h)\big)$.`, porque: 'Truco: escribir $f(x)$ también como una media, para poder agrupar.' },
      { texto: R`Cada paréntesis es, en valor absoluto, a lo sumo $L\, h$: la distancia de $x$ a cada cima no pasa de $h$.`, porque: 'Por la condición sobre $f$.' },
      { texto: R`Por tanto, $|f(x) - g(x)| \le (1 - t) L h + t L h = L h$.`, porque: 'Una media de cosas que no pasan de $Lh$ no pasa de $Lh$. Basta tomar $h$ pequeño, $h < \\frac{\\varepsilon}{L}$.' },
    ] },
    { tipo: 'nota', titulo: 'El precio', texto: 'El teorema dice que existe, no que sea barato. Con 10 palabras por entrada: una entrada, 10 reglas; dos entradas, 100; seis entradas, un millón. Esto se llama «la maldición de la dimensión». Por eso los sistemas reales eligen sus reglas con cuidado, en lugar de cubrirlo todo.' },
  ],
  tecnicas: [
    { titulo: 'Escribe lo mismo como una media', texto: 'Para comparar algo con una media, escríbelo también como media con los mismos pesos. Las diferencias se agrupan solas.' },
    { titulo: 'Existe no es lo mismo que es barato', texto: 'Un teorema de existencia dice que la meta se puede alcanzar; no dice cuánto cuesta. Pregúntalo siempre.' },
  ],
  retos: [
    { id: 'bajar-error', tipo: 'manipular', enunciado: R`Añade reglas hasta que el peor error baje de $0{,}01$. ¿Cuántas hacen falta?`, precision: (e) => (peorError(e.f, Math.round(e.n), 300) < 0.01 ? 1 : 0), prueba: { n: 40 }, pendiente: (e) => `Ahora el peor error es ${peorError(e.f, Math.round(e.n), 300).toFixed(3).replace('.', ',')}.`, pistas: ['Súbelo poco a poco, mirando el número rojo.'], explicacion: 'Si cambias de curva, el número de reglas necesario cambia también: cuanto más rápido varía, más reglas exige.' },
    { id: 'cuantas-reglas', tipo: 'calcular', enunciado: R`Tienes 5 entradas, con 3 palabras cada una. Si quieres cubrir todas las combinaciones, ¿cuántas reglas necesitas?`, respuesta: 243, tol: 0.5, pistas: [R`Se multiplican: $3 \cdot 3 \cdot 3 \cdot 3 \cdot 3$.`], explicacion: R`$3^5 = 243$.` },
    { id: 'demuestra-lipschitz', tipo: 'demostrar', enunciado: R`Si $f(x) = 2x$ y las cimas están separadas $h = 0{,}1$, usa el resultado para decir cuánto puede valer el error como máximo. ¿Se alcanza?`, pistas: ['¿Qué pendiente tiene $f$? Y una recta, ¿qué le pasa al unirla con rectas?'],
      solucion: [
        { texto: R`$|f(u) - f(v)| = 2\, |u - v|$, luego $L = 2$, y el error no pasa de $L h = 0{,}2$.`, porque: 'Aplicar el resultado.' },
        { texto: R`Pero $f$ ya es una recta: unir sus puntos con rectas devuelve la misma $f$. El error real es 0.`, porque: 'Lo demostrado es un tope, y un tope puede estar lejos de la realidad.' },
      ] },
  ],
  referencias: ['L.-X. Wang, «Fuzzy systems are universal approximators», <em>Proc. IEEE FUZZ</em> (1992).', 'B. Kosko, «Fuzzy systems as universal approximators», <em>Proc. IEEE FUZZ</em> (1992).', 'J. J. Buckley, «Universal fuzzy controllers», <em>Automatica</em> 28 (1992).'],
};
