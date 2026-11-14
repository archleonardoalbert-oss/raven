import { AZUL, BLANCO, GRIS2, ORO, ROJO, ROSA } from '../../motor/colores.js';
import { DATOS_ANFIS, INICIO_ANFIS, anfisEntrena, anfisSalida } from '../../nucleo/aprender.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v, d = 2) => v.toFixed(d).replace('.', '{,}');
const DOM = [0, 1], EPOCAS = 300, CADA = 3, COLOR = [AZUL, ROSA, BLANCO, ORO];
const HIST = anfisEntrena(INICIO_ANFIS, DATOS_ANFIS, { epocas: EPOCAS, eta: 0.25, cada: CADA });
const estado = (ep) => HIST[Math.min(HIST.length - 1, Math.round(ep / CADA))];

export default {
  id: '7-2-anfis',
  titulo: 'Reglas que se ajustan solas: ANFIS',
  puente: 'Tus sistemas ya aprenden. Pero aún dan por seguro el significado de cada palabra. ¿Y si tampoco estás seguro de la curva? Entonces, la propia curva necesita un margen.',
  pregunta: 'Las reglas las escribe un experto. ¿Y si no hay experto, pero sí ejemplos? ¿Pueden unas reglas corregirse solas, como una red neuronal, y seguir siendo legibles?',
  escena: {
    id: 'anfis', formato: 'plano', W: 1100, H: 600,
    ejes: { x: DOM, y: [0, 1], caja: { x: 80, y: 44, w: 620, h: 140 } },
    entradas: [{ id: 'epoca', tipo: 'deslizador', etiqueta: 'vueltas de entrenamiento', min: 0, max: EPOCAS, paso: 3, valor: 0 }],
    pasos: [
      { dur: 2400, texto: 'Puntos blancos: ejemplos de lo que debería hacer el sistema. Arriba, las condiciones de cuatro reglas, puestas sin pensar. Abajo, lo que da el sistema: <b style="color:#f4d345;font-weight:400">una raya casi plana</b>.' },
      { dur: 2800, texto: 'En rojo, <b style="color:#f05a5a;font-weight:400">el error en cada ejemplo</b>. Cada número del sistema, centros, anchos y resultados, se puede mover un poquito. ¿Hacia dónde baja el error?' },
      { dur: 4800, texto: 'Eso lo dice el <b>gradiente</b>. Se da un pasito cuesta abajo, y se repite. Mira: las curvas se mueven y se ajustan solas, y el error <b style="color:#f4d345;font-weight:400">se hunde</b>.' },
      { dur: 2200, texto: 'A la derecha están las reglas aprendidas. A diferencia de una red neuronal, <b>se pueden leer</b>. Ahora rebobina tú, y entrena poco a poco.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.5), er = ev(q(1), 0, 0.5), ep = paso < 2 ? 0 : paso === 2 ? ev(q(2), 0, 1) * EPOCAS : mix(EPOCAS, e.epoca, ev(q(3), 0.55, 1)), { p, error } = estado(ep), f = (x) => anfisSalida(p, x);
      const A = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] } }), rotulo([0.5, 1], R`\text{Las condiciones de las reglas}`, { clave: 'ta', dy: -18, tam: 16, color: GRIS2, alfa: al })];
      p.c.forEach((c, i) => A.push(curva((x) => [x, Math.exp(-((x - c) ** 2) / (2 * p.s[i] ** 2))], DOM, { n: 100, color: COLOR[i], ancho: 2.4, alfa: al })));
      const B = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x', y: 'z' } })];
      const modelo = curva((x) => [x, f(x)], DOM, { hasta: Math.max(ev(q(0), 0.2, 1), 1e-3), n: 200, color: ORO, ancho: 3.2, brillo: true });
      if (er > 0) DATOS_ANFIS.forEach(([x, y], i) => { if (i % 2 === 0) B.push(linea([x, y], [x, f(x)], { color: ROJO, ancho: 1.4, alfa: 0.85 * er }), punto([x, f(x)], { color: ROJO, radio: 2, alfa: er, halo: 0 })); });
      B.push(modelo);
      DATOS_ANFIS.forEach(([x, y]) => B.push(punto([x, y], { color: BLANCO, radio: 4, alfa: al, halo: 0 })));
      const G = [marco({ x: [0, EPOCAS], y: [0, 0.18] }, { alfa: er, ticks: { x: [0, EPOCAS], y: [0, 0.18] }, etiquetas: { x: R`\text{vueltas}` } }), rotulo([EPOCAS / 2, 0.18], R`\text{El error}`, { clave: 'tg', dy: -18, tam: 16, color: GRIS2, alfa: er })];
      if (ep >= CADA && er > 0) { const hasta = HIST.filter((h) => h.epoca <= ep); if (hasta.length > 1) G.push(curva((u) => { const j = Math.min(hasta.length - 1, Math.round(u * (hasta.length - 1))); return [hasta[j].epoca, Math.min(0.18, hasta[j].error)]; }, [0, 1], { n: Math.min(100, hasta.length - 1), color: ROJO, ancho: 2.4 })); }
      if (er > 0) G.push(punto([ep, Math.min(0.18, error)], { color: ROJO, radio: 6, alfa: er }));
      const T = [];
      const rt = ev(q(3), 0, 0.4);
      T.push(rotulo([135, 10], R`\text{error} = {\color{#f05a5a}${coma(error, 3)}}`, { clave: 'e', tam: 22, alfa: er }));
      if (rt > 0) p.c.forEach((c, i) => T.push(rotulo([135, 56 + i * 34], R`\text{si } x \approx ${coma(c)} \Rightarrow z = ${coma(p.z[i])}`, { clave: `r${i}`, tam: 18, color: COLOR[i], alfa: rt })));
      return { principal: A, paneles: [{ ejes: { x: DOM, y: [0, 1], caja: { x: 80, y: 230, w: 620, h: 310 } }, prims: B }, { ejes: { x: [0, EPOCAS], y: [0, 0.18], caja: { x: 790, y: 60, w: 260, h: 170 } }, prims: G }, { ejes: { x: [0, 270], y: [230, 0], caja: { x: 780, y: 300, w: 270, h: 230 } }, prims: T }] };
    },
  },
  manipulacion: '<ul><li>Mueve las vueltas despacio: mira cómo las curvas de arriba se reparten por la zona.</li><li>Compara las reglas al principio y al final: los números cuentan qué aprendió.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un sistema de Sugeno es una fórmula con muchos números: los centros, los anchos y los resultados. Y es [[derivable]] en todos ellos. Eso permite ajustarlo igual que una red neuronal, con [[gradiente]]. Jang lo llamó ANFIS en 1993: sistema de inferencia difusa adaptativo, basado en redes.' },
    { tipo: 'ejemplo', texto: 'Las cuatro capas de lo que has visto, para una sola entrada:', tabla: [['Capa', 'Hace', 'Números que se ajustan'], ['1', 'Da el grado de cada palabra', 'centros y anchos'], ['2', 'Normaliza: cada fuerza entre la suma', 'ninguno'], ['3', 'Multiplica por el resultado de la regla', 'los resultados'], ['4', 'Suma todo', 'ninguno']], cierre: 'Es un sistema de reglas, dibujado como una red. Con varias entradas, se añade una capa que combina las condiciones con un «y».' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\bar{w}_i = \frac{w_i}{\sum_j w_j}`, dice: 'La fuerza normalizada de la regla: todas juntas suman 1. La barra se lee «normalizada».' },
      { tex: R`f = \sum_i \bar{w}_i z_i`, dice: 'La salida del sistema.' },
      { tex: R`E = \frac{1}{2}(f - y)^2`, dice: 'El error en un ejemplo, cuyo valor correcto es $y$. El cuadrado evita que se cancelen los errores de signos distintos.' },
      { tex: R`\eta`, dice: 'La letra griega «eta»: lo largo que es cada paso. Se llama tasa de aprendizaje.' },
    ], todo: R`z_i \leftarrow z_i - \eta\, \frac{\partial E}{\partial z_i}`, lee: '«Mueve $z_i$ un poquito en el sentido en que baja el error». La $\\partial$ se lee «de»: es la [[derivada]] respecto a un solo número, dejando fijos los demás.' },
    { tipo: 'formal', titulo: 'Entrenamiento', tex: R`Para cada número $\theta$ del sistema, repetir $\theta \leftarrow \theta - \eta\, \frac{\partial}{\partial \theta} \sum_k E_k$, sumando en todos los ejemplos $k$. El método original de Jang es híbrido: los resultados $z_i$ se calculan de una vez, resolviendo un sistema lineal, y lo demás se ajusta con el gradiente.`, lee: 'Aquí, para verlo más claro, todo se mueve con el gradiente. El híbrido suele llegar antes, y no siempre al mismo arreglo.' },
    { tipo: 'demo', titulo: 'Cada regla se corrige en proporción a su culpa', plan: 'Se calcula una derivada, y sale algo muy intuitivo: una regla apenas se mueve si no ha intervenido en ese ejemplo.', tex: R`$\dfrac{\partial E}{\partial z_i} = (f - y)\, \bar{w}_i$.`, pasos: [
      { texto: R`Por la regla de la cadena: $\dfrac{\partial E}{\partial z_i} = (f - y)\, \dfrac{\partial f}{\partial z_i}$.`, porque: 'La derivada de $\\frac{1}{2}u^2$ es $u$, por la derivada de lo de dentro, $u = f - y$.' },
      { texto: R`Como $f = \sum_j \bar{w}_j z_j$, y los pesos no dependen de $z_i$: $\dfrac{\partial f}{\partial z_i} = \bar{w}_i$.`, porque: 'Solo un sumando contiene $z_i$, y su coeficiente es $\\bar{w}_i$.' },
      { texto: R`Por tanto, el ajuste de $z_i$ es $-\eta\, (f - y)\, \bar{w}_i$.`, porque: 'Error multiplicado por participación: si $\\bar{w}_i \\approx 0$, la regla no estaba activa, y no se la culpa.' },
    ] },
    { tipo: 'nota', titulo: 'Con cuidado', texto: 'El paso importa: en este mismo ejemplo, duplicar $\\eta$ deja al sistema atascado con un error mucho mayor. Y entrenar puede volver raras las reglas: un centro se escapa fuera de la zona de datos, como te puede pasar aquí con el primero. La interpretabilidad no es gratis: hay que vigilarla.' },
  ],
  tecnicas: [
    { titulo: 'Si es derivable, se puede entrenar', texto: 'Cualquier fórmula derivable se puede ajustar con el gradiente. Por eso se prefiere el producto al mínimo, y las gaussianas a los triángulos, cuando hay que aprender.' },
  ],
  retos: [
    { id: 'entrena', tipo: 'manipular', enunciado: R`Entrena lo justo para que el error baje de $0{,}02$. No hace falta llegar al final.`, precision: (e) => (estado(e.epoca).error < 0.02 ? 1 : 0), prueba: { epoca: 300 }, pendiente: (e) => `Ahora el error es ${estado(e.epoca).error.toFixed(3).replace('.', ',')}.`, pistas: ['Súbelo poco a poco, mirando el número rojo.'], explicacion: 'La mayor parte de la mejora llega muy pronto; luego, afinar cuesta mucho más.' },
    { id: 'gradiente-calc', tipo: 'calcular', enunciado: R`En un ejemplo, $f = 0{,}7$ e $y = 0{,}5$; la regla tiene $\bar{w}_i = 0{,}5$ y $\eta = 0{,}1$. ¿Cuánto cambia $z_i$?`, respuesta: -0.01, tol: 0.0001, pistas: [R`Es $-\eta\, (f - y)\, \bar{w}_i$.`], explicacion: R`$-0{,}1 \cdot 0{,}2 \cdot 0{,}5 = -0{,}01$. Baja, porque el sistema se pasó.` },
    { id: 'anfis-elegir', tipo: 'elegir', enunciado: '¿Qué tiene ANFIS que no tiene una red neuronal normal?', opciones: ['Que no necesita datos', 'Que siempre acierta más', 'Que el resultado del entrenamiento se puede leer como reglas', 'Que no usa derivadas'], correcta: 2, explicacion: 'Cada grupo de números es una regla con sentido. Aunque no siempre sale una redacción perfecta.' },
    { id: 'demuestra-derivada', tipo: 'demostrar', enunciado: R`Si el sistema acierta exactamente un ejemplo, $f = y$, demuestra que ese ejemplo no mueve ningún $z_i$.`, pistas: ['Mira la fórmula del ajuste.'],
      solucion: [
        { texto: R`El ajuste es $-\eta\, (f - y)\, \bar{w}_i$.`, porque: 'Lo demostrado.' },
        { texto: R`Como $f - y = 0$, vale 0, para todo $i$.`, porque: 'Sin error, no hay nada que corregir.' },
      ] },
  ],
  referencias: ['J.-S. R. Jang, «ANFIS: adaptive-network-based fuzzy inference system», <em>IEEE Trans. SMC</em> 23 (1993).', 'J.-S. R. Jang, C.-T. Sun, E. Mizutani, <em>Neuro-Fuzzy and Soft Computing</em>, 1997.'],
};
