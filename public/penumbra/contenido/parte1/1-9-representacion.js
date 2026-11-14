import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { gaussiana } from '../../nucleo/difuso.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v, d = 2) => v.toFixed(d).replace('.', '{,}');
const g = gaussiana(5, 1.6);
const DOM = [0, 10];
const semi = (a) => 1.6 * Math.sqrt(-2 * Math.log(a));
const esc = (x, n) => Math.floor(g(x) * n) / n;

export default {
  id: '1-9-representacion',
  titulo: 'El teorema de representación',
  puente: 'Los cortes cuentan toda la historia. Con ellos vas a definir, sin dibujos, qué significa tener una sola cima.',
  pregunta: 'Los cortes son conjuntos nítidos. ¿Bastan para reconstruir el conjunto difuso entero, sin perder nada? Apila unos sobre otros y mira.',
  escena: {
    id: 'representacion', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: [0, 1], caja: { x: 110, y: 60, w: 860, h: 410 } },
    entradas: [
      { id: 'n', tipo: 'deslizador', etiqueta: 'niveles', min: 1, max: 40, paso: 1, valor: 8 },
      { id: 'x', tipo: 'arrastre', eje: 'x', valor: [3.4, 0], region: { x: DOM, y: [0, 1] } },
    ],
    pasos: [
      { dur: 1800, texto: 'Empezamos con un conjunto difuso cualquiera: la curva azul.' },
      { dur: 2200, texto: 'Tomamos un nivel $\\alpha$ y su corte $A_\\alpha$. Un conjunto nítido: lo convertimos en un bloque de altura $\\alpha$, es decir, en la función $\\alpha \\cdot \\mathbf{1}_{A_\\alpha}$.' },
      { dur: 3400, texto: 'Hacemos lo mismo en muchos niveles. Cada bloque es más alto y más estrecho que el anterior. Todos nacen de cortes nítidos.' },
      { dur: 2400, texto: 'Mira qué altura alcanzan los bloques en cada punto: su silueta dorada se pega a la curva. En cada $x$, el bloque más alto que lo cubre llega hasta casi $\\mu(x)$.' },
      { dur: 1800, texto: 'Con más niveles, la silueta se pega más. En el límite, coincide. <b style="color:#f4d345;font-weight:400">Los cortes contienen toda la información.</b>' },
    ],
    primitivas({ q, paso, e }) {
      const n = Math.round(e.n);
      const N = [marco({ x: DOM, y: [0, 1] }, { alfa: ev(q(0), 0, 0.3), ticks: { x: [0, 5, 10], y: [0, 1] }, etiquetas: { x: 'x', y: R`\mu` } })];
      const t = ev(q(0), 0.1, 1);
      if (t > 0) N.push(curva((x) => [x, g(x)], DOM, { hasta: t, n: 240, color: AZUL, ancho: 3, brillo: true }));
      const uno = ev(q(1), 0, 0.7);
      if (uno > 0 && paso === 1) {
        const a = 0.5, s = semi(a);
        N.push(linea([0, a], [10, a], { color: BLANCO, ancho: 1.2, alfa: 0.6 * uno, discontinua: true }), punto([5 - s, a], { color: ORO, radio: 5, alfa: uno }), punto([5 + s, a], { color: ORO, radio: 5, alfa: uno }));
        N.push(poligono([[5 - s, 0], [5 + s, 0], [5 + s, a * ev(q(1), 0.3, 1)], [5 - s, a * ev(q(1), 0.3, 1)]], { color: ORO, alfa: 0.35 }));
        N.push(rotulo([5, a], R`\alpha \cdot \mathbf{1}_{A_\alpha}`, { clave: 'bloque', dy: 26, tam: 24, color: ORO, alfa: uno }));
      }
      if (paso >= 2) {
        const prog = ev(q(2), 0, 1);
        for (let k = 1; k <= n; k++) {
          const a = k / n;
          if (a >= 1) continue;
          const vis = ev(prog, (k - 1) / n, (k + 1) / n);
          if (vis <= 0) continue;
          const s = semi(a);
          N.push(poligono([[5 - s, 0], [5 + s, 0], [5 + s, a * vis], [5 - s, a * vis]], { color: ORO, alfa: Math.min(0.28, 2.6 / n) }));
        }
      }
      if (paso >= 3) {
        const si = ev(q(3), 0, 0.9);
        N.push(curva((x) => [x, esc(x, n)], DOM, { hasta: Math.max(si, 1e-3), n: 1600, color: ORO, ancho: 2.4 }));
        const x = e.x[0], m = g(x), r = esc(x, n), ap = ev(q(3), 0.5, 1);
        if (ap > 0) {
          N.push(punto([x, m], { color: AZUL, radio: 5.5, alfa: ap }), punto([x, r], { color: ORO, radio: 5.5, alfa: ap }), linea([x, 0], [x, r], { color: BLANCO, ancho: 1.2, alfa: 0.5 * ap, discontinua: true }));
          N.push(rotulo([9.8, 0.9], R`\mu - \text{silueta} = ${coma(m - r, 3)}`, { clave: 'dif', ancla: 'r', tam: 22, color: BLANCO, alfa: ap }));
          N.push(rotulo([9.8, 0.8], R`\text{nunca llega a } \tfrac{1}{n} = ${coma(1 / n, 3)}`, { clave: 'cot', ancla: 'r', tam: 22, color: ORO, alfa: ap }));
        }
      }
      return N;
    },
  },
  manipulacion: '<ul><li>Mueve «niveles» de 1 a 40. Con pocos, escalones enormes; con muchos, se recupera la curva.</li><li>Arrastra la línea vertical y compara el error con su límite.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La sorpresa', texto: 'Los cortes parecen perder información: de cada uno solo sabes quién está dentro, sin grados. Pero si tienes <em>todos</em> los cortes, puedes reconstruir cada grado. Sin perder nada.' },
    { tipo: 'ejemplo', texto: '¿Qué grado tiene la casa de 3 dormitorios? Mira en qué cortes aparece:', tabla: [['Listón', '0,2', '0,5', '0,8', '1'], ['¿Está el 3?', 'sí', 'sí', 'sí', 'no']], cierre: 'El listón más alto que supera es 0,8. Y ese es exactamente su grado. Cada elemento lleva su grado escrito en el último corte que pasa.' },
    { tipo: 'idea', etiqueta: 'Bloques', texto: 'Eso es lo que hacen los bloques de la escena: cada corte se convierte en un bloque de altura α. En cada punto, el bloque más alto que lo cubre llega hasta su grado.' },
    { tipo: 'simbolos', intro: 'Dicho en fórmula. Necesitamos una pieza nueva.', piezas: [
      { tex: R`\mathbf{1}_E(x)`, dice: 'Un interruptor: vale 1 si $x$ está en $E$, y 0 si no. Se llama función [[indicadora]].' },
      { tex: R`\alpha \cdot \mathbf{1}_{A_\alpha}(x)`, dice: 'El bloque: vale $\\alpha$ si $x$ está en el corte, y 0 si no.' },
      { tex: R`\sup_\alpha`, dice: 'De todos los niveles, el valor más alto. Se llama [[supremo]]; por ahora, piensa en él como «el mayor».' },
    ], todo: R`\mu_A(x) = \sup_{\alpha \in (0, 1]} \alpha \cdot \mathbf{1}_{A_\alpha}(x)`, lee: '«El grado de $x$ es la altura del bloque más alto que lo cubre». Es lo que has hecho a mano con la casa de 3 dormitorios.' },
    { tipo: 'formal', titulo: 'Teorema de representación', tex: R`Para todo conjunto difuso $A$ y todo $x \in X$: $\ \mu_A(x) = \sup_{\alpha \in (0, 1]} \alpha \cdot \mathbf{1}_{A_\alpha}(x)$.`, lee: 'También se le llama teorema de descomposición: un conjunto difuso se descompone en clásicos.' },
    { tipo: 'demo', titulo: 'Teorema de representación', valiente: true, cartelas: ['En un mundo de conjuntos sin borde…', 'alguien afirmó que bastan <em>bordes nítidos</em> para reconstruirlo todo…', 'nadie le creyó. Hasta que trajo un supremo.'], plan: 'La idea: fija un punto, llama $m$ a su grado, y reparte los listones en dos grupos: los que supera y los que no.', pasos: [
      { texto: R`Fijemos $x \in X$ y llamemos $m = \mu_A(x)$. Hay que ver que el [[supremo]] vale $m$.`, porque: 'Dos funciones son iguales si coinciden en cada punto.' },
      { texto: R`Si $\alpha > m$: $x$ no llega al listón, luego $x \notin A_\alpha$ y el bloque vale $0$.`, porque: 'Definición de corte.' },
      { texto: R`Si $0 < \alpha \le m$: $x$ sí llega, luego $x \in A_\alpha$ y el bloque vale $\alpha$.`, porque: 'Definición de corte, otra vez.' },
      { texto: R`Si $m = 0$: todos los listones están en el primer grupo. Todos los bloques valen 0, y el [[supremo]] es $0 = m$.`, porque: 'Como $\\alpha > 0$, siempre $\\alpha > m$.' },
      { texto: R`Si $m > 0$: los valores son 0 y todos los $\alpha \in (0, m]$. El mayor es $m$, y se alcanza con $\alpha = m$.`, porque: '$m$ está entre los listones permitidos, y ningún valor lo supera.' },
      { texto: R`En ambos casos el [[supremo]] es $m = \mu_A(x)$.`, porque: 'Como $x$ era cualquiera, vale para todo $X$.' },
    ] },
    { tipo: 'idea', etiqueta: 'Con finitos niveles', texto: 'En la práctica no se usan infinitos listones. ¿Cuánto se pierde con unos pocos? Muy poco, y se puede decir con exactitud: con $n$ niveles repartidos por igual, el error nunca llega a $\\frac{1}{n}$.' },
    { tipo: 'ejemplo', texto: 'Con 4 niveles (0,25; 0,5; 0,75; 1):', tabla: [['Grado real', '0,8', '0,3', '0,5'], ['Bloque más alto', '0,75', '0,25', '0,5'], ['Error', '0,05', '0,05', '0']], cierre: 'Siempre menos de $\\frac{1}{4}$.' },
    { tipo: 'demo', titulo: 'El error es menor que 1 entre n', plan: 'Se usa la [[parte entera]]: $\\lfloor t \\rfloor$ es $t$ sin decimales, por ejemplo $\\lfloor 3{,}2 \\rfloor = 3$. Siempre cumple $t - 1 < \\lfloor t \\rfloor \\le t$.', tex: R`Con niveles $\frac{k}{n}$, la altura es $r_n(x) = \dfrac{\lfloor n\, \mu_A(x) \rfloor}{n}$, y $0 \le \mu_A(x) - r_n(x) < \frac{1}{n}$.`, pasos: [
      { texto: R`$x$ supera el nivel $\frac{k}{n}$ si y solo si $k \le n\, \mu_A(x)$.`, porque: 'Definición de corte, multiplicando por $n$, que es positivo.' },
      { texto: R`El mayor $k$ entero que cumple eso es $\lfloor n\, \mu_A(x) \rfloor$, así que $r_n(x) = \frac{\lfloor n\, \mu_A(x) \rfloor}{n}$.`, porque: 'Es lo que hace la [[parte entera]]. Si da 0, ningún bloque cubre a $x$ y la altura es 0.' },
      { texto: R`Con $t = n\, \mu_A(x)$ en $t - 1 < \lfloor t \rfloor \le t$, y dividiendo por $n$: $\mu_A(x) - \frac{1}{n} < r_n(x) \le \mu_A(x)$.`, porque: 'Dividir por un positivo conserva las desigualdades. Reordenando sale lo que queríamos.' },
    ] },
    { tipo: 'nota', titulo: 'Por qué importa', texto: 'Se puede trabajar nivel a nivel, con herramientas clásicas, y recomponer el resultado al final. Así funcionarán la aritmética de números difusos y el principio de extensión, en la región 4.' },
  ],
  tecnicas: [
    { titulo: 'Parte en dos los casos', texto: 'Para calcular un [[supremo]] con una condición, separa los índices en los que la condición se cumple de los que no, y resuelve cada grupo.' },
    { titulo: 'Dos cosas en una', texto: 'Demostrar que un [[supremo]] vale $m$ es probar dos cosas: ningún valor lo supera, y hay valores que lo alcanzan o se le acercan.' },
  ],
  retos: [
    { id: 'niveles-necesarios', tipo: 'calcular', enunciado: R`Quieres que la silueta tenga un error estrictamente menor que $0{,}05$ en todo punto, sea cual sea el conjunto. ¿Cuál es el menor $n$ que lo garantiza, sabiendo que $\mu_A - r_n < \frac{1}{n}$?`, respuesta: 20, tol: 0.4,
      pistas: [R`Basta $\frac{1}{n} \le 0{,}05$: esa desigualdad ya es estricta.`], explicacion: R`$\frac{1}{20} = 0{,}05$, y como la desigualdad es estricta, $n = 20$ basta.` },
    { id: 'demostrar-representacion', tipo: 'demostrar', enunciado: R`Demuestra la versión con cortes fuertes: $\mu_A(x) = \sup_{\alpha \in [0, 1)} \alpha \cdot \mathbf{1}_{A_{\alpha^+}}(x)$.`,
      pistas: ['Copia el esquema del teorema: fija $x$, sea $m = \\mu_A(x)$, y separa los niveles.', 'Ahora $x \\in A_{\\alpha^+}$ exige $\\alpha < m$: el [[supremo]] ya no se alcanza. ¿Sigue valiendo $m$?'],
      solucion: [
        { texto: R`Sea $m = \mu_A(x)$. Si $\alpha \ge m$, entonces $x \notin A_{\alpha^+}$ y el valor es $0$.`, porque: 'Definición de corte fuerte: $x \\in A_{\\alpha^+}$ exige $\\mu_A(x) > \\alpha$.' },
        { texto: R`Si $\alpha < m$, entonces $x \in A_{\alpha^+}$ y el valor es $\alpha$.`, porque: 'La misma definición.' },
        { texto: R`Si $m = 0$, todo $\alpha \in [0, 1)$ cumple $\alpha \ge m$: todos los valores son $0$, y el [[supremo]] es $0 = m$.`, porque: 'Solo se aplica el primer caso.' },
        { texto: R`Si $m > 0$, el conjunto de valores no nulos es $(0, m)$, cuyo [[supremo]] es $m$ aunque no se alcance.`, porque: 'El [[supremo]] de un [[intervalo]] $[0, m)$ es su extremo $m$.' },
      ] },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., Kluwer, 2001, caps. 1–2.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 2 (teoremas de descomposición).', 'M. Navara, temario del curso <em>Fuzzy Logic</em>, CTU Praga: teorema de representación por cortes.'],
};
