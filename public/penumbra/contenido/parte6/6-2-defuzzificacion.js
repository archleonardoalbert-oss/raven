import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { triangular } from '../../nucleo/difuso.js';
import { bisector, centroide, maximos } from '../../nucleo/sistemas.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(1).replace('.', '{,}');
const DOM = [0, 10];
const izq = triangular(0, 2.5, 5), der = triangular(4, 7, 10);
const figura = (a, b) => (x) => Math.max(Math.min(a, izq(x)), Math.min(b, der(x)));
const relleno = (f, u0, u1, color, alfa, n = 90) => {
  const P = [];
  for (let i = 0; i < n; i++) {
    const x0 = u0 + ((u1 - u0) * i) / n, x1 = u0 + ((u1 - u0) * (i + 1)) / n, y0 = f(x0), y1 = f(x1);
    if (y0 + y1 > 1e-4) P.push(poligono([[x0, 0], [x1, 0], [x1, y1], [x0, y0]], { color, alfa }));
  }
  return P;
};
const separacion = (a, b) => Math.abs(centroide(figura(a, b), DOM) - maximos(figura(a, b), DOM).medio);

export default {
  id: '6-2-defuzzificacion',
  titulo: 'De una figura a un número',
  puente: 'Construir la figura y buscar su equilibrio, en cada instante, es caro. ¿Y si cada regla diera directamente un número? Esa es la idea de Sugeno, y se quita de encima este paso.',
  pregunta: 'Las reglas te dan una figura, y el motor necesita un número. ¿Con cuál te quedas? Si dos opiniones pesan distinto, ¿qué resume mejor a las dos?',
  escena: {
    id: 'defuzzificacion', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: [-0.1, 1.3], caja: { x: 110, y: 40, w: 880, h: 440 } },
    entradas: [
      { id: 'a', tipo: 'deslizador', etiqueta: 'fuerza de la regla de la izquierda', min: 0.05, max: 1, paso: 0.01, valor: 0.8 },
      { id: 'b', tipo: 'deslizador', etiqueta: 'fuerza de la regla de la derecha', min: 0.05, max: 1, paso: 0.01, valor: 0.4 },
    ],
    pasos: [
      { dur: 2200, texto: 'Dos reglas han recortado sus conclusiones. Hay que dar <b style="color:#f4d345;font-weight:400">un solo número</b>. ¿Cuál?' },
      { dur: 3200, texto: 'La opción reina: imagina la figura recortada en cartón. <b style="color:#f4d345;font-weight:400">El centroide</b> es el punto donde se sostiene en equilibrio, sobre un apoyo. Pesa toda la figura.' },
      { dur: 3000, texto: '<b>El bisector</b> parte la figura en dos trozos de <b style="color:#58c4dd;font-weight:400">igual</b> <b style="color:#fc6282;font-weight:400">área</b>. Suele quedar cerca del centroide, pero no en el mismo sitio.' },
      { dur: 3000, texto: 'Otra familia solo mira <b>los puntos más altos</b>: el primero, el último, o el que queda en el medio. Son fáciles de calcular, pero ignoran todo lo demás.' },
      { dur: 2400, texto: 'Las cinco, juntas. Mueve las fuerzas después: unas se deslizan suavemente, y otras <b>pegan un salto</b>.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.5), f = figura(e.a, e.b), c = centroide(f, DOM), b = bisector(f, DOM), m = maximos(f, DOM);
      const N = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 2, 4, 6, 8, 10], y: [0, 1] }, etiquetas: { x: 'z', y: R`\mu` } })];
      const parte = ev(q(2), 0, 0.5) * (1 - ev(q(3), 0, 0.3)), dib = Math.max(ev(q(0), 0, 1), 1e-3);
      if (parte > 0.001) N.push(...relleno(f, 0, b, AZUL, 0.55 * parte), ...relleno(f, b, 10, ROSA, 0.55 * parte));
      N.push(...relleno(f, 0, 10, ORO, 0.38 * al * (1 - parte)), curva((x) => [x, f(x)], DOM, { hasta: dib, n: 400, color: ORO, ancho: 3 }));
      const pc = ev(q(1), 0, 0.5), pb = ev(q(2), 0, 0.5), pm = ev(q(3), 0, 0.5);
      if (pc > 0) {
        N.push(punto([c, 1.02], { color: BLANCO, radio: 3, alfa: pc }), linea([c, 0], [c, 1.02], { color: BLANCO, ancho: 2.4, alfa: pc }), poligono([[c, 0], [c - 0.22, -0.08], [c + 0.22, -0.08]], { color: BLANCO, alfa: pc }));
        N.push(rotulo([c, 1.02], R`\text{centroide } ${coma(c)}`, { clave: 'c', dy: -14, dx: c >= b ? 8 : -8, ancla: c >= b ? 'l' : 'r', tam: 20, alfa: pc }));
      }
      if (pb > 0) {
        N.push(punto([b, 1.13], { color: GRIS2, radio: 3, alfa: pb }), linea([b, 0], [b, 1.13], { color: GRIS2, ancho: 2, alfa: pb, discontinua: true }), rotulo([b, 1.13], R`\text{bisector } ${coma(b)}`, { clave: 'b', dy: -13, dx: c >= b ? -8 : 8, ancla: c >= b ? 'r' : 'l', tam: 20, color: GRIS2, alfa: pb }));
        if (paso === 2) N.push(rotulo([Math.max(1.2, b / 2), 0.14], R`50\ \%`, { clave: 'ai', tam: 24, alfa: parte }), rotulo([(b + 10) / 2, 0.08], R`50\ \%`, { clave: 'ad', tam: 24, alfa: parte }));
      }
      if (pm > 0) {
        const h = m.altura;
        N.push(linea([m.primero, h], [m.ultimo, h], { color: BLANCO, ancho: 3.4, alfa: pm }));
        N.push(punto([m.primero, h], { color: AZUL, radio: 7, alfa: pm }), punto([m.medio, h], { color: BLANCO, radio: 7, alfa: pm }), punto([m.ultimo, h], { color: ROSA, radio: 7, alfa: pm }));
        N.push(rotulo([9.9, 1.26], R`\text{primer máximo } {\color{#58c4dd}${coma(m.primero)}}`, { clave: 'mp', ancla: 'r', tam: 18, alfa: pm }), rotulo([9.9, 1.17], R`\text{media de máximos } ${coma(m.medio)}`, { clave: 'mm', ancla: 'r', tam: 18, alfa: pm }), rotulo([9.9, 1.08], R`\text{último máximo } {\color{#fc6282}${coma(m.ultimo)}}`, { clave: 'mu', ancla: 'r', tam: 18, alfa: pm }));
      }
      return N;
    },
  },
  manipulacion: '<ul><li>Sube la fuerza de la derecha despacio, hasta pasar a la de la izquierda. Mira el centroide: se desliza. Mira la media de máximos: salta.</li><li>Iguala las dos fuerzas: ¿dónde queda ahora el centroide?</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Este paso se llama «defuzzificar»: quitar lo difuso. Es resumir una figura en un número, igual que resumes unas notas en una media. Y como toda forma de resumir, pierde información. La pregunta es qué quieres conservar.' },
    { tipo: 'ejemplo', texto: 'El [[centroide]] en pequeño: cinco valores $z$ con sus grados.', tabla: [['z', '2', '4', '6', '8', '10'], ['μ', '0,2', '0,6', '1', '0,6', '0,2'], ['z · μ', '0,4', '2,4', '6', '4,8', '2']], cierre: 'Suma de $z \\cdot \\mu$: 15,6. Suma de $\\mu$: 2,6. Centroide: 15,6 / 2,6 = 6. Es la media de las $z$, con cada una pesando su grado.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\sum_i z_i\, \mu(z_i)`, dice: 'Cada valor, multiplicado por su peso: como en una media de notas con créditos.' },
      { tex: R`\sum_i \mu(z_i)`, dice: 'El peso total, por el que se divide.' },
      { tex: R`\int z\, \mu(z)\, dz`, dice: 'La misma suma, con infinitos puntos muy juntos: eso es una [[integral]]. La $dz$ es la anchura de cada trocito.' },
    ], todo: R`\hat{z} = \frac{\int z\, \mu(z)\, dz}{\int \mu(z)\, dz}`, lee: '«El centroide es la media de $z$, pesada por el grado». Es la misma fórmula que da el centro de masas en física.' },
    { tipo: 'formal', titulo: 'Las cinco clásicas', tex: R`Centroide: la fórmula anterior. Bisector: el $\hat{z}$ con $\int_{-\infty}^{\hat{z}} \mu = \int_{\hat{z}}^{\infty} \mu$. Con $M$, el conjunto de puntos donde $\mu$ alcanza su máximo: primer máximo $\min M$, último máximo $\max M$, y media de máximos, el valor medio de $M$.`, lee: 'En la tabla de abajo verás qué gana y qué pierde cada una.' },
    { tipo: 'ejemplo', etiqueta: 'Comparación', texto: 'Qué mirar al elegir:', tabla: [['Método', 'Usa', '¿Da saltos?', 'Coste'], ['Centroide', 'toda la figura', 'no', 'alto'], ['Bisector', 'toda la figura', 'no', 'alto'], ['Media de máximos', 'solo lo más alto', 'sí', 'bajo'], ['Primer / último', 'solo lo más alto', 'sí', 'bajo']], cierre: 'En control se prefiere el centroide: una orden que salta de golpe puede dañar un motor. Eso sí, solo es suave mientras haya alguna regla encendida: si se apagan todas, ni el centroide te salva. En decisiones (elegir una opción) se usan los de máximos.' },
    { tipo: 'demo', titulo: 'Una figura simétrica se apoya en su eje', plan: 'Intuitivamente obvio: una figura simétrica se sostiene en su centro. Se demuestra midiendo todo desde el eje: lo de un lado cancela a lo del otro.', tex: R`Si $\mu(c + t) = \mu(c - t)$ para todo $t$, y la figura no está vacía, entonces $\hat{z} = c$.`, pasos: [
      { texto: R`Basta probar que $\int (z - c)\, \mu(z)\, dz = 0$.`, porque: 'Esa igualdad, al separar la resta, dice $\\int z\\mu = c \\int \\mu$. Dividiendo, sale $\\hat{z} = c$.' },
      { texto: R`Con $z = c + t$: la integral pasa a $\int t\, \mu(c + t)\, dt$.`, porque: 'Solo es medir la distancia desde el eje: $t = z - c$.' },
      { texto: R`El integrando en $t$ y en $-t$ vale $t\, \mu(c + t)$ y $-t\, \mu(c - t) = -t\, \mu(c + t)$: se cancelan por parejas.`, porque: 'La simetría dice que los dos grados son iguales. Por tanto, la integral total es 0.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Mide desde el centro', texto: 'Cuando hay simetría, elige el origen en el eje. Lo que antes era una cuenta se convierte en una cancelación.' },
    { titulo: 'Comprueba la suavidad', texto: 'Un método puede ser correcto en cada punto y aun así dar saltos. Prueba siempre moviendo poco la entrada.' },
  ],
  retos: [
    { id: 'separa-metodos', tipo: 'manipular', enunciado: R`Ajusta las fuerzas hasta que el centroide y la media de máximos se separen más de $2{,}05$.`, precision: (e) => (separacion(e.a, e.b) > 2.05 ? 1 : 0), prueba: { a: 0.85, b: 0.8 }, pendiente: (e) => `Ahora se separan ${separacion(e.a, e.b).toFixed(2).replace('.', ',')}.`, pistas: ['La media de máximos solo mira lo más alto. Dale mucho peso a la otra regla, sin que llegue a ser la más alta.'], explicacion: 'La media de máximos ignora por completo la regla un poco más baja. El centroide la tiene en cuenta.' },
    { id: 'centroide-calc', tipo: 'calcular', enunciado: R`Tres valores: $z = 0$ con grado $0{,}5$; $z = 4$ con grado $1$; $z = 10$ con grado $0{,}5$. ¿Cuál es su centroide?`, respuesta: 4.5, tol: 0.001, pistas: [R`Numerador: $0 + 4 + 5$. Denominador: $0{,}5 + 1 + 0{,}5$.`], explicacion: R`$\frac{9}{2} = 4{,}5$.` },
    { id: 'metodo-elegir', tipo: 'elegir', enunciado: '¿Por qué un controlador de motor prefiere el centroide a la media de máximos?', opciones: ['Porque es más rápido de calcular', 'Porque cambia suavemente, sin saltos, al cambiar la entrada', 'Porque siempre da el número mayor', 'Porque no necesita reglas'], correcta: 1, explicacion: 'En cambio, es más caro de calcular: ese es su precio.' },
    { id: 'demuestra-simetrica', tipo: 'demostrar', enunciado: R`Demuestra que el centroide no cambia si se multiplica toda la figura por una constante $k > 0$.`, pistas: ['Sustituye $\\mu$ por $k\\mu$ en la fórmula.'],
      solucion: [
        { texto: R`$\dfrac{\int z\, k\mu(z)\, dz}{\int k\mu(z)\, dz} = \dfrac{k \int z\, \mu(z)\, dz}{k \int \mu(z)\, dz}$.`, porque: 'Una constante sale fuera de la integral.' },
        { texto: R`Las $k$ se cancelan, y queda el centroide original.`, porque: 'Como $k > 0$, se puede dividir. Importa la forma de la figura, no su altura total.' },
      ] },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 11.4.2.', 'T. A. Runkler, «Selection of appropriate defuzzification methods using application specific properties», <em>IEEE Trans. Fuzzy Systems</em> 5 (1997).'],
};
