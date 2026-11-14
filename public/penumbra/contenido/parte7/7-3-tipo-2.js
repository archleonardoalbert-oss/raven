import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { kmIntervalo } from '../../nucleo/aprender.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const DOM = [0, 10], S0 = 1.6, Z = [2, 8];
const g = (x, c, s) => Math.exp(-((x - c) ** 2) / (2 * s * s));
const banda = (x, d) => [[g(x, 3, S0 - d), g(x, 3, S0 + d)], [g(x, 7, S0 - d), g(x, 7, S0 + d)]];
export const intervalo = (x, d) => { const b = banda(x, d); return kmIntervalo(Z, [b[0][0], b[1][0]], [b[0][1], b[1][1]]); };
const EXPERTOS = [-1, -0.75, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.75, 1];

function franja(c, d, color, alfa) {
  const P = [], n = 80;
  for (let i = 0; i < n; i++) {
    const x0 = (10 * i) / n, x1 = (10 * (i + 1)) / n;
    P.push(poligono([[x0, g(x0, c, S0 - d)], [x1, g(x1, c, S0 - d)], [x1, g(x1, c, S0 + d)], [x0, g(x0, c, S0 + d)]], { color, alfa }));
  }
  return P;
}

export default {
  id: '7-3-tipo-2',
  titulo: 'Dudar de la curva: conjuntos de tipo 2',
  puente: 'Grados que vienen de datos, reglas que aprenden, y un margen para la duda. Queda juntarlo todo en algo real: tu propuesta.',
  pregunta: 'Lo difuso resuelve la vaguedad con una curva. Pero ¿quién dibuja esa curva? Si diez expertos dibujan «alto», salen diez curvas. ¿Quién lleva razón?',
  escena: {
    id: 'tipo-2', formato: 'plano', W: 1100, H: 580,
    ejes: { x: DOM, y: [0, 1], caja: { x: 90, y: 50, w: 900, h: 300 } },
    entradas: [
      { id: 'd', tipo: 'deslizador', etiqueta: 'cuánta duda hay sobre la curva', min: 0, max: 1.2, paso: 0.02, valor: 0.3 },
      { id: 'x', tipo: 'deslizador', etiqueta: 'la entrada x', min: 0, max: 10, paso: 0.05, valor: 4 },
    ],
    pasos: [
      { dur: 2800, texto: 'Pides a diez personas que dibujen una misma palabra. <b>Ninguna curva coincide con otra.</b> La curva única tenía una precisión que en realidad no existía.' },
      { dur: 2800, texto: 'Solución: no elegir. Se guarda toda la franja, <b style="color:#58c4dd;font-weight:400">desde la curva más alta hasta la más baja</b>. Se llama huella de incertidumbre. Es un conjunto de tipo 2.' },
      { dur: 3000, texto: 'Añade otra palabra, y mete un dato. Ahora, <b>el grado ya no es un número: es un intervalo</b>. En cada franja, de dónde a dónde.' },
      { dur: 3400, texto: 'Las reglas siguen igual, pero la respuesta es también <b style="color:#f4d345;font-weight:400">un intervalo</b>: el sistema dice hasta dónde está seguro. Su punto medio sirve como orden para el motor.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.3), fr = ev(q(1), 0, 0.5), seg = ev(q(2), 0, 0.5), res = ev(q(3), 0, 0.5), d = paso === 0 ? 1 : paso === 1 ? mix(1, e.d, ev(q(1), 0.5, 1)) : e.d, x = e.x;
      const P = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 5, 10], y: [0, 1] }, etiquetas: { x: 'x', y: R`\mu` } })];
      if (fr > 0) P.push(...franja(3, d, AZUL, 0.42 * fr));
      if (seg > 0) P.push(...franja(7, d, ROSA, 0.42 * seg));
      EXPERTOS.forEach((t, i) => { const a = ev(q(0), (i / 10) * 0.7, (i / 10) * 0.7 + 0.3) * (1 - fr); if (a > 0) P.push(curva((u) => [u, g(u, 3, S0 + t)], DOM, { n: 100, color: GRIS2, ancho: 1.6, alfa: a })); });
      if (fr > 0) P.push(curva((u) => [u, g(u, 3, S0 + d)], DOM, { n: 200, color: AZUL, ancho: 2.4, alfa: fr }), curva((u) => [u, g(u, 3, S0 - d)], DOM, { n: 200, color: AZUL, ancho: 2.4, alfa: fr }));
      if (seg > 0) {
        P.push(curva((u) => [u, g(u, 7, S0 + d)], DOM, { n: 200, color: ROSA, ancho: 2.4, alfa: seg }), curva((u) => [u, g(u, 7, S0 - d)], DOM, { n: 200, color: ROSA, ancho: 2.4, alfa: seg }));
        const b = banda(x, d);
        P.push(linea([x, 0], [x, 1], { color: BLANCO, ancho: 1.3, alfa: 0.7 * seg, discontinua: true }));
        b.forEach((v, i) => { const c = i ? ROSA : AZUL; P.push(punto([x, v[0]], { color: c, radio: 5, alfa: seg }), punto([x, v[1]], { color: c, radio: 5, alfa: seg }), linea([x, v[0]], [x, v[1]], { color: c, ancho: 5, alfa: seg })); });
        P.push(rotulo([9.9, 1.09], R`{\color{#58c4dd}[${coma(b[0][0])},\ ${coma(b[0][1])}]},\quad {\color{#fc6282}[${coma(b[1][0])},\ ${coma(b[1][1])}]}`, { clave: 'gr', ancla: 'r', tam: 21, alfa: seg }));
      }
      const S = [];
      if (res > 0) {
        const [a, c] = intervalo(x, d), m = (a + c) / 2;
        S.push(marco({ x: [0, 10], y: [0, 1] }, { alfa: res, soloBase: true, ticks: { x: [0, 2, 4, 6, 8, 10], y: [] }, etiquetas: { x: 'z' } }));
        S.push(punto([a, 0.3], { color: ORO, radio: 6, alfa: res }), punto([c, 0.3], { color: ORO, radio: 6, alfa: res }), linea([a, 0.3], [c, 0.3], { color: ORO, ancho: 7, alfa: res }), punto([m, 0.3], { color: BLANCO, radio: 6, alfa: res }));
        S.push(rotulo([5, 0.95], R`\text{La respuesta está entre } {\color{#f4d345}${coma(a)}} \text{ y } {\color{#f4d345}${coma(c)}};\ \text{punto medio } ${coma(m)}`, { clave: 'res', tam: 21, alfa: res }));
      }
      return { principal: P, paneles: [{ ejes: { x: [0, 10], y: [0, 1], caja: { x: 90, y: 405, w: 900, h: 120 } }, prims: S }] };
    },
  },
  manipulacion: '<ul><li>Sube la duda: la franja se ensancha, y con ella el intervalo de salida.</li><li>Pon la duda a 0: todo se reduce a un sistema normal, con una sola respuesta.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Hay dos dudas distintas. La primera, lo vago: ¿es alto quien mide 1,75? Eso lo resuelve un grado. La segunda: ¿qué grado exactamente le doy? Zadeh ya propuso en 1975 conjuntos cuyos grados son, a su vez, difusos: de tipo 2. Karnik y Mendel los hicieron prácticos en los años 90, con grados en forma de intervalo.' },
    { tipo: 'ejemplo', texto: 'Dos reglas, con resultados $z_1 = 2$ y $z_2 = 8$. Las fuerzas son intervalos: $[0{,}2;\\ 0{,}6]$ y $[0{,}4;\\ 0{,}9]$.', tabla: [['Se busca', 'Quién pesa más', 'Pesos', 'Resultado'], ['El menor', 'la regla baja, y lo menos la alta', '0,6 y 0,4', '4,4'], ['El mayor', 'la regla alta, y lo menos la baja', '0,2 y 0,9', '6,91']], cierre: 'La respuesta es el intervalo $[4{,}4;\\ 6{,}91]$. Para el motor, su punto medio: unos 5,65.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\underline{\mu}(x)`, dice: 'La curva inferior de la franja. La raya debajo se lee «inferior».' },
      { tex: R`\overline{\mu}(x)`, dice: 'La curva superior.' },
      { tex: R`[\underline{\mu}(x),\ \overline{\mu}(x)]`, dice: 'El grado, en forma de intervalo.' },
      { tex: R`[z_l,\ z_r]`, dice: 'La respuesta del sistema: de la izquierda («left») a la derecha («right»).' },
    ], todo: R`z_l = \min_{w_i \in [\underline{w}_i,\ \overline{w}_i]} \frac{\sum_i w_i z_i}{\sum_i w_i}`, lee: '«El menor valor que puede dar la media pesada, entre todos los pesos que permite cada intervalo». $z_r$ es lo mismo con el máximo.' },
    { tipo: 'formal', titulo: 'Conjunto de tipo 2 de intervalo', tex: R`Es una pareja de funciones $\underline{\mu} \le \overline{\mu}$ de $X$ en $[0, 1]$. La franja entre ellas es la [[huella de incertidumbre]]. El paso de los intervalos $[\underline{w}_i, \overline{w}_i]$ a $[z_l, z_r]$ se llama reducción de tipo.`, lee: 'Si las dos curvas coinciden, se recupera un conjunto difuso normal, de tipo 1.' },
    { tipo: 'demo', titulo: 'Los extremos están en los bordes', plan: 'Parece que hay que probar infinitos pesos. No: al subir el peso de una regla, la media se acerca a su resultado. Así que el extremo siempre está en un borde.', tex: R`Con dos reglas, $z_1 < z_2$, y $w_2 > 0$, la media pesada baja al subir $w_1$.`, pasos: [
      { texto: R`Sea $y = \dfrac{w_1 z_1 + w_2 z_2}{w_1 + w_2}$. Su derivada respecto a $w_1$ es $\dfrac{z_1 (w_1 + w_2) - (w_1 z_1 + w_2 z_2)}{(w_1 + w_2)^2}$.`, porque: 'La regla del cociente.' },
      { texto: R`Simplificando el numerador: $w_2 (z_1 - z_2)$.`, porque: 'Se cancela $w_1 z_1$.' },
      { texto: R`Es negativo, porque $w_2 > 0$ y $z_1 < z_2$. Luego $y$ baja. El menor $y$ se da con $w_1$ máximo, y lo simétrico con $w_2$ mínimo.`, porque: 'Por eso, en el ejemplo, se tomaron los pesos 0,6 y 0,4.' },
    ] },
    { tipo: 'nota', titulo: '¿Vale la pena?', texto: 'Cuesta más que un tipo 1, y hay que justificar ese coste. La comunidad sigue discutiendo cuánto mejoran en la práctica. Rinden sobre todo cuando las reglas vienen de muchas personas, o cuando hay mucho ruido en los datos.' },
  ],
  tecnicas: [
    { titulo: 'Busca el extremo en el borde', texto: 'Si algo crece o decrece siempre con una variable, su máximo y su mínimo están en los bordes del intervalo. Muchas optimizaciones que parecen infinitas se reducen a mirar pocos casos.' },
  ],
  retos: [
    { id: 'ensancha', tipo: 'manipular', enunciado: R`Sube la duda hasta que el intervalo de salida tenga una anchura de al menos $2$, con $x$ en $4$.`, precision: (e) => { const [a, b] = intervalo(e.x, e.d); return Math.abs(e.x - 4) < 0.5 && b - a >= 2 ? 1 : 0; }, prueba: { d: 0.9, x: 4 }, pendiente: (e) => { const [a, b] = intervalo(e.x, e.d); return `Ahora, la anchura es ${(b - a).toFixed(2).replace('.', ',')}.`; }, pistas: ['Mueve el primer mando.'], explicacion: 'Cuanta más duda hay en las palabras, más amplia es la respuesta: el sistema es honesto sobre lo que no sabe.' },
    { id: 'intervalo-calc', tipo: 'calcular', enunciado: R`Si $[z_l, z_r] = [3{,}2;\ 5{,}0]$, ¿cuál es la orden para el motor?`, respuesta: 4.1, tol: 0.001, pistas: ['Es el punto medio.'], explicacion: R`$\frac{3{,}2 + 5{,}0}{2} = 4{,}1$.` },
    { id: 'tipo2-elegir', tipo: 'elegir', enunciado: '¿Qué pasa si no hay ninguna duda sobre la curva?', opciones: ['El sistema no funciona', 'Las dos curvas coinciden, y se recupera un sistema normal, de tipo 1', 'La respuesta es siempre 0', 'Hay que usar un tipo 3'], correcta: 1, explicacion: 'El tipo 1 es un caso particular del tipo 2.' },
    { id: 'demuestra-extremos', tipo: 'demostrar', enunciado: R`Demuestra que, si todas las fuerzas tienen intervalos de anchura 0, entonces $z_l = z_r$.`, pistas: ['¿Cuántos pesos posibles hay?'],
      solucion: [
        { texto: R`Si $\underline{w}_i = \overline{w}_i$, cada peso solo puede tomar un valor.`, porque: 'El intervalo es un punto.' },
        { texto: R`Por tanto, el mínimo y el máximo se toman sobre un solo valor posible, y coinciden.`, porque: 'Con una sola opción, el mínimo y el máximo son la misma.' },
      ] },
  ],
  referencias: ['L. A. Zadeh (1975): la variable lingüística, parte I.', 'N. N. Karnik, J. M. Mendel, Q. Liang, «Type-2 fuzzy logic systems», <em>IEEE Trans. Fuzzy Systems</em> 7 (1999).', 'J. M. Mendel, <em>Uncertain Rule-Based Fuzzy Systems</em>, 2.ª ed., 2017.'],
};
