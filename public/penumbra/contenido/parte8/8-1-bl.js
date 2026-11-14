import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { LOGICAS } from '../../nucleo/logicas.js';
import { curva, linea, mapaCalor, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const LISTA = [LOGICAS.lukasiewicz, LOGICAS.godel, LOGICAS.producto], DOM = [0, 1];

export default {
  id: '8-1-bl',
  titulo: 'BL: la lógica de las normas continuas',
  puente: 'BL es lo que tienen en común [[todas las normas|norma T]] continuas. Ahora, añadiendo un solo axioma cada vez, salen las tres lógicas clásicas de los grados.',
  pregunta: 'Te lo advertimos al principio: lo que tiene grados es la verdad de las frases, no el razonamiento. Las reglas para deducir son tan exactas como las clásicas. ¿Cuáles son?',
  escena: {
    id: 'bl', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: DOM, caja: { x: 90, y: 60, w: 470, h: 400 } },
    entradas: [
      { id: 'cual', tipo: 'deslizador', etiqueta: 'la norma (0 Łukasiewicz, 1 Gödel, 2 producto)', min: 0, max: 2, paso: 1, valor: 0 },
      { id: 'a', tipo: 'deslizador', etiqueta: 'la verdad de a', min: 0.05, max: 1, paso: 0.01, valor: 0.7 },
      { id: 'b', tipo: 'deslizador', etiqueta: 'la verdad de b', min: 0, max: 1, paso: 0.01, valor: 0.4 },
    ],
    pasos: [
      { dur: 2800, texto: 'Fija una verdad <b style="color:#58c4dd;font-weight:400">$a$</b>. La curva dice qué pasa al combinarla con «y» con cada posible $z$: es $T(a, z)$, [[una norma T|norma T]].' },
      { dur: 2400, texto: 'Pon un techo: <b style="color:#fc6282;font-weight:400">$b$</b>. Hay valores de $z$ que dejan el resultado por debajo del techo, y otros que se pasan.' },
      { dur: 3000, texto: '<b style="color:#f4d345;font-weight:400">El mayor $z$ que no se pasa</b>: esa es la verdad de «si $a$, entonces $b$». Es lo máximo que le puedes sumar a $a$ sin ir más allá de $b$.' },
      { dur: 3000, texto: 'Repítelo con todas las parejas, y sale un mapa: <b>la implicación entera nace de [[la norma|norma T]]</b>. Ya no hay que elegirla: [[cada norma|norma T]] trae la suya.' },
    ],
    primitivas({ q, paso, e }) {
      const L = LISTA[Math.round(e.cual)], a = e.a, b = e.b, z = L.r(a, b), al = ev(q(0), 0, 0.5), te = ev(q(1), 0, 0.5), zo = ev(q(2), 0, 0.5), mp = ev(q(3), 0, 0.6);
      const P = [marco({ x: DOM, y: DOM }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'z', y: R`T(a, z)` } }), curva((u) => [u, L.t(a, u)], DOM, { hasta: Math.max(ev(q(0), 0, 1), 1e-3), n: 300, color: AZUL, ancho: 3, brillo: true })];
      P.push(rotulo([0.02, 0.98], R`{\color{#58c4dd}a = ${coma(a)}}`, { clave: 'a', ancla: 'l', tam: 22, alfa: al }));
      if (te > 0) P.push(linea([0, b], [1, b], { color: ROSA, ancho: 2, alfa: te, discontinua: true }), rotulo([0.98, b], R`{\color{#fc6282}b = ${coma(b)}}`, { clave: 'b', ancla: 'r', dy: -14, tam: 20, alfa: te }));
      if (zo > 0) {
        P.push(poligono([[0, 0], [z, 0], [z, 0.03], [0, 0.03]], { color: ORO, alfa: 0.6 * zo }));
        P.push(punto([z, Math.min(1, L.t(a, z))], { color: ORO, radio: 7, alfa: zo }), linea([z, 0], [z, L.t(a, z)], { color: ORO, ancho: 2, alfa: zo }), punto([z, 0], { color: ORO, radio: 4, alfa: zo }));
        P.push(rotulo([z, 0], R`a \to b = {\color{#f4d345}${coma(z)}}`, { clave: 'z', dy: 34, tam: 21, ancla: z > 0.7 ? 'r' : 'l', alfa: zo }));
      }
      const M = [];
      if (mp > 0) {
        M.push(mapaCalor((u, v) => L.r(u, v), { clave: `bl${Math.round(e.cual)}` }), marco({ x: DOM, y: DOM }, { alfa: mp, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'a', y: 'b' } }), punto([a, b], { color: BLANCO, radio: 6, alfa: mp }));
        M.push(rotulo([0.5, 1], R`\text{${L.nombre}: todo } a \to b`, { clave: 'tm', dy: -20, tam: 18, color: GRIS2, alfa: mp }));
      }
      return { principal: P, paneles: [{ ejes: { x: DOM, y: DOM, caja: { x: 680, y: 90, w: 340, h: 340 } }, prims: M }] };
    },
  },
  manipulacion: '<ul><li>Sube $b$ por encima de $a$: la implicación vale 1, porque ya no hay techo que respetar.</li><li>Cambia de [[norma|norma T]]: la curva cambia, y con ella el mapa entero.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Hasta ahora, elegías una [[implicación]] de entre varias. Hay una forma más profunda de verlo: en lógica clásica, «$a$ y $z$ implican $b$» equivale a «$z$ implica que $a$ implica $b$». Si exiges que esto siga siendo así con grados, la implicación queda determinada por el «y». Se llama su [[residuo]]. Y lo que todas estas lógicas tienen en común es la lógica BL, de Petr Hájek (1998).' },
    { tipo: 'ejemplo', texto: 'Con $a = 0{,}7$ y $b = 0{,}4$: el mayor $z$ que combinado con $a$ no pasa de $b$.', tabla: [['Norma', 'T(0,7; z) ≤ 0,4', 'Mayor z'], ['Łukasiewicz', '0,7 + z − 1 ≤ 0,4', '0,7'], ['Gödel', 'mín(0,7; z) ≤ 0,4', '0,4'], ['Producto', '0,7 · z ≤ 0,4', '0,57']], cierre: 'Los valores 0,7 y 0,4 ya los viste en «Si… entonces, con grados»: entonces eran fórmulas sueltas; ahora, salen de una misma idea.' },
    { tipo: 'simbolos', intro: 'BL tiene dos operaciones básicas. Una constante, $\\bar{0}$, es lo totalmente falso.', piezas: [
      { tex: R`\varphi \,\&\, \psi`, dice: 'El «y fuerte»: [[una norma T|norma T]]. Las letras griegas $\\varphi$ («fi») y $\\psi$ («psi») son frases cualesquiera.' },
      { tex: R`\varphi \to \psi`, dice: 'La implicación: su residuo.' },
      { tex: R`\neg \varphi := \varphi \to \bar{0}`, dice: '«No» se define: que $\\varphi$ lleve a lo falso. El signo $:=$ se lee «se define como».' },
      { tex: R`\varphi \wedge \psi := \varphi \,\&\, (\varphi \to \psi)`, dice: 'El «y débil»: en [[las normas|norma T]] continuas, sale ser el mínimo.' },
    ], todo: R`T(a, z) \le b \iff z \le (a \to b)`, lee: '«Combinar $a$ con $z$ no se pasa de $b$ exactamente cuando $z$ no se pasa de $a \\to b$». Esta equivalencia es el corazón de todo.' },
    { tipo: 'simbolos', etiqueta: 'Los axiomas', intro: 'Los [[axiomas|axioma]] de BL, leídos. Se deduce con una sola regla, el [[modus ponens]].', piezas: [
      { tex: R`(\varphi \to \psi) \to ((\psi \to \chi) \to (\varphi \to \chi))`, dice: 'Encadenar: si $\\varphi$ lleva a $\\psi$, y $\\psi$ a $\\chi$, entonces $\\varphi$ lleva a $\\chi$.' },
      { tex: R`(\varphi \,\&\, \psi) \to \varphi`, dice: 'Quitar: de «los dos», sale uno.' },
    ] },
    { tipo: 'simbolos', etiqueta: 'Los axiomas', intro: 'Dos más, sobre el orden.', piezas: [
      { tex: R`(\varphi \,\&\, \psi) \to (\psi \,\&\, \varphi)`, dice: 'Cambiar de orden.' },
      { tex: R`(\varphi \,\&\, (\varphi \to \psi)) \to (\psi \,\&\, (\psi \to \varphi))`, dice: 'El «y débil» también se puede cambiar de orden.' },
    ] },
    { tipo: 'simbolos', etiqueta: 'Los axiomas', intro: 'El corazón, como axioma.', piezas: [
      { tex: R`(\varphi \to (\psi \to \chi)) \to ((\varphi \,\&\, \psi) \to \chi)`, dice: 'Juntar dos condiciones en una.' },
      { tex: R`((\varphi \,\&\, \psi) \to \chi) \to (\varphi \to (\psi \to \chi))`, dice: 'Y al revés: separarlas. Juntos son el corazón, escrito como axioma.' },
    ] },
    { tipo: 'simbolos', etiqueta: 'Los axiomas', intro: 'Y los dos últimos.', piezas: [
      { tex: R`((\varphi \to \psi) \to \chi) \to (((\psi \to \varphi) \to \chi) \to \chi)`, dice: 'Por casos: si $\\chi$ sale tanto suponiendo $\\varphi \\to \\psi$ como $\\psi \\to \\varphi$, sale siempre. Solo tiene sentido porque los grados se comparan todos.' },
      { tex: R`\bar{0} \to \varphi`, dice: 'De lo falso se sigue cualquier cosa.' },
    ] },
    { tipo: 'formal', titulo: 'La lógica BL', tex: R`Sus fórmulas se construyen con letras, $\&$, $\to$ y $\bar{0}$. Una interpretación da a cada letra un valor de $[0, 1]$, y calcula el resto con [[una norma T|norma T]] continua y su residuo. Una [[tautología]] de BL es una fórmula que vale 1 en todas las interpretaciones, con todas esas [[normas|norma T]].`, lee: 'En la región 8, «ser verdad» significa valer exactamente 1. Los grados intermedios existen, pero lo que se demuestra es que algo vale 1.' },
    { tipo: 'demo', titulo: 'La implicación vale 1 justo cuando hay orden', plan: 'Con el corazón de la región, y un truco: elegir $z = 1$.', tex: R`$a \to b = 1$ si y solo si $a \le b$.`, pasos: [
      { texto: R`En el corazón, toma $z = 1$: $T(a, 1) \le b \iff 1 \le (a \to b)$.`, porque: 'La equivalencia vale para cualquier $z$.' },
      { texto: R`Como $T(a, 1) = a$, la izquierda dice $a \le b$.`, porque: 'El 1 es el elemento que no cambia nada en [[una norma T|norma T]].' },
      { texto: R`Como $a \to b$ no pasa de 1, la derecha dice $a \to b = 1$.`, porque: 'Por tanto, las dos frases son equivalentes.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Define por lo que debe cumplir', texto: 'Igual que el operador alfa: la implicación se define como «el mayor número que cumple esto». La definición ya trae dentro la propiedad más útil.' },
    { titulo: 'Sustituye el valor más cómodo', texto: 'Una equivalencia que vale para todo $z$ es una máquina: elige el $z$ que te convenga.' },
  ],
  retos: [
    { id: 'busca-residuo', tipo: 'manipular', enunciado: R`Con Łukasiewicz, busca $a$ y $b$ con $a \to b$ igual a $0{,}5$, con margen de $0{,}03$.`, precision: (e) => (Math.round(e.cual) === 0 && Math.abs(LOGICAS.lukasiewicz.r(e.a, e.b) - 0.5) <= 0.03 ? 1 : 0), prueba: { cual: 0, a: 0.9, b: 0.4 }, pendiente: (e) => `Ahora, la implicación vale ${LISTA[Math.round(e.cual)].r(e.a, e.b).toFixed(2).replace('.', ',')}.`, pistas: ['En Łukasiewicz vale $1 - a + b$, cuando $a > b$.'], explicacion: 'Lo que falta para 1 es exactamente lo que $a$ le lleva de ventaja a $b$.' },
    { id: 'residuo-calc', tipo: 'calcular', enunciado: R`Con el producto, ¿cuánto vale $0{,}8 \to 0{,}2$?`, respuesta: 0.25, tol: 0.001, pistas: [R`El mayor $z$ con $0{,}8 \cdot z \le 0{,}2$.`], explicacion: R`$z = \frac{0{,}2}{0{,}8} = 0{,}25$.` },
    { id: 'bl-elegir', tipo: 'elegir', enunciado: '¿Qué significa que una fórmula sea una tautología de BL?', opciones: ['Que vale más de 0,5', 'Que vale 1, sea cual sea [[la norma T|norma T]] continua y los valores de sus letras', 'Que vale 1 en al menos [[una norma|norma T]]', 'Que no se puede demostrar'], correcta: 1, explicacion: 'Tiene que aguantar en [[todas las normas|norma T]] continuas, y con todos los valores.' },
    { id: 'demuestra-uno', tipo: 'demostrar', enunciado: R`Demuestra que $1 \to b = b$.`, pistas: ['Usa la definición: el mayor $z$ con $T(1, z) \\le b$.'],
      solucion: [
        { texto: R`Como $T(1, z) = z$, se busca el mayor $z$ con $z \le b$.`, porque: 'El 1 no cambia nada en [[una norma T|norma T]].' },
        { texto: R`Ese $z$ es $b$.`, porque: 'Es decir: una implicación con condición totalmente cierta vale lo que su conclusión.' },
      ] },
  ],
  referencias: ['P. Hájek, <em>Metamathematics of Fuzzy Logic</em>, Kluwer, 1998.', 'Stanford Encyclopedia of Philosophy, «Fuzzy Logic».', 'Fuzzy Logic, hojas de ejercicios, TU Dresden (en <code>fuentes/referencias/dresden</code>).'],
};
