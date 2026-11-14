import { AZUL, BLANCO, GRIS2, ORO, ROJO, ROSA } from '../../motor/colores.js';
import { NILPOTENTE } from '../../nucleo/logicas.js';
import { curva, linea, mapaCalor, marco, punto, rotulo, terreno } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const DOM = [0, 1];
const GLSL = 'float n=x+y>1.?min(x,y):0.;return mix(min(x,y),n,uM);';

export default {
  id: '8-3-mtl',
  titulo: 'MTL: cuando la norma da un salto',
  puente: 'Ya hay muchas lógicas, y todas funcionan igual. Cuando varias teorías se parecen tanto, los matemáticos buscan la estructura común. Es la hora del álgebra.',
  pregunta: '¿Qué condición mínima debe cumplir un «y» para que tenga su propia implicación? Todo el edificio descansa en esto, y la respuesta es muy fina: se puede saltar, pero solo hacia un lado.',
  escena: {
    id: 'mtl', formato: '3d', W: 1100, H: 660, render3d: { cx: 345, cy: 360, S: 320 },
    entradas: [
      { id: 'a', tipo: 'deslizador', etiqueta: 'la verdad de a', min: 0.1, max: 0.95, paso: 0.01, valor: 0.7 },
      { id: 'b', tipo: 'deslizador', etiqueta: 'el techo b', min: 0, max: 0.9, paso: 0.01, valor: 0.2 },
    ],
    pasos: [
      { dur: 2400, texto: 'El terreno del mínimo, que ya conoces: suave, sin saltos. Es [[una norma|norma T]] continua, de las que estudia BL.' },
      { dur: 3000, texto: 'Ahora, el <b style="color:#f05a5a;font-weight:400">mínimo nilpotente</b>: si $a + b \\le 1$, vale 0 de golpe. Aparece un acantilado por la diagonal. ¿Sigue siendo [[una norma T|norma T]]? Sí. ¿Tiene implicación?' },
      { dur: 3200, texto: 'Mira un corte, a la derecha. Da un salto, pero el valor del punto del salto pertenece a la parte de abajo. <b style="color:#f4d345;font-weight:400">Existe un mayor $z$ que no se pasa del techo</b>: está justo en el borde.' },
      { dur: 4000, texto: 'Compara con [[la norma|norma T]] drástica, en <b style="color:#f05a5a;font-weight:400">rojo</b>: el salto está justo al final, y el punto pertenece a la parte de arriba. Con el techo por debajo de $a$, te acercas a 1 sin llegar nunca: <b>no hay mayor $z$</b>. Sin residuo, no hay lógica.' },
    ],
    primitivas({ q, paso, e }) {
      const a = e.a, b = e.b, ba = ev(q(0), 0, 0.3), M = paso === 0 ? 0 : ev(q(1), 0, 0.8), corte = ev(q(2), 0, 0.5), dr = paso === 3 ? ev(q(3), 0.02, 0.2) : 0;
      const F = (x, y) => mix(Math.min(x, y), NILPOTENTE.t(x, y), M);
      const P = [marco({ x: DOM, y: DOM, z: DOM }, { alfa: ba, etiquetas: { x: 'a', y: 'z' } }), terreno(F, { glsl: GLSL, uniformes: { uM: M }, desde: 1 - ev(q(0), 0, 1) })];
      if (M > 0.5) P.push(curva((u) => [u, 1 - u, 0], DOM, { n: 2, color: ROJO, ancho: 2.6, alfa: M }));
      const C = [marco({ x: DOM, y: DOM }, { alfa: corte, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'z' } }), rotulo([0.5, 1], R`\text{El corte, con } a = ${coma(a)}`, { clave: 'tc', dy: -18, tam: 17, color: GRIS2, alfa: corte })];
      if (corte > 0) {
        const s = 1 - a, z = NILPOTENTE.r(a, b);
        C.push(curva((u) => [u, 0], [0, s], { n: 2, color: AZUL, ancho: 3.2, alfa: corte }), curva((u) => [u, Math.min(a, u)], [Math.min(1, s + 0.0005), 1], { n: 120, color: AZUL, ancho: 3.2, alfa: corte }));
        C.push(punto([s, 0], { color: AZUL, radio: 6, alfa: corte }), punto([s, Math.min(a, s)], { color: BLANCO, radio: 5, alfa: 0.55 * corte, halo: 0 }));
        C.push(linea([0, b], [1, b], { color: ROSA, ancho: 2, alfa: corte, discontinua: true }), rotulo([0.98, b], R`{\color{#fc6282}b}`, { clave: 'b', ancla: 'r', dy: -12, tam: 18, alfa: corte }));
        C.push(punto([z, NILPOTENTE.t(a, z)], { color: ORO, radio: 8, alfa: corte }), rotulo([0.02, 0.9], R`a \to b = {\color{#f4d345}${coma(z)}}`, { clave: 'z', ancla: 'l', tam: 21, alfa: corte }));
      }
      if (dr > 0) C.push(curva((u) => [u, 0], [0, 0.995], { n: 2, color: ROJO, ancho: 3, alfa: dr }), punto([1, a], { color: ROJO, radio: 7, alfa: dr }), rotulo([0.02, 0.78], R`{\color{#f05a5a}\text{drástica: si } b < a, \text{ sin mayor } z}`, { clave: 'dr', ancla: 'l', tam: 15, alfa: dr }));
      const V = [mapaCalor(F, { clave: `mtl${M.toFixed(2)}` }), marco({ x: DOM, y: DOM }, { alfa: ba, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'a', y: 'z' } }), rotulo([0.5, 1], R`\text{Desde arriba}`, { clave: 'tm', dy: -16, tam: 15, color: GRIS2, alfa: ba })];
      return { principal: P, paneles: [{ ejes: { x: DOM, y: DOM, caja: { x: 690, y: 44, w: 180, h: 180 } }, prims: V }, { ejes: { x: DOM, y: DOM, caja: { x: 680, y: 310, w: 380, h: 280 } }, prims: C }] };
    },
  },
  manipulacion: '<ul><li>Mueve $a$: el salto del corte se desplaza, porque está en $z = 1 - a$.</li><li>Mueve el techo por debajo de $a$, y fíjate dónde se queda el punto dorado.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Para que exista el «mayor $z$ que no se pasa», basta con que [[la norma|norma T]] no dé saltos si te acercas desde la izquierda: se llama ser [[continua por la izquierda]]. Es menos que ser continua. Y resulta que [[las normas|norma T]] de este tipo son, exactamente, las que tienen residuo. Esteva y Godo (2001) escribieron la lógica de todas ellas: MTL, lógica monoidal de [[normas T|norma T]].' },
    { tipo: 'ejemplo', texto: 'El mínimo nilpotente: vale $\\min(a, b)$ si $a + b > 1$, y 0 si no.', tabla: [['a', 'b', 'a + b', 'Resultado'], ['0,6', '0,7', '1,3', '0,6'], ['0,6', '0,4', '1,0', '0'], ['0,6', '0,41', '1,01', '0,41']], cierre: 'Un cambio diminuto, de 0,40 a 0,41, salta de 0 a 0,41. Es [[una norma T|norma T]] perfectamente válida, y con su residuo: $a \\to b = 1$ si $a \\le b$, y $\\max(1 - a, b)$ si no.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\lim_{z \uparrow z_0} T(a, z) = T(a, z_0)`, dice: 'Continua por la izquierda: si $z$ se acerca a $z_0$ desde abajo, el resultado llega al valor en $z_0$. La flecha $\\uparrow$ indica «desde abajo».' },
      { tex: R`a \to b = \sup \{ z : T(a, z) \le b \}`, dice: 'El residuo: el [[supremo]] de lo que no se pasa. Lo que hay que ver es que este [[supremo]] cumple él mismo la condición.' },
      { tex: R`\varphi \wedge \psi`, dice: 'En MTL, el «y débil» es una operación propia: ya no se puede definir como en BL.' },
    ], todo: R`\varphi \wedge \psi \ \neq\ \varphi \,\&\, (\varphi \to \psi)`, lee: 'Es lo que se pierde: en BL coinciden, por ser continua. Aquí, por ejemplo, con $a = 0{,}6$, $b = 0{,}3$, a la izquierda sale $0{,}3$, y a la derecha $0{,}4$ con 0,6: da 0.' },
    { tipo: 'formal', titulo: 'La lógica MTL', tex: R`Tiene las conectivas $\&$, $\wedge$, $\to$, $\bar{0}$. Sus axiomas son los de BL sin el de divisibilidad, y con axiomas propios para $\wedge$. Jenei y Montagna (2002) probaron que sus tautologías son exactamente las fórmulas que valen 1 con toda [[norma T]] continua por la izquierda.`, lee: 'Es decir: MTL es a [[las normas|norma T]] continuas por la izquierda lo que BL es a las continuas.' },
    { tipo: 'demo', titulo: 'Sin salto por la izquierda, hay mayor', plan: 'Se toma el [[supremo]] de lo permitido, y se comprueba que él también está permitido. Es una aplicación directa de la definición.', tex: R`Si $T$ es continua por la izquierda, y $S = \{ z : T(a, z) \le b \}$, entonces $S$ tiene un mayor elemento.`, pasos: [
      { texto: R`Sea $z_0 = \sup S$. Existe en $[0, 1]$, porque $S$ contiene al 0: $T(a, 0) = 0 \le b$.`, porque: 'Toda parte no vacía de $[0, 1]$ tiene [[supremo]].' },
      { texto: R`Hay una sucesión $z_n \in S$ que se acerca a $z_0$, sin superarlo.`, porque: 'Es lo que significa ser el [[supremo]]: hay elementos de $S$ tan cerca como se quiera.' },
      { texto: R`Como $T(a, z_n) \le b$ para todo $n$, en el límite: $T(a, z_0) \le b$.`, porque: 'Por la continuidad por la izquierda, el límite es $T(a, z_0)$; y una desigualdad no estricta se conserva en el límite.' },
      { texto: R`Por tanto, $z_0 \in S$, y es su mayor elemento.`, porque: 'Pertenece a $S$, y por ser el [[supremo]] nada de $S$ le supera.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Toma el supremo y comprueba', texto: 'Para probar que hay un mayor elemento, toma el [[supremo]], y comprueba que está dentro. La continuidad es la que permite pasar al límite.' },
    { titulo: 'Debilita una hipótesis', texto: 'Una buena pregunta: ¿qué parte de la hipótesis se usa de verdad? Aquí no hacía falta ser continua: bastaba con un lado.' },
  ],
  retos: [
    { id: 'cruza-salto', tipo: 'manipular', enunciado: R`Elige $a$ para que el salto del corte esté en $z = 0{,}35$, con margen de $0{,}02$.`, precision: (e) => (Math.abs(1 - e.a - 0.35) <= 0.02 ? 1 : 0), prueba: { a: 0.65 }, pendiente: (e) => `Ahora, el salto está en ${(1 - e.a).toFixed(2).replace('.', ',')}.`, pistas: ['El salto está donde $a + z = 1$.'], explicacion: 'Se cae en $z = 1 - a$.' },
    { id: 'nilpotente-calc', tipo: 'calcular', enunciado: R`Con el mínimo nilpotente, ¿cuánto vale $0{,}8 \,\&\, 0{,}5$?`, respuesta: 0.5, tol: 0.001, pistas: [R`$0{,}8 + 0{,}5 = 1{,}3 > 1$.`], explicacion: R`Como la suma pasa de 1, vale $\min(0{,}8;\ 0{,}5) = 0{,}5$.` },
    { id: 'mtl-elegir', tipo: 'elegir', enunciado: '¿Qué condición debe cumplir [[una norma T|norma T]] para tener residuo?', opciones: ['Ser continua', 'Ser continua por la izquierda', 'Ser igual al mínimo', 'No hace falta ninguna'], correcta: 1, explicacion: 'Esa es exactamente la condición: menos que ser continua, y [[la norma|norma T]] drástica no la cumple.' },
    { id: 'demuestra-izquierda', tipo: 'demostrar', enunciado: R`Comprueba que [[la norma|norma T]] drástica no tiene residuo para $a = 0{,}5$ y $b = 0{,}2$. Vale $T(a, z) = 0$ si $a, z < 1$, y $T(a, 1) = a$.`, pistas: ['¿Qué $z$ dejan el resultado por debajo de $0{,}2$?'],
      solucion: [
        { texto: R`Si $z < 1$: $T(0{,}5;\ z) = 0 \le 0{,}2$. Sí vale.`, porque: 'Primer caso de la definición.' },
        { texto: R`Si $z = 1$: $T(0{,}5;\ 1) = 0{,}5 > 0{,}2$. No vale.`, porque: 'Segundo caso.' },
        { texto: R`Por tanto, se permiten todos los $z < 1$, y no hay uno mayor.`, porque: 'Para cualquier $z < 1$, hay otro más cerca de 1.' },
      ] },
  ],
  referencias: ['F. Esteva, L. Godo, «Monoidal t-norm based logic», <em>Fuzzy Sets and Systems</em> 124 (2001).', 'S. Jenei, F. Montagna, «A proof of standard completeness for Esteva and Godo\'s logic MTL», <em>Studia Logica</em> 70 (2002).'],
};
