import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { simular } from '../../nucleo/pendulo.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v, d = 2) => v.toFixed(d).replace('.', '{,}');
const GRADOS = 180 / Math.PI;
const centro = (t, w) => Math.max(0, 1 - Math.abs(t) / w);
const derecha = (t, w) => Math.min(1, Math.max(0, t / w));
const izquierda = (t, w) => Math.min(1, Math.max(0, -t / w));

const memo = new Map();
const caida = (grados) => {
  if (!memo.has(grados)) memo.set(grados, simular({ theta: grados / GRADOS, omega: 0, x: 0, v: 0 }, { T: 3, dt: 0.01, parar: true }));
  return memo.get(grados);
};
const L = 0.75;

export default {
  id: '2-4-pendulo',
  titulo: 'Tu péndulo: darle palabras al ángulo',
  puente: 'Tu péndulo ya sabe decir «inclinado a la derecha, un poco». Para decidir qué hacer, tendrá que combinar palabras: «inclinado Y cayendo». ¿Qué significa «Y» con grados?',
  pregunta: 'Equilibrar un palo sobre un carrito es muy difícil. Tú lo harías sin ecuaciones: «si se inclina un poco a la derecha, muévete un poco a la derecha». ¿Puedes enseñárselo a una máquina?',
  escena: {
    id: 'pendulo', formato: 'plano', W: 1100, H: 560,
    ejes: { x: [-2.4, 2.4], y: [0, 1.2], caja: { x: 40, y: 80, w: 560, h: 400 } },
    entradas: [
      { id: 'ancho', tipo: 'deslizador', etiqueta: 'qué inclinación ya es «inclinado» (grados)', min: 5, max: 40, paso: 1, valor: 35 },
      { id: 'theta', tipo: 'arrastre', eje: 'x', panel: 0, valor: [12, 0], region: { x: [-45, 45], y: [0, 1] } },
    ],
    pasos: [
      { dur: 3000, texto: 'Un palo sobre un carrito. Si no haces nada, cae: basta una inclinación mínima. Este es el problema que vas a resolver a lo largo del curso.' },
      { dur: 2000, texto: 'Primero, la máquina tiene que <em>ver</em>. Un sensor le da un número: el ángulo. Pero las reglas que queremos usan palabras: «un poco a la derecha».' },
      { dur: 2800, texto: 'Así que definimos tres conjuntos difusos sobre el ángulo: <b style="color:#58c4dd;font-weight:400">a la izquierda</b>, <b style="color:#f4d345;font-weight:400">recto</b> y <b style="color:#fc6282;font-weight:400">a la derecha</b>.' },
      { dur: 2200, texto: 'Cada ángulo se traduce en tres grados. Cuando lo traduces de número a palabras, a eso se le llama <em>fuzzificar</em>. Es la primera pieza de tu controlador.' },
    ],
    primitivas({ q, paso, e }) {
      const w = e.ancho, ang = paso >= 1 ? e.theta[0] : 4;
      let s;
      if (paso === 0) { const tr = caida(4), i = Math.min(tr.length - 1, Math.floor(ev(q(0), 0.15, 1) * (tr.length - 1))); s = tr[i]; } else s = { theta: ang / GRADOS, x: 0 };
      const cx = Math.max(-1.9, Math.min(1.9, s.x * 0.6)), al = ev(q(0), 0, 0.15);
      const base = [cx, 0.14], tip = [cx + L * Math.sin(s.theta), 0.14 + L * Math.cos(s.theta)];
      const P = [marco({ x: [-2.4, 2.4], y: [0, 1.2] }, { alfa: al * 0.7, soloBase: true, ticks: { x: [], y: [] } })];
      P.push(poligono([[cx - 0.32, 0.05], [cx + 0.32, 0.05], [cx + 0.32, 0.14], [cx - 0.32, 0.14]], { color: [90, 98, 130], alfa: al }));
      P.push(punto([cx - 0.2, 0.03], { radio: 7, color: GRIS2, alfa: al, halo: 0 }), punto([cx + 0.2, 0.03], { radio: 7, color: GRIS2, alfa: al, halo: 0 }));
      P.push(punto(base, { radio: 5, color: GRIS2, alfa: al }), punto(tip, { radio: 8, color: ORO, alfa: al }), linea(base, tip, { color: BLANCO, ancho: 5, alfa: al }));
      if (paso >= 1) {
        const ar = ev(q(1), 0, 0.5);
        P.push(punto([cx, 0.14 + L], { radio: 1, color: GRIS2, alfa: 0, halo: 0 }), linea(base, [cx, 0.14 + L], { color: GRIS2, ancho: 1.2, alfa: 0.5 * ar, discontinua: true }));
        P.push(rotulo([cx, 1.02], R`\theta = ${ang.toFixed(0)}°`, { clave: 'ang', tam: 24, alfa: ar }));
      }
      const G = [], ap = ev(q(2), 0, 0.4);
      if (ap > 0) {
        const tr = ev(q(2), 0.1, 1);
        G.push(marco({ x: [-45, 45], y: [0, 1] }, { alfa: ap, ticks: { x: [-45, 0, 45], y: [0, 1] }, etiquetas: { x: R`\theta`, y: R`\mu` } }));
        G.push(curva((t) => [t, izquierda(t, w)], [-45, 45], { hasta: tr, n: 200, color: AZUL, ancho: 2.8 }));
        G.push(curva((t) => [t, centro(t, w)], [-45, 45], { hasta: tr, n: 200, color: ORO, ancho: 2.8 }));
        G.push(curva((t) => [t, derecha(t, w)], [-45, 45], { hasta: tr, n: 200, color: ROSA, ancho: 2.8 }));
      }
      const le = ev(q(3), 0, 0.5);
      if (le > 0) {
        const vals = [[izquierda(ang, w), AZUL, 'izquierda'], [centro(ang, w), ORO, 'recto'], [derecha(ang, w), ROSA, 'derecha']];
        G.push(linea([ang, 0], [ang, 1], { color: BLANCO, ancho: 1.3, alfa: 0.6 * le, discontinua: true }));
        vals.forEach(([v, c, n], i) => {
          G.push(punto([ang, v], { color: c, radio: 6, alfa: le }));
          G.push(rotulo([-45, 1], R`\text{${n}: } ${coma(v)}`, { clave: `v${i}`, dy: 140 + i * 30 + 150, dx: 40 + i * 0, ancla: 'l', tam: 20, color: c, alfa: le }));
        });
      }
      return { principal: P, paneles: [{ ejes: { x: [-45, 45], y: [0, 1], caja: { x: 660, y: 80, w: 380, h: 250 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Arrastra la línea blanca del panel: inclinas el palo, y mira qué tres grados salen.</li><li>Mueve el deslizador: decide a partir de qué inclinación consideras que el palo está del todo «inclinado».</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'El proyecto', texto: 'A lo largo de las regiones vas a construir un controlador difuso de verdad. Con cada región añadirás una pieza. Hoy, la primera: traducir números a palabras.' },
    { tipo: 'idea', etiqueta: 'Por qué palabras', texto: 'Lo difícil de equilibrar el palo con ecuaciones es que hay que conocer con exactitud la física del sistema. Con reglas, basta con saber qué haría una persona. Pero esas reglas hablan de «un poco a la derecha», y el sensor solo da un número.' },
    { tipo: 'ejemplo', texto: 'Si «inclinado del todo» empieza en 20 grados, cada ángulo se traduce en tres grados:', tabla: [['Ángulo', '−20', '−10', '0', '6', '10', '20'], ['A la izquierda', '1', '0,5', '0', '0', '0', '0'], ['Recto', '0', '0,5', '1', '0,7', '0,5', '0'], ['A la derecha', '0', '0', '0', '0,3', '0,5', '1']], cierre: 'Con 10 grados, el palo está a medias «recto» y a medias «a la derecha».' },
    { tipo: 'simbolos', intro: 'Las tres reglas, con una sola letra nueva.', piezas: [
      { tex: R`\theta`, dice: '«Theta», el ángulo en grados. Positivo si cae a la derecha.' },
      { tex: R`w`, dice: 'La inclinación a partir de la cual ya está del todo inclinado: el botón del conjunto.' },
      { tex: R`\tfrac{|\theta|}{w}`, dice: 'Qué parte de $w$ llevas, sin importar el lado: $|\\cdot|$ es el [[valor absoluto]].' },
      { tex: R`\max(0,\ 1 - \tfrac{|\theta|}{w})`, dice: '«Recto»: vale 1 en el centro, y baja a 0 al llegar a $w$.' },
      { tex: R`\min(1,\ \max(0,\ \tfrac{\theta}{w}))`, dice: '«A la derecha»: sube de 0 a 1 desde el centro hasta $w$, y se queda en 1.' },
    ], todo: R`\mu_{\text{recto}}(\theta) = \max\left(0,\ 1 - \tfrac{|\theta|}{w}\right)`, lee: 'Es una triangular con su cima en 0. «A la izquierda» es igual que «a la derecha», cambiando $\\theta$ por $-\\theta$.' },
    { tipo: 'formal', titulo: 'Fuzzificar', tex: R`Dados conjuntos difusos $A_1, \dots, A_m$ sobre un universo, fuzzificar un valor $x$ es calcular sus grados $\mu_{A_1}(x), \dots, \mu_{A_m}(x)$.`, lee: 'Una entrada nítida se convierte en varios grados a la vez. Eso es lo que usarán las reglas.' },
    { tipo: 'demo', titulo: 'Los tres grados siempre suman 1', plan: 'No es obligatorio, pero es una propiedad cómoda: una partición así no deja ningún ángulo sin palabra. Se demuestra separando casos, según dónde esté el ángulo.', tex: R`Para todo $\theta$: $\ \mu_{\text{izq}}(\theta) + \mu_{\text{recto}}(\theta) + \mu_{\text{der}}(\theta) = 1$.`, pasos: [
      { texto: R`Si $0 \le \theta \le w$: «izquierda» vale 0, «recto» vale $1 - \frac{\theta}{w}$ y «derecha» vale $\frac{\theta}{w}$. Suman 1.`, porque: 'Se sustituye en cada fórmula. Con $\\theta \\ge 0$ se tiene $|\\theta| = \\theta$, y $\\frac{\\theta}{w}$ está entre 0 y 1.' },
      { texto: R`Si $\theta > w$: «izquierda» 0, «recto» 0 y «derecha» 1. Suman 1.`, porque: 'Ahí $1 - \\frac{\\theta}{w}$ es negativo, luego el máximo con 0 da 0; y $\\frac{\\theta}{w} > 1$, luego el mínimo con 1 da 1.' },
      { texto: R`Si $\theta < 0$, las fórmulas de izquierda y derecha se intercambian, y sale lo mismo.`, porque: 'Las fórmulas son simétricas al cambiar $\\theta$ por $-\\theta$.' },
    ] },
    { tipo: 'nota', titulo: 'Lo que guarda tu taller', texto: 'Cuando superes el reto de ajustar el ángulo, ese valor de $w$ se guardará en tu taller. En la región «Sistemas», tu controlador lo usará para sostener el palo de verdad.' },
  ],
  tecnicas: [
    { titulo: 'Separa por casos', texto: 'Con $\\min$, $\\max$ y valor absoluto, divide el problema en las zonas donde cada uno se resuelve solo. En cada zona, la fórmula se vuelve simple.' },
    { titulo: 'Usa la simetría', texto: 'Si un problema no cambia al invertir el signo, basta con demostrarlo de un lado.' },
  ],
  retos: [
    { id: 'ajusta-angulo', tipo: 'manipular', enunciado: R`Ajusta el deslizador para que, con $\theta = 10$ grados, «recto» y «a la derecha» valgan lo mismo: $0{,}5$ cada uno.`,
      precision: (e) => (Math.abs(e.ancho - 20) < 0.5 ? 1 : 0), prueba: { ancho: 20 }, guardar: (e) => ({ anchoAngulo: e.ancho }),
      pendiente: (e) => `Con este ajuste, a 10 grados, «recto» vale ${coma(centro(10, e.ancho)).replace('{,}', ',')}.`, pistas: [R`«Recto» vale $1 - \frac{10}{w}$. ¿Para qué $w$ da $0{,}5$?`], explicacion: 'Guardado en tu taller: tu controlador ya sabe leer el ángulo.' },
    { id: 'grado-angulo', tipo: 'calcular', enunciado: R`Con $w = 20$, ¿qué grado de «recto» tiene un ángulo de $\theta = -5$ grados?`, respuesta: 0.75, tol: 0.006, pistas: [R`El valor absoluto quita el signo: $|-5| = 5$.`], explicacion: R`$1 - \frac{5}{20} = 0{,}75$.` },
  ],
  referencias: ['C. W. Anderson, A. G. Barto, R. S. Sutton, «Neuronlike adaptive elements…», <em>IEEE Trans. SMC</em> 13 (1983): el modelo del carro y la varilla.', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 11 (control difuso).'],
};
