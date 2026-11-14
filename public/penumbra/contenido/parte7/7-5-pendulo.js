import { BLANCO, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { ajustar, costePendulo } from '../../nucleo/diseno.js';
import { simular } from '../../nucleo/pendulo.js';
import { fuerzaPendulo } from '../../nucleo/sistemas.js';
import { curva, linea, mapaCalor, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v, d = 2) => v.toFixed(d).replace('.', '{,}');
const GRADOS = 180 / Math.PI, DF = [2, 30], DA = [0.05, 1], VUELTAS = 30;
const INICIO = { F: 4, atencion: 0.1 };
let hist = null;
const historia = () => (hist ??= ajustar(INICIO, VUELTAS));
let tabla = null;
/** El paisaje del coste, una vez: 25 × 25 simulaciones. */
function paisaje(F, a) {
  if (!tabla) { tabla = []; for (let j = 0; j <= 24; j++) for (let i = 0; i <= 24; i++) tabla.push(costePendulo({ F: 2 + (28 * i) / 24, atencion: 0.05 + (0.95 * j) / 24 })); }
  const v = tabla[Math.round(((a - 0.05) / 0.95) * 24) * 25 + Math.round(((F - 2) / 28) * 24)];
  return 1 - Math.min(1, Math.log10(1 + v * 30) / 2.2);
}
const memo = new Map();
const vuelo = (p) => { const k = `${p.F}|${p.atencion}`; if (!memo.has(k)) memo.set(k, simular({ theta: 15 / GRADOS, omega: 0, x: 0, v: 0 }, { T: 4, dt: 0.01, parar: true, fuerza: (s) => fuerzaPendulo(s.theta, s.omega, { anchoAngulo: 20, anchoVel: 2 / p.atencion, F: p.F }) })); return memo.get(k); };

export default {
  id: '7-5-pendulo',
  titulo: 'Tu péndulo se ajusta solo',
  puente: 'Tu péndulo ya está terminado: palabras, reglas, diseño y ajuste automático. Queda una última región, solo para quien quiera: la lógica difusa como lógica de verdad, con axiomas y demostraciones.',
  pregunta: 'Elegiste a mano la fuerza y la atención a la velocidad. ¿Y si le das unos números malos, le dices qué significa «ir bien», y dejas que los corrija solo?',
  escena: {
    id: 'ajuste', formato: 'plano', W: 1100, H: 600,
    ejes: { x: DF, y: DA, caja: { x: 120, y: 40, w: 480, h: 470 } },
    entradas: [{ id: 'vueltas', tipo: 'deslizador', etiqueta: 'vueltas del ajuste', min: 0, max: VUELTAS, paso: 1, valor: 0 }],
    pasos: [
      { dur: 3000, texto: 'Primero hay que decir qué significa «ir bien»: un <b>coste</b>, un solo número. Se suma lo lejos que queda el palo de la vertical, y caer sale muy caro. Cada punto del mapa es una elección; <b style="color:#f4d345;font-weight:400">más claro, mejor</b>.' },
      { dur: 2600, texto: 'Se empieza con unas piezas malas, en <b style="color:#f05a5a;font-weight:400">rojo</b>: poca fuerza, y casi sin mirar la velocidad. A la derecha, el palo <b style="color:#f05a5a;font-weight:400">se cae</b>.' },
      { dur: 3000, texto: 'No hay gradiente que seguir: caer es un salto. Así que se <b>tantea</b>: se prueba un poco más y un poco menos de cada cosa, y se va a la mejor. Si ninguna mejora, se acorta el paso.' },
      { dur: 4800, texto: 'Repite, sin que nadie le diga nada sobre péndulos. El camino dorado sube hasta la zona clara, y <b style="color:#f4d345;font-weight:400">el palo se sostiene</b>. Ahora rebobina tú.' },
    ],
    primitivas({ q, paso, e }) {
      const h = historia(), al = ev(q(0), 0, 0.5), ini = ev(q(1), 0, 0.4), tant = paso === 2 ? ev(q(2), 0, 0.3) : 0, t = paso < 3 ? 0 : Math.round(mix(mix(0, VUELTAS, ev(q(3), 0, 0.75)), e.vueltas, ev(q(3), 0.8, 1)));
      const a = h[t], tr = vuelo(a.p), cay = tr.length < 401;
      const P = [mapaCalor(paisaje, { clave: 'ajuste' }), marco({ x: DF, y: DA }, { alfa: al, ticks: { x: [2, 16, 30], y: [0.05, 1] } }), rotulo([16, 0.05], R`\text{fuerza máxima}`, { clave: 'ex', dy: 32, tam: 17, color: GRIS2, alfa: al }), rotulo([2, 0.5], R`\text{atención}`, { clave: 'ey', dx: -16, ancla: 'r', tam: 17, color: GRIS2, alfa: al })];
      if (ini > 0) P.push(punto([INICIO.F, INICIO.atencion], { color: ROJO, radio: 9, alfa: ini }));
      for (let j = 0; j < t; j++) if (h[j].p !== h[j + 1].p) P.push(punto([h[j].p.F, h[j].p.atencion], { color: ORO, radio: 3, halo: 0 }), punto([h[j + 1].p.F, h[j + 1].p.atencion], { color: ORO, radio: 3, halo: 0 }), linea([h[j].p.F, h[j].p.atencion], [h[j + 1].p.F, h[j + 1].p.atencion], { color: ORO, ancho: 2.4 }));
      if (tant > 0) for (const [dF, dA] of [[7, 0], [-2, 0], [0, 0.2375], [0, -0.05]]) { const q2 = [INICIO.F + dF, INICIO.atencion + dA]; P.push(punto(INICIO.F + dF >= 2 ? q2 : [2, INICIO.atencion], { color: BLANCO, radio: 5, alfa: tant }), punto([INICIO.F, INICIO.atencion], { color: ROJO, radio: 4, alfa: tant, halo: 0 }), linea([INICIO.F, INICIO.atencion], INICIO.F + dF >= 2 ? q2 : [2, INICIO.atencion], { color: BLANCO, ancho: 1.4, alfa: 0.8 * tant, discontinua: true })); }
      P.push(punto([a.p.F, a.p.atencion], { color: BLANCO, radio: 7, alfa: ini }));
      const G = [marco({ x: [0, 4], y: [-90, 90] }, { alfa: ini, ticks: { x: [0, 4], y: [-90, 0, 90] }, etiquetas: { x: R`\text{tiempo (s)}`, y: R`\theta` } }), linea([0, 0], [4, 0], { color: GRIS2, ancho: 1, alfa: 0.5 * ini, discontinua: true }), rotulo([2, 90], R`\text{Con estas piezas, el ángulo}`, { clave: 'tg', dy: -16, tam: 16, color: GRIS2, alfa: ini })];
      if (ini > 0) G.push(curva((u) => { const j = Math.min(tr.length - 1, Math.round(u * (tr.length - 1))); return [tr[j].t, tr[j].theta * GRADOS]; }, [0, 1], { hasta: Math.max(ini, 1e-3), n: Math.min(300, tr.length - 1), color: cay ? ROJO : ORO, ancho: 3 }));
      const T = [rotulo([210, 16], R`\text{vuelta } ${t}`, { clave: 'v', tam: 18, color: GRIS2, alfa: ini }), rotulo([210, 56], R`F_{\max} = ${coma(a.p.F, 1)},\quad \text{atención} = ${coma(a.p.atencion)}`, { clave: 'p', tam: 21, alfa: ini }), rotulo([210, 100], R`\text{coste} = {\color{${cay ? '#f05a5a' : '#f4d345'}}${coma(a.coste, 3)}}`, { clave: 'c', tam: 26, alfa: ini })];
      return { principal: P, paneles: [{ ejes: { x: [0, 4], y: [-90, 90], caja: { x: 670, y: 60, w: 380, h: 240 } }, prims: G }, { ejes: { x: [0, 420], y: [130, 0], caja: { x: 650, y: 370, w: 420, h: 130 } }, prims: T }] };
    },
  },
  manipulacion: '<ul><li>Mueve las vueltas: el camino dorado y la gráfica cambian a la vez.</li><li>Fíjate en la vuelta en que el palo deja de caer: el coste da un gran salto.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Ajustar es buscar en un mapa. Solo hacen falta tres cosas: unos números que se pueden mover, un coste que mida lo bien que va, y una forma de bajar. Aquí, además, no hay gradiente útil: la caída es un salto brusco en el coste. Por eso se usa una búsqueda que no necesita [[derivadas|derivada]]: se tantea alrededor.' },
    { tipo: 'ejemplo', texto: 'Una vuelta de tanteo, con costes inventados para ver la mecánica:', tabla: [['Prueba', 'F', 'Atención', 'Coste'], ['Donde estoy', '4', '0,10', '4,60'], ['Más fuerza', '11', '0,10', '0,09'], ['Menos fuerza', '2', '0,10', '4,80'], ['Más atención', '4', '0,34', '4,20']], cierre: 'Gana «más fuerza»: se mueve ahí. Si ninguna hubiera mejorado, el paso se habría partido por la mitad, para buscar más cerca.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`p = (F_{\max},\ \text{atención})`, dice: 'Los números que se ajustan.' },
      { tex: R`\theta(t)^2`, dice: 'Lo lejos que queda de la vertical, en cada instante. Al cuadrado, para no distinguir el lado.' },
      { tex: R`\int_0^T \theta(t)^2\, dt`, dice: 'Sumado durante todo el vuelo. Es una [[integral]].' },
    ], todo: R`J(p) = \int_0^T \theta(t)^2\, dt + \text{castigo si cae}`, lee: '«El coste de unas piezas: lo que se aleja de la vertical en total, más un castigo grande si se cae». Es lo que se quiere hacer pequeño.' },
    { tipo: 'formal', titulo: 'Búsqueda por tanteo', tex: R`Dado $p_t$ y un paso $s_t$: se calcula $J$ en $p_t \pm s_t e_i$, para cada dirección $e_i$. Si alguno mejora, $p_{t+1}$ es el mejor, y $s_{t+1} = s_t$. Si no, $p_{t+1} = p_t$ y $s_{t+1} = \frac{s_t}{2}$.`, lee: 'En inglés se llama «compass search», búsqueda con brújula: se prueba en todas las direcciones. Las $e_i$ son esas direcciones, una por cada número.' },
    { tipo: 'demo', titulo: 'El coste nunca sube', plan: 'Se sigue directamente de la regla: solo se acepta lo que mejora. Y de ahí sale que el coste se acaba estabilizando.', tex: R`La sucesión $J(p_t)$ nunca sube, y tiende a un valor.`, pasos: [
      { texto: R`En cada vuelta: o $p_{t+1}$ mejora, y $J(p_{t+1}) < J(p_t)$; o no se mueve, y $J(p_{t+1}) = J(p_t)$.`, porque: 'Son los dos casos de la regla.' },
      { texto: R`Además, $J(p_t) \ge 0$, porque es una suma de cuadrados y de un castigo positivo.`, porque: 'El coste tiene un suelo.' },
      { texto: R`Una sucesión que nunca sube, y que tiene un suelo, tiende a un valor.`, porque: 'Es una propiedad de los números reales. Ojo: tiende a un valor, no necesariamente al mejor posible.' },
    ] },
    { tipo: 'nota', titulo: 'Te da lo que le pides', texto: 'Mira dónde acaba: con la fuerza al máximo. Es lo que has pedido, porque el coste no castiga gastar motor. Un coste real incluiría también el esfuerzo. Además, solo se ha ajustado para empezar a 15 grados: habría que probar otras situaciones. Elegir qué medir es la parte más humana de todo esto.' },
  ],
  tecnicas: [
    { titulo: 'Sin derivadas, tantea', texto: 'Si el coste da saltos, o no lo puedes derivar, aún puedes bajar probando alrededor. Es más lento, pero funciona con cualquier cosa que puedas medir.' },
    { titulo: 'Cuidado con lo que mides', texto: 'Un optimizador cumple literalmente lo que le pides. Si el resultado es raro, revisa primero el coste.' },
  ],
  retos: [
    { id: 'ajusta-solo', tipo: 'manipular', enunciado: R`Avanza las vueltas hasta que el coste baje de $0{,}05$. Ese ajuste se guarda en tu taller.`, precision: (e) => (historia()[Math.round(e.vueltas)].coste < 0.05 ? 1 : 0), prueba: { vueltas: 30 }, guardar: (e) => ({ fuerzaMaxima: historia()[Math.round(e.vueltas)].p.F }), pendiente: (e) => `Ahora, el coste es ${historia()[Math.round(e.vueltas)].coste.toFixed(3).replace('.', ',')}.`, pistas: ['Súbelo poco a poco, mirando el número dorado.'], explicacion: 'Al principio, cada vuelta mejora mucho; luego, muy poco.' },
    { id: 'paso-calc', tipo: 'calcular', enunciado: R`El paso vale $0{,}25$, y en dos vueltas seguidas ninguna prueba mejora. ¿Cuánto vale ahora el paso?`, respuesta: 0.0625, tol: 0.0001, pistas: ['Cada vez que nada mejora, se parte por la mitad.'], explicacion: R`$\frac{0{,}25}{2 \cdot 2} = 0{,}0625$.` },
    { id: 'ajuste-elegir', tipo: 'elegir', enunciado: '¿Por qué aquí no se usa el gradiente, como en ANFIS?', opciones: ['Porque el gradiente siempre es peor', 'Porque el coste da un salto al caerse el palo: no hay inclinación útil allí', 'Porque solo hay dos números', 'Porque no hay reglas'], correcta: 1, explicacion: 'En la zona donde el palo cae, el coste casi no da pistas sobre hacia dónde mejorar.' },
    { id: 'demuestra-tanteo', tipo: 'demostrar', enunciado: R`Demuestra que, tras $n$ vueltas sin ninguna mejora, el paso vale $s_0 \cdot 2^{-n}$.`, pistas: ['Razona vuelta a vuelta.'],
      solucion: [
        { texto: R`Sin mejora, $s_{t+1} = \frac{s_t}{2}$. Con $n = 1$: $s_1 = s_0 \cdot 2^{-1}$.`, porque: 'Es la regla.' },
        { texto: R`Si $s_n = s_0 \cdot 2^{-n}$, entonces $s_{n+1} = \frac{s_0 \cdot 2^{-n}}{2} = s_0 \cdot 2^{-(n+1)}$.`, porque: 'Cada vuelta divide otra vez entre 2: es una [[inducción]].' },
      ] },
  ],
  referencias: ['T. G. Kolda, R. M. Lewis, V. Torczon, «Optimization by direct search», <em>SIAM Review</em> 45 (2003).', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 11.6.'],
};
