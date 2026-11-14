import { AZUL, BLANCO, ORO, ROJO, ROSA } from '../../motor/colores.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const DOM = [0, 10];
const A = (w) => (x) => 1 / (1 + Math.exp(Math.max(-40, Math.min(40, -(x - 5) / Math.max(w, 0.01)))));
const joroba = (w) => { const f = A(w); let s = 0; for (let i = 0; i < 2000; i++) { const u = f((i + 0.5) / 200); s += Math.min(u, 1 - u) / 200; } return s; };

export default {
  id: '3-3-leyes-que-caen',
  titulo: 'Las leyes que caen',
  puente: 'Si el mínimo rompe esas leyes, ¿no habrá otro «y» que las respete? Lo hay. Y aquí empieza lo interesante: no hay un solo «y» correcto, sino una familia entera.',
  pregunta: '«Llueve y no llueve» siempre es falso. Pero ¿y si está lloviznando? ¿Es «un poco alto y un poco no alto» una contradicción?',
  escena: {
    id: 'leyes-caen', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: [0, 1], caja: { x: 110, y: 80, w: 860, h: 380 } },
    entradas: [
      { id: 'w', tipo: 'deslizador', etiqueta: 'borrosidad', min: 0, max: 1.5, paso: 0.01, valor: 0.8 },
      { id: 'x', tipo: 'arrastre', eje: 'x', valor: [4.4, 0], region: { x: DOM, y: [0, 1] } },
    ],
    pasos: [
      { dur: 2200, texto: 'Un conjunto clásico, <b style="color:#58c4dd;font-weight:400">A</b>, y su contrario, <b style="color:#fc6282;font-weight:400">no A</b>. No se tocan: nada es a la vez A y no A. Es el principio de no contradicción.' },
      { dur: 2600, texto: 'Ahora, deja que el borde se derrita. Las dos curvas se cruzan en el centro, en 0,5.' },
      { dur: 2600, texto: '«A y no A» ya no es vacío: toma el mínimo de las dos, y aparece esta <b style="color:#f4d345;font-weight:400">joroba</b>. Algo es a la vez, en parte, A y no A.' },
      { dur: 2400, texto: 'Y «A o no A» no llega a 1 en todas partes. Hay un <b style="color:#f05a5a;font-weight:400">valle</b> en el medio: el principio del tercero excluido también cae.' },
    ],
    primitivas({ q, paso, e }) {
      const w = paso === 0 ? 0 : paso === 1 ? mix(0, e.w, ev(q(1), 0, 0.85)) : e.w, f = A(w), al = ev(q(0), 0, 0.4);
      const N = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 5, 10], y: [0, 0.5, 1] }, etiquetas: { x: 'x', y: R`\mu` } })];
      const t = Math.max(ev(q(0), 0, 1), 1e-3);
      N.push(curva((u) => [u, f(u)], DOM, { hasta: t, n: 400, color: AZUL, ancho: 2.8 }), curva((u) => [u, 1 - f(u)], DOM, { hasta: t, n: 400, color: ROSA, ancho: 2.8 }));
      const j = ev(q(2), 0, 0.7);
      if (j > 0) {
        for (let i = 0; i < 200; i++) { const x0 = i / 20, x1 = (i + 1) / 20, u0 = Math.min(f(x0), 1 - f(x0)), u1 = Math.min(f(x1), 1 - f(x1)); if (u0 + u1 > 1e-3) N.push(poligono([[x0, 0], [x1, 0], [x1, u1 * j], [x0, u0 * j]], { color: ORO, alfa: 0.75 })); }
        N.push(rotulo([5, 0.5], R`A \cap \overline{A} \neq \varnothing`, { clave: 'j', dy: -34, tam: 25, color: ORO, alfa: j }));
      }
      const v = ev(q(3), 0, 0.7);
      if (v > 0) {
        for (let i = 0; i < 200; i++) { const x0 = i / 20, x1 = (i + 1) / 20, u0 = Math.max(f(x0), 1 - f(x0)), u1 = Math.max(f(x1), 1 - f(x1)); if (u0 + u1 < 2 - 1e-3) N.push(poligono([[x0, 1], [x1, 1], [x1, mix(1, u1, v)], [x0, mix(1, u0, v)]], { color: ROJO, alfa: 0.55 })); }
        N.push(rotulo([5, 1], R`A \cup \overline{A} \neq X`, { clave: 'v', dy: -18, tam: 25, color: ROJO, alfa: v }));
      }
      if (paso === 3) {
        const x = e.x[0], a = f(x), s = ev(q(3), 0.5, 1);
        N.push(linea([x, 0], [x, 1], { color: BLANCO, ancho: 1.3, alfa: 0.55 * s, discontinua: true }), punto([x, Math.min(a, 1 - a)], { color: ORO, radio: 6, alfa: s }), punto([x, Math.max(a, 1 - a)], { color: ROJO, radio: 6, alfa: s }));
        N.push(rotulo([9.8, 0.62], R`\mu_A = ${coma(a)}`, { clave: 'la', ancla: 'r', tam: 21, color: AZUL, alfa: s }), rotulo([9.8, 0.5], R`\text{y: } ${coma(Math.min(a, 1 - a))}`, { clave: 'ly', ancla: 'r', tam: 21, color: ORO, alfa: s }), rotulo([9.8, 0.38], R`\text{o: } ${coma(Math.max(a, 1 - a))}`, { clave: 'lo', ancla: 'r', tam: 21, color: ROJO, alfa: s }));
      }
      return N;
    },
  },
  manipulacion: '<ul><li>Baja la borrosidad a 0: la joroba y el valle desaparecen, y vuelves al mundo clásico.</li><li>Sube la borrosidad, y arrastra la línea: la joroba siempre llega a 0,5.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'Dos leyes sagradas', texto: 'Hace más de dos mil años que la lógica se apoya en dos leyes. Nada es a la vez A y no A: es la <b>no contradicción</b>. Y todo es A o no A: es el <b>tercero excluido</b>. En lo difuso, las dos dejan de valer.' },
    { tipo: 'ejemplo', texto: 'Con el mínimo, el máximo y el «no» de siempre:', tabla: [['Grado a', '0', '0,3', '0,5', '0,8', '1'], ['A y no A', '0', '0,3', '0,5', '0,2', '0'], ['A o no A', '1', '0,7', '0,5', '0,8', '1']], cierre: 'En los extremos, todo sigue como siempre. Solo fallan los valores intermedios. Y lo peor ocurre en 0,5.' },
    { tipo: 'idea', etiqueta: 'No es un fallo', texto: 'Esto no es un defecto del sistema: es justo lo que queríamos. Algo que está en la frontera <em>es</em> en parte A y en parte no A. Si estas leyes siguieran valiendo, no habría frontera borrosa.' },
    { tipo: 'simbolos', intro: 'Las dos leyes clásicas, escritas.', piezas: [
      { tex: R`\varnothing`, dice: 'El conjunto vacío: el que no tiene nada.' },
      { tex: R`A \cap \overline{A} = \varnothing`, dice: 'Nada es a la vez «A» y «no A».' },
      { tex: R`X`, dice: 'El [[universo]]: todo.' },
      { tex: R`A \cup \overline{A} = X`, dice: 'Todo es «A» o «no A».' },
    ], todo: R`\mu_{A \cap \overline{A}}(x) = \min(a,\ 1 - a) \le \tfrac{1}{2}`, lee: 'La joroba nunca pasa de 0,5, y solo llega ahí con grado 0,5.' },
    { tipo: 'formal', titulo: 'Las dos leyes caen', tex: R`Con las operaciones de Zadeh, $A \cap \overline{A} = \varnothing$ se cumple si y solo si $A$ es [[clásico|clasico]]. Lo mismo vale para $A \cup \overline{A} = X$.`, lee: 'En otras palabras: en cuanto un solo punto tiene grado intermedio, las dos leyes fallan en ese punto.' },
    { tipo: 'demo', titulo: 'Las leyes valen solo en lo clásico', plan: 'Basta mirar un punto: el mínimo de $a$ y $1 - a$ vale 0 solo si uno de los dos es 0.', pasos: [
      { texto: R`Fijemos $x$, y sea $a = \mu_A(x)$. Queremos saber cuándo $\min(a,\ 1 - a) = 0$.`, porque: 'El conjunto $A \\cap \\overline{A}$ es vacío si su grado es 0 en todos los puntos.' },
      { texto: R`El mínimo de dos números $\ge 0$ vale 0 si y solo si alguno de los dos vale 0: $a = 0$ o $1 - a = 0$.`, porque: 'Si los dos fueran positivos, su mínimo también lo sería.' },
      { texto: R`Eso significa $a = 0$ o $a = 1$. Para que valga en todo $x$, $A$ solo puede usar grados 0 y 1: es clásico.`, porque: 'Y si es clásico, el cálculo es el de siempre, y la ley se cumple.' },
    ] },
    { tipo: 'nota', titulo: 'Se puede salvar, a un precio', texto: R`Con otro «y», como $\max(0,\ a + b - 1)$, sí se cumple la no contradicción: $\max(0,\ a + (1 - a) - 1) = 0$. Pero se pierde otra ley: $A \cap A$ ya no es $A$. No se puede tener todo a la vez, y por eso hay toda una familia de «y». Es la siguiente parada.` },
  ],
  tecnicas: [
    { titulo: 'Mira dónde falla', texto: 'Si una ley clásica falla, no te quedes en «falla»: localiza para qué valores falla. Aquí, solo en los intermedios. Eso explica el porqué.' },
    { titulo: 'Busca el máximo con simetría', texto: 'Una expresión simétrica como $\\min(a, 1-a)$ suele tener su extremo en el punto simétrico: aquí, $a = 0{,}5$.' },
  ],
  retos: [
    { id: 'borrar-joroba', tipo: 'manipular', enunciado: R`Baja la borrosidad hasta que el área de la joroba sea menor que $0{,}1$.`, precision: (e) => (joroba(e.w) < 0.1 ? 1 : 0), prueba: { w: 0.05 },
      pendiente: (e) => `El área es ahora ${joroba(e.w).toFixed(2).replace('.', ',')}. Hace falta menos de 0,1.`, pistas: ['La joroba es tan alta siempre; lo que se estrecha es su anchura.'], explicacion: 'Cuanto menos borroso, más estrecha. En el límite, desaparece: lo clásico.' },
    { id: 'joroba-punto', tipo: 'calcular', enunciado: R`Si $\mu_A(x) = 0{,}3$, ¿cuánto vale «A y no A» en ese punto, con el mínimo?`, respuesta: 0.3, tol: 0.001, pistas: [R`«No A» vale $0{,}7$.`], explicacion: R`$\min(0{,}3;\ 0{,}7) = 0{,}3$.` },
    { id: 'demuestra-tope', tipo: 'demostrar', enunciado: R`Demuestra que $\min(a,\ 1 - a) \le \frac{1}{2}$ para todo $a \in [0, 1]$.`, pistas: ['Separa dos casos: $a \\le \\frac{1}{2}$ y $a > \\frac{1}{2}$.'],
      solucion: [
        { texto: R`Si $a \le \frac{1}{2}$: el mínimo no supera a $a$, luego $\min(a,\ 1 - a) \le a \le \frac{1}{2}$.`, porque: 'El mínimo no supera a ninguno de los dos.' },
        { texto: R`Si $a > \frac{1}{2}$: entonces $1 - a < \frac{1}{2}$, y $\min(a,\ 1 - a) \le 1 - a < \frac{1}{2}$.`, porque: 'Igual, ahora con el otro número.' },
      ] },
  ],
  referencias: ['G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 1 y 3.', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 2–3.'],
};
