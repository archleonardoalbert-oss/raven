import { BLANCO, GRIS2, ORO, ROJO, ROSA } from '../../motor/colores.js';
import { simular } from '../../nucleo/pendulo.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const GRADOS = 180 / Math.PI, ANCHO = 20, L = 0.75, TF = 1.2;
const der = (t) => Math.min(1, Math.max(0, (t * GRADOS) / ANCHO)), izq = (t) => Math.min(1, Math.max(0, -(t * GRADOS) / ANCHO));

/** Una sola regla: «si cae a la derecha, empuja con fuerza `s` · grado», y su simétrica. */
const memo = new Map();
const vuelo = (s) => {
  const k = s.toFixed(2);
  if (!memo.has(k)) memo.set(k, simular({ theta: 5 / GRADOS, omega: 0, x: 0, v: 0 }, { T: TF, dt: 0.005, parar: true, fuerza: (e) => 18 * s * (der(e.theta) - izq(e.theta)) }));
  return memo.get(k);
};

/** El gráfico solo enseña 1,2 s; el reto comprueba bastante más, para no aprobar lo que se cae luego. */
const aguanta = (s) => simular({ theta: 5 / GRADOS, omega: 0, x: 0, v: 0 }, { T: 4, dt: 0.005, parar: true, fuerza: (e) => 18 * s * (der(e.theta) - izq(e.theta)) }).every((v) => Math.abs(v.theta) * GRADOS < 45);

export default {
  id: '5-8-pendulo',
  titulo: 'Tu péndulo: su primera regla',
  puente: 'Has terminado «Razonar». Sabes escribir reglas y sacar conclusiones. Solo queda montar la máquina completa y ver el palo sostenerse.',
  pregunta: 'Si el palo cae a la derecha, ¿hacia dónde empujas el carro? Piénsalo con una escoba en la mano. Luego, compruébalo: una regla ya cambia lo que pasa.',
  escena: {
    id: 'pendulo-regla', formato: 'plano', W: 1100, H: 560,
    ejes: { x: [-2.4, 2.4], y: [0, 1.2], caja: { x: 40, y: 80, w: 560, h: 400 } },
    entradas: [{ id: 's', tipo: 'deslizador', etiqueta: 'si cae a la derecha, empuja: ← izquierda (−1) · derecha (1) →', min: -1, max: 1, paso: 0.05, valor: 0 }, { id: 't', tipo: 'deslizador', etiqueta: 'el tiempo (segundos)', min: 0, max: TF, paso: 0.01, valor: TF }],
    pasos: [
      { dur: 2000, texto: 'La primera regla: «si cae <b style="color:#fc6282;font-weight:400">a la derecha</b>, empuja». Falta decir hacia dónde. Sin empuje, el palo cae.' },
      { dur: 2600, texto: 'Empuja en sentido contrario, a la izquierda: el carro se aparta de debajo del palo, y cae <b style="color:#f05a5a;font-weight:400">más rápido</b>.' },
      { dur: 2800, texto: 'Empuja <b style="color:#f4d345;font-weight:400">hacia donde cae</b>: el carro se pone debajo, y el palo se endereza. Es lo que hace tu mano con una escoba.' },
      { dur: 1800, texto: 'Fíjate en lo que falta: no se cae, pero tampoco se calma. Solo mira el ángulo, no a qué velocidad cae. Ahora te toca: empiezas sin empuje.' },
    ],
    primitivas({ q, paso, e }) {
      const s = paso === 0 ? 0 : paso === 1 ? -0.8 : paso === 2 ? 0.8 : Math.round((0.8 + (e.s - 0.8) * ev(q(3), 0.7, 1)) * 20) / 20, tr = vuelo(s), t = paso === 3 ? e.t / TF : ev(q(paso), 0.1, 1), i = Math.min(tr.length - 1, Math.floor(t * (tr.length - 1))), st = tr[i];
      const cx = Math.max(-1.9, Math.min(1.9, st.x * 0.7)), al = ev(q(0), 0, 0.2), base = [cx, 0.14], tip = [cx + L * Math.sin(st.theta), 0.14 + L * Math.cos(st.theta)];
      const P = [marco({ x: [-2.4, 2.4], y: [0, 1.2] }, { alfa: al * 0.7, soloBase: true, ticks: { x: [], y: [] } })];
      P.push(poligono([[cx - 0.32, 0.05], [cx + 0.32, 0.05], [cx + 0.32, 0.14], [cx - 0.32, 0.14]], { color: [90, 98, 130], alfa: al }), punto([cx - 0.2, 0.03], { radio: 7, color: GRIS2, alfa: al, halo: 0 }), punto([cx + 0.2, 0.03], { radio: 7, color: GRIS2, alfa: al, halo: 0 }));
      P.push(punto(base, { radio: 5, color: GRIS2, alfa: al }), punto(tip, { radio: 8, color: ORO, alfa: al }), linea(base, tip, { color: BLANCO, ancho: 5, alfa: al }));
      if (Math.abs(s) > 0.01) P.push(rotulo([cx, 0.02], s > 0 ? R`\text{empuja} \rightarrow` : R`\leftarrow \text{empuja}`, { clave: 'emp', dy: 26, tam: 19, color: s > 0 ? ORO : ROJO, alfa: al }));
      const G = [marco({ x: [0, TF], y: [-90, 90] }, { alfa: al, ticks: { x: [0, TF], y: [-90, 0, 90] }, etiquetas: { x: R`\text{tiempo (s)}`, y: R`\theta` } })];
      G.push(linea([0, 0], [TF, 0], { color: GRIS2, ancho: 1, alfa: 0.5 * al, discontinua: true }));
      const v = tr.slice(0, i + 1);
      if (v.length > 1) G.push(curva((u) => { const j = Math.min(v.length - 1, Math.round(u * (v.length - 1))); return [v[j].t, v[j].theta * GRADOS]; }, [0, 1], { n: Math.min(240, v.length - 1), color: s > 0.2 ? ORO : s < -0.2 ? ROJO : ROSA, ancho: 3 }));
      G.push(rotulo([TF / 2, 90], R`\text{El ángulo, con el tiempo}`, { clave: 'tg', dy: -20, tam: 17, color: GRIS2, alfa: al }));
      return { principal: P, paneles: [{ ejes: { x: [0, TF], y: [-90, 90], caja: { x: 660, y: 100, w: 380, h: 320 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Mueve el empuje: a la izquierda, a la derecha, más fuerte o más suave.</li><li>Mira la gráfica: ¿llega el ángulo a 90°, o da la vuelta antes?</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Ya sabes convertir un ángulo en palabras. La regla de hoy conecta esa palabra con una acción: «si cae a la derecha, empuja a la derecha». Y la fuerza depende del grado: cuanto más inclinado, más empuje.' },
    { tipo: 'ejemplo', texto: 'Con «inclinado del todo» a 20 grados, y un empuje máximo de 18:', tabla: [['Ángulo', '5', '10', '20', '30'], ['Grado de «a la derecha»', '0,25', '0,5', '1', '1'], ['Fuerza', '4,5', '9', '18', '18']], cierre: 'Con poca inclinación, una corrección suave. Con mucha, a fondo. Sin escalones: una transición continua.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`g`, dice: 'El grado con que se cumple la condición.' },
      { tex: R`F_{\max}`, dice: 'La fuerza máxima que puede dar el motor.' },
      { tex: R`g \cdot F_{\max}`, dice: 'Cuánto empuja: lo que pide la regla, escalado por su grado.' },
    ], todo: R`F = g_{\text{der}}(\theta)\, F_{\max} - g_{\text{izq}}(\theta)\, F_{\max}`, lee: 'Dos reglas simétricas: «si cae a la derecha, empuja a la derecha», y al revés. Se restan porque empujan en sentidos opuestos.' },
    { tipo: 'formal', titulo: 'Tu primera regla', tex: R`$R_1$: si $\theta$ es «a la derecha», entonces $F$ es «a la derecha». $\ R_2$: si $\theta$ es «a la izquierda», entonces $F$ es «a la izquierda». La salida de cada una se pesa con su grado.`, lee: 'Es una forma de razonamiento con un dato exacto, el del sensor. Es la que verás en detalle con los sistemas de Sugeno.' },
    { tipo: 'demo', titulo: 'En equilibrio, no hace nada', plan: 'Comprobación de sentido común: si el palo está recto, el controlador no debe tocarlo.', tex: R`Si $\theta = 0$, entonces $F = 0$.`, pasos: [
      { texto: R`Con $\theta = 0$: $g_{\text{der}}(0) = 0$ y $g_{\text{izq}}(0) = 0$.`, porque: 'Las dos curvas valen 0 en el centro.' },
      { texto: R`Por tanto, $F = 0 \cdot F_{\max} - 0 \cdot F_{\max} = 0$.`, porque: 'Se sustituye en la fórmula.' },
    ] },
    { tipo: 'nota', titulo: 'Lo que le falta', texto: 'Solo con el ángulo, el palo no se cae, pero sigue oscilando sin calmarse: corrige tarde, porque no sabe a qué velocidad se mueve. Un humano mira las dos cosas. Por eso, en «Sistemas», tu controlador mirará también la velocidad.' },
  ],
  tecnicas: [
    { titulo: 'Prueba el signo', texto: 'En un sistema físico, antes de ajustar magnitudes, comprueba el sentido de cada acción. Un signo mal puesto convierte una corrección en una catástrofe.' },
  ],
  retos: [
    { id: 'elige-signo', tipo: 'manipular', enunciado: 'Elige el sentido del empuje, con al menos media potencia: durante 4 segundos, el ángulo no debe llegar a 45 grados.', precision: (e) => (Math.abs(e.s) >= 0.5 && aguanta(e.s) ? 1 : 0), prueba: { s: 0.8 }, guardar: (e) => ({ fuerzaMaxima: 18 * Math.abs(e.s) }), pendiente: () => 'El palo se cae. Prueba en el otro sentido, o más fuerte.', pistas: ['Con una escoba en la mano: si se cae hacia un lado, ¿hacia dónde mueves la mano?'], explicacion: 'Hacia donde cae: el carro se pone debajo. Guardado en tu taller.' },
    { id: 'peso-regla', tipo: 'calcular', enunciado: R`Con $F_{\max} = 18$ y grado $0{,}25$ en «a la derecha», ¿qué fuerza pide la regla?`, respuesta: 4.5, tol: 0.01, pistas: [R`$g \cdot F_{\max}$.`], explicacion: R`$0{,}25 \cdot 18 = 4{,}5$.` },
  ],
  referencias: ['C. W. Anderson, A. G. Barto, R. S. Sutton (1983): el carro y la varilla.', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 11.'],
};
