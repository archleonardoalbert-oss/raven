import { AZUL, ORO, ROSA, BLANCO } from '../../motor/colores.js';
import { triangular } from '../../nucleo/difuso.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const DOM = [0, 10];
const A = triangular(2, 4, 6), B = triangular(3, 6, 9);
const entrada = (c) => triangular(c - 2, c, c + 2);
const altura = (c) => { const f = entrada(c); let m = 0, xm = 0; for (let i = 0; i <= 1000; i++) { const x = i / 100, v = Math.min(f(x), A(x)); if (v > m) { m = v; xm = x; } } return { h: m, x: xm }; };

export default {
  id: '5-5-modus-ponens',
  titulo: 'Modus ponens generalizado',
  puente: 'El recorte es la versión cómoda. Detrás hay una receta general que sirve con cualquier regla. Se llama regla composicional, y junta todo lo que has aprendido.',
  pregunta: '«Si el tomate está rojo, está maduro». Este tomate está <em>bastante</em> rojo. ¿Qué concluyes? La lógica clásica se calla. Tú concluirías: bastante maduro.',
  escena: {
    id: 'modus-ponens', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: [0, 1], caja: { x: 70, y: 90, w: 450, h: 340 } },
    entradas: [{ id: 'c', tipo: 'deslizador', etiqueta: 'lo que sabes: «cerca de…»', min: 0, max: 10, paso: 0.05, valor: 5.2 }],
    pasos: [
      { dur: 2400, texto: 'La regla: «si $x$ es <b style="color:#58c4dd;font-weight:400">A</b>, entonces $y$ es <b style="color:#fc6282;font-weight:400">B</b>». A la izquierda, A. A la derecha, B.' },
      { dur: 2400, texto: 'Lo que sabes no es exactamente A, sino algo parecido: <b style="color:#ffffff;font-weight:400">A′</b>. Se solapa con A, en parte.' },
      { dur: 2600, texto: '¿Cuánto se cumple la regla? Lo que indica <b style="color:#f4d345;font-weight:400">el punto más alto del solape</b>. Es un número: la fuerza con que se dispara la regla.' },
      { dur: 3000, texto: 'Lleva esa altura a la derecha, y <b style="color:#f4d345;font-weight:400">corta B</b> a ese nivel. Lo que queda es la conclusión, B′. Si se cumple a medias, concluyes a medias.' },
    ],
    primitivas({ q, paso, e }) {
      const c = paso === 3 && q(3) >= 1 ? e.c : 5.2, Ap = entrada(c), { h, x } = altura(c), al = ev(q(0), 0, 0.4);
      const N = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 5, 10], y: [0, 1] }, etiquetas: { x: 'x', y: R`\mu` } }), curva((u) => [u, A(u)], DOM, { hasta: Math.max(ev(q(0), 0, 1), 1e-3), n: 300, color: AZUL, ancho: 3, brillo: true })];
      N.push(rotulo([3.2, 1], 'A', { clave: 'A', dy: -18, tam: 24, color: AZUL, alfa: al }));
      const D = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 5, 10], y: [0, 1] }, etiquetas: { x: 'y' } }), curva((u) => [u, B(u)], DOM, { hasta: Math.max(ev(q(0), 0, 1), 1e-3), n: 300, color: ROSA, ancho: paso === 3 ? 1.6 : 3, alfa: paso === 3 ? 0.55 : 1 })];
      D.push(rotulo([6, 1], 'B', { clave: 'B', dy: -18, tam: 24, color: ROSA, alfa: al }));
      const ap = ev(q(1), 0, 0.5);
      if (ap > 0) N.push(curva((u) => [u, Ap(u)], DOM, { n: 300, color: BLANCO, ancho: 3, alfa: ap }), rotulo([c, 1], R`A'`, { clave: 'Ap', dy: -18, tam: 24, alfa: ap }));
      const so = ev(q(2), 0, 0.6);
      if (so > 0) {
        for (let i = 0; i < 200; i++) { const x0 = i / 20, x1 = (i + 1) / 20, y0 = Math.min(Ap(x0), A(x0)), y1 = Math.min(Ap(x1), A(x1)); if (y0 + y1 > 1e-4) N.push(poligono([[x0, 0], [x1, 0], [x1, y1 * so], [x0, y0 * so]], { color: ORO, alfa: 0.55 })); }
        if (h > 0) N.push(punto([x, h], { color: ORO, radio: 7, alfa: so }), linea([x, h], [10, h], { color: ORO, ancho: 1.4, alfa: 0.8 * so, discontinua: true }));
        N.push(rotulo([9.8, 0.92], R`h = ${coma(h)}`, { clave: 'h', ancla: 'r', tam: 26, color: ORO, alfa: so }));
      }
      const cu = ev(q(3), 0, 0.7);
      if (cu > 0) {
        const nivel = mix(1, h, cu), sal = (u) => Math.min(nivel, B(u));
        for (let i = 0; i < 200; i++) { const x0 = i / 20, x1 = (i + 1) / 20; if (B(x0) + B(x1) > 1e-4) D.push(poligono([[x0, 0], [x1, 0], [x1, sal(x1)], [x0, sal(x0)]], { color: ORO, alfa: 0.55 })); }
        D.push(linea([0, nivel], [10, nivel], { color: ORO, ancho: 1.4, alfa: 0.8 * cu, discontinua: true }), curva((u) => [u, sal(u)], DOM, { n: 300, color: ORO, ancho: 3.4 }));
        D.push(rotulo([6, nivel], R`B'`, { clave: 'Bp', dy: -18, tam: 25, color: ORO, alfa: cu }));
      }
      return { principal: N, paneles: [{ ejes: { x: DOM, y: [0, 1], caja: { x: 590, y: 90, w: 450, h: 340 } }, prims: D }] };
    },
  },
  manipulacion: '<ul><li>Mueve lo que sabes: cuanto más se aleja de A, más baja la altura, y más se recorta B.</li><li>Si no se solapan, la regla no se dispara: la conclusión es vacía.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'El [[modus ponens]] clásico exige que el dato coincida exactamente con la condición. Si tu tomate está «bastante rojo» y la regla dice «rojo», la lógica clásica se queda muda. El modus ponens generalizado permite concluir de un dato <em>parecido</em> a la condición.' },
    { tipo: 'ejemplo', texto: 'Con tres datos distintos, y la regla «si A, entonces B»:', tabla: [['Lo que sabes', 'Solape con A', 'Conclusión'], ['Exactamente A', '1', 'B entero'], ['Parecido a A', '0,6', 'B, recortado a 0,6'], ['Nada que ver con A', '0', 'Nada']], cierre: 'Cuanto más se parece el dato a la condición, más fuerte es la conclusión.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`A'`, dice: 'Lo que sabes, que se parece a $A$. La comilla se lee «prima».' },
      { tex: R`\min(\mu_{A'}(x),\ \mu_A(x))`, dice: 'El solape: la zona dorada de la izquierda.' },
      { tex: R`h = \sup_x \min(\mu_{A'}(x),\ \mu_A(x))`, dice: 'Lo más alto del solape: su [[supremo]]. Es cuánto se dispara la regla.' },
      { tex: R`\min(h,\ \mu_B(y))`, dice: 'Corta $B$ a esa altura.' },
    ], todo: R`\mu_{B'}(y) = \min(h,\ \mu_B(y))`, lee: '«La conclusión es $B$, recortada a la altura del solape». Es la versión con la regla de Mamdani.' },
    { tipo: 'formal', titulo: 'Modus ponens generalizado', tex: R`Dados: regla «si $x$ es $A$, entonces $y$ es $B$», y hecho «$x$ es $A'$». Se concluye: «$y$ es $B'$», con $\mu_{B'}(y) = \sup_x \min(\mu_{A'}(x),\ \mu_R(x, y))$.`, lee: 'Si $R$ es $\\min(\\mu_A, \\mu_B)$, esta fórmula general se reduce al recorte. Ahora lo demostramos.' },
    { tipo: 'demo', titulo: 'Con Mamdani, se reduce a un recorte', plan: 'El truco es que $\\mu_B(y)$ no depende de $x$, y se puede sacar del [[supremo]].', tex: R`Si $\mu_R(x, y) = \min(\mu_A(x), \mu_B(y))$, entonces $\mu_{B'}(y) = \min(h,\ \mu_B(y))$.`, pasos: [
      { texto: R`$\mu_{B'}(y) = \sup_x \min\big(\mu_{A'}(x),\ \min(\mu_A(x), \mu_B(y))\big)$.`, porque: 'Sustituir $R$ en la definición.' },
      { texto: R`El mínimo es [[asociativo|asociativa]]: es $\sup_x \min\big(\min(\mu_{A'}(x), \mu_A(x)),\ \mu_B(y)\big)$.`, porque: 'Reagrupar los tres números.' },
      { texto: R`Como $\mu_B(y)$ es fijo, sale del [[supremo]]: $\min\big(\sup_x \min(\mu_{A'}(x), \mu_A(x)),\ \mu_B(y)\big)$.`, porque: 'Para un número fijo $c$: $\\sup_x \\min(u(x), c) = \\min(\\sup_x u(x), c)$. Vale porque el mínimo con $c$ es continuo y creciente.' },
      { texto: R`Lo que queda dentro es exactamente $h$. Luego $\mu_{B'}(y) = \min(h,\ \mu_B(y))$.`, porque: 'Definición de $h$.' },
    ] },
    { tipo: 'nota', titulo: 'Y si fuera el producto', texto: 'Si se usa el producto en todos los pasos, $h$ pasa a ser $\\sup_x \\mu_{A\'}(x)\\, \\mu_A(x)$, y $B$ no se corta, sino que se escala: $h \\cdot \\mu_B(y)$. Conserva la forma de la curva. Es la otra opción habitual.' },
  ],
  tecnicas: [
    { titulo: 'Saca lo que no depende', texto: 'Dentro de un [[supremo]] en $x$, lo que no depende de $x$ se puede sacar. Es como sacar factor común.' },
  ],
  retos: [
    { id: 'altura-recorte', tipo: 'manipular', enunciado: R`Mueve lo que sabes para que la regla se dispare con una fuerza entre $0{,}45$ y $0{,}55$.`, precision: (e) => { const h = altura(e.c).h; return h >= 0.45 && h <= 0.55 ? 1 : 0; }, prueba: { c: 6 }, pendiente: (e) => `Ahora la fuerza es ${altura(e.c).h.toFixed(2).replace('.', ',')}.`, pistas: ['Cuanto más separados, menos solape.'], explicacion: 'Dos triángulos iguales, con las cimas separadas 2, se cruzan a media altura.' },
    { id: 'mp-calc', tipo: 'calcular', enunciado: R`Si el solape tiene altura $h = 0{,}6$, y $\mu_B(y) = 0{,}9$, ¿cuánto vale $\mu_{B'}(y)$ con Mamdani?`, respuesta: 0.6, tol: 0.001, pistas: ['Recorta a la altura $h$.'], explicacion: R`$\min(0{,}6;\ 0{,}9) = 0{,}6$.` },
    { id: 'demuestra-recorte', tipo: 'demostrar', enunciado: R`Demuestra que, si $A' = A$ y $A$ es normal, entonces con Mamdani $B' = B$.`, pistas: ['¿Cuánto vale $h$ si $A\' = A$?'],
      solucion: [
        { texto: R`Con $A' = A$: $h = \sup_x \min(\mu_A(x), \mu_A(x)) = \sup_x \mu_A(x)$.`, porque: 'El mínimo de un número consigo mismo es ese número.' },
        { texto: R`Como $A$ es normal, ese [[supremo]] vale 1: $h = 1$.`, porque: 'Definición de normal.' },
        { texto: R`Luego $\mu_{B'}(y) = \min(1,\ \mu_B(y)) = \mu_B(y)$.`, porque: 'Si el dato es exactamente la condición, se concluye exactamente la conclusión: es el modus ponens clásico.' },
      ] },
  ],
  referencias: ['L. A. Zadeh (1973, 1975): el razonamiento aproximado.', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 9.'],
};
