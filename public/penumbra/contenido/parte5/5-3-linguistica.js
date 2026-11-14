import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const joven = (x) => (x <= 25 ? 1 : 1 / (1 + ((x - 25) / 5) ** 2));
const mayor = (x) => (x <= 50 ? 0 : 1 / (1 + ((x - 50) / 5) ** -2));
const adulto = (x) => Math.max(0, Math.min(1, (x - 15) / 15, (65 - x) / 15));
const DOM = [0, 90];

export default {
  id: '5-3-linguistica',
  titulo: 'Hablar con palabras: variables lingüísticas',
  puente: 'Ya tienes palabras que significan algo. Ahora, unirlas en frases con forma de regla: «si la temperatura es alta, entonces el ventilador va rápido».',
  pregunta: '«La edad es: bastante joven». Una magnitud cuyo valor no es un número, sino una palabra. ¿Y qué le hace «muy» a «joven»?',
  escena: {
    id: 'linguistica', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: [0, 1], caja: { x: 110, y: 70, w: 860, h: 390 } },
    entradas: [
      { id: 'p', tipo: 'deslizador', etiqueta: 'el modificador, exponente p', min: 0.25, max: 4, paso: 0.05, valor: 1 },
      { id: 'x', tipo: 'arrastre', eje: 'x', valor: [30, 0], region: { x: DOM, y: [0, 1] } },
    ],
    pasos: [
      { dur: 2400, texto: 'La edad se puede dar con un número. O con una palabra: <b style="color:#58c4dd;font-weight:400">joven</b>, <b style="color:#f4d345;font-weight:400">adulto</b>, <b style="color:#fc6282;font-weight:400">mayor</b>. Cada palabra es un conjunto difuso. A esto se le llama variable lingüística.' },
      { dur: 2800, texto: '«Muy joven» es más exigente que «joven». Basta elevar los grados al cuadrado: los que ya son altos casi no cambian, y los medios bajan mucho.' },
      { dur: 2800, texto: '«Algo joven» es más permisivo: se saca la raíz cuadrada. Los grados medios suben. La curva se ensancha.' },
      { dur: 2200, texto: 'Un solo botón, el exponente $p$, cubre toda la gama. Lo interesante: estas palabras ya no son etiquetas sueltas, son <b>operaciones</b>.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), p = paso === 0 ? 1 : paso === 1 ? mix(1, 2, ev(q(1), 0, 0.8)) : paso === 2 ? mix(2, 0.5, ev(q(2), 0, 0.8)) : (q(3) < 1 ? mix(0.5, e.p, ev(q(3), 0, 0.8)) : e.p);
      const N = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 30, 60, 90], y: [0, 1] }, etiquetas: { x: R`\text{edad}`, y: R`\mu` } })];
      const t = Math.max(ev(q(0), 0, 1), 1e-3);
      N.push(curva((u) => [u, adulto(u)], DOM, { hasta: t, n: 250, color: ORO, ancho: 2, alfa: paso === 0 ? 1 : 0.3 }), curva((u) => [u, mayor(u)], DOM, { hasta: t, n: 250, color: ROSA, ancho: 2, alfa: paso === 0 ? 1 : 0.3 }));
      N.push(curva((u) => [u, joven(u)], DOM, { hasta: t, n: 250, color: AZUL, ancho: paso === 0 ? 3 : 2, alfa: paso === 0 ? 1 : 0.6, discontinua: paso > 0 }));
      if (paso === 0) N.push(rotulo([8, 1], R`\text{joven}`, { clave: 'j', dy: -16, tam: 21, color: AZUL, alfa: al }), rotulo([40, 1], R`\text{adulto}`, { clave: 'a', dy: -16, tam: 21, color: ORO, alfa: al }), rotulo([78, 1], R`\text{mayor}`, { clave: 'm', dy: -16, tam: 21, color: ROSA, alfa: al }));
      if (paso >= 1) {
        const a = ev(q(1), 0, 0.3), f = (u) => joven(u) ** p, x = e.x[0], v = f(x), nombre = p > 1.3 ? R`\text{muy joven}` : p < 0.8 ? R`\text{algo joven}` : R`\text{joven}`;
        N.push(curva((u) => [u, f(u)], DOM, { n: 300, color: BLANCO, ancho: 3.6, brillo: true, alfa: a }));
        N.push(rotulo([62, 0.86], nombre, { clave: 'nombre', tam: 30, color: BLANCO, alfa: a }), rotulo([62, 0.72], R`\mu^{${coma(p)}}`, { clave: 'p', tam: 26, color: ORO, alfa: a }));
        N.push(linea([x, 0], [x, Math.max(v, joven(x))], { color: GRIS2, ancho: 1.2, alfa: 0.6 * a, discontinua: true }), punto([x, joven(x)], { color: AZUL, radio: 5, alfa: a }), punto([x, v], { color: BLANCO, radio: 7, alfa: a }));
        N.push(rotulo([x, v], R`${coma(joven(x))} \to ${coma(v)}`, { clave: 'lec', dx: 18, dy: -20, ancla: 'l', tam: 21, alfa: a }));
      }
      return N;
    },
  },
  manipulacion: '<ul><li>Mueve el exponente: por encima de 1 estrecha la curva; por debajo, la ensancha.</li><li>Arrastra la línea hasta 30 años: fíjate en que los grados 0 y 1 nunca cambian.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Zadeh tuvo una intuición: la gente no razona con números, sino con palabras. Una [[variable lingüística]] es una magnitud cuyos valores son palabras, y cada palabra tiene su conjunto difuso. Es el puente entre el lenguaje y las matemáticas.' },
    { tipo: 'ejemplo', texto: 'Qué hacen los [[modificadores|modificador]] a un mismo grado:', tabla: [['Joven', '0', '0,25', '0,5', '0,8', '1'], ['Muy joven (cuadrado)', '0', '0,06', '0,25', '0,64', '1'], ['Algo joven (raíz)', '0', '0,5', '0,71', '0,89', '1']], cierre: 'Los extremos no cambian. Y «muy muy joven» es elevar a la cuarta: se pueden encadenar, como en el lenguaje.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\mu_A`, dice: 'El grado en la palabra original.' },
      { tex: R`\mu_A^2`, dice: '«Muy $A$»: cuadrado del grado. Zadeh lo llama concentración.' },
      { tex: R`\sqrt{\mu_A}`, dice: '«Algo $A$»: la raíz. Lo llama dilatación.' },
      { tex: R`1 - \mu_A`, dice: '«No $A$»: el [[complemento]] de siempre.' },
    ], todo: R`\mu_{\text{muy } A}(x) = \mu_A(x)^2`, lee: 'Y se puede componer: «no muy joven» es $1 - \\mu^2$. Una frase entera se traduce en una fórmula.' },
    { tipo: 'formal', titulo: 'Variable lingüística (Zadeh, 1975)', tex: R`Es un quinteto $(x, T(x), U, G, M)$: el nombre $x$ de la variable, su conjunto de términos $T(x)$, el [[universo]] $U$, las reglas $G$ para formar términos, y las reglas $M$ que dan a cada término su conjunto difuso.`, lee: 'Por ejemplo: edad; {joven, adulto, mayor, muy joven…}; de 0 a 100; «muy» y «no» forman nuevos términos; y cada uno significa una curva.' },
    { tipo: 'demo', titulo: '«Muy» siempre es más exigente', plan: 'Un número entre 0 y 1, al elevarlo al cuadrado, no sube. Por eso «muy joven» cabe dentro de «joven».', tex: R`$\text{muy } A \subseteq A$: para todo $x$, $\mu_A(x)^2 \le \mu_A(x)$.`, pasos: [
      { texto: R`Sea $m = \mu_A(x) \in [0, 1]$. Como $m \le 1$, multiplicando por $m \ge 0$: $m \cdot m \le m \cdot 1$.`, porque: 'Multiplicar por un número no negativo conserva el orden.' },
      { texto: R`Es decir, $m^2 \le m$, para todo $x$.`, porque: 'Por tanto, «muy $A$» está dentro de $A$. Coincide con la intuición: quien es muy joven, es joven.' },
    ] },
    { tipo: 'nota', titulo: 'Solo es una convención', texto: 'El cuadrado y la raíz son propuestas de Zadeh, razonables y cómodas. No son una ley de la naturaleza: los experimentos muestran que el efecto real de «muy» varía según la palabra y el contexto.' },
  ],
  tecnicas: [
    { titulo: 'Compón las palabras', texto: 'Traduce una frase de dentro hacia fuera: «no muy alto» es primero «alto», luego «muy», luego «no».' },
  ],
  retos: [
    { id: 'ajusta-muy', tipo: 'manipular', enunciado: R`Elige un exponente tal que un grado de $0{,}5$ baje a $0{,}125$ o menos: algo así como «muy muy».`, precision: (e) => (0.5 ** e.p <= 0.1251 ? 1 : 0), prueba: { p: 3 }, pendiente: (e) => `Ahora, 0,5 pasa a valer ${(0.5 ** e.p).toFixed(2).replace('.', ',')}.`, pistas: [R`$0{,}5^3 = 0{,}125$.`], explicacion: 'Cuanto mayor el exponente, más exigente.' },
    { id: 'muy-calc', tipo: 'calcular', enunciado: R`Si «alto» vale $0{,}8$, ¿cuánto vale «no muy alto»?`, respuesta: 0.36, tol: 0.001, pistas: [R`Muy alto: $0{,}8^2 = 0{,}64$.`], explicacion: R`$1 - 0{,}64 = 0{,}36$.` },
    { id: 'hedge-elegir', tipo: 'elegir', enunciado: '¿Qué hace la raíz cuadrada, «algo», a una curva?', opciones: ['La estrecha', 'La ensancha: los grados medios suben', 'La desplaza a la derecha', 'Cambia su máximo'], correcta: 1, explicacion: 'Un número entre 0 y 1 sube con la raíz. Los extremos 0 y 1 no cambian.' },
  ],
  referencias: ['L. A. Zadeh, «The concept of a linguistic variable and its application to approximate reasoning» (1975).', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 9.'],
};
