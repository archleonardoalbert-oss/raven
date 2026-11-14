import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { sugeno } from '../../nucleo/operadores.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const fijo = (l) => (Math.abs(l) < 1e-6 ? 0.5 : (Math.sqrt(1 + l) - 1) / l);

export default {
  id: '3-6-complementos',
  titulo: 'Muchos «no»: los complementos',
  puente: 'Una familia de «y», otra de «o», otra de «no». ¿No se podrían fabricar todas de un modo sencillo? Sí: con una sola curva.',
  pregunta: '¿«No» siempre es «lo que falta para 1»? Si alguien es un poco alto, ¿es «muy no alto» o «poco no alto»? Quizá el punto de equilibrio no tiene por qué estar en la mitad.',
  escena: {
    id: 'complementos', formato: 'plano', W: 1100, H: 620,
    ejes: { x: [0, 1], y: [0, 1], caja: { x: 300, y: 50, w: 500, h: 500 } },
    entradas: [
      { id: 'l', tipo: 'deslizador', etiqueta: 'λ', min: -0.9, max: 10, paso: 0.01, valor: 2 },
      { id: 'a', tipo: 'arrastre', eje: 'x', valor: [0.25, 0], region: { x: [0, 1], y: [0, 1] } },
    ],
    pasos: [
      { dur: 2200, texto: 'Este es el «no» de siempre. Pon un grado $a$ en la base, y la curva dice cuánto vale «no $a$». Si $a$ sube, «no $a$» baja.' },
      { dur: 3000, texto: 'Aplica el «no» dos veces: sube a la curva, cruza hasta la diagonal, y baja. <em>Vuelves a donde empezaste</em>: «no no $a$» es $a$. En el dibujo, es un rectángulo que se cierra.' },
      { dur: 2600, texto: 'Pero se puede doblar la curva con un botón, $\\lambda$. Sigue siendo decreciente, sigue yendo de 1 a 0, y el rectángulo sigue cerrándose.' },
      { dur: 2200, texto: 'Lo que cambia es el <b style="color:#f4d345;font-weight:400">punto de equilibrio</b>: donde «a» y «no a» valen lo mismo. Ya no tiene por qué ser 0,5.' },
    ],
    primitivas({ q, paso, e }) {
      const l = paso < 2 ? 0 : paso === 2 ? mix(0, e.l, ev(q(2), 0, 0.8)) : e.l, c = sugeno(l), al = ev(q(0), 0, 0.4), a = e.a[0];
      const N = [marco({ x: [0, 1], y: [0, 1] }, { alfa: al, ticks: { x: [0, 0.5, 1], y: [0, 1] }, etiquetas: { x: 'a', y: R`c(a)` }, colorY: ORO })];
      N.push(linea([0, 0], [1, 1], { color: GRIS2, ancho: 1.2, alfa: 0.6 * al, discontinua: true }));
      N.push(curva((u) => [u, c(u)], [0, 1], { hasta: Math.max(ev(q(0), 0.1, 0.8), 1e-3), n: 200, color: ORO, ancho: 3.4, brillo: true }));
      const ca = c(a), s = ev(q(0), 0.6, 1);
      N.push(punto([a, 0], { color: AZUL, radio: 6, alfa: s }), linea([a, 0], [a, ca], { color: AZUL, ancho: 2, alfa: s }), punto([a, ca], { color: BLANCO, radio: 5, alfa: s }));
      N.push(rotulo([a, 0], 'a', { clave: 'a', dy: 38, tam: 21, color: AZUL, alfa: s }));
      const r = paso >= 1 ? ev(q(1), 0, 1) : 0;
      if (r > 0) {
        const c2 = c(ca);
        const t1 = ev(r, 0, 0.35), t2 = ev(r, 0.35, 0.7), t3 = ev(r, 0.7, 1);
        N.push(linea([a, ca], [mix(a, ca, t1), ca], { color: ROSA, ancho: 2, alfa: 0.9 }));
        if (t2 > 0) N.push(linea([ca, ca], [ca, mix(ca, c2, t2)], { color: ROSA, ancho: 2, alfa: 0.9 }));
        if (t3 > 0) N.push(linea([ca, a], [mix(ca, a, t3), a], { color: ROSA, ancho: 2, alfa: 0.9 }), rotulo([a, a], R`c(c(a)) = a`, { clave: 'vuelve', dx: 14, dy: 22, ancla: 'l', tam: 21, color: ROSA, alfa: t3, siempre: true }));
        N.push(punto([ca, ca], { color: ROSA, radio: 4, alfa: r, halo: 0 }), punto([ca, mix(ca, c2, t2)], { color: ROSA, radio: 3, alfa: t2, halo: 0 }), punto([mix(ca, a, t3), a], { color: ROSA, radio: 3, alfa: t3, halo: 0 }), punto([mix(a, ca, t1), ca], { color: ROSA, radio: 3, alfa: t1, halo: 0 }));
      }
      const pf = ev(q(3), 0, 0.6);
      if (pf > 0) {
        const f = fijo(l);
        N.push(punto([f, f], { color: ORO, radio: 8, alfa: pf }));
        N.push(rotulo([f, f], R`\text{equilibrio: } ${coma(f)}`, { clave: 'fijo', dx: 16, dy: 16, ancla: 'l', tam: 22, color: ORO, alfa: pf }));
      }
      N.push(rotulo([1, 1], R`\lambda = ${coma(l)}`, { clave: 'lam', dx: 16, dy: 8, ancla: 'l', tam: 22, alfa: ev(q(2), 0, 0.3) }));
      return N;
    },
  },
  manipulacion: '<ul><li>Mueve $\\lambda$: hacia arriba, el «no» se vuelve más exigente; hacia abajo, más generoso.</li><li>Arrastra la línea azul por la base: el rectángulo rosa siempre se cierra.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'El «no» habitual es lo que falta para 1. Pero piensa qué le pides a un «no»: que «no totalmente» sea nada, que «no nada» sea todo, y que cuanto más seas algo, menos seas lo contrario. Hay muchas curvas que cumplen eso.' },
    { tipo: 'ejemplo', texto: 'Tres «no» para los mismos grados:', tabla: [['Grado a', '0', '0,25', '0,5', '0,75', '1'], ['1 − a', '1', '0,75', '0,5', '0,25', '0'], ['Sugeno con λ = 2', '1', '0,5', '0,25', '0,1', '0'], ['Sugeno con λ = −0,5', '1', '0,86', '0,67', '0,4', '0']], cierre: 'Todos empiezan en 1 y acaban en 0. Lo que cambia es cuán rápido caen.' },
    { tipo: 'simbolos', intro: 'La familia de Sugeno, pieza a pieza.', piezas: [
      { tex: R`1 - a`, dice: 'Arriba, el «no» de siempre.' },
      { tex: R`\lambda`, dice: '«Lambda»: el botón. Un número mayor que −1.' },
      { tex: R`1 + \lambda a`, dice: 'Abajo, algo que crece con $a$ si $\\lambda$ es positivo, y entonces hace que el resultado caiga más rápido.' },
    ], todo: R`c_\lambda(a) = \dfrac{1 - a}{1 + \lambda a}`, lee: 'Con $\\lambda = 0$, queda $1 - a$: el de siempre. El botón solo dobla la curva.' },
    { tipo: 'formal', titulo: 'Complemento difuso', tex: R`Un [[complemento]] es una función $c : [0,1] \to [0,1]$ con $c(0) = 1$, $c(1) = 0$, y decreciente: si $a \le b$, entonces $c(a) \ge c(b)$. Suele pedirse además que sea [[involutivo]]: $c(c(a)) = a$.`, lee: 'Otra familia: la de Yager, $c_w(a) = (1 - a^w)^{\\frac{1}{w}}$, con $w > 0$.' },
    { tipo: 'idea', etiqueta: 'El equilibrio', texto: 'Si dibujas una curva decreciente y la diagonal, se cruzan en un solo punto: donde $c(a) = a$. Es el [[punto fijo]]: el grado que es tan «a» como «no a». En el «no» de siempre, es 0,5.' },
    { tipo: 'demo', titulo: 'El complemento de Sugeno es involutivo', plan: 'Es una cuenta, y el truco está en no perderse: sustituye una fracción dentro de otra y multiplica arriba y abajo por el mismo denominador.', tex: R`Para $\lambda > -1$: $\ c_\lambda(c_\lambda(a)) = a$.`, pasos: [
      { texto: R`Sea $u = c_\lambda(a) = \frac{1 - a}{1 + \lambda a}$. Entonces $c_\lambda(u) = \frac{1 - u}{1 + \lambda u}$.`, porque: 'Se aplica la definición a $u$.' },
      { texto: R`Arriba: $1 - u = \frac{(1 + \lambda a) - (1 - a)}{1 + \lambda a} = \frac{a(1 + \lambda)}{1 + \lambda a}$.`, porque: 'Denominador común; se simplifica, y se saca $a$ como factor.' },
      { texto: R`Abajo: $1 + \lambda u = \frac{(1 + \lambda a) + \lambda(1 - a)}{1 + \lambda a} = \frac{1 + \lambda}{1 + \lambda a}$.`, porque: 'Denominador común. Los términos $\\lambda a$ se cancelan.' },
      { texto: R`Al dividir uno entre otro se cancela todo menos $a$: $c_\lambda(u) = a$.`, porque: 'Se cancelan $1 + \\lambda a$ y $1 + \\lambda$; este último no es 0 porque $\\lambda > -1$.' },
    ] },
  ],
  tecnicas: [
    { titulo: 'Fracciones dentro de fracciones', texto: 'Calcula por separado el numerador y el denominador, con denominador común, y divide al final. Se cancela casi todo.' },
    { titulo: 'Lee la gráfica como un mapa', texto: 'Aplicar una función dos veces se puede ver subiendo a la curva y cruzando a la diagonal. Es una técnica que sirve siempre.' },
  ],
  retos: [
    { id: 'punto-fijo', tipo: 'manipular', enunciado: R`Mueve $\lambda$ hasta que el punto de equilibrio esté en $0{,}3$, con error menor que $0{,}01$.`, precision: (e) => (Math.abs(fijo(e.l) - 0.3) < 0.01 ? 1 : 0), prueba: { l: 4.44 }, pendiente: (e) => `El equilibrio está ahora en ${fijo(e.l).toFixed(2).replace('.', ',')}.`, pistas: ['Para bajar el equilibrio, $\\lambda$ tiene que ser positivo.'], explicacion: R`Con $\lambda \approx 4{,}44$, el «no» exige mucho: con grado 0,3 ya estás a medias.` },
    { id: 'calcula-sugeno', tipo: 'calcular', enunciado: R`¿Cuánto vale $c_\lambda(a) = \frac{1 - a}{1 + \lambda a}$ con $\lambda = 2$ y $a = 0{,}25$?`, respuesta: 0.5, tol: 0.001, pistas: [R`Arriba, $0{,}75$. Abajo, $1 + 2 \cdot 0{,}25$.`], explicacion: R`$\frac{0{,}75}{1{,}5} = 0{,}5$.` },
    { id: 'demuestra-involucion', tipo: 'demostrar', enunciado: R`Demuestra que un complemento involutivo no puede saltarse ningún valor: todo $y \in [0, 1]$ es $c(a)$ para algún $a$.`, pistas: ['Propón tú mismo el $a$ que sirve.', '¿Qué pasa si tomas $a = c(y)$?'],
      solucion: [
        { texto: R`Dado $y \in [0, 1]$, toma $a = c(y)$.`, porque: 'Es un valor permitido: $c$ da números en $[0, 1]$.' },
        { texto: R`Entonces $c(a) = c(c(y)) = y$.`, porque: 'Es lo que dice que sea involutivo. Hemos encontrado el $a$ que buscábamos.' },
      ] },
  ],
  referencias: ['M. Sugeno (1977), y R. R. Yager (1980): las familias de complementos.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 3.', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001.'],
};
