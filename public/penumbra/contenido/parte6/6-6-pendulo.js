import { BLANCO, GRIS2, ORO, ROJO, ROSA, TEXTO } from '../../motor/colores.js';
import { simular } from '../../nucleo/pendulo.js';
import { activaciones, fuerzaPendulo } from '../../nucleo/sistemas.js';
import { crearTaller } from '../../nucleo/taller.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { matriz } from '../parte4/matriz.js';

const R = String.raw;
const coma = (v, d = 1) => (Math.abs(v) < 0.05 ? 0 : v).toFixed(d).replace('.', '{,}');
const GRADOS = 180 / Math.PI, TF = 6, DT = 0.01, L = 0.75, INICIO = 15;

function tusPiezas() {
  try { return crearTaller(globalThis.localStorage).leer(); } catch { return {}; }
}
const T_DE = (norma) => (norma === 0 ? Math.min : (u, v) => u * v);
const memo = new Map();
function vuelo(a, atencion, F, norma, golpe) {
  const k = [a, atencion, F, norma, golpe].join();
  if (!memo.has(k)) {
    if (memo.size > 200) memo.clear();
    const P = { anchoAngulo: a, anchoVel: atencion > 0 ? 2 / atencion : Infinity, F }, T = T_DE(norma);
    memo.set(k, simular({ theta: INICIO / GRADOS, omega: 0, x: 0, v: 0 }, { T: TF, dt: DT, parar: true, fuerza: (s, t) => fuerzaPendulo(s.theta, s.omega, P, T) + (golpe && t >= 3 && t < 3.15 ? 20 : 0) }));
  }
  return memo.get(k);
}
const seSostiene = (tr) => tr.length === Math.round(TF / DT) + 1 && tr.slice(-100).every((s) => Math.abs(s.theta) * GRADOS < 1);

export default {
  id: '6-6-pendulo',
  titulo: 'El péndulo se sostiene',
  puente: 'Se sostiene, pero el carro se escapa rodando. Falta lo que distingue a un juguete de una máquina real: diseñarlo con cuidado.',
  pregunta: 'Empezaste con un palo que siempre caía, y una pregunta: ¿se puede sostener razonando con palabras? Aquí están tus piezas. Vamos a ver.',
  escena: {
    id: 'pendulo-final', formato: 'plano', W: 1100, H: 620,
    ejes: { x: [-2, 2], y: [0, 1.2], caja: { x: 30, y: 70, w: 510, h: 370 } },
    entradas: (() => {
      const t = tusPiezas();
      return [
        { id: 'atencion', tipo: 'deslizador', etiqueta: 'cuánto mira la velocidad', min: 0, max: 1, paso: 0.05, valor: 0 },
        { id: 'a', tipo: 'deslizador', etiqueta: 'tu «inclinado del todo» (grados)', min: 5, max: 40, paso: 0.5, valor: t.anchoAngulo ?? 20 },
        { id: 'F', tipo: 'deslizador', etiqueta: 'tu fuerza máxima', min: 2, max: 30, paso: 0.5, valor: t.fuerzaMaxima || 18 },
        { id: 'norma', tipo: 'deslizador', etiqueta: 'tu «y» (0 mínimo, 1 producto)', min: 0, max: 1, paso: 1, valor: t.normaY === 'mínimo' ? 0 : 1 },
        { id: 'golpe', tipo: 'deslizador', etiqueta: 'un empujón a los 3 s (0 no, 1 sí)', min: 0, max: 1, paso: 1, valor: 0 },
        { id: 't', tipo: 'deslizador', etiqueta: 'el tiempo (segundos)', min: 0, max: TF, paso: 0.01, valor: TF },
      ];
    })(),
    pasos: [
      { dur: 4200, texto: 'Primero, solo tu regla del ángulo. El palo no se cae, pero <b style="color:#f05a5a;font-weight:400">no se calma</b>: corrige siempre tarde.' },
      { dur: 4200, texto: 'Ahora, mira también a qué velocidad cae: <b>nueve reglas</b>, las de la tabla. Las casillas encendidas son las que están decidiendo. <b style="color:#f4d345;font-weight:400">Se queda quieto.</b>' },
      { dur: 4600, texto: 'Dale un empujón a los 3 segundos. Nadie le ha dicho qué hacer ante eso. Se recupera <b style="color:#f4d345;font-weight:400">solo</b>, porque las reglas cubren todas las situaciones.' },
      { dur: 3400, texto: 'Ahora con <b>tus piezas</b>, las que guardaste por el camino. Empiezas sin mirar la velocidad. Sube ese mando, y vuelve a ver cómo se sostiene.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.1);
      const cfg = paso === 0 ? [20, 0, 18, 1, 0] : paso === 1 ? [20, 1, 18, 1, 0] : paso === 2 ? [20, 1, 18, 1, 1] : [e.a, e.atencion, e.F, Math.round(e.norma), Math.round(e.golpe)];
      const tr = vuelo(...cfg), avance = paso === 3 ? Math.min(ev(q(3), 0, 1) * TF, e.t) : ev(q(paso), 0.04, 1) * TF, i = Math.min(tr.length - 1, Math.round(avance / DT)), s = tr[i], cay = i === tr.length - 1 && tr.length < Math.round(TF / DT) + 1;
      const P = cfg[1] > 0 ? { anchoAngulo: cfg[0], anchoVel: 2 / cfg[1], F: cfg[2] } : { anchoAngulo: cfg[0], anchoVel: Infinity, F: cfg[2] }, T = T_DE(cfg[3]);
      const f = fuerzaPendulo(s.theta, s.omega, P, T);
      // La cámara sigue al carro: el suelo se desliza por debajo.
      const c = [marco({ x: [-2, 2], y: [0, 1.2] }, { alfa: al * 0.6, soloBase: true, ticks: { x: [], y: [] } })];
      for (let k = Math.ceil(s.x - 2.2); k <= s.x + 2.2; k++) { const u = (k - s.x) * 1.0; if (Math.abs(u) <= 2) c.push(punto([u, -0.02], { color: GRIS2, radio: 2.5, alfa: al, halo: 0 })); }
      const base = [0, 0.14], tip = [L * Math.sin(s.theta), 0.14 + L * Math.cos(s.theta)];
      c.push(poligono([[-0.32, 0.05], [0.32, 0.05], [0.32, 0.14], [-0.32, 0.14]], { color: [90, 98, 130], alfa: al }), punto([-0.2, 0.03], { radio: 7, color: GRIS2, alfa: al, halo: 0 }), punto([0.2, 0.03], { radio: 7, color: GRIS2, alfa: al, halo: 0 }));
      c.push(punto(base, { radio: 5, color: GRIS2, alfa: al }), linea(base, tip, { color: cay ? ROJO : BLANCO, ancho: 5, alfa: al }), punto(tip, { radio: 8, color: cay ? ROJO : ORO, alfa: al }));
      if (Math.abs(f) > 0.05) c.push(punto([0, 0.095], { color: ORO, radio: 3, alfa: al }), punto([(f / 30) * 1.2, 0.095], { color: ORO, radio: 5, alfa: al }), linea([0, 0.095], [(f / 30) * 1.2, 0.095], { color: ORO, ancho: 4, alfa: al }));
      c.push(rotulo([0, 1.13], R`\theta = ${coma(s.theta * GRADOS)}°,\ \ F = ${coma(f)}`, { clave: 'est', tam: 21, alfa: al }));
      c.push(rotulo([0, -0.09], R`\text{el carro ha rodado } ${coma(Math.abs(s.x))}\ \text{m}`, { clave: 'x', tam: 15, color: GRIS2, alfa: al }));
      const G = [marco({ x: [0, TF], y: [-30, 30] }, { alfa: al, ticks: { x: [0, 3, TF], y: [-30, 0, 30] }, etiquetas: { x: R`\text{tiempo (s)}`, y: R`\theta` } }), linea([0, 0], [TF, 0], { color: GRIS2, ancho: 1, alfa: 0.5 * al, discontinua: true }), rotulo([TF / 2, 30], R`\text{El ángulo, con el tiempo}`, { clave: 'tg', dy: -16, tam: 16, color: GRIS2, alfa: al })];
      const v = tr.slice(0, i + 1);
      if (v.length > 1) G.push(curva((u) => { const j = Math.min(v.length - 1, Math.round(u * (v.length - 1))); return [v[j].t, Math.max(-30, Math.min(30, v[j].theta * GRADOS))]; }, [0, 1], { n: Math.min(300, v.length - 1), color: cfg[1] > 0 ? ORO : ROSA, ancho: 2.8 }));
      const pt = paso === 0 ? 0 : ev(q(1), 0, 0.15), act = activaciones(s.theta, s.omega, P, T), M = [0, 1, 2].map((i2) => [0, 1, 2].map((j) => +act[i2 * 3 + j].toFixed(2)));
      const Tb = [];
      if (pt > 0) {
        Tb.push(...matriz(M, { x: 200, y: 42, lado: 58, filas: ['inclinado a la izq.', 'recto', 'inclinado a la der.'], cols: ['←', 'quieto', '→'], alfa: pt, id: 'act' }));
        Tb.push(rotulo([287, 8], R`\text{Qué reglas están decidiendo. Arriba: hacia dónde gira.}`, { clave: 'tit', tam: 15, color: TEXTO, alfa: pt }));
      }
      return { principal: c, paneles: [{ ejes: { x: [0, TF], y: [-30, 30], caja: { x: 600, y: 70, w: 450, h: 180 } }, prims: G }, { ejes: { x: [0, 520], y: [230, 0], caja: { x: 560, y: 320, w: 520, h: 230 } }, prims: Tb }] };
    },
  },
  manipulacion: '<ul><li>Sube «cuánto mira la velocidad» y recorre el tiempo con su deslizador: el palo se calma.</li><li>Activa el empujón. Quita fuerza. ¿Cuánto hace falta como mínimo para que aguante?</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un equilibrista no resuelve ecuaciones: si se inclina y además cae rápido, corrige fuerte; si se inclina pero ya vuelve, casi no hace nada. Eso, escrito en nueve reglas, sostiene el palo. No has hecho ningún modelo matemático del péndulo para escribirlas: bastó con el sentido común.' },
    { tipo: 'ejemplo', texto: 'La tabla entera: en cada casilla, cuánta fuerza pide la regla, como fracción de la máxima $F$.', tabla: [['', 'Gira ←', 'Quieto', 'Gira →'], ['Inclinado a la izq.', '−1', '−0,5', '0'], ['Recto', '−0,5', '0', '0,5'], ['Inclinado a la der.', '0', '0,5', '1']], cierre: 'Fíjate en la casilla de arriba a la derecha: inclinado a la izquierda, pero girando a la derecha. Ya está volviendo solo: no hay que hacer nada.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\theta`, dice: 'Ángulo del palo respecto a la vertical. La letra griega «theta».' },
      { tex: R`\omega`, dice: 'A qué velocidad gira. La letra griega «omega».' },
      { tex: R`w_{ij} = T(\mu_i(\theta),\ \nu_j(\omega))`, dice: 'La fuerza de la regla en la fila $i$, columna $j$: combina con tu «y» las dos condiciones.' },
      { tex: R`k_{ij}`, dice: 'El número de esa casilla de la tabla.' },
    ], todo: R`F = F_{\max} \cdot \frac{\sum_{ij} w_{ij}\, k_{ij}}{\sum_{ij} w_{ij}}`, lee: 'Es un sistema de Sugeno de orden cero: la media de la tabla, pesada por las casillas encendidas, y multiplicada por la fuerza máxima.' },
    { tipo: 'formal', titulo: 'Tu controlador', tex: R`Para $i, j \in \{-1, 0, 1\}$: si $\theta$ es $A_i$ y $\omega$ es $B_j$, entonces $k_{ij} = \frac{i + j}{2}$. Con entradas $\mu_{\pm 1}$ rampas, $\mu_0$ triángulo, de anchos $a$ para $\theta$ y $b$ para $\omega$.`, lee: 'La fórmula de la tabla es muy sencilla: $\\frac{i + j}{2}$. En el fondo, se empuja en proporción a la suma de la inclinación y de la velocidad. Lo difuso te permitió llegar sin saberlo.' },
    { tipo: 'demo', titulo: 'Con producto y dentro de los anchos, es una recta', plan: 'Vamos a abrir la caja. Con el producto como «y», y sin salir de los anchos, el controlador se vuelve una fórmula famosa de la teoría clásica: un controlador proporcional-derivativo.', tex: R`Si $|\theta| \le a$ y $|\omega| \le b$, entonces $F = \dfrac{F_{\max}}{2}\left(\dfrac{\theta}{a} + \dfrac{\omega}{b}\right)$.`, pasos: [
      { texto: R`Sean $u = \frac{\theta}{a}$, $v = \frac{\omega}{b}$. Los tres grados de $\theta$ suman 1, y su media de $i$ es $u$. Lo mismo para $\omega$ con $v$.`, porque: 'En cada tramo, dos rampas de suma 1 mezclan dos valores vecinos de $i$. Por ejemplo, si $u > 0$: $0 \\cdot (1 - u) + 1 \\cdot u = u$.' },
      { texto: R`Con producto: $\sum_{ij} w_{ij} = (\sum_i \mu_i)(\sum_j \nu_j) = 1$, luego no hay que dividir.`, porque: 'La suma de un producto de grados se factoriza.' },
      { texto: R`$F = F_{\max} \sum_{ij} \mu_i \nu_j \dfrac{i + j}{2} = \dfrac{F_{\max}}{2}\left(\sum_i i\mu_i + \sum_j j\nu_j\right) = \dfrac{F_{\max}}{2}(u + v)$.`, porque: 'Se reparte la suma, y se usa que cada lista de grados suma 1.' },
    ] },
    { tipo: 'nota', titulo: 'Sin engañarte', texto: 'Dos cosas honestas. Fíjate en que el carro sigue rodando: no le pedimos que se quede en su sitio, y en un riel real se saldría. Lo arreglas en la siguiente parada. Y en este caso, tan simétrico, con producto y dentro de los anchos, un controlador clásico iguala al difuso: es lo que acabas de demostrar. Lo difuso destaca cuando no hay un modelo, y cuando hay un experto al que preguntarle.' },
  ],
  tecnicas: [
    { titulo: 'Abre la caja', texto: 'Ante un sistema que funciona, intenta simplificarlo en un caso cómodo. Suele aparecer algo conocido, y entiendes por qué funciona.' },
    { titulo: 'Factoriza la suma doble', texto: 'Si un término de una suma doble es producto de algo en $i$ por algo en $j$, la suma se separa en dos. Ahorra casi siempre muchísimo trabajo.' },
  ],
  retos: [
    { id: 'sostenlo', tipo: 'manipular', enunciado: 'Con tus piezas: consigue que, en 6 segundos, el palo quede a menos de 1 grado de la vertical, y que no se caiga.', precision: (e) => (seSostiene(vuelo(e.a, e.atencion, e.F, Math.round(e.norma), 0)) ? 1 : 0), prueba: { atencion: 1, a: 20, F: 18, norma: 1 }, pendiente: () => 'Aún no se calma. ¿Está mirando la velocidad?', pistas: ['Sube «cuánto mira la velocidad».', 'Si se cae, aumenta la fuerza máxima, o reduce el ancho del ángulo.'], explicacion: 'Lo has conseguido: tu sistema de reglas sostiene un péndulo invertido.' },
    { id: 'tabla-calc', tipo: 'calcular', enunciado: R`Con $F_{\max} = 18$, y solo encendidas dos casillas: la de $k = 0{,}5$ con peso $0{,}75$, y la de $k = 1$ con peso $0{,}25$. ¿Qué fuerza se pide?`, respuesta: 11.25, tol: 0.01, pistas: [R`Media pesada: $0{,}375 + 0{,}25$. Luego, multiplica por $18$.`], explicacion: R`$0{,}625 \cdot 18 = 11{,}25$.` },
    { id: 'quien-falta', tipo: 'elegir', enunciado: '¿Por qué tu primera regla, solo con el ángulo, no calmaba el palo?', opciones: ['Porque la fuerza era demasiado grande', 'Porque ignoraba la velocidad: no frenaba al volver y se pasaba de largo', 'Porque el «y» era incorrecto', 'Porque el palo era muy largo'], correcta: 1, explicacion: 'Mirar la velocidad es anticiparse: frena antes de llegar.' },
    { id: 'demuestra-pd', tipo: 'demostrar', enunciado: R`Usa la fórmula de la recta para demostrar que el controlador pide fuerza 0 si $\frac{\theta}{a} = -\frac{\omega}{b}$. ¿Qué significa?`, pistas: ['Sustituye en la fórmula.'],
      solucion: [
        { texto: R`$F = \dfrac{F_{\max}}{2}\left(\dfrac{\theta}{a} + \dfrac{\omega}{b}\right) = \dfrac{F_{\max}}{2}\left(-\dfrac{\omega}{b} + \dfrac{\omega}{b}\right) = 0$.`, porque: 'Sustituir.' },
        { texto: R`Significa que está inclinado, y que vuelve a la vertical a la velocidad justa: no hay nada que corregir.`, porque: 'Son las casillas de la diagonal de ceros en la tabla.' },
      ] },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 11.', 'C. W. Anderson, A. G. Barto, R. S. Sutton (1983): el carro y la varilla.', 'K. M. Passino, S. Yurkovich, <em>Fuzzy Control</em>, 1998.'],
};
