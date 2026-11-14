import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { existeP, paraTodoP } from '../../nucleo/ia.js';
import { curva, linea, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { coma } from '../parte9/comun.js';

const R = String.raw;
const V = [0.92, 0.85, 0.7, 0.55, 0.3, 0.12], PM = 40;
const DP = [1, PM];

export default {
  id: '10-2-cuantificadores',
  titulo: '«Para todo» y «existe», suaves',
  puente: 'Ya sabes convertir reglas en pérdidas. Toca ponerlas a prueba: ¿cuánto ayudan de verdad con pocas etiquetas? ¿Y si la regla está mal?',
  pregunta: '«Todos cumplen la regla». En lógica clásica basta un solo incumplidor para que sea falso. ¿Y en una red, donde cada ejemplo cumple a medias? Un mínimo solo corregiría al peor de todos.',
  escena: {
    id: 'cuantificadores', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [0, 6.4], y: [0, 1], caja: { x: 70, y: 60, w: 470, h: 400 } },
    entradas: [{ id: 'p', tipo: 'deslizador', etiqueta: 'p', min: 1, max: PM, paso: 0.5, valor: 2 }],
    pasos: [
      { dur: 2600, texto: 'Seis ejemplos, cada uno con la verdad con que cumple una regla. <b>¿Qué tan cierto es que «todos cumplen»?</b> ¿Y que «alguno cumple»?' },
      { dur: 3000, texto: 'Con $p = 1$, las dos respuestas son la <b>media</b>. Cada ejemplo cuenta igual. Todos reciben corrección, pero no distingue a uno que falla mucho.' },
      { dur: 3400, texto: 'Sube $p$. <b style="color:#fc6282;font-weight:400">«Para todo»</b> baja hacia el peor. <b style="color:#58c4dd;font-weight:400">«Existe»</b> sube hacia el mejor. En el límite, son el mínimo y el máximo de la lógica clásica.' },
      { dur: 2800, texto: 'Mira las curvas: $p$ es un botón entre <b>«tratar a todos por igual»</b> y <b>«fijarse solo en el extremo»</b>. Con $p = 2$, «para todo» es $1 - \\text{RMSE}$.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), p = paso <= 1 ? 1 : paso === 2 ? mix(1, 24, ev(q(2), 0, 0.85)) : mix(24, e.p, ev(q(3), 0.2, 0.8)), pt = paso === 0 ? 0 : ev(q(1), 0, 0.5);
      const N = [marco({ x: [0, 6.4], y: [0, 1] }, { alfa: al, ticks: { x: [], y: [0, 0.5, 1] }, etiquetas: { y: R`\text{verdad}` } })];
      V.forEach((v, i) => N.push(poligono([[0.25 + i, 0], [0.95 + i, 0], [0.95 + i, v * ev(q(0), i / 12, i / 12 + 0.5)], [0.25 + i, v * ev(q(0), i / 12, i / 12 + 0.5)]], { color: BLANCO, alfa: 0.26 * al }), rotulo([0.6 + i, v], coma(v), { clave: `v${i}`, dy: -12, tam: 15, color: GRIS2, alfa: al })));
      const f = paraTodoP(V, p), x = existeP(V, p);
      if (pt > 0) { for (const [y, c] of [[f, ROSA], [x, AZUL]]) N.push(linea([0, y], [6.4, y], { color: c, ancho: 2.6, alfa: pt })); N.push(rotulo([6.3, f], R`\forall = ${coma(f)}`, { clave: 'f', ancla: 'r', dy: 16, tam: 20, color: ROSA, alfa: pt }), rotulo([6.3, x], R`\exists = ${coma(x)}`, { clave: 'x', ancla: 'r', dy: -14, tam: 20, color: AZUL, alfa: pt })); }
      const G = [marco({ x: DP, y: [0, 1] }, { alfa: pt, ticks: { x: [1, 20, PM], y: [0, 1] }, etiquetas: { x: 'p' } }), linea([1, 0.12], [PM, 0.12], { color: GRIS2, ancho: 1, alfa: 0.6 * pt, discontinua: true }), linea([1, 0.92], [PM, 0.92], { color: GRIS2, ancho: 1, alfa: 0.6 * pt, discontinua: true })];
      if (pt > 0) { G.push(curva((u) => [u, paraTodoP(V, u)], DP, { n: 120, color: ROSA, ancho: 2.6, alfa: pt }), curva((u) => [u, existeP(V, u)], DP, { n: 120, color: AZUL, ancho: 2.6, alfa: pt }), punto([p, f], { color: ROSA, radio: 6, alfa: pt }), punto([p, x], { color: AZUL, radio: 6, alfa: pt })); G.push(rotulo([PM, 0.12], R`\min`, { clave: 'mn', ancla: 'r', dy: -12, tam: 16, color: GRIS2, alfa: pt }), rotulo([PM, 0.92], R`\max`, { clave: 'mx', ancla: 'r', dy: -12, tam: 16, color: GRIS2, alfa: pt }), rotulo([20, 1], `p = ${coma(p, 1)}`, { clave: 'p', dy: -14, tam: 21, color: ORO, alfa: pt })); }
      return { principal: N, paneles: [{ ejes: { x: DP, y: [0, 1], caja: { x: 620, y: 70, w: 410, h: 380 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Mueve $p$: las dos líneas se separan de la media hacia los extremos.</li><li>Fíjate en que nunca se cruzan, y que a partir de cierto $p$ casi no cambian.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una regla vale para muchos casos, y hay que unir sus verdades en una sola. El mínimo clásico tiene un defecto grave para aprender: solo corrige al peor, como ya viste. Una media generalizada es un compromiso: cada caso recibe corrección, pero el que peor va recibe más. Y el exponente $p$ decide cuánto.' },
    { tipo: 'ejemplo', texto: 'Con las verdades 0,6 y 0,8, «para todo»:', tabla: [['p', 'Cuenta', 'Resultado'], ['1', '1 − (0,4 + 0,2) / 2', '0,7'], ['2', '1 − √((0,16 + 0,04) / 2)', '0,684'], ['muy grande', 'tiende al peor', '0,6']], cierre: 'Cuanto mayor es $p$, más pesa el error más grande.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`A_{pM}(a_1, \dots, a_n) = \left(\frac{1}{n}\sum_i a_i^{\,p}\right)^{\frac{1}{p}}`, dice: 'Existe: una media que favorece a los valores altos. Tiende al máximo.' },
      { tex: R`A_{pME}(a_1, \dots, a_n) = 1 - \left(\frac{1}{n}\sum_i (1 - a_i)^{p}\right)^{\frac{1}{p}}`, dice: 'Para todo: uno menos la media generalizada de lo que falta. Tiende al mínimo.' },
      { tex: R`p \ge 1`, dice: 'El botón. Es un número fijo, o un horario que crece durante el entrenamiento.' },
    ], todo: R`\frac{\partial A_{pME}}{\partial a_i} \propto (1 - a_i)^{p - 1}`, lee: '«La corrección de un caso es proporcional a lo que le falta, elevado a $p - 1$». El signo $\\propto$ se lee «proporcional a». Con $p = 1$, todos igual; con $p$ grande, se concentra en el peor.' },
    { tipo: 'formal', titulo: 'Agregadores en LTN', tex: R`Para $p \ge 1$, $A_{pM}$ interpreta $\exists$ y $A_{pME}$ interpreta $\forall$. Se usa un horario: $p_\exists$ empieza en 1 y sube, por ejemplo, hasta 6. Con $p$ alto desde el principio, los resultados son malos: se favorece lo que empezó bien por azar.`, lee: 'Otro detalle: estas fórmulas explotan numéricamente en un extremo, y por eso se usan versiones estables, $\\pi_0(a) = (1 - \\varepsilon)a + \\varepsilon$ y $\\pi_1(a) = (1 - \\varepsilon)a$.' },
    { tipo: 'demo', titulo: 'En el límite, es el máximo', plan: 'Se atrapa la media entre dos cotas que tienden al mismo número: es una técnica clásica.', tex: R`Para $a_i \ge 0$: $\lim_{p \to \infty} \left(\frac{1}{n}\sum_i a_i^{\,p}\right)^{\frac{1}{p}} = \max_i a_i$.`, pasos: [
      { texto: R`Sea $M = \max_i a_i$. La suma tiene al menos el término $M^p$, y cada término es a lo sumo $M^p$. Luego $\frac{M^p}{n} \le \frac{1}{n}\sum_i a_i^{\,p} \le M^p$.`, porque: 'Cada $a_i \\le M$, y hay $n$ términos no negativos.' },
      { texto: R`Elevando a $\frac{1}{p}$: $M\, n^{-\frac{1}{p}} \le \left(\frac{1}{n}\sum_i a_i^{\,p}\right)^{\frac{1}{p}} \le M$.`, porque: 'La potencia positiva conserva el orden.' },
      { texto: R`Y $n^{-\frac{1}{p}} \to 1$ al crecer $p$, luego las dos cotas tienden a $M$.`, porque: 'Lo que queda atrapado entre las dos también tiende a $M$. Aplicado a $1 - a_i$, da que $A_{pME}$ tiende al mínimo.' },
    ] },
    { tipo: 'nota', titulo: 'Otra opción muy usada', texto: 'Van Krieken et al. recomiendan, para «para todo», sumar logaritmos: $\\sum_i \\ln a_i$. Su derivada, $\\frac{1}{a_i}$, nunca se anula, y es lo mismo que hace la entropía cruzada, la pérdida habitual de clasificación. Y para «existe», una media generalizada con $p$ entre 1 y 2.' },
  ],
  tecnicas: [{ titulo: 'Atrapa entre dos cotas', texto: 'Para encontrar un límite difícil, busca una expresión por encima y otra por debajo que tiendan al mismo valor.' }],
  retos: [
    { id: 'casi-min', tipo: 'manipular', enunciado: R`Sube $p$ hasta que «para todo» quede a menos de $0{,}1$ del peor caso, $0{,}12$.`, precision: (e) => (paraTodoP(V, e.p) - 0.12 < 0.1 ? 1 : 0), prueba: { p: 30 }, pendiente: (e) => `Ahora vale ${paraTodoP(V, e.p).toFixed(2).replace('.', ',')}.`, pistas: ['Hace falta un $p$ bastante grande.'], explicacion: 'Se acerca despacio: con seis casos, $6^{-\\frac{1}{p}}$ tarda en llegar a 1.' },
    { id: 'pmedia-calc', tipo: 'calcular', enunciado: R`Con $p = 2$, verdades $1$ y $0{,}4$. ¿Cuánto vale «para todo»? Redondea a 3 decimales.`, respuesta: 1 - Math.sqrt(0.18), tol: 0.002, pistas: [R`$1 - \sqrt{\frac{0 + 0{,}36}{2}}$.`], explicacion: R`$1 - \sqrt{0{,}18} \approx 0{,}576$.` },
    { id: 'p-elegir', tipo: 'elegir', enunciado: '¿Por qué no se empieza con $p$ muy grande en «existe»?', opciones: ['Porque es lento de calcular', 'Porque con pesos aleatorios favorece a lo que empezó alto por azar', 'Porque no es derivable', 'Porque da siempre 1'], correcta: 1, explicacion: 'Primero se aprende con todos; luego se afina hacia los extremos.' },
    { id: 'demuestra-rmse', tipo: 'demostrar', enunciado: R`Demuestra que, con $p = 2$, $A_{pME} = 1 - \mathrm{RMSE}(a, 1)$.`, pistas: ['Escribe qué es RMSE, la raíz del error cuadrático medio.'], solucion: [{ texto: R`$\mathrm{RMSE}(a, 1) = \sqrt{\frac{1}{n}\sum_i (a_i - 1)^2}$.`, porque: 'Definición, con objetivo 1 en todos.' }, { texto: R`Como $(a_i - 1)^2 = (1 - a_i)^2$, coincide con el paréntesis de $A_{pME}$ para $p = 2$.`, porque: 'Por eso entrenar con esta regla se parece tanto a una regresión hacia el 1.' }] },
  ],
  referencias: ['S. Badreddine et al., «Logic Tensor Networks», <em>Artificial Intelligence</em> 303 (2022), sec. 2.4 y 4.4.', 'E. van Krieken et al., <em>Artificial Intelligence</em> 302 (2022).'],
};
