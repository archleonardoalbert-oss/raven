import { AZUL, BLANCO, ORO, ROSA, GRIS2 } from '../../motor/colores.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const NUBE = { x: 340, y: 310, r: 170 };
const mb = (p, k) => 1 / (1 + (((p[0] - NUBE.x) ** 2 + (p[1] - NUBE.y) ** 2) / (NUBE.r * NUBE.r)) ** k);

export default {
  id: '1-3-conjunto-difuso',
  titulo: 'Qué es un conjunto difuso',
  puente: 'Ya sabes qué es. ¿Sirve para algo fuera de la pizarra? Vamos a ver dónde se usa de verdad.',
  pregunta: 'Si un conjunto puede tener bordes borrosos, ¿qué es exactamente un conjunto? Y lo que escribimos: ¿cómo se escribe «un poco dentro»?',
  escena: {
    id: 'conjunto-difuso', formato: 'niebla', W: 1100, H: 600,
    entradas: [
      { id: 'sonda', tipo: 'arrastre', valor: [420, 310], region: { x: [20, 680], y: [40, 580] } },
      { id: 'f', tipo: 'expresion', etiqueta: 'μ(x) =', vars: ['x'], valor: 'x / 10', dominio: [0, 10] },
    ],
    pasos: [
      { dur: 2000, texto: 'Un conjunto clásico es una región con borde. Cada punto está dentro o fuera, sin matices.' },
      { dur: 3000, texto: 'Ahora el borde se vuelve niebla. Cada punto tiene una densidad entre 0 y 1: eso es su grado de pertenencia. Las líneas marcan los grados 0,25, 0,5 y 0,75.' },
      { dur: 1800, texto: 'Con esto basta para definirlo: un conjunto difuso <em>es</em> la función que da a cada punto su grado. Mueve la sonda y léelo.' },
      { dur: 2000, texto: 'La misma idea en una dimensión es una curva. «Cerca de 5» es una forma de decir qué grado le toca a cada número. Enseguida escribirás tu propia función.' },
    ],
    primitivas({ q, paso, e }) {
      const bl = ev(q(1), 0, 0.85), k = mix(60, 1.45, bl), ent = ev(q(0), 0, 0.5);
      const P = [rotulo([NUBE.x - 55, NUBE.y], 'A', { clave: 'A', tam: 46, alfa: ent })];
      const sv = ev(q(2), 0, 0.5);
      if (sv > 0 || paso >= 0) {
        const s = paso >= 2 ? e.sonda : [mix(90, 420, ev(q(0), 0.3, 1)), 310], v = mb(s, k), a = ev(q(0), 0.25, 0.5);
        P.push(punto(s, { color: BLANCO, radio: 5, alfa: a }));
        P.push(rotulo(s, R`\mu_A = ${coma(v)}`, { clave: 'mu', dx: 16, dy: -20, ancla: 'l', tam: 22, color: BLANCO, alfa: a }));
      }
      const pa = ev(q(3), 0, 0.5), G = [];
      if (pa > 0) {
        G.push(marco({ x: [0, 10], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 5, 10], y: [0, 1] }, etiquetas: { y: R`\mu`, x: 'x' }, colorY: ORO }));
        G.push(curva((x) => [x, e.f(x)], [0, 10], { hasta: Math.max(ev(q(3), 0.2, 1), 1e-3), n: 200, color: ORO, ancho: 3.2, brillo: true }));
        for (const [x, c] of [[4, ROSA], [5, ROSA], [8, ROSA]]) G.push(punto([x, e.f(x)], { color: c, radio: 5, alfa: pa }), linea([x, e.f(x)], [x, 0], { color: GRIS2, ancho: 1, alfa: 0.5 * pa, discontinua: true }));
        G.push(rotulo([0, 1], R`\mu(x) = ${e.f_tex ?? ''}`, { clave: 'exp', dx: 8, dy: -22, ancla: 'l', tam: 17, color: AZUL, alfa: pa }));
      }
      return {
        niebla: { nubes: [{ ...NUBE, color: AZUL }], k, operacion: 'ambos', previa: 'ambos', mezcla: 1, entrada: ent },
        principal: P,
        paneles: [{ ejes: { x: [0, 10], y: [0, 1], caja: { x: 720, y: 130, w: 330, h: 300 } }, prims: G }],
      };
    },
  },
  manipulacion: `<ul>
    <li>Arrastra la sonda blanca por la niebla: el grado cambia sin saltos.</li>
    <li>Escribe funciones de <code>x</code>: <code>exp(-(x-5)^2)</code>, <code>1/(1+(x-5)^2)</code>… Si tu expresión se sale de [0, 1], se recorta y se avisa.</li></ul>`,
  entender: [
    { tipo: 'idea', etiqueta: 'Aviso', texto: 'Antes de nada, una aclaración que hace el propio Zimmermann en su libro: aquí lo difuso es el objeto, no las matemáticas. La teoría de conjuntos difusos es tan exacta como cualquier otra.' },
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una agencia quiere describir qué casa es «cómoda para una familia de cuatro». Solo mira cuántos dormitorios tiene. Con cuatro dormitorios, perfecta. Con uno, poco cómoda. Con diez, ni siquiera entra: sobra casa.' },
    { tipo: 'ejemplo', texto: 'Podría dar estos grados:', tabla: [['Dormitorios', '1', '2', '3', '4', '5', '6'], ['Grado', '0,2', '0,5', '0,8', '1', '0,7', '0,3']], cierre: 'Y a las de 7 o más dormitorios, grado 0: normalmente ni se escriben. Esa tabla <em>es</em> el conjunto difuso. No hay nada más.' },
    { tipo: 'idea', etiqueta: 'Sin borde', texto: 'Fíjate en la niebla de la escena: es lo mismo en el plano. A cada punto, un número. Un conjunto difuso no es una forma con bordes borrosos: es la regla que reparte grados.' },
    { tipo: 'simbolos', intro: 'Como se escribe, pieza a pieza.', piezas: [
      { tex: R`X`, dice: 'El [[universo]]: de todo aquello de lo que hablamos. Aquí, los números de dormitorios del 1 al 10.' },
      { tex: R`A`, dice: 'El nombre del conjunto: «casa cómoda».' },
      { tex: R`\mu_A(x)`, dice: 'El [[grado]] de $x$ en $A$. Por ejemplo, $\\mu_A(3) = 0{,}8$.' },
      { tex: R`(x,\ \mu_A(x))`, dice: 'Una pareja: la cosa y su grado. Por ejemplo, $(3,\ 0{,}8)$.' },
      { tex: R`\{\ \dots : x \in X\}`, dice: 'El grupo de esas parejas, una para cada cosa del universo. Los dos puntos se leen «para».' },
    ], todo: R`A = \{(x,\ \mu_A(x)) : x \in X\}`, lee: '«$A$ es la lista de parejas: cada cosa con su grado». Es la tabla de arriba, en una línea.' },
    { tipo: 'formal', titulo: 'Conjunto difuso', tex: R`Dado un universo $X$, un conjunto difuso $A$ queda dado por su función de pertenencia $\mu_A : X \to [0, 1]$. Dos conjuntos son iguales si y solo si $\mu_A(x) = \mu_B(x)$ para todo $x \in X$.`, lee: 'La [[función|funcion]] es todo el conjunto: para ver que dos son iguales, se compara punto a punto.' },
    { tipo: 'nota', titulo: 'Casos que ya conoces', texto: R`El conjunto <em>vacío</em> da grado 0 a todo. El <em>universal</em> da grado 1 a todo. Y un conjunto [[clásico|clasico]] es un difuso que solo usa 0 y 1: lo de siempre es un caso particular.` },
    { tipo: 'nota', titulo: 'Tres formas de escribir lo mismo', texto: R`Verás los conjuntos como lista de parejas, como una fórmula (por ejemplo, «números cerca de 10» es $\mu(x) = \frac{1}{1 + (x - 10)^2}$) o con una notación de Zadeh que parece una suma de fracciones. Ojo con esta última: ni la raya divide ni la suma suma. Solo enumera parejas.` },
  ],
  tecnicas: [
    { titulo: 'Un conjunto difuso es su función', texto: 'Para demostrar que dos conjuntos difusos coinciden, demuestra que sus funciones coinciden en cada punto. Este es el patrón de casi toda demostración del tema.' },
    { titulo: 'Comprueba el caso clásico', texto: 'Toda definición nueva debe devolver la clásica cuando los grados solo valen 0 y 1. Si no lo hace, desconfía.' },
  ],
  retos: [
    { id: 'cerca-de-5', tipo: 'manipular', enunciado: R`Escribe una $\mu$ para «cerca de 5» con $\mu(5) = 1$, con $\mu(4)$ entre $0{,}3$ y $0{,}8$, y con $\mu(8) \le 0{,}1$.`,
      precision: (e) => (e.f(5) > 0.99 ? [true, e.f(4) >= 0.3 && e.f(4) <= 0.8, e.f(8) <= 0.1001].filter(Boolean).length / 3 : 0),
      prueba: { f: '1 / (1 + (x - 5)^2)' }, pistas: [R`Una forma con su pico en 5 depende de $x - 5$ al cuadrado.`, R`Prueba con $1 \div (1 + (x - 5)^2)$, que en $x = 4$ da $0{,}5$.`],
      pendiente: (e) => `Te falta: ${[e.f(5) > 0.99 ? '' : 'μ(5) = 1', e.f(4) >= 0.3 && e.f(4) <= 0.8 ? '' : 'μ(4) entre 0,3 y 0,8', e.f(8) <= 0.1001 ? '' : 'μ(8) ≤ 0,1'].filter(Boolean).join(' · ')}.`,
      explicacion: 'Hay infinitas soluciones: modelar es elegir una.' },
    { id: 'discreto-a-tabla', tipo: 'calcular', enunciado: R`Sea $A = \{(1, 0{,}2),\ (2, 0{,}7),\ (3, 1)\}$. ¿Cuánto vale $\mu_A(3) - \mu_A(1)$?`, respuesta: 0.8, tol: 0.001,
      pistas: ['Cada par es (elemento, grado).'], explicacion: R`$1 - 0{,}2 = 0{,}8$.` },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., Kluwer, 2001, caps. 1–2.', 'L. A. Zadeh, «Fuzzy sets», <em>Information and Control</em> 8 (1965).', 'B. Kosko, «Fuzziness vs. probability», <em>International Journal of General Systems</em> 17 (1990).'],
};
