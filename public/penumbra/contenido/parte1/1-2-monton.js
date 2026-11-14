import { AZUL, BLANCO, ORO, ROJO, ROSA } from '../../motor/colores.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const luk = (k, eps) => Math.max(0, 1 - k * eps);
const prod = (k, eps) => (1 - eps) ** k;
const coma = (v) => v.toFixed(2).replace('.', '{,}');

/** Los granos que quedan, apilados en un triángulo. Siempre las mismas posiciones: solo cambia cuántos se ven. */
const GRANOS = [];
for (let fila = 0, i = 0; i < 100; fila++) {
  const n = 14 - fila;
  for (let c = 0; c < n && i < 100; c++, i++) GRANOS.push([(c - (n - 1) / 2) * 0.13, 0.04 + fila * 0.068]);
}

export default {
  id: '1-2-monton',
  titulo: 'La paradoja del montón',
  puente: 'Ya sabes por qué hacen falta los grados. Toca decir con exactitud qué es un conjunto que los usa.',
  pregunta: 'Quitar un grano a un montón no deja de hacerlo un montón. Repite eso 99 veces y un solo grano será «un montón». ¿Dónde está el error?',
  escena: {
    id: 'monton', formato: 'plano', W: 1100, H: 580,
    ejes: { x: [0, 99], y: [0, 1], caja: { x: 90, y: 90, w: 620, h: 420 } },
    entradas: [
      { id: 'eps', tipo: 'deslizador', etiqueta: 'lo que falla cada regla, ε', min: 0.001, max: 0.05, paso: 0.001, valor: 0.012 },
      { id: 'quitados', tipo: 'arrastre', eje: 'x', valor: [50, 0], region: { x: [0, 99], y: [0, 1] } },
    ],
    pasos: [
      { dur: 2200, texto: 'Partimos de 100 granos: sin duda, un montón. La regla parece impecable: si $n$ granos son un montón, $n - 1$ también.' },
      { dur: 3000, texto: 'En lógica clásica, cada aplicación de la regla conserva la verdad. Da igual cuántas veces: la verdad sigue en 1, aunque ya casi no queden granos.' },
      { dur: 2600, texto: 'Pero la regla no es <em>del todo</em> cierta: es cierta casi siempre, con grado $1 - \\varepsilon$. Ese pequeño fallo no se ve en un paso, pero se acumula.' },
      { dur: 2200, texto: 'Según cómo se encadenen los grados, la verdad se desgasta en línea recta (Łukasiewicz) o de forma exponencial (producto). En ambos casos, la paradoja desaparece.' },
    ],
    primitivas({ q, paso, e }) {
      const P = [marco({ x: [0, 99], y: [0, 1] }, { alfa: ev(q(0), 0, 0.5), ticks: { x: [0, 25, 50, 75, 99], y: [0, 1] }, etiquetas: { x: R`\text{granos quitados}`, y: R`v` }, colorY: ORO })];
      const c = paso >= 1 ? ev(q(1), 0, 0.8) : 0;
      if (c > 0) P.push(curva((k) => [k, 1], [0, 99], { hasta: c, n: 60, color: AZUL, ancho: 3, brillo: true }), rotulo([50, 1], R`\text{lógica clásica: siempre } 1`, { clave: 'clasica', dy: -18, tam: 19, color: AZUL, alfa: c }));
      if (paso === 1 && q(1) > 0.8) P.push(punto([99, 1], { color: ROJO, radio: 8, alfa: ev(q(1), 0.8, 1) }), rotulo([99, 1], R`\text{¡un grano = montón!}`, { clave: 'absurdo', dy: 30, ancla: 'r', tam: 19, color: ROJO, alfa: ev(q(1), 0.8, 1) }));
      const l = paso >= 2 ? ev(q(2), 0.1, 1) : 0;
      if (l > 0) P.push(curva((k) => [k, luk(k, e.eps)], [0, 99], { hasta: l, n: 200, color: ORO, ancho: 3.4, brillo: true }));
      const m = paso >= 3 ? ev(q(3), 0, 0.9) : 0;
      if (m > 0) P.push(curva((k) => [k, prod(k, e.eps)], [0, 99], { hasta: m, n: 200, color: ROSA, ancho: 3 }));
      const k = paso >= 2 ? e.quitados[0] : paso === 1 ? 99 * c : 0, quedan = Math.round(100 - k);
      const a = ev(q(2), 0.6, 1);
      if (a > 0) {
        const v = luk(k, e.eps);
        P.push(linea([k, 0], [k, v], { color: BLANCO, ancho: 1.4, alfa: 0.6 * a, discontinua: true }), punto([k, v], { color: ORO, alfa: a }));
        P.push(rotulo([k, v], R`v = ${coma(v)}`, { clave: 'v', dx: 14, dy: -18, ancla: 'l', tam: 20, color: ORO, alfa: a }));
        if (m > 0) { const w = prod(k, e.eps); P.push(linea([k, v], [k, w], { color: ROSA, ancho: 1.2, alfa: 0.5 * m, discontinua: true }), punto([k, w], { color: ROSA, alfa: m, radio: 5 })); }
      }
      // el montón, en su propio panel
      const G = [];
      GRANOS.forEach((g, i) => { if (i < quedan) G.push(punto(g, { radio: 4.2, halo: 0, color: [200, 170, 110], alfa: ev(q(0), 0, 0.7) })); });
      G.push(rotulo([0, 1.02], R`${quedan}\ \text{granos}`, { clave: 'quedan', tam: 20, alfa: ev(q(0), 0.3, 0.8) }));
      return { principal: P, paneles: [{ ejes: { x: [-1, 1], y: [0, 1], caja: { x: 750, y: 150, w: 310, h: 310 } }, prims: G }] };
    },
  },
  manipulacion: `<ul>
    <li>Arrastra sobre la gráfica la línea blanca: quita granos y lee la verdad que queda.</li>
    <li>Cambia ε. Con ε muy pequeño hacen falta muchísimas reglas para notar nada.</li>
    <li>Compara las curvas dorada y rosa: la misma regla, dos formas de encadenarla.</li></ul>`,
  entender: [
    { tipo: 'idea', etiqueta: 'La trampa', texto: 'El argumento del montón es una cadena. Cada eslabón parece impecable, y aun así el final es absurdo. Algo se escapa en el camino.' },
    { tipo: 'ejemplo', texto: 'En la lógica de toda la vida, una regla verdadera conserva la verdad sin perder nada:', tabla: [['Granos', '100', '99', '98', '…', '1'], ['Verdad', '1', '1', '1', '…', '1']], cierre: 'Por eso la conclusión absurda sale con verdad 1: nada la frena.' },
    { tipo: 'idea', etiqueta: 'La salida', texto: 'Pero la regla «quitar un grano no cambia nada» no es del todo cierta: es <em>casi</em> cierta. Digamos que su verdad es 0,99. Si solo es casi cierta, cada vez que la usas pierdes un poco.' },
    { tipo: 'ejemplo', texto: 'Con una pérdida de 0,01 en cada paso:', tabla: [['Granos quitados', '0', '1', '2', '30', '99'], ['Verdad que queda', '1', '0,99', '0,98', '0,70', '0,01']], cierre: 'En un solo paso no se nota nada. En 99, casi no queda nada. Ahí está la paradoja, deshecha.' },
    { tipo: 'simbolos', intro: 'Esa tabla cabe en una fórmula.', piezas: [
      { tex: R`v`, dice: 'De «verdad»: un número entre 0 y 1.' },
      { tex: R`\varepsilon`, dice: '«Épsilon», la letra que se usa para una cantidad pequeña. Aquí, lo que falla cada regla.' },
      { tex: R`k`, dice: 'Cuántas veces has usado la regla.' },
      { tex: R`1 - k\varepsilon`, dice: 'Partes de 1 y pierdes $\\varepsilon$ cada vez, $k$ veces.' },
      { tex: R`\max(0,\ \cdot\ )`, dice: 'El mayor de los dos números: si la cuenta se hace negativa, se queda en 0. La verdad no baja de ahí.' },
    ], todo: R`v_k = \max(0,\ 1 - k\varepsilon)`, lee: '«La verdad tras $k$ pasos es lo que queda de 1 al restar $k$ veces $\\varepsilon$, sin bajar de 0».' },
    { tipo: 'formal', titulo: 'Cómo se arrastra la verdad', tex: R`Si $A$ tiene verdad $a$ y la regla «si $A$, entonces $B$» tiene verdad $r$, entonces $B$ tiene verdad al menos $\max(0,\ a + r - 1)$.`, lee: 'Se lee: lo que le falta a la regla para ser 1, es lo que pierdes. Si $r = 1$, conservas todo, como en la lógica clásica.' },
    { tipo: 'demo', titulo: 'Tras k pasos, la verdad es al menos 1 − kε', plan: 'Se demuestra por [[inducción]]: es verdad al principio, y si es verdad en un paso, es verdad en el siguiente. Como una fila de fichas de dominó.', tex: R`Sean $v_0 = 1$, cada regla con verdad $1 - \varepsilon$, y $v_k$ la verdad que garantiza el paso $k$. Queremos ver que $v_k \ge \max(0,\ 1 - k\varepsilon)$.`, pasos: [
      { texto: R`Para $k = 0$: $v_0 = 1 = \max(0,\ 1 - 0 \cdot \varepsilon)$.`, porque: 'La primera ficha: es justo de donde partimos.' },
      { texto: R`Supón que vale en el paso $k$. La regla da $v_{k+1} \ge \max\big(0,\ v_k + (1 - \varepsilon) - 1\big) = \max(0,\ v_k - \varepsilon)$.`, porque: 'Es la fórmula del arrastre con $a = v_k$ y $r = 1 - \\varepsilon$; lo demás es simplificar.' },
      { texto: R`Si $1 - k\varepsilon \ge 0$: como $v_k \ge 1 - k\varepsilon$, restando $\varepsilon$ queda $v_k - \varepsilon \ge 1 - (k + 1)\varepsilon$.`, porque: 'Restar lo mismo a los dos lados no cambia la desigualdad.' },
      { texto: R`Si $1 - k\varepsilon < 0$: también $1 - (k + 1)\varepsilon < 0$, y lo que hay que probar es solo $v_{k+1} \ge 0$, que siempre se cumple.`, porque: 'Los grados nunca son negativos.' },
      { texto: R`En los dos casos, $v_{k+1} \ge \max(0,\ 1 - (k + 1)\varepsilon)$: la siguiente ficha también cae.`, porque: 'El máximo es uno de los dos números, y acabamos de ver que $v_{k+1}$ llega al que manda en cada caso.' },
    ] },
    { tipo: 'nota', titulo: 'Otra forma de perder', texto: R`Si en vez de restar se multiplica, la verdad tras $k$ pasos es al menos $(1 - \varepsilon)^k$: nunca llega a 0, pero se acerca todo lo que quieras. Es la curva rosa. A la resta se la llama de Łukasiewicz, un lógico polaco. Verás en la región 3 que hay muchas formas legítimas de combinar grados. Goguen propuso en 1969 este tipo de análisis, aunque la filosofía aún lo discute: no es la única salida a la paradoja.` },
  ],
  tecnicas: [
    { titulo: 'Una cadena con pérdida', texto: 'Cuando una propiedad se transmite con un pequeño coste, plantea la [[inducción]] sobre una desigualdad que incluya el coste acumulado: aquí, $1 - k\\varepsilon$.' },
    { titulo: 'Separa los casos del máximo', texto: 'Frente a un $\\max(0, \\cdot)$, demuestra por separado la parte positiva y la parte en la que manda el 0.' },
  ],
  retos: [
    { id: 'verdad-tras-n', tipo: 'calcular', enunciado: R`Cada regla vale $0{,}99$ y partes de verdad 1. Con Łukasiewicz, ¿qué verdad queda garantizada tras 30 aplicaciones?`,
      respuesta: 0.7, tol: 0.005, pistas: [R`Aquí $\varepsilon = 0{,}01$.`, R`La fórmula es $\max(0,\ 1 - k\varepsilon)$.`], explicacion: R`$1 - 30 \cdot 0{,}01 = 0{,}7$.` },
    { id: 'causa-paradoja', tipo: 'elegir', enunciado: 'Según este análisis, ¿dónde falla el argumento del montón?',
      opciones: ['El primer paso: 100 granos no son un montón', 'Cada regla es casi cierta, y lo casi cierto se desgasta al encadenarlo', 'Quitar un grano cambia mucho las cosas', 'La lógica no se puede aplicar a los montones'],
      correcta: 1, explicacion: 'Ninguna regla falla de golpe; cada una pierde un poco, y es la acumulación lo que acaba en una conclusión falsa.' },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., Kluwer, 2001, caps. 1–2.', 'J. A. Goguen, «The logic of inexact concepts», <em>Synthese</em> 19 (1969), 325–373.', 'P. Hájek, <em>Metamathematics of Fuzzy Logic</em>, Kluwer, 1998.', 'Stanford Encyclopedia of Philosophy, «Fuzzy Logic».'],
};
