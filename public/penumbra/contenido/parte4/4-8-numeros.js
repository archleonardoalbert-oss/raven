import { AZUL, BLANCO, ORO, ROSA } from '../../motor/colores.js';
import { triangular } from '../../nucleo/difuso.js';
import { cortesTri, sumaTri } from '../../nucleo/relaciones.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => String(+v.toFixed(2)).replace('.', '{,}');
const DOM = [0, 14];
const n1 = [1, 2, 4];
const n2 = (c) => [c - 1, c, c + 2];

export default {
  id: '4-8-numeros',
  titulo: 'Números difusos y su aritmética',
  puente: 'Has terminado «Relaciones y extensión». Ya tienes conjuntos, operaciones y relaciones. Falta usarlos para lo más humano: sacar conclusiones de frases vagas.',
  pregunta: 'Si el trayecto dura «unos 2 minutos» y la cola «unos 5», ¿cuánto tardas? «Unos 7», claro. Pero ¿cuánto de «unos»? ¿Se puede hacer la cuenta en serio?',
  escena: {
    id: 'numeros', formato: 'plano', W: 1100, H: 540,
    ejes: { x: DOM, y: [0, 1], caja: { x: 90, y: 60, w: 920, h: 400 } },
    entradas: [
      { id: 'alfa', tipo: 'deslizador', etiqueta: 'listón α', min: 0, max: 1, paso: 0.01, valor: 0.5 },
      { id: 'c', tipo: 'deslizador', etiqueta: 'centro del segundo número', min: 2, max: 8, paso: 0.1, valor: 5 },
    ],
    pasos: [
      { dur: 2000, texto: 'Dos números difusos: <b style="color:#58c4dd;font-weight:400">«unos 2»</b> y <b style="color:#fc6282;font-weight:400">«unos 5»</b>. Cada uno es un triángulo, con su cima y sus márgenes.' },
      { dur: 2800, texto: 'Sumarlos con el principio de extensión es muy largo. Hay un atajo: los <b>cortes</b>. Pon un listón: cada número se convierte en un intervalo normal.' },
      { dur: 2800, texto: 'Sumar intervalos es lo más fácil del mundo: se suman los extremos izquierdos y los derechos. Eso da un intervalo de la suma, a esa altura.' },
      { dur: 3600, texto: 'Sube el listón de abajo arriba, y apila cada intervalo: <b style="color:#f4d345;font-weight:400">aparece un triángulo</b>. Cima con cima, pie con pie. Y es más ancho: las dudas se suman.' },
    ],
    primitivas({ q, paso, e }) {
      const c = paso >= 3 && q(3) >= 1 ? e.c : 5, A = n1, B = n2(c), S = sumaTri(A, B), al = ev(q(0), 0, 0.4);
      const alfa = paso === 3 ? mix(ev(q(3), 0, 0.7), e.alfa, ev(q(3), 0.75, 1)) : paso >= 1 ? e.alfa * ev(q(1), 0, 0.6) + (1 - ev(q(1), 0, 0.6)) * 0.02 : 0.02;
      const N = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [0, 2, 4, 6, 8, 10, 12, 14], y: [0, 1] }, etiquetas: { x: 'x', y: R`\mu` } })];
      const fa = triangular(...A), fb = triangular(...B), fs = triangular(...S), t = Math.max(ev(q(0), 0, 1), 1e-3);
      N.push(curva((u) => [u, fa(u)], DOM, { hasta: t, n: 400, color: AZUL, ancho: 3, brillo: true }), curva((u) => [u, fb(u)], DOM, { hasta: t, n: 400, color: ROSA, ancho: 3, brillo: true }));
      if (paso >= 1) {
        const a = ev(q(1), 0, 0.4), [a0, a1] = cortesTri(A, alfa), [b0, b1] = cortesTri(B, alfa);
        N.push(linea([0, alfa], [DOM[1], alfa], { color: BLANCO, ancho: 1, alfa: 0.4 * a, discontinua: true }));
        N.push(linea([a0, alfa], [a1, alfa], { color: AZUL, ancho: 5, alfa: a }), linea([b0, alfa], [b1, alfa], { color: ROSA, ancho: 5, alfa: a }));
        for (const [x, cc] of [[a0, AZUL], [a1, AZUL], [b0, ROSA], [b1, ROSA]]) N.push(punto([x, alfa], { color: cc, radio: 5, alfa: a }));
        N.push(rotulo([0.1, alfa], R`\alpha = ${coma(alfa)}`, { clave: 'alfa', dy: -16, ancla: 'l', tam: 20, alfa: a }));
      }
      if (paso >= 2) {
        const b = paso === 2 ? ev(q(2), 0, 0.8) : 1, [s0, s1] = cortesTri(S, alfa), [a0, a1] = cortesTri(A, alfa), [b0, b1] = cortesTri(B, alfa);
        N.push(linea([mix(b0, s0, b), alfa], [mix(b1, s1, b), alfa], { color: ORO, ancho: 6, alfa: b }), punto([mix(b0, s0, b), alfa], { color: ORO, radio: 6, alfa: b }), punto([mix(b1, s1, b), alfa], { color: ORO, radio: 6, alfa: b }));
        N.push(rotulo([9.8, 0.82], R`[${coma(a0)},\ ${coma(a1)}] + [${coma(b0)},\ ${coma(b1)}] = {\color{#f4d345}[${coma(s0)},\ ${coma(s1)}]}`, { clave: 'cuenta', tam: 23, alfa: b }));
      }
      if (paso >= 3) {
        const d = q(3) < 1 ? ev(q(3), 0, 0.9) : 1;
        for (let i = 0; i < 40 * d; i++) { const u0 = i / 40, u1 = (i + 1) / 40, [p0, r0] = cortesTri(S, u0), [p1, r1] = cortesTri(S, u1); N.push(poligono([[p0, u0], [r0, u0], [r1, u1], [p1, u1]], { color: ORO, alfa: 0.22 })); }
        N.push(curva((u) => [u, fs(u)], [S[0], S[2]], { hasta: Math.max(d, 1e-3), n: 300, color: ORO, ancho: 3 }));
        N.push(rotulo([S[1], 1], R`\text{suma: }(${coma(S[0])},\ ${coma(S[1])},\ ${coma(S[2])})`, { clave: 'res', dy: -22, tam: 22, color: ORO, alfa: d }));
      }
      return N;
    },
  },
  manipulacion: '<ul><li>Mueve el listón $\\alpha$: los intervalos azul, rosa y dorado cambian a la vez.</li><li>Mueve el centro del segundo número: la suma se desplaza. La anchura de la suma no cambia.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un [[número difuso]] es un conjunto que representa «alrededor de cierto número». Se le pide una sola cima, que llegue a 1, y que sus márgenes acaben en algún sitio. Con ellos se puede hacer aritmética de verdad.' },
    { tipo: 'ejemplo', texto: 'Un triángulo se da con tres números: pie izquierdo, cima, pie derecho. Para sumar, se suma cada uno:', tabla: [['', 'Pie izq.', 'Cima', 'Pie der.'], ['«Unos 2»', '1', '2', '4'], ['«Unos 5»', '4', '5', '7'], ['Suma', '5', '7', '11']], cierre: 'Y es exacto: no es una aproximación. Fíjate: cada número tenía un margen de 1 a la izquierda y de 2 a la derecha; la suma tiene 2 y 4. Las dudas se acumulan.' },
    { tipo: 'simbolos', intro: 'La suma de intervalos es la base.', piezas: [
      { tex: R`[a, b]`, dice: 'Un [[intervalo]]: «entre $a$ y $b$».' },
      { tex: R`[a, b] + [c, d]`, dice: 'Un número del primero más uno del segundo.' },
      { tex: R`[a + c,\ b + d]`, dice: 'Lo menos que puede dar, $a + c$, y lo más, $b + d$.' },
    ], todo: R`(A + B)_\alpha = A_\alpha + B_\alpha`, lee: '«Cada corte de la suma es la suma de los cortes». Este es el atajo: se trabaja nivel a nivel, y se recompone.' },
    { tipo: 'formal', titulo: 'Número difuso y su suma', tex: R`Un número difuso es un conjunto normal y convexo de los reales, de soporte acotado y cortes cerrados. Su suma viene del principio de extensión: $\mu_{A + B}(z) = \sup_{x + y = z} \min(\mu_A(x), \mu_B(y))$, y cumple $(A + B)_\alpha = A_\alpha + B_\alpha$.`, lee: 'La fórmula larga es la definición. La de los cortes es la que se usa para calcular.' },
    { tipo: 'demo', titulo: 'La suma de triángulos es un triángulo', plan: 'Ya tienes todas las piezas: el corte de un triángulo, de «Una curva con pocos botones», y la suma por cortes.', tex: R`Si $A = (a_1, a_2, a_3)$ y $B = (b_1, b_2, b_3)$, entonces $A + B = (a_1 + b_1,\ a_2 + b_2,\ a_3 + b_3)$.`, pasos: [
      { texto: R`El corte de $A$ es $A_\alpha = [a_1 + \alpha(a_2 - a_1),\ a_3 - \alpha(a_3 - a_2)]$, y el de $B$ igual.`, porque: 'Es el corte de un triángulo, ya demostrado.' },
      { texto: R`Sumando los extremos: el izquierdo es $(a_1 + b_1) + \alpha\big((a_2 + b_2) - (a_1 + b_1)\big)$.`, porque: 'Suma de intervalos, y agrupar los términos con $\\alpha$.' },
      { texto: R`El derecho es $(a_3 + b_3) - \alpha\big((a_3 + b_3) - (a_2 + b_2)\big)$.`, porque: 'Igual que antes.' },
      { texto: R`Esos son los cortes del triángulo $(a_1 + b_1,\ a_2 + b_2,\ a_3 + b_3)$. Como los cortes determinan el conjunto, $A + B$ es ese triángulo.`, porque: 'Por el teorema de representación.' },
    ] },
    { tipo: 'nota', titulo: 'Sorpresas', texto: R`La resta no deshace la suma: «unos 5» menos «unos 5» no es 0, sino «cerca de 0», con un margen. Y el producto de dos triángulos, en general, no es un triángulo: sus lados se curvan. En la práctica se aproxima por uno.` },
  ],
  tecnicas: [
    { titulo: 'Trabaja por niveles', texto: 'Una operación difusa complicada suele ser una familia de operaciones clásicas simples, una por cada corte.' },
    { titulo: 'La incertidumbre no se cancela', texto: 'Al operar con datos vagos, los márgenes se acumulan, incluso restando. Por eso conviene hacer pocos cálculos encadenados.' },
  ],
  retos: [
    { id: 'ajusta-suma', tipo: 'manipular', enunciado: R`Mueve el centro del segundo número para que la cima de la suma esté en $9$.`, precision: (e) => (Math.abs(e.c + 2 - 9) < 0.11 ? 1 : 0), prueba: { c: 7 }, pistas: ['La cima del primer número está en 2.'], explicacion: 'Cima con cima: 2 + 7 = 9.' },
    { id: 'pie-suma', tipo: 'calcular', enunciado: R`Suma $(1, 2, 3)$ y $(2, 4, 5)$. ¿Cuál es el pie derecho del resultado?`, respuesta: 8, tol: 0.001, pistas: ['Se suman los pies derechos.'], explicacion: R`$3 + 5 = 8$. La suma es $(3, 6, 8)$.` },
    { id: 'resta-sorpresa', tipo: 'elegir', enunciado: R`¿Cuánto vale $(1, 2, 3)$ menos $(1, 2, 3)$?`, opciones: ['Exactamente 0', R`$(0, 0, 0)$`, R`$(-2, 0, 2)$: «cerca de 0», con margen`, 'No se puede restar'], correcta: 2, explicacion: 'Un valor cualquiera del primero, menos uno del segundo. Para que dé 0, tendrían que ser el mismo, pero no sabes que lo sean. La duda no se cancela.' },
  ],
  referencias: ['D. Dubois, H. Prade, «Fuzzy numbers: an overview» (1987).', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 5.3.'],
};
