import { AZUL, BLANCO, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { fuerzaConCarro, umbralFuerza } from '../../nucleo/diseno.js';
import { simular } from '../../nucleo/pendulo.js';
import { fuerzaPendulo } from '../../nucleo/sistemas.js';
import { curva, linea, mapaCalor, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v, d = 1) => (Math.abs(v) < 0.05 && d === 1 ? 0 : v).toFixed(d).replace('.', '{,}');
const GRADOS = 180 / Math.PI, TF = 12, DT = 0.01, L = 0.75, RIEL = 2.4, ANCHO = 20, DF = [2, 30], DA = [0, 1];
const memo = new Map();
function vuelo(c, F, atencion) {
  const k = [c, F, atencion].join();
  if (!memo.has(k)) {
    if (memo.size > 200) memo.clear();
    const P = { anchoAngulo: ANCHO, anchoVel: atencion > 0 ? 2 / atencion : Infinity, F, kx: 0.1 * c, kv: 0.2 * c };
    memo.set(k, simular({ theta: 15 / GRADOS, omega: 0, x: 0, v: 0 }, { T: TF, dt: DT, parar: true, fuerza: (s) => fuerzaConCarro(s, P) }));
  }
  return memo.get(k);
}
const centrado = (tr) => tr.length === Math.round(TF / DT) + 1 && Math.abs(tr.at(-1).x) < 0.3 && Math.abs(tr.at(-1).theta) * GRADOS < 1 && tr.every((s) => Math.abs(s.x) < RIEL);

let rejilla = null;
/** Para cada pareja (fuerza, atención), ¿se sostiene el palo? Se calcula una vez, cuando hace falta. */
function sostiene(F, a) {
  if (!rejilla) {
    rejilla = [];
    for (let j = 0; j <= 20; j++) for (let i = 0; i <= 28; i++) {
      const Fi = 2 + i, at = j / 20, P = { anchoAngulo: ANCHO, anchoVel: at > 0 ? 2 / at : Infinity, F: Fi };
      const tr = simular({ theta: 5 / GRADOS, omega: 0, x: 0, v: 0 }, { T: 6, dt: 0.02, parar: true, fuerza: (s) => fuerzaPendulo(s.theta, s.omega, P) });
      rejilla.push(tr.length === 301 && Math.abs(tr.at(-1).theta) * GRADOS < 2 ? 1 : 0);
    }
  }
  return rejilla[Math.round(a * 20) * 29 + Math.round(F - 2)];
}

export default {
  id: '6-7-diseno',
  titulo: 'Diseñar de verdad: el riel y la estabilidad',
  puente: 'Has diseñado tú cada pieza, tanteando. ¿Y si un sistema pudiera aprenderlas de los datos? Es la siguiente región.',
  pregunta: 'El palo se sostiene, pero el carro se aleja hasta salirse del riel. ¿Cómo se arregla? ¿Y cómo sabes, sin probarlo, si unas piezas van a funcionar?',
  escena: {
    id: 'diseno', formato: 'plano', W: 1100, H: 620,
    ejes: { x: [-2.7, 2.7], y: [0, 1.15], caja: { x: 30, y: 50, w: 530, h: 300 } },
    entradas: [
      { id: 'c', tipo: 'deslizador', etiqueta: 'cuánto mira dónde está el carro', min: 0, max: 1, paso: 0.05, valor: 0 },
      { id: 'F', tipo: 'deslizador', etiqueta: 'fuerza máxima', min: 2, max: 30, paso: 1, valor: 18 },
      { id: 'atencion', tipo: 'deslizador', etiqueta: 'cuánto mira la velocidad del palo', min: 0, max: 1, paso: 0.05, valor: 1 },
      { id: 't', tipo: 'deslizador', etiqueta: 'el tiempo (segundos)', min: 0, max: TF, paso: 0.05, valor: TF },
    ],
    pasos: [
      { dur: 4000, texto: 'Tu controlador no mira dónde está el carro. El palo se endereza, pero el carro sigue rodando, y <b style="color:#f05a5a;font-weight:400">se sale del riel</b>.' },
      { dur: 4600, texto: 'Una regla más: «si el carro se aleja, inclina el palo <b>hacia el centro</b>». Para ir a la izquierda, primero inclinas a la izquierda, y el carro lo persigue. Mira cómo <b style="color:#f4d345;font-weight:400">vuelve solo</b>.' },
      { dur: 4600, texto: 'Pero cuidado: si le das el doble de importancia a esa regla, <b style="color:#f05a5a;font-weight:400">el sistema oscila sin parar</b>. Más no siempre es mejor. Hay que diseñar.' },
      { dur: 3600, texto: 'Abajo, todas las elecciones de fuerza y atención: en <b style="color:#f4d345;font-weight:400">oro</b>, las que sostienen el palo. La línea blanca es un cálculo a mano que predice el borde <b>sin simular nada</b>.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.1), cfg = paso === 0 ? [0, 18, 1] : paso === 1 ? [0.5, 18, 1] : paso === 2 ? [1, 18, 1] : [e.c, e.F, e.atencion];
      const tr = vuelo(...cfg), avance = paso === 3 ? Math.min(ev(q(3), 0, 1) * TF, e.t) : ev(q(paso), 0.03, 1) * TF, i = Math.min(tr.length - 1, Math.round(avance / DT)), s = tr[i];
      const fuera = Math.abs(s.x) >= RIEL, cx = Math.max(-RIEL, Math.min(RIEL, s.x)), cay = i === tr.length - 1 && tr.length < Math.round(TF / DT) + 1, malo = fuera || cay;
      const P = [marco({ x: [-2.7, 2.7], y: [0, 1.15] }, { alfa: al * 0.6, soloBase: true, ticks: { x: [], y: [] } })];
      for (const u of [-RIEL, RIEL]) P.push(punto([u, 0], { color: ROJO, radio: 6, alfa: al }), punto([u, 0.16], { color: ROJO, radio: 3, alfa: al }), linea([u, 0], [u, 0.16], { color: ROJO, ancho: 3, alfa: al }));
      P.push(punto([0, 0], { color: GRIS2, radio: 3, alfa: al, halo: 0 }), rotulo([0, 0], R`\text{centro}`, { clave: 'cen', dy: 16, tam: 13, color: GRIS2, alfa: al }));
      const base = [cx, 0.14], tip = [cx + L * Math.sin(s.theta), 0.14 + L * Math.cos(s.theta)];
      P.push(poligono([[cx - 0.32, 0.05], [cx + 0.32, 0.05], [cx + 0.32, 0.14], [cx - 0.32, 0.14]], { color: [90, 98, 130], alfa: al }), punto([cx - 0.2, 0.03], { radio: 7, color: GRIS2, alfa: al, halo: 0 }), punto([cx + 0.2, 0.03], { radio: 7, color: GRIS2, alfa: al, halo: 0 }));
      P.push(punto(base, { radio: 5, color: GRIS2, alfa: al }), linea(base, tip, { color: malo ? ROJO : BLANCO, ancho: 5, alfa: al }), punto(tip, { radio: 8, color: malo ? ROJO : ORO, alfa: al }));
      P.push(rotulo([0, 1.1], malo ? R`{\color{#f05a5a}\text{${fuera ? 'fuera del riel' : 'se ha caído'}}}` : R`x = ${coma(s.x)}\ \text{m},\ \ \theta = ${coma(s.theta * GRADOS)}°`, { clave: 'est', tam: 20, alfa: al }));
      const G = [marco({ x: [0, TF], y: [-4, 4] }, { alfa: al, ticks: { x: [0, TF], y: [-4, 0, 4] }, etiquetas: { x: R`\text{tiempo (s)}`, y: 'x' } }), linea([0, RIEL], [TF, RIEL], { color: ROJO, ancho: 1.2, alfa: 0.7 * al, discontinua: true }), linea([0, -RIEL], [TF, -RIEL], { color: ROJO, ancho: 1.2, alfa: 0.7 * al, discontinua: true }), rotulo([TF / 2, 4], R`\text{Dónde está el carro}`, { clave: 'tg', dy: -15, tam: 15, color: GRIS2, alfa: al })];
      const v = tr.slice(0, i + 1);
      if (v.length > 1) G.push(curva((u) => { const j = Math.min(v.length - 1, Math.round(u * (v.length - 1))); return [v[j].t, Math.max(-4, Math.min(4, v[j].x))]; }, [0, 1], { n: Math.min(300, v.length - 1), color: AZUL, ancho: 2.6 }));
      const mp = paso === 3 ? ev(q(3), 0, 0.3) : 0, M = [], F0 = umbralFuerza(ANCHO);
      if (mp > 0) {
        M.push(mapaCalor((u, w) => sostiene(u, w), { clave: 'estable' }), marco({ x: DF, y: DA }, { alfa: mp, ticks: { x: [2, 16, 30], y: [0, 1] } }), rotulo([16, 0], R`\text{fuerza máxima}`, { clave: 'ex', dy: 30, tam: 15, color: GRIS2, alfa: mp }), rotulo([2, 0.5], R`\text{atención}`, { clave: 'ey', dx: -14, ancla: 'r', tam: 15, color: GRIS2, alfa: mp }));
        M.push(linea([F0, 0], [F0, 1], { color: BLANCO, ancho: 2.2, alfa: mp }), rotulo([F0, 1], R`F = ${coma(F0)}`, { clave: 'f0', dy: -12, tam: 16, alfa: mp }), punto([e.F, e.atencion], { color: BLANCO, radio: 7, alfa: mp }));
      }
      return { principal: P, paneles: [{ ejes: { x: [0, TF], y: [-4, 4], caja: { x: 620, y: 40, w: 430, h: 180 } }, prims: G }, { ejes: { x: DF, y: DA, caja: { x: 700, y: 300, w: 340, h: 240 } }, prims: M }] };
    },
  },
  manipulacion: '<ul><li>Sube «cuánto mira dónde está el carro» hasta la mitad: vuelve al centro. Súbelo al máximo: oscila. Con el deslizador del tiempo, lo recorres entero.</li><li>Baja la fuerza hasta cruzar la línea blanca del mapa: el palo cae justo donde predice la cuenta.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un sistema difuso real se diseña en bucle: eliges piezas, pruebas y corriges. Las reglas se leen fácil, pero sus números importan. Y hay preguntas que no se responden con palabras: ¿cubren las reglas todas las situaciones? ¿Se va a sostener, o a oscilar? A eso último se le llama estabilidad.' },
    { tipo: 'ejemplo', etiqueta: 'Las decisiones', texto: 'Lo que hay que decidir, en el orden habitual:', tabla: [['Decisión', 'La pregunta', 'Qué falla si no'], ['Escala', '¿qué es «grande» en esta máquina?', 'nunca satura, o satura siempre'], ['Cuántas palabras', '¿3, 5 o 7 por entrada?', 'tosco, o demasiadas reglas'], ['Reglas', '¿cubren todo? ¿se contradicen?', 'zonas sin ninguna regla: parón'], ['Concretar', '¿centroide, o de máximos?', 'órdenes con saltos']], cierre: 'En tu péndulo, el «inclinado del todo» de 20 grados es una escala, y la tabla de nueve casillas cubre todas las situaciones.' },
    { tipo: 'simbolos', intro: 'Cerca de la vertical, y dentro de los anchos, tu controlador es la recta que demostraste. Vamos a usarla.', piezas: [
      { tex: R`\ddot{\theta}`, dice: 'Dos puntos encima: la aceleración del ángulo, cómo cambia su velocidad.' },
      { tex: R`A\theta`, dice: 'La gravedad: cuanto más inclinado, más tira hacia abajo. Empuja a caer.' },
      { tex: R`-BF`, dice: 'Lo que corrige la fuerza del carro. Los números $A$ y $B$ salen de las masas y de la longitud.' },
      { tex: R`F = K\theta + D\dot{\theta}`, dice: 'Tu recta: $K$ mira el ángulo, y $D$ su velocidad.' },
    ], todo: R`\ddot{\theta} + BD\,\dot{\theta} + (BK - A)\,\theta = 0`, lee: 'Es la ecuación de un muelle con un freno. $BK - A$ es el muelle: tira hacia la vertical si es positivo. $BD$ es el freno: calma la oscilación.' },
    { tipo: 'formal', titulo: 'La condición de estabilidad', tex: R`Cerca de la vertical, el palo vuelve si y solo si $BK > A$ y $BD > 0$. Como $\frac{A}{B} = (M + m)\,g$, y con «inclinado del todo» en $a$ radianes $K = \frac{F_{\max}}{2a}$, se necesita $F_{\max} > 2a\,(M + m)\,g$, y mirar la velocidad.`, lee: 'Con tus números, $a = 20$ grados, sale $F_{\\max} > 7{,}5$. Es la línea blanca, calculada a mano.' },
    { tipo: 'demo', titulo: 'De dónde sale', plan: 'Se simplifica la física cerca de la vertical, se sustituye la recta del controlador, y se reconoce un muelle con freno.', tex: R`Con $\ddot{\theta} = A\theta - BF$ y $F = K\theta + D\dot{\theta}$: el palo vuelve si $BK > A$ y $D > 0$.`, pasos: [
      { texto: R`Cerca de la vertical, $\sin\theta \approx \theta$ y $\cos\theta \approx 1$, y las ecuaciones del carro se reducen a $\ddot{\theta} = A\theta - BF$, con $A = \frac{g}{\ell}$ y $B = \frac{1}{(M + m)\,\ell}$, siendo $\ell$ una longitud efectiva del palo.`, porque: 'Se quedan solo los términos más grandes. Por eso esta cuenta vale cerca de la vertical, y no con el palo muy inclinado.' },
      { texto: R`Sustituyendo $F$: $\ddot{\theta} + BD\,\dot{\theta} + (BK - A)\,\theta = 0$.`, porque: 'Se pasa todo al mismo lado.' },
      { texto: R`Si $BK < A$, el «muelle» empuja hacia afuera: $\theta$ crece, y el palo cae.`, porque: 'La gravedad gana a la corrección.' },
      { texto: R`Si $BK > A$ y $D > 0$, es un muelle con freno de verdad: la energía se pierde, y $\theta$ tiende a 0.`, porque: 'Sin freno, $D = 0$, oscilaría para siempre: es lo que le pasaba a tu primera regla.' },
    ] },
    { tipo: 'nota', titulo: 'Sin engañarte', texto: 'Esta cuenta vale cerca de la vertical, y solo dice qué hace falta para volver: no cuánto tarda, ni si aguantas un golpe fuerte. Fuera de esa zona, la estabilidad de un sistema difuso se estudia con otras herramientas, como las funciones de Lyapunov, y es una de las críticas clásicas al control difuso: hay que demostrarla, no se regala.' },
  ],
  tecnicas: [
    { titulo: 'Cerca de un punto, todo es casi una recta', texto: 'Para entender un sistema complicado cerca de su equilibrio, sustituye cada curva por su recta. Esta técnica se llama linealizar.' },
    { titulo: 'Reconoce la ecuación', texto: 'Un muelle con freno aparece en muchos sitios. Si reconoces la forma, ya sabes el comportamiento, sin resolver nada.' },
  ],
  retos: [
    { id: 'centra', tipo: 'manipular', enunciado: 'Ajusta cuánto mira el carro: en 12 segundos debe volver a menos de 0,3 m del centro, con el palo recto y sin salirse del riel.', precision: (e) => (centrado(vuelo(e.c, e.F, e.atencion)) ? 1 : 0), prueba: { c: 0.5, F: 18, atencion: 1 }, pendiente: (e) => { const f = vuelo(e.c, e.F, e.atencion).at(-1); return `Acaba en ${f.x.toFixed(1).replace('.', ',')} m, con el palo a ${(f.theta * GRADOS).toFixed(0)}°.`; }, pistas: ['Ni nada, ni demasiado: prueba hacia la mitad.'], explicacion: 'Se persigue un objetivo que también se mueve: por eso, con demasiada ganancia, oscila.' },
    { id: 'umbral-calc', tipo: 'calcular', enunciado: R`Si $(M + m)\,g = 10{,}78$, y «inclinado del todo» es $a = 0{,}5$ radianes, ¿cuál es la fuerza máxima mínima?`, respuesta: 10.78, tol: 0.01, pistas: [R`Es $2a\,(M + m)\,g$.`], explicacion: R`$2 \cdot 0{,}5 \cdot 10{,}78 = 10{,}78$.` },
    { id: 'cobertura-elegir', tipo: 'elegir', enunciado: '¿Qué pasa si las reglas no cubren una situación?', opciones: ['El sistema adivina', 'Ninguna regla se enciende, y la salida se queda sin decidir: un parón brusco', 'La fuerza se hace máxima', 'Da igual: el centroide lo arregla'], correcta: 1, explicacion: 'Lo viste en el ventilador de Mamdani: a 10 °C y 20 % de humedad se para de golpe.' },
    { id: 'demuestra-muelle', tipo: 'demostrar', enunciado: R`Demuestra que, con $D = 0$ y $BK > A$, la cantidad $E = \dot{\theta}^2 + (BK - A)\,\theta^2$ no cambia con el tiempo: el palo oscila para siempre.`, pistas: ['Deriva $E$ respecto al tiempo, y usa la ecuación.'],
      solucion: [
        { texto: R`$\dot{E} = 2\dot{\theta}\ddot{\theta} + 2(BK - A)\,\theta\dot{\theta} = 2\dot{\theta}\big(\ddot{\theta} + (BK - A)\,\theta\big)$.`, porque: 'Se deriva cada término, y se saca factor común.' },
        { texto: R`Con $D = 0$, la ecuación dice que ese paréntesis vale 0. Luego $\dot{E} = 0$.`, porque: 'Sin freno, la energía se conserva. Por eso tu primera regla no calmaba el palo.' },
      ] },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 11.5 y 11.9.', 'K. M. Passino, S. Yurkovich, <em>Fuzzy Control</em>, 1998.', 'K. Tanaka, H. O. Wang, <em>Fuzzy Control Systems Design and Analysis</em>, 2001.'],
};
