import { AZUL, BLANCO, GRIS2, ORO, ROSA, TEXTO } from '../../motor/colores.js';
import { triangular } from '../../nucleo/difuso.js';
import { agregar, centroide } from '../../nucleo/sistemas.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { LIENZO } from '../parte4/matriz.js';

const R = String.raw;
const coma = (v, d = 2) => v.toFixed(d).replace('.', '{,}');
const cl = (v) => Math.max(0, Math.min(1, v));
const DT = [0, 40], DH = [0, 100], DV = [0, 100];
const templada = triangular(10, 20, 30), calor = (t) => cl((t - 20) / 15), seca = (h) => cl((70 - h) / 50), humeda = (h) => cl((h - 30) / 50);
const lento = triangular(0, 20, 45), medio = triangular(25, 50, 75), rapido = triangular(55, 80, 100);
const REGLAS = [
  { A: templada, nA: 'templada', B: seca, nB: 'seca', C: lento, nC: 'lento' },
  { A: templada, nA: 'templada', B: humeda, nB: 'húmeda', C: medio, nC: 'medio' },
  { A: calor, nA: 'calurosa', B: humeda, nB: 'húmeda', C: rapido, nC: 'rápido' },
];
const fuerzas = (t, h) => REGLAS.map((r) => Math.min(r.A(t), r.B(h)));
const salida = (t, h) => agregar(REGLAS.map((r, i) => ({ fuerza: fuerzas(t, h)[i], salida: r.C })));
export const velocidadVentilador = (t, h) => (Math.max(...fuerzas(t, h)) > 0 ? centroide(salida(t, h), DV, 500) : 0);

const COLS = [60, 310, 590], ANCHO = 210, FILAS = [70, 235, 400], ALTO = 105, FINAL = { x: 860, y: 190, w: 210, h: 170 };
const caja = (c, f) => ({ x: COLS[c], y: FILAS[f], w: ANCHO, h: ALTO });
const relleno = (f, dom, alfa, n = 70) => {
  const P = [];
  for (let i = 0; i < n; i++) {
    const x0 = dom[0] + ((dom[1] - dom[0]) * i) / n, x1 = dom[0] + ((dom[1] - dom[0]) * (i + 1)) / n, y0 = f(x0), y1 = f(x1);
    if (y0 + y1 > 1e-4) P.push(poligono([[x0, 0], [x1, 0], [x1, y1], [x0, y0]], { color: ORO, alfa }));
  }
  return P;
};

export default {
  id: '6-1-mamdani',
  titulo: 'Mamdani: la máquina completa',
  puente: 'La máquina termina con una figura, pero un motor necesita un solo número. ¿Cómo se resume una figura en un número? Hay varias formas, y no dan lo mismo.',
  pregunta: 'Sabes razonar con una regla. Pero una máquina real tiene muchas, y entra un número de un sensor. ¿Qué pasa, paso a paso, desde el número de entrada hasta la orden?',
  escena: {
    id: 'mamdani', formato: 'plano', W: 1100, H: 560, ejes: LIENZO(1100, 560),
    entradas: [
      { id: 't', tipo: 'deslizador', etiqueta: 'temperatura (°C)', min: 0, max: 40, paso: 0.5, valor: 26 },
      { id: 'h', tipo: 'deslizador', etiqueta: 'humedad (%)', min: 0, max: 100, paso: 1, valor: 60 },
    ],
    pasos: [
      { dur: 2800, texto: 'Un ventilador con tres reglas, una por fila. Se leen de izquierda a derecha: <b style="color:#58c4dd;font-weight:400">si la temperatura es…</b>, <b style="color:#fc6282;font-weight:400">y la humedad es…</b>, <b style="color:#f4d345;font-weight:400">entonces va…</b>' },
      { dur: 2600, texto: '<b>1. Convertir a grados.</b> Entran dos números, de dos sensores. Cada línea vertical corta las curvas: cada palabra recibe un grado.' },
      { dur: 2600, texto: '<b>2. Combinar la condición.</b> En cada fila hay un «y»: se queda el menor de los dos grados. Esa es la fuerza de la regla.' },
      { dur: 2600, texto: '<b>3. Recortar.</b> Con esa fuerza, se recorta la conclusión de la regla, como en el modus ponens.' },
      { dur: 2800, texto: '<b>4. Unir.</b> Se juntan los tres recortes en una figura, tomando el máximo en cada punto. Es la opinión conjunta de todas las reglas.' },
      { dur: 2600, texto: '<b>5. Concretar.</b> Un motor no entiende figuras. Se busca el punto de equilibrio de la figura. <b style="color:#f4d345;font-weight:400">Esa es la orden.</b>' },
    ],
    primitivas({ q, paso, e }) {
      const t = e.t, h = e.h, F = fuerzas(t, h), al = ev(q(0), 0, 0.5), P1 = ev(q(1), 0, 0.5), P2 = ev(q(2), 0, 0.5), P3 = ev(q(3), 0, 0.6), P4 = ev(q(4), 0, 0.7), P5 = ev(q(5), 0, 0.6);
      const N = [], paneles = [];
      ['si la temperatura es…', 'y la humedad es…', 'entonces el ventilador va…'].forEach((x, i) => N.push(rotulo([COLS[i] + ANCHO / 2, 30], R`\text{${x}}`, { clave: `cab${i}`, tam: 17, color: [AZUL, ROSA, ORO][i], alfa: al })));
      REGLAS.forEach((r, f) => {
        N.push(rotulo([30, FILAS[f] + ALTO / 2], `R_{${f + 1}}`, { clave: `R${f}`, tam: 20, color: GRIS2, alfa: al }));
        const a = [], b = [], c = [];
        a.push(marco({ x: DT, y: [0, 1] }, { alfa: al, ticks: { x: [0, 20, 40], y: f === 2 ? [0, 1] : [] } }), curva((u) => [u, r.A(u)], DT, { n: 120, color: AZUL, ancho: 2.6, alfa: al }), rotulo([20, 1], R`\text{${r.nA}}`, { clave: `a${f}`, dy: -11, tam: 15, color: AZUL, alfa: al }));
        b.push(marco({ x: DH, y: [0, 1] }, { alfa: al, ticks: { x: [0, 50, 100], y: [] } }), curva((u) => [u, r.B(u)], DH, { n: 120, color: ROSA, ancho: 2.6, alfa: al }), rotulo([50, 1], R`\text{${r.nB}}`, { clave: `b${f}`, dy: -11, tam: 15, color: ROSA, alfa: al }));
        c.push(marco({ x: DV, y: [0, 1] }, { alfa: al, ticks: { x: [0, 50, 100], y: [] } }), curva((u) => [u, r.C(u)], DV, { n: 120, color: GRIS2, ancho: 2, alfa: al }), rotulo([50, 1], R`\text{${r.nC}}`, { clave: `c${f}`, dy: -11, tam: 15, color: GRIS2, alfa: al }));
        if (P1 > 0) {
          a.push(linea([t, 0], [t, 1], { color: BLANCO, ancho: 1.3, alfa: 0.7 * P1 }), punto([t, r.A(t)], { color: BLANCO, radio: 5, alfa: P1 }), rotulo([t, r.A(t)], coma(r.A(t)), { clave: `ga${f}`, dx: 10, dy: -11, ancla: 'l', tam: 15, alfa: P1 }));
          b.push(linea([h, 0], [h, 1], { color: BLANCO, ancho: 1.3, alfa: 0.7 * P1 }), punto([h, r.B(h)], { color: BLANCO, radio: 5, alfa: P1 }), rotulo([h, r.B(h)], coma(r.B(h)), { clave: `gb${f}`, dx: 10, dy: -11, ancla: 'l', tam: 15, alfa: P1 }));
        }
        if (P2 > 0) {
          const Y = FILAS[f] + ALTO * (1 - F[f]), X0 = r.A(t) <= r.B(h) ? COLS[0] + (t / 40) * ANCHO : COLS[1] + (h / 100) * ANCHO, X1 = COLS[2] + ANCHO;
          N.push(punto([X0, Y], { color: ORO, radio: 6, alfa: P2 }), punto([X1, Y], { color: ORO, radio: 3, alfa: P2 }), linea([X0, Y], [X1, Y], { color: ORO, ancho: 1.3, alfa: 0.8 * P2, discontinua: true }), rotulo([(COLS[1] + ANCHO + COLS[2]) / 2, FILAS[f] + ALTO / 2], R`\min = ${coma(F[f])}`, { clave: `mn${f}`, tam: 16, color: ORO, alfa: P2 }));
        }
        if (P3 > 0) c.push(...relleno((u) => Math.min(F[f], r.C(u)), DV, 0.7 * P3), curva((u) => [u, Math.min(F[f], r.C(u))], DV, { n: 120, color: ORO, ancho: 2.6, alfa: P3 }));
        paneles.push({ ejes: { x: DT, y: [0, 1], caja: caja(0, f) }, prims: a }, { ejes: { x: DH, y: [0, 1], caja: caja(1, f) }, prims: b }, { ejes: { x: DV, y: [0, 1], caja: caja(2, f) }, prims: c });
      });
      const u = [];
      if (P4 > 0) {
        const s = salida(t, h);
        u.push(marco({ x: DV, y: [0, 1] }, { alfa: P4, ticks: { x: [0, 100], y: [0, 1] } }), rotulo([50, 1], R`\text{Todas juntas}`, { clave: 'tj', dy: -16, tam: 16, color: TEXTO, alfa: P4 }));
        u.push(...relleno(s, DV, 0.7 * P4, 100), curva((x) => [x, s(x)], DV, { n: 200, color: ORO, ancho: 3, alfa: P4 }));
        if (P5 > 0) {
          const v = velocidadVentilador(t, h);
          u.push(linea([v, 0], [v, 1], { color: BLANCO, ancho: 2.4, alfa: P5 }), poligono([[v, 0], [v - 5, -0.09], [v + 5, -0.09]], { color: BLANCO, alfa: P5 }));
          N.push(rotulo([FINAL.x + FINAL.w / 2, 420], R`\text{velocidad} = {\color{#f4d345}${coma(v, 0)}\ \%}`, { clave: 'v', tam: 24, alfa: P5 }));
        }
      }
      paneles.push({ ejes: { x: DV, y: [0, 1], caja: FINAL }, prims: u });
      return { principal: N, paneles };
    },
  },
  manipulacion: '<ul><li>Mueve la temperatura: mira qué reglas se encienden y cuáles se apagan.</li><li>Busca un punto en el que dos reglas se repartan el trabajo: mientras haya alguna encendida, la orden cambia sin dar saltos.</li><li>Prueba 10 °C con 20 % de humedad: ninguna regla se enciende, y el ventilador se para de golpe. Faltan reglas para esa zona.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'En 1975, Ebrahim Mamdani controló una máquina de vapor escribiendo en reglas lo que hacía un operario, y funcionó mejor que los métodos de la época. La máquina es siempre la misma cadena: <b>convertir los números en grados</b>, <b>combinar</b> la condición, <b>recortar</b> cada conclusión, <b>unir</b> y <b>concretar</b>.' },
    { tipo: 'ejemplo', texto: 'Con 26 °C y 60 % de humedad:', tabla: [['Regla', 'Temperatura', 'Humedad', 'Fuerza (el menor)', 'Recorta'], ['Templada y seca → lento', '0,40', '0,20', '0,20', 'lento a 0,20'], ['Templada y húmeda → medio', '0,40', '0,60', '0,40', 'medio a 0,40'], ['Calurosa y húmeda → rápido', '0,40', '0,60', '0,40', 'rápido a 0,40']], cierre: 'Las tres reglas opinan a la vez, con distinta fuerza. Por eso el resultado cambia con suavidad: al moverse la temperatura, unas ceden poco a poco ante otras. Solo hay un salto si se apagan todas.' },
    { tipo: 'simbolos', intro: 'Para cada regla $i$, y luego todas juntas.', piezas: [
      { tex: R`w_i = \min(\mu_{A_i}(x_0),\ \mu_{B_i}(y_0))`, dice: 'La fuerza de la regla. La $w$ viene de «weight», «peso» en inglés. $x_0$ e $y_0$ son los números que dan los sensores.' },
      { tex: R`\min(w_i,\ \mu_{C_i}(z))`, dice: 'Su conclusión, recortada a esa fuerza.' },
      { tex: R`\mu(z) = \max_i \min(w_i,\ \mu_{C_i}(z))`, dice: 'Unir: en cada $z$, la regla que más opina.' },
    ], todo: R`\hat{z} = \text{concretar}(\mu)`, lee: 'La $\\hat{z}$, con su sombrero, es la orden final. La forma de concretar es el tema de la siguiente parada.' },
    { tipo: 'formal', titulo: 'Sistema de Mamdani', tex: R`Dadas $n$ reglas «si $x$ es $A_i$ e $y$ es $B_i$, entonces $z$ es $C_i$», y los datos $x_0$, $y_0$, la salida es $\mu(z) = \max_i \min\big(\min(\mu_{A_i}(x_0), \mu_{B_i}(y_0)),\ \mu_{C_i}(z)\big)$. Se puede cambiar cada $\min$ por otra [[norma T]], y el $\max$ por otra [[norma S]].`, lee: 'Es lo que acabas de ver: el $\\min$ de dentro combina la condición; el de fuera recorta; el $\\max$ une.' },
    { tipo: 'demo', titulo: 'Es la regla composicional, con dato exacto', plan: 'Esta receta tan práctica no es un invento nuevo: es la teoría de la región anterior, aplicada a números exactos y con un «o» entre reglas.', tex: R`La salida de Mamdani es la unión de $\{(x_0, y_0)\} \circ R_i$, donde $R_i = (A_i \times B_i) \times C_i$.`, pasos: [
      { texto: R`Un dato exacto es un conjunto con un solo punto. Con él, la composición con $R_i$ se reduce a leer la fila: $\mu_{R_i}(x_0, y_0, z)$.`, porque: 'Se demostró en «La regla composicional».' },
      { texto: R`Y por definición de $R_i$: $\mu_{R_i}(x_0, y_0, z) = \min\big(\min(\mu_{A_i}(x_0), \mu_{B_i}(y_0)),\ \mu_{C_i}(z)\big) = \min(w_i, \mu_{C_i}(z))$.`, porque: 'Es el [[producto cartesiano]], con mínimo.' },
      { texto: R`Si se unen las reglas con máximo, queda exactamente $\mu(z)$.`, porque: 'Cada regla describe una zona posible, y el sistema acepta cualquiera de ellas.' },
    ] },
    { tipo: 'nota', titulo: 'Para qué sirve', texto: 'Su gran virtud es que se lee: cada regla es una frase que un experto puede revisar. Su coste es el cálculo: hay que construir una figura y concretarla en cada instante.' },
  ],
  tecnicas: [
    { titulo: 'Descompón en cadena', texto: 'Una fórmula imponente se vuelve sencilla al leerla como una cadena de pasos. Si algo falla en un sistema difuso, se comprueba eslabón a eslabón.' },
  ],
  retos: [
    { id: 'ajusta-rapido', tipo: 'manipular', enunciado: 'Mueve los dos sensores hasta que el ventilador pase del 70 %.', precision: (e) => (velocidadVentilador(e.t, e.h) > 70 ? 1 : 0), prueba: { t: 38, h: 90 }, pendiente: (e) => `Ahora va al ${velocidadVentilador(e.t, e.h).toFixed(0)} %.`, pistas: ['¿Qué regla pide «rápido»? Haz que su condición se cumpla del todo.'], explicacion: 'Solo queda encendida la tercera regla, y la figura se reduce a «rápido».' },
    { id: 'mamdani-fuerza', tipo: 'calcular', enunciado: R`En una regla, la primera condición se cumple con $0{,}7$ y la segunda con $0{,}3$. ¿Con qué fuerza se dispara?`, respuesta: 0.3, tol: 0.001, pistas: ['Las une un «y».'], explicacion: R`$\min(0{,}7;\ 0{,}3) = 0{,}3$.` },
    { id: 'mamdani-orden', tipo: 'elegir', enunciado: '¿Cuál es el orden correcto de la máquina?', opciones: ['Unir, recortar, convertir a grados, concretar', 'Convertir a grados, combinar, recortar, unir, concretar', 'Concretar, convertir a grados, unir, recortar', 'Convertir a grados, unir, concretar, recortar'], correcta: 1, explicacion: 'De números a grados, de grados a una figura, y de la figura a un número.' },
    { id: 'demuestra-sin-reglas', tipo: 'demostrar', enunciado: R`Demuestra que, si una regla tiene fuerza $w_i = 0$, entonces no influye en la salida.`, pistas: ['¿Qué aporta esa regla al máximo?'],
      solucion: [
        { texto: R`Su conclusión recortada es $\min(0, \mu_{C_i}(z)) = 0$, para todo $z$.`, porque: 'El mínimo con 0 es 0.' },
        { texto: R`Y añadir un 0 a un máximo de números no negativos no lo cambia.`, porque: '$\\max(a, 0) = a$ si $a \\ge 0$.' },
      ] },
  ],
  referencias: ['E. H. Mamdani, S. Assilian, «An experiment in linguistic synthesis with a fuzzy logic controller», <em>Int. J. Man-Machine Studies</em> 7 (1975).', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 11.3 y 11.4.1.'],
};
