import { BLANCO, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { NORMAS, gradNorma } from '../../nucleo/ia.js';
import { curva, mapaCalor, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { coma, flecha } from './comun.js';

const R = String.raw;
const U = [0, 1], LISTA = [['minimo', 'Mínimo (Gödel)'], ['lukasiewicz', 'Łukasiewicz'], ['producto', 'Producto']], X = [60, 400, 740], LADO = 300;
/** Sube la verdad de «a y b» siguiendo el gradiente, como haría una red. */
export function ascenso(n, a0, b0, pasos = 60, eta = 0.04) {
  const C = [[a0, b0]];
  let a = a0, b = b0;
  for (let i = 0; i < pasos; i++) { const [da, db] = gradNorma(n, a, b); a = Math.min(1, a + eta * da); b = Math.min(1, b + eta * db); C.push([a, b]); }
  return C;
}

export default {
  id: '9-3-gradientes',
  titulo: 'Operadores que dejan pasar el gradiente',
  puente: 'El «y» es el fácil. La implicación es la pieza más delicada de la región 5, y al derivarla aparece un desequilibrio que nadie había previsto.',
  pregunta: 'Elegiste un «y» en la región 3 por cómo se comportaba. Para entrenar una red, importa otra cosa: ¿le dice a la red qué debe corregir? Algunos operadores se quedan callados.',
  escena: {
    id: 'gradientes', formato: 'plano', W: 1100, H: 560,
    ejes: { x: U, y: U, caja: { x: X[0], y: 90, w: LADO, h: LADO } },
    entradas: [
      { id: 'a', tipo: 'deslizador', etiqueta: 'la verdad de a', min: 0.02, max: 0.98, paso: 0.01, valor: 0.3 },
      { id: 'b', tipo: 'deslizador', etiqueta: 'la verdad de b', min: 0.02, max: 0.98, paso: 0.01, valor: 0.4 },
    ],
    pasos: [
      { dur: 2800, texto: 'Tres «y», vistos desde arriba. El punto blanco es lo que dice ahora mismo una red: $a$ y $b$. Quiere que «a y b» sea cierto. ¿Hacia dónde debe moverse?' },
      { dur: 3200, texto: 'La flecha es el <b style="color:#f4d345;font-weight:400">gradiente</b>: hacia dónde sube más rápido. En el <b>mínimo</b> solo apunta a una dirección: solo corrige el más bajo. El otro no recibe ninguna señal.' },
      { dur: 3200, texto: 'En <b>Łukasiewicz</b>, en toda esta zona, <b style="color:#f05a5a;font-weight:400">no hay flecha</b>: la derivada es 0. La red está equivocada y nadie se lo dice. Esto pasa en la mitad del cuadrado.' },
      { dur: 3400, texto: 'En el <b>producto</b>, la flecha tiene las dos componentes. Sigue cada uno: el mínimo avanza en escalera, Łukasiewicz ni se mueve, y el producto sube suave.' },
    ],
    primitivas({ q, e }) {
      const al = ev(q(0), 0, 0.4), fl = ev(q(1), 0, 0.5), paneles = [];
      LISTA.forEach(([n, nombre], i) => {
        const M = [mapaCalor(NORMAS[n], { clave: `g${n}` }), marco({ x: U, y: U }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'a', y: 'b' } }), rotulo([0.5, 1], R`\text{${nombre}}`, { clave: `t${i}`, dy: -20, tam: 20, alfa: al })];
        const vis = i === 0 ? fl : i === 1 ? ev(q(2), 0, 0.5) : ev(q(3), 0, 0.3), [da, db] = gradNorma(n, e.a, e.b), norma = Math.hypot(da, db);
        M.push(punto([e.a, e.b], { color: BLANCO, radio: 7, alfa: al }));
        if (vis > 0) {
          if (norma > 1e-9) M.push(...flecha([e.a, e.b], [da * 0.2, db * 0.2], { color: ORO, alfa: vis, ancho: 3 }));
          else M.push(rotulo([e.a, e.b], R`\nabla = 0`, { clave: `z${i}`, dy: 22, tam: 19, color: ROJO, alfa: vis }));
          M.push(rotulo([0.5, 0], R`\nabla T = (${coma(da)};\ ${coma(db)})`, { clave: `g${i}`, dy: 42, tam: 18, color: GRIS2, alfa: vis }));
        }
        const tr = ev(q(3), 0.2, 0.9);
        if (tr > 0) {
          const C = ascenso(n, e.a, e.b), hasta = Math.max(1, Math.floor(tr * (C.length - 1)));
          if (hasta > 0 && n !== 'lukasiewicz') M.push(curva((u) => { const j = Math.min(C.length - 1, Math.round(u * hasta)); return C[j]; }, [0, 1], { n: hasta, color: ORO, ancho: 2.4 }));
        }
        paneles.push({ ejes: { x: U, y: U, caja: { x: X[i], y: 90, w: LADO, h: LADO } }, prims: M });
      });
      return { principal: [], paneles };
    },
  },
  manipulacion: '<ul><li>Mueve $a$ y $b$ hasta que $a + b$ pase de 1: Łukasiewicz despierta de golpe, con una flecha entera.</li><li>Cruza $a = b$ en el mínimo: la flecha salta de una dirección a la otra.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una red aprende con el [[gradiente]]: cada número se mueve según cuánto influye en el error. Si un operador tiene derivada 0, ese camino queda mudo: la red no recibe corrección. Por eso, para entrenar, un buen operador lógico no basta con que sea lógico: tiene que dejar pasar la señal. Van Krieken, Acar y Van Harmelen lo estudiaron en 2022, y encontraron que varios de los más conocidos encajan mal.' },
    { tipo: 'ejemplo', texto: 'Con $a = 0{,}3$ y $b = 0{,}4$:', tabla: [['«Y»', 'Valor', '∂/∂a', '∂/∂b', 'Lectura'], ['Mínimo', '0,3', '1', '0', 'solo corrige a a'], ['Łukasiewicz', '0', '0', '0', 'silencio total'], ['Producto', '0,12', '0,4', '0,3', 'corrige a los dos']], cierre: 'Fíjate en el producto: la derivada respecto a $a$ es $b$. Empuja a $a$ en proporción a lo que vale el otro.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\frac{\partial T}{\partial a}`, dice: 'Cuánto cambia el «y» si cambia un poco $a$, sin tocar $b$. Es una [[derivada]] parcial.' },
      { tex: R`\nabla T = \left(\frac{\partial T}{\partial a}, \frac{\partial T}{\partial b}\right)`, dice: 'El gradiente: las dos juntas. El triángulo se lee «nabla».' },
      { tex: R`\theta \leftarrow \theta + \eta\, \frac{\partial T}{\partial a}\frac{\partial a}{\partial \theta}`, dice: 'Cómo llega a los pesos $\\theta$ de la red: el operador multiplica. Si su derivada es 0, se anula toda la señal.' },
    ], todo: R`\frac{\partial}{\partial a}\min(a, b) = \begin{cases} 1 & a < b \\ 0 & a > b \end{cases}`, lee: 'Solo una entrada recibe señal. Se dice que el mínimo es «de paso único» (single-passing).' },
    { tipo: 'formal', titulo: 'Las derivadas', tex: R`$\nabla T_{\min} = (1, 0)$ si $a < b$, y $(0, 1)$ si $a > b$. $\ \nabla T_{\text{Ł}} = (1, 1)$ si $a + b > 1$, y $(0, 0)$ si $a + b < 1$. $\ \nabla T_{\text{P}} = (b, a)$.`, lee: 'El producto solo se apaga si las dos entradas valen 0. Los tres no son derivables en sus líneas de cambio: en la práctica, se elige uno de los dos lados.' },
    { tipo: 'demo', titulo: 'Una conjunción larga con el mínimo', plan: 'Es lo que hace inservible al mínimo en reglas grandes: de $n$ condiciones, solo una aprende en cada paso.', tex: R`En $\min(a_1, \dots, a_n)$, con un único mínimo $a_k$, solo $\frac{\partial}{\partial a_k}$ es distinta de 0.`, pasos: [
      { texto: R`Sea $a_k$ el único mínimo. Para valores cercanos, la función vale $a_k$.`, porque: 'Un cambio pequeño en otra entrada no le quita ser mayor que $a_k$.' },
      { texto: R`Por tanto, $\frac{\partial}{\partial a_j} = 0$ si $j \neq k$, y $\frac{\partial}{\partial a_k} = 1$.`, porque: 'La función, en esa zona, es $a_k$ y nada más.' },
      { texto: 'De $n$ entradas, $n - 1$ no reciben ninguna señal.', porque: 'En cambio, con el producto todas reciben: $\\frac{\\partial}{\\partial a_j} \\prod_i a_i = \\prod_{i \\neq j} a_i$.' },
    ] },
    { tipo: 'nota', titulo: 'El producto tampoco es perfecto', texto: 'Con muchas condiciones, $\\prod_{i \\neq j} a_i$ se vuelve diminuto: el gradiente se desvanece. Por eso se trabaja en logaritmos, donde $\\frac{\\partial}{\\partial a_i} \\sum \\ln a_i = \\frac{1}{a_i}$. El artículo recomienda ese log-producto para agregar muchos ejemplos.' },
  ],
  tecnicas: [{ titulo: 'Mira la señal, no solo el valor', texto: 'Dos operadores pueden dar valores parecidos y entrenar de forma opuesta. Antes de elegir uno para aprender, deriva.' }],
  retos: [
    { id: 'zona-muda', tipo: 'manipular', enunciado: 'Lleva el punto a un sitio donde Łukasiewicz siga mudo, aunque tanto $a$ como $b$ valgan al menos 0,45.', precision: (e) => (e.a >= 0.45 && e.b >= 0.45 && e.a + e.b < 1 ? 1 : 0), prueba: { a: 0.47, b: 0.48 }, pistas: ['Mudo significa $a + b \\le 1$.'], explicacion: 'Dos verdades a medias, y no recibe ninguna señal: muy peligroso al empezar a entrenar.' },
    { id: 'producto-calc', tipo: 'calcular', enunciado: R`Con el producto de tres condiciones, $a_1 a_2 a_3$, y valores $0{,}5;\ 0{,}2;\ 0{,}4$: ¿cuánto vale $\frac{\partial}{\partial a_1}$?`, respuesta: 0.08, tol: 0.001, pistas: ['Es el producto de las otras dos.'], explicacion: R`$0{,}2 \cdot 0{,}4 = 0{,}08$.` },
    { id: 'gradiente-elegir', tipo: 'elegir', enunciado: 'Si una red usa el «y» de Łukasiewicz al empezar, con salidas pequeñas, ¿qué pasa?', opciones: ['Aprende más rápido', 'La derivada es 0, y no aprende de esa regla', 'Solo corrige la mayor', 'Oscila'], correcta: 1, explicacion: 'Se anula en la mitad del cuadrado, justo donde suele empezar una red sin entrenar.' },
    { id: 'demuestra-producto-grad', tipo: 'demostrar', enunciado: R`Demuestra que, en el producto, una entrada recibe más señal cuanto mayores son las demás.`, pistas: ['Escribe la derivada respecto a $a_j$.'],
      solucion: [
        { texto: R`$\frac{\partial}{\partial a_j} \prod_i a_i = \prod_{i \neq j} a_i$.`, porque: 'Las demás son constantes.' },
        { texto: R`Es creciente en cada $a_i$, $i \neq j$, para valores no negativos.`, porque: 'Subir un factor no negativo no baja el producto. Por eso se corrige antes lo que está a punto de bastar.' },
      ] },
  ],
  referencias: ['E. van Krieken, E. Acar, F. van Harmelen, «Analyzing differentiable fuzzy logic operators», <em>Artificial Intelligence</em> 302 (2022).', 'S. Badreddine et al., «Logic Tensor Networks», <em>Artificial Intelligence</em> 303 (2022).'],
};
