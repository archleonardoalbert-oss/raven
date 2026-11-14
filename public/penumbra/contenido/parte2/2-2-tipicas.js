import { GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { campana, gaussiana, sigmoide, trapecial, triangular } from '../../nucleo/difuso.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v, d = 1) => v.toFixed(d).replace('.', '{,}');
const DOM = [0, 10];
const NOMBRES = ['triangular', 'trapecial', 'gaussiana', 'campana', 'sigmoidal'];
const TEX = [
  R`\max\!\left(\min\!\left(\tfrac{x - a}{b - a},\ \tfrac{c - x}{c - b}\right),\ 0\right)`,
  R`\max\!\left(\min\!\left(\tfrac{x - a}{b - a},\ 1,\ \tfrac{d - x}{d - c}\right),\ 0\right)`,
  R`e^{-\frac{(x - c)^2}{2\sigma^2}}`,
  R`\dfrac{1}{1 + \left|\frac{x - c}{a}\right|^{2b}}`,
  R`\dfrac{1}{1 + e^{-a(x - c)}}`,
];
const forma = (k, c, s) => [
  triangular(c - s, c, c + s), trapecial(c - s, c - s * 0.45, c + s * 0.45, c + s),
  gaussiana(c, s * 0.5), campana(c, s * 0.6, 2.5), sigmoide(c, s * 0.25),
][k];
const puntas = (k, c, s) => (k === 0 ? [c - s, c, c + s] : k === 1 ? [c - s, c - s * 0.45, c + s * 0.45, c + s] : []);

export default {
  id: '2-2-tipicas',
  titulo: 'Las cinco formas de siempre',
  puente: 'Ya tienes las formas. Queda la pregunta incómoda: ¿de dónde salen los números? ¿Quién decide que 1,74 m tiene grado 0,23?',
  pregunta: 'Si puedes elegir cualquier curva, ¿por qué casi todo el mundo usa las mismas cinco? ¿Qué tiene cada una que no tienen las otras?',
  escena: {
    id: 'tipicas', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: [0, 1], caja: { x: 110, y: 90, w: 860, h: 370 } },
    entradas: [
      { id: 'forma', tipo: 'deslizador', etiqueta: 'forma (0 a 4)', min: 0, max: 4, paso: 1, valor: 4 },
      { id: 'c', tipo: 'deslizador', etiqueta: 'centro', min: 1, max: 9, paso: 0.1, valor: 5 },
      { id: 's', tipo: 'deslizador', etiqueta: 'anchura', min: 1, max: 4, paso: 0.1, valor: 3 },
    ],
    pasos: [
      { dur: 2000, texto: 'La <b style="color:#f4d345;font-weight:400">triangular</b>: tres rectas y un pico. Es la más simple. Pero mira sus puntas, en rojo: ahí la curva da un giro brusco.' },
      { dur: 2200, texto: 'La <b style="color:#f4d345;font-weight:400">trapecial</b> tiene una meseta: un rango entero con grado 1. Sirve para «entre 20 y 25 grados, perfecto».' },
      { dur: 2400, texto: 'La <b style="color:#f4d345;font-weight:400">gaussiana</b> no tiene puntas. Dos botones: dónde está el centro y cuán ancha es.' },
      { dur: 2200, texto: 'La <b style="color:#f4d345;font-weight:400">campana</b> se parece, pero con un botón más, que decide cuán plana es la cima y cuán rápido cae.' },
      { dur: 2400, texto: 'La <b style="color:#f4d345;font-weight:400">sigmoidal</b> no vuelve a bajar. Es la forma natural de «alto» o «caliente»: a partir de cierto punto, lo es del todo.' },
    ],
    primitivas({ q, paso, e }) {
      const previa = Math.max(0, paso - 1), m = ev(q(paso), 0, 0.8), c = e.c, s = e.s;
      const k = paso === 4 ? Math.round(e.forma) : paso, f0 = forma(previa, c, s), f1 = forma(k, c, s);
      const enReposo = q(4) >= 1;
      const fin = enReposo ? forma(Math.round(e.forma), c, s) : f1, kFin = enReposo ? Math.round(e.forma) : paso;
      const f = (x) => (paso === 0 || enReposo ? fin(x) : mix(f0(x), f1(x), m));
      const al = ev(q(0), 0, 0.4), N = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 5, 10], y: [0, 1] }, etiquetas: { x: 'x', y: R`\mu` }, colorY: ORO })];
      N.push(curva((x) => [x, f(x)], DOM, { hasta: paso === 0 ? Math.max(ev(q(0), 0, 1), 1e-3) : 1, n: 400, color: ORO, ancho: 3.4, brillo: true }));
      N.push(linea([c, 0], [c, f(c)], { color: GRIS2, ancho: 1, alfa: 0.6 * al, discontinua: true }), rotulo([c, 0], 'c', { clave: 'c', dy: 30, tam: 17, color: GRIS2, alfa: al }));
      const ap = ev(q(paso), 0.75, 1);
      for (const [i, x] of puntas(kFin, c, s).entries()) if (x >= 0 && x <= 10) N.push(punto([x, f(x)], { color: ROJO, radio: 6.5, alfa: paso === 0 ? ev(q(0), 0.8, 1) : ap, halo: 10 }), rotulo([x, f(x)], '', { clave: `p${i}` }));
      N.push(rotulo([5, 1.14], R`\text{${NOMBRES[kFin]}:}\quad ${TEX[kFin]}`, { clave: 'nombre', tam: 26, alfa: Math.max(al, ap) }));
      return N;
    },
  },
  manipulacion: '<ul><li>Cambia «forma» de 0 a 4 y compara: 0 triangular, 1 trapecial, 2 gaussiana, 3 campana, 4 sigmoidal.</li><li>Mueve el centro y la anchura: son los mismos botones en todas.</li><li>Busca los puntos rojos: solo las dos primeras los tienen.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'Por qué tan pocas', texto: 'Ninguna ley obliga a usarlas. Son costumbre, y la costumbre tiene motivos: tienen pocos botones, se calculan rápido, y cada una expresa una idea distinta.' },
    { tipo: 'ejemplo', texto: 'Qué decir con cada una:', tabla: [['Forma', 'Frase que modela'], ['Triangular', '«alrededor de 25»'], ['Trapecial', '«entre 20 y 25, perfecto»'], ['Gaussiana', '«cerca de 25», con suavidad'], ['Campana', '«cerca de 25», ajustando la meseta'], ['Sigmoidal', '«más de 25»']] },
    { tipo: 'simbolos', intro: 'La gaussiana parece temible, y solo tiene dos ideas.', piezas: [
      { tex: R`x - c`, dice: 'Cuánto te alejas del centro $c$.' },
      { tex: R`(x - c)^2`, dice: 'Al cuadrado: da igual hacia qué lado te alejes, y cuanto más lejos, peor.' },
      { tex: R`\sigma`, dice: '«Sigma», la anchura. Cuanto mayor, más lenta es la caída.' },
      { tex: R`e^{-\ \cdots}`, dice: 'El número $e \\approx 2{,}718$ elevado a algo negativo: cuanto más negativo, más cerca de 0. Con exponente 0, da 1.' },
    ], todo: R`\mu(x) = e^{-\frac{(x - c)^2}{2\sigma^2}}`, lee: '«En el centro vale 1, y cae con suavidad según te alejas». Con $c = 5$, $\\sigma = 2$: $\\mu(7) = e^{-\\frac{4}{8}} = e^{-0{,}5} \\approx 0{,}61$.' },
    { tipo: 'simbolos', intro: 'La campana cambia la forma de caer.', piezas: [
      { tex: R`\left|\frac{x - c}{a}\right|`, dice: 'La distancia al centro, con $|\\cdot|$ el [[valor absoluto]], medida en unidades de $a$. Vale 1 justo a distancia $a$.' },
      { tex: R`\left|\cdots\right|^{2b}`, dice: 'Elevado a $2b$. Con $b$ grande, lo menor que 1 casi desaparece y lo mayor que 1 explota: la meseta se aplana y la caída se acorta.' },
      { tex: R`\dfrac{1}{1 + \cdots}`, dice: 'Con 0 abajo da 1; con algo enorme, casi 0.' },
    ], todo: R`\mu(x) = \dfrac{1}{1 + \left|\frac{x - c}{a}\right|^{2b}}`, lee: 'Siempre vale exactamente $\\frac{1}{2}$ a distancia $a$ del centro, sea cual sea $b$. Por eso $a$ es la media anchura.' },
    { tipo: 'formal', titulo: 'Las cinco', tex: R`Triangular $(a, b, c)$ y trapecial $(a, b, c, d)$, con rectas.<br>Gaussiana $(c, \sigma)$: $e^{-\frac{(x - c)^2}{2\sigma^2}}$.<br>Campana $(a, b, c)$: $\frac{1}{1 + |\frac{x - c}{a}|^{2b}}$.<br>Sigmoidal $(a, c)$: $\frac{1}{1 + e^{-a(x - c)}}$; si $a > 0$ sube, y si $a < 0$ baja.`, lee: 'Atención: la letra $a$ significa cosas distintas en cada una. Mira siempre su lista de parámetros.' },
    { tipo: 'idea', etiqueta: 'Puntas', texto: 'Hay una razón práctica para preferir las suaves. Las rectas se calculan muy rápido, pero tienen puntas. Una curva sin puntas se llama [[derivable]], y es lo que necesitan los sistemas que aprenden solos, en la región 7.' },
    { tipo: 'demo', titulo: 'La campana vale 1 entre 2 a distancia a', plan: 'Una cuenta corta, para ver cómo se usa una fórmula sin miedo.', tex: R`Si $|x - c| = a$, entonces $\mu(x) = \frac{1}{2}$, para todo $b > 0$.`, pasos: [
      { texto: R`$\left|\frac{x - c}{a}\right| = \frac{|x - c|}{a} = \frac{a}{a} = 1$.`, porque: 'La hipótesis es $|x - c| = a$, con $a > 0$.' },
      { texto: R`$1^{2b} = 1$ para todo $b$. Entonces $\mu(x) = \frac{1}{1 + 1} = \frac{1}{2}$.`, porque: 'Uno elevado a cualquier número sigue siendo 1. Por eso $b$ no influye en este punto.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Evalúa en los puntos especiales', texto: 'Para entender una fórmula con parámetros, pruébala en el centro, a distancia uno y muy lejos. Con eso ya se ve su forma.' },
    { titulo: 'Elige por la frase', texto: 'Primero di con palabras lo que quieres modelar. La frase suele señalar la forma: «más de» pide sigmoidal; «entre», trapecial.' },
  ],
  retos: [
    { id: 'elige-forma', tipo: 'manipular', enunciado: R`Modela «más de 6»: elige la forma adecuada y pon su centro en 6, con error menor que $0{,}25$.`,
      precision: (e) => (Math.round(e.forma) === 4 && Math.abs(e.c - 6) < 0.25 ? 1 : 0),
      pendiente: (e) => (Math.round(e.forma) === 4 ? 'La forma es esa. Ajusta el centro.' : '¿Qué forma no vuelve a bajar?'),
      prueba: { forma: 4, c: 6 }, pistas: ['«Más de» no vuelve a bajar.'], explicacion: 'La sigmoidal: a partir de cierto punto, lo es del todo.' },
    { id: 'calcula-gaussiana', tipo: 'calcular', enunciado: R`Gaussiana con $c = 10$, $\sigma = 2$. ¿Cuánto vale $\mu(12)$? Usa $e^{-0{,}5} \approx 0{,}61$.`, respuesta: 0.61, tol: 0.006, pistas: [R`$(x - c)^2 = 4$ y $2\sigma^2 = 8$.`], explicacion: R`$e^{-\frac{4}{8}} = e^{-0{,}5} \approx 0{,}61$: a una anchura del centro, siempre vale eso.` },
    { id: 'sin-puntas', tipo: 'elegir', enunciado: '¿Cuál de estas formas tiene puntas, y por tanto no es derivable en todos sus puntos?', opciones: ['Gaussiana', 'Campana', 'Trapecial', 'Sigmoidal'], correcta: 2, explicacion: 'La trapecial cambia de inclinación de golpe en sus cuatro esquinas.' },
  ],
  referencias: ['J.-S. R. Jang, C.-T. Sun, E. Mizutani, <em>Neuro-Fuzzy and Soft Computing</em>, cap. 2.', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001.'],
};
