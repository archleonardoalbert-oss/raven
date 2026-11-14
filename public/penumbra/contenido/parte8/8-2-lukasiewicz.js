import { AZUL, GRIS2, ORO, ROSA, BLANCO } from '../../motor/colores.js';
import { LOGICAS, neg, sumaOrdinal } from '../../nucleo/logicas.js';
import { curva, linea, mapaCalor, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const LISTA = [LOGICAS.lukasiewicz, LOGICAS.godel, LOGICAS.producto], COLOR = [AZUL, ROSA, BLANCO], DOM = [0, 1];
const X = [50, 300, 550], X4 = 810, W = 210;

export default {
  id: '8-2-lukasiewicz',
  titulo: 'Las tres grandes',
  puente: 'Las tres grandes son [[normas|norma T]] continuas. ¿Y si [[la norma|norma T]] da un salto? Entonces BL ya no alcanza: hace falta una lógica más amplia.',
  pregunta: 'Si BL es lo común a [[todas las normas|norma T]] continuas, ¿qué hace especial a cada una? Basta con añadir una sola regla, y sale cada lógica.',
  escena: {
    id: 'tres-grandes', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: DOM, caja: { x: X[0], y: 70, w: W, h: 190 } },
    entradas: [
      { id: 'a', tipo: 'deslizador', etiqueta: 'la verdad de a', min: 0, max: 1, paso: 0.01, valor: 0.8 },
      { id: 'c', tipo: 'deslizador', etiqueta: 'dónde se cortan los dos bloques', min: 0.1, max: 0.9, paso: 0.01, valor: 0.5 },
    ],
    pasos: [
      { dur: 2600, texto: 'Arriba, las tres grandes [[normas|norma T]], vistas desde arriba: <b style="color:#58c4dd;font-weight:400">Łukasiewicz</b>, <b style="color:#fc6282;font-weight:400">Gödel</b> y <b>producto</b>. Más claro significa más verdad.' },
      { dur: 3000, texto: 'Abajo, la negación que trae cada una. En Łukasiewicz es <b>$1 - a$</b>, y negar dos veces te devuelve al sitio. En las otras dos, solo lo totalmente falso se niega a 1: <b>todo lo demás se niega a 0</b>.' },
      { dur: 3000, texto: '¿Y $a \\,\\&\\, a$, decir lo mismo dos veces? En Gödel no cambia nada: <b>repetir no cuesta</b>. En las otras dos, baja: el punto dorado lo muestra. Cada repetición gasta verdad.' },
      { dur: 3600, texto: 'Un teorema precioso: <b style="color:#f4d345;font-weight:400">toda [[norma|norma T]] continua se construye con estas tres</b>, poniéndolas en bloques sobre la diagonal, con el mínimo en el resto. Mueve el corte.' },
    ],
    primitivas({ q, e }) {
      const a = e.a, al = ev(q(0), 0, 0.4), ne = ev(q(1), 0, 0.5), co = ev(q(2), 0, 0.5), bl = ev(q(3), 0, 0.5), c = e.c, paneles = [];
      LISTA.forEach((L, i) => {
        const M = [mapaCalor(L.t, { clave: `tres${i}` }), marco({ x: DOM, y: DOM }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] } }), rotulo([0.5, 1], R`\text{${L.nombre}}`, { clave: `n${i}`, dy: -16, tam: 19, color: COLOR[i], alfa: al })];
        paneles.push({ ejes: { x: DOM, y: DOM, caja: { x: X[i], y: 70, w: W, h: 190 } }, prims: M });
        const D = [marco({ x: DOM, y: DOM }, { alfa: ne, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'a' } })];
        if (ne > 0) {
          if (i === 0) D.push(curva((u) => [u, 1 - u], DOM, { n: 2, color: COLOR[i], ancho: 2.8, alfa: ne }));
          else D.push(punto([0, 1], { color: COLOR[i], radio: 5, alfa: ne }), curva((u) => [u, 0], [0.004, 1], { n: 2, color: COLOR[i], ancho: 2.8, alfa: ne }));
          D.push(rotulo([0.5, 1], R`\neg a = ${coma(neg(L, a))}`, { clave: `ne${i}`, dy: -14, tam: 18, alfa: ne }), punto([a, neg(L, a)], { color: COLOR[i], radio: 6, alfa: ne }));
        }
        if (co > 0) D.push(curva((u) => [u, L.t(u, u)], DOM, { n: 100, color: ORO, ancho: 2, alfa: co }), punto([a, L.t(a, a)], { color: ORO, radio: 6, alfa: co }), rotulo([0.02, 0.86], R`{\color{#f4d345}a \,\&\, a = ${coma(L.t(a, a))}}`, { clave: `co${i}`, ancla: 'l', tam: 15, alfa: co }));
        paneles.push({ ejes: { x: DOM, y: DOM, caja: { x: X[i], y: 320, w: W, h: 160 } }, prims: D });
      });
      const T = sumaOrdinal([[0, c, LOGICAS.lukasiewicz.t], [c, 1, LOGICAS.producto.t]]), S = [];
      if (bl > 0) {
        S.push(mapaCalor(T, { clave: `suma${c.toFixed(2)}` }), marco({ x: DOM, y: DOM }, { alfa: bl, ticks: { x: [0, 1], y: [0, 1] } }), linea([0, c], [1, c], { color: BLANCO, ancho: 1.2, alfa: 0.7 * bl, discontinua: true }), linea([c, 0], [c, 1], { color: BLANCO, ancho: 1.2, alfa: 0.7 * bl, discontinua: true }));
        S.push(rotulo([0.5, 1], R`\text{Una norma nueva}`, { clave: 'nuevo', dy: -16, tam: 19, color: ORO, alfa: bl }));
      }
      const L4 = [];
      if (bl > 0) L4.push(rotulo([105, 26], R`\text{Bloque de abajo: Łukasiewicz}`, { clave: 'l1', tam: 15, color: AZUL, alfa: bl }), rotulo([105, 54], R`\text{Bloque de arriba: producto}`, { clave: 'l2', tam: 15, alfa: bl }), rotulo([105, 82], R`\text{En el resto: mínimo}`, { clave: 'l3', tam: 15, color: GRIS2, alfa: bl }));
      paneles.push({ ejes: { x: DOM, y: DOM, caja: { x: X4, y: 70, w: W, h: 190 } }, prims: S }, { ejes: { x: [0, 210], y: [160, 0], caja: { x: X4, y: 320, w: W, h: 160 } }, prims: L4 });
      return { principal: [], paneles };
    },
  },
  manipulacion: '<ul><li>Mueve $a$, y compara las negaciones y las repeticiones en las tres.</li><li>Mueve el corte: la nueva [[norma|norma T]] cambia, y sigue siendo [[una norma|norma T]] continua.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'BL es lo común. Cada una de las tres grandes añade una sola regla, y cada regla dice qué valor tiene una intuición clásica. ¿Negar dos veces deshace la negación? Solo en Łukasiewicz. ¿Repetir una frase no cambia nada? Solo en Gödel. Elegir lógica es elegir qué intuiciones conservar.' },
    { tipo: 'ejemplo', texto: 'Con $a = 0{,}8$:', tabla: [['', 'Łukasiewicz', 'Gödel', 'Producto'], ['a & a', '0,6', '0,8', '0,64'], ['¬a', '0,2', '0', '0'], ['¬¬a', '0,8', '1', '1'], ['a → 0,4', '0,6', '0,4', '0,5']], cierre: 'En Gödel solo importa qué número es mayor, no cuánto: la lógica ve únicamente el orden. En Łukasiewicz importa la distancia. En el producto, la proporción.' },
    { tipo: 'simbolos', intro: 'La regla que se añade a BL para cada una.', piezas: [
      { tex: R`\neg\neg\varphi \to \varphi`, dice: 'Łukasiewicz: negar dos veces deshace.' },
      { tex: R`\varphi \to (\varphi \,\&\, \varphi)`, dice: 'Gödel: repetir no cuesta. Se llama contracción.' },
      { tex: R`\neg\varphi \vee \big((\varphi \to (\varphi \,\&\, \psi)) \to \psi\big)`, dice: 'Producto: o $\\varphi$ es del todo falsa, o se puede cancelar, como al dividir: si $\\varphi \\,\\&\\, \\psi$ conserva toda la verdad de $\\varphi$, entonces $\\psi$ es del todo cierta. Hájek lo escribió con dos axiomas; este los resume.' },
    ], todo: R`\text{Ł} = \text{BL} + \neg\neg\varphi \to \varphi`, lee: 'Solo hay que añadir un axioma a los de BL.' },
    { tipo: 'formal', titulo: 'Teorema de Mostert y Shields (1957)', tex: R`Toda [[norma T]] continua es una suma ordinal: hay intervalos $[u_k, v_k]$ que no se solapan más que en los extremos; en cada uno, [[la norma|norma T]] es una copia reescalada de la de Łukasiewicz o de la del producto; y fuera de esos bloques, es el mínimo.`, lee: 'Es decir: las tres grandes son las piezas de todas las demás. Por eso se estudian primero.' },
    { tipo: 'demo', titulo: 'Negar dos veces', plan: 'Se calcula, en cada caso, a partir de la definición de $\\neg a$ como $a \\to 0$.', tex: R`En Łukasiewicz, $\neg\neg a = a$. En Gödel y en el producto, si $a > 0$, entonces $\neg\neg a = 1$.`, pasos: [
      { texto: R`Łukasiewicz: $a \to 0 = \min(1,\ 1 - a) = 1 - a$. Dos veces: $1 - (1 - a) = a$.`, porque: 'Se sustituye en el residuo.' },
      { texto: R`Gödel: si $a > 0$, $a \to 0 = 0$, porque el mayor $z$ con $\min(a, z) \le 0$ es 0.`, porque: 'Como $a > 0$, el mínimo solo es 0 si $z = 0$.' },
      { texto: R`Producto: si $a > 0$, $a \cdot z \le 0$ fuerza $z = 0$. También da $\neg a = 0$.`, porque: 'Un producto de positivos no es 0.' },
      { texto: R`Por tanto, en esos dos: $\neg\neg a = \neg 0 = 1$.`, porque: 'Por eso sus negaciones son tan bruscas: en ellas, casi nada se puede negar con matices.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Clasifica por lo que conservan', texto: 'Para distinguir dos teorías, busca qué frase cumple una y no la otra. Un solo axioma separa estas tres.' },
  ],
  retos: [
    { id: 'busca-contraccion', tipo: 'manipular', enunciado: R`Busca un $a$ mayor que $0{,}5$ con el que, en Łukasiewicz, $a \,\&\, a$ baje de $0{,}3$.`, precision: (e) => (e.a > 0.5 && LOGICAS.lukasiewicz.t(e.a, e.a) < 0.3 ? 1 : 0), prueba: { a: 0.6 }, pendiente: (e) => `Ahora vale ${LOGICAS.lukasiewicz.t(e.a, e.a).toFixed(2).replace('.', ',')}.`, pistas: [R`Vale $2a - 1$, cuando es positivo.`], explicacion: 'Una frase que está bastante cerca del término medio pierde casi toda su verdad al repetirla. En Gödel no pierde nada.' },
    { id: 'negacion-calc', tipo: 'calcular', enunciado: R`En Łukasiewicz, ¿cuánto vale $\neg(0{,}7 \,\&\, 0{,}6)$?`, respuesta: 0.7, tol: 0.001, pistas: [R`$0{,}7 \,\&\, 0{,}6 = 0{,}7 + 0{,}6 - 1$.`], explicacion: R`$\neg 0{,}3 = 0{,}7$.` },
    { id: 'tres-elegir', tipo: 'elegir', enunciado: '¿En cuál de las tres lógicas importa solo el orden de los valores, y no cuánto se separan?', opciones: ['Łukasiewicz', 'Gödel', 'Producto', 'En ninguna'], correcta: 1, explicacion: 'Sus fórmulas solo comparan: mínimo, y si es menor o igual. Solo le importa qué número es mayor.' },
    { id: 'demuestra-goedel', tipo: 'demostrar', enunciado: R`Demuestra que la contracción $\varphi \to (\varphi \,\&\, \varphi)$ vale 1 en Gödel, para cualquier valor.`, pistas: ['Calcula $a \\,\\&\\, a$ con el mínimo.'],
      solucion: [
        { texto: R`En Gödel, $a \,\&\, a = \min(a, a) = a$.`, porque: 'El mínimo de un número consigo mismo.' },
        { texto: R`Queda $a \to a$, que vale 1 porque $a \le a$.`, porque: 'La implicación vale 1 justo cuando hay orden.' },
      ] },
  ],
  referencias: ['P. Hájek, <em>Metamathematics of Fuzzy Logic</em>, 1998, cap. 3 y 4.', 'P. Cintula, «About axiomatic systems of product fuzzy logic», <em>Soft Computing</em> 5 (2001).', 'P. S. Mostert, A. L. Shields, «On the structure of semigroups on a compact manifold with boundary», <em>Annals of Mathematics</em> 65 (1957).', 'Stanford Encyclopedia of Philosophy, «Fuzzy Logic».'],
};
