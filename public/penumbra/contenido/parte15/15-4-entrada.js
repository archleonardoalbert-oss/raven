import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { EJEMPLO, fuerzasDifusas, mamdaniDifuso, mamdaniEjemplo, poligono } from '../../nucleo/fuzzython.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { PREP_MAMDANI, codigo, coma, relleno, trazar } from '../parte14/comun.js';

const R = String.raw;
const D = [20, 40], T = EJEMPLO.temp, C = { normal: ORO, hot: ROSA, cold: AZUL };
const E = (e) => poligono([[33 - e.w, 0], [33, 1], [33 + e.w, 0]]);
const NR = (w) => mamdaniDifuso(poligono([[33 - w, 0], [33, 1], [33 + w, 0]]));
const altura = (A, F) => Math.max(...A.combinar(Math.min, F).puntos.map((p) => p[1]));
export default {
  id: '15-4-entrada',
  titulo: 'Entradas difusas',
  puente: 'Has completado las órbitas medias. Ahora, los tres motores completos, uno a uno, empezando por el que más se parece a un razonamiento.',
  pregunta: 'Un sensor nunca dice 33 grados exactos: dice «unos 33». En la región 5 viste cómo razonar con eso: la composición sup-min. Es una función que el README de fuzzython ni menciona, pero la tiene, y es exacta. ¿Cuánto cambia la respuesta?',
  escena: {
    id: 'entrada', formato: 'plano', W: 1100, H: 500,
    ejes: { x: D, y: [0, 1], caja: { x: 70, y: 60, w: 560, h: 370 } },
    entradas: [{ id: 'w', tipo: 'deslizador', etiqueta: 'la duda: cuántos grados, a cada lado', min: 0.25, max: 6, paso: 0.25, valor: 3 }],
    pasos: [
      { dur: 2800, texto: 'Las palabras, y en blanco, la entrada: «unos 33 grados». Ya no es una línea vertical: <b style="color:#f4d345;font-weight:400">es un conjunto</b>.' },
      { dur: 3000, texto: 'El grado de una palabra es la parte más alta de la intersección con la entrada. Ese es el <em>sup</em> del «sup-min». Mira los puntos.' },
      { dur: 3000, texto: 'Cuanta más duda, más alcanza a cada palabra. Los grados <b>suben</b>: con duda, se cumplen más cosas a la vez.' },
      { dur: 2800, texto: 'Y la respuesta cambia. A la derecha, los minutos según la duda. La línea gris es la entrada exacta, 33 grados: 24,14 minutos.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, F = E(e), N = [marco({ x: D, y: [0, 1] }, { alfa: al, ticks: { x: [20, 30, 40], y: [0, 1] }, etiquetas: { x: R`\text{grados}` } })];
      for (const k of ['normal', 'hot']) N.push(trazar(T[k], D, { color: C[k], alfa: al }));
      N.push(relleno(F, [33 - e.w, 33 + e.w], { color: BLANCO, alfa: 0.14 * al }), trazar(F, [Math.max(20, 33 - e.w), Math.min(40, 33 + e.w)], { color: BLANCO, alfa: al }));
      if (g1 > 0) for (const k of ['normal', 'hot']) { const I = T[k].combinar(Math.min, F), h = altura(T[k], F), p = I.puntos.find((u) => Math.abs(u[1] - h) < 1e-9); N.push(punto(p, { color: C[k], radio: 7, alfa: g1 }), rotulo(p, R`${coma(h)}`, { clave: 'h' + k, dy: -18, tam: 21, color: C[k], alfa: g1 })); }
      const G = [marco({ x: [0, 6], y: [20, 28] }, { alfa: g3, ticks: { x: [0, 3, 6], y: [20, 24, 28] }, etiquetas: { x: R`\text{duda}`, y: R`\text{minutos}` } })];
      if (g3 > 0) { const m = mamdaniEjemplo(33); G.push(curva((u) => [u, m], [0, 6], { n: 2, color: GRIS2, ancho: 1.4, alfa: g3 }), curva((u) => [u, NR(u)], [0.25, 6], { n: 80, color: ORO, ancho: 2.6, alfa: g3, tol: 1 }), punto([e.w, NR(e.w)], { color: ORO, radio: 6, alfa: g3 }), rotulo([6, 28], R`${coma(NR(e.w), 2)}\ \text{min}`, { clave: 'r', ancla: 'r', dy: -14, tam: 21, color: ORO, alfa: g3 })); }
      return { principal: N, paneles: [{ ejes: { x: [0, 6], y: [20, 28], caja: { x: 720, y: 90, w: 330, h: 340 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Aumenta la duda, y mira cómo suben los dos grados.</li><li>En la gráfica de la derecha, mira cómo cambia cada vez menos.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'En lugar de un número, se le pasa un conjunto a <code>compute</code>. fuzzython hace lo que dice la teoría: compara la entrada con cada palabra, y se queda con el punto en que mejor encajan. La regla no cambia nada: solo cambia su antecedente.' },
    codigo('En Python', 'Una línea de diferencia:', "from fsets.singleton import Singleton\nfrom fsets.triangular import Triangular\nfrom systems.mamdani import MamdaniSystem\n\nm = MamdaniSystem('m', b)\nprint(m.compute({'temp': 33}))\nprint(m.compute({'temp': Triangular((30, 0), (33, 1), (36, 0))}))\nprint(m.compute({'temp': Singleton(33, 0.5)}))", 'El último es otro uso: «33 grados, pero solo me lo creo en 0,5».', { prefacio: PREP_MAMDANI }),
    { tipo: 'ejemplo', texto: 'Los grados, con «unos 33» de 3 grados a cada lado:', tabla: [['Palabra', 'Entrada exacta', 'Entrada difusa'], ['normal', '0,4', '0,625'], ['hot', '0,6', '0,75'], ['cold', '0', '0']], cierre: 'Los dos suben. Por eso la salida se aplana hacia el medio, y no siempre en la dirección que esperarías.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\mu_E`, dice: 'La entrada, ahora un conjunto.' },
      { tex: R`\min(\mu_A(x), \mu_E(x))`, dice: 'Cuánto encajan $A$ y $E$ en el punto $x$.' },
      { tex: R`\sup_x`, dice: 'El [[supremo]]: el mejor encaje posible. Es un máximo que quizá no se alcance.' },
    ], todo: R`\text{grado}(A) = \sup_x \min(\mu_A(x), \mu_E(x))`, lee: '«El grado de $A$ es el mejor encaje entre $A$ y la entrada, en cualquier punto». Es la composición de la región 5.' },
    { tipo: 'formal', titulo: 'Entrada exacta como caso particular', tex: R`Si $E$ vale 1 en $x_0$ y 0 en el resto, $\sup_x \min(\mu_A(x), \mu_E(x)) = \mu_A(x_0)$.`, lee: 'Un número exacto es un conjunto muy estrecho. Por eso, al reducir la duda, la curva vuelve a 24,14.' },
    { tipo: 'demo', titulo: 'Más duda nunca baja el grado', plan: 'Se usa que, si el conjunto de entrada crece, crece la intersección.', tex: R`Si $\mu_E \le \mu_F$ en todos los puntos, entonces $\sup_x \min(\mu_A, \mu_E) \le \sup_x \min(\mu_A, \mu_F)$.`, pasos: [
      { texto: R`Para cada $x$: $\min(\mu_A(x), \mu_E(x)) \le \min(\mu_A(x), \mu_F(x))$.`, porque: 'El mínimo es monótono en cada argumento.' },
      { texto: R`El [[supremo]] de lo pequeño no supera al de lo grande.`, porque: 'Cualquier valor del lado izquierdo está por debajo de uno del derecho. Y los triángulos de la escena están encajados: más anchos, más altos en cada punto.' },
    ] },
    { tipo: 'nota', titulo: 'Dos avisos', texto: 'En Sugeno solo funciona en el antecedente: si la fórmula de salida usa esa variable, falla, porque no sabe convertir un conjunto en número. Y <code>ZFunction</code> y <code>Singleton</code> tienen mal <code>membership</code>: como antecedente, con entradas difusas, dan grados falsos.' },
  ],
  tecnicas: [{ titulo: 'Comprueba el caso límite', texto: 'Cuando generalices algo, reduce la novedad hasta llegar a lo que ya sabes. Una entrada difusa muy estrecha debe dar lo mismo que un número. Si no, algo está mal.' }],
  retos: [
    { id: 'duda-23', tipo: 'manipular', enunciado: R`Busca una duda que dé menos de $23{,}1$ minutos.`, precision: (e) => (NR(e.w) < 23.1 ? 1 : 0), prueba: { w: 5 }, pendiente: (e) => `Salen ${NR(e.w).toFixed(2).replace('.', ',')} minutos.`, pistas: ['Hay que dudar bastante más de 3 grados.'], explicacion: 'Con 5 grados, 23,07 minutos: más de un minuto de diferencia, solo por admitir la duda.' },
    { id: 'hot-calc', tipo: 'calcular', enunciado: R`Con «unos 33» y una duda de 3 grados, ¿cuál es el grado de «hot»? Busca dónde se cruzan $\frac{x - 30}{5}$ y $\frac{36 - x}{3}$.`, respuesta: 0.75, tol: 0.001, pistas: [R`$3 (x - 30) = 5 (36 - x)$, así que $x = 33{,}75$.`], explicacion: R`$\frac{3{,}75}{5} = 0{,}75$.` },
    { id: 'readme-elegir', tipo: 'elegir', enunciado: '¿Qué le pasas a <code>compute</code> para una entrada difusa?', opciones: ['Un número y un margen', 'El conjunto, en lugar del número', 'Una lista de números', 'No se puede'], correcta: 1, explicacion: '<code>compute({\'temp\': Triangular(...)})</code>. Eso es todo.' },
    { id: 'demuestra-singleton', tipo: 'demostrar', enunciado: R`Demuestra el caso exacto: si $\mu_E(x_0) = 1$ y $\mu_E(x) = 0$ en los demás puntos, el grado es $\mu_A(x_0)$.`, pistas: ['Separa $x_0$ del resto.'], solucion: [{ texto: R`Si $x \ne x_0$, $\min(\mu_A(x), 0) = 0$.`, porque: 'Fuera de $x_0$ no aporta nada.' }, { texto: R`En $x_0$: $\min(\mu_A(x_0), 1) = \mu_A(x_0) \ge 0$. Ese es el [[supremo]].`, porque: 'Es el mayor de todos los valores.' }] },
  ],
  referencias: ['L. A. Zadeh, «Outline of a new approach to the analysis of complex systems», <em>IEEE Trans. SMC</em> 3 (1973).', '<em>fuzzython</em>: predicate.py y adjective.py.'],
};
