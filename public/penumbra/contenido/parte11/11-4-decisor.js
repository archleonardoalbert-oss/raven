import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { NOMBRES_CCD, muestraCalibracion, pav, sigma } from '../../nucleo/ia.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { barra, coma, tramo } from '../parte9/comun.js';

const R = String.raw;
// φ aprendido de verdad: PAV sobre 600 casos de juguete de un decisor que exagera por 3
const ORD = [...muestraCalibracion].sort((a, b) => a.logit - b.logit), PHI = pav(ORD.map((m) => m.y)), AS = ORD.map((m) => sigma(3 * m.logit));
const fi = (a) => { let lo = 0, hi = AS.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (AS[m] < a) lo = m + 1; else hi = m; } return PHI[lo]; };
const OTROS = [0.71, 0.08, 0.93, 0.12, 0.05]; // los otros conceptos del caso inventado

export default {
  id: '11-4-decisor',
  titulo: 'Un modelo decisor como fuzzificador',
  puente: 'Un modelo puede dar respuestas distintas si cambias la redacción de la pregunta. ¿Te quedas con una? Mejor unirlas, con una actitud elegida a propósito.',
  pregunta: 'Todo lo que hemos hecho parte de un grado ya dado. Pero en un informe médico no hay ningún número, solo palabras. ¿Cómo se saca un grado de un texto, y por qué fiarse de él?',
  escena: {
    id: 'decisor', formato: 'plano', W: 1100, H: 560,
    ejes: { x: [0, 2], y: [0, 8], caja: { x: 60, y: 70, w: 200, h: 380 } },
    entradas: [{ id: 'd', tipo: 'deslizador', etiqueta: 'lo que dice el modelo: ℓSí − ℓNo', min: -8, max: 8, paso: 0.1, valor: 2.4 }],
    pasos: [
      { dur: 3000, texto: 'Un texto inventado, y una pregunta: <b>«¿Tiene dolor en el pecho?»</b>. Un modelo de lenguaje no contesta con palabras: da una puntuación a <b style="color:#58c4dd;font-weight:400">Sí</b> y otra a <b style="color:#fc6282;font-weight:400">No</b>. Son dos [[logits|logit]].' },
      { dur: 3000, texto: 'Una [[softmax]] las convierte en un número $a$. Con dos opciones, es justo una [[sigmoide]] de la diferencia. Ya hay un grado... <b>que no sabemos si es honrado</b>.' },
      { dur: 3400, texto: 'Se calibra: la escalera $\\varphi$ de la parada anterior, aprendida con casos etiquetados. Entra $a$ y sale $\\mu$. Mira cuánto baja: el modelo <b style="color:#f4d345;font-weight:400">presumía</b>.' },
      { dur: 3200, texto: 'Se repite con cada pregunta, y el texto se convierte en un vector de grados. <b>Es el mismo papel que hacían las curvas de pertenencia</b>: un fuzzificador, pero de lenguaje. Y ahí empiezan las reglas.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, d = e.d, si = 4 + d / 2, no = 4 - d / 2, a = sigma(d), m = fi(a);
      const L = [marco({ x: [0, 2], y: [0, 8] }, { alfa: al, soloBase: true, ticks: { x: [], y: [] } }), barra(0.14, 0.92, si * al, { color: AZUL, alfa: 0.85 * al }), barra(1.08, 1.86, no * al, { color: ROSA, alfa: 0.85 * al }), rotulo([0.53, 0], R`\ell_{\text{Sí}}`, { clave: 'si', dy: 18, tam: 18, color: AZUL, alfa: al }), rotulo([1.47, 0], R`\ell_{\text{No}}`, { clave: 'no', dy: 18, tam: 18, color: ROSA, alfa: al }), rotulo([1, 8], R`\text{Sí} - \text{No} = ${coma(d, 1)}`, { clave: 'dif', dy: -18, tam: 18, alfa: al })];
      const S = [marco({ x: [-8, 8], y: [0, 1] }, { alfa: g1, ticks: { x: [-8, 8], y: [0, 1] }, etiquetas: { x: R`\ell_{\text{Sí}} - \ell_{\text{No}}`, y: 'a' } })];
      if (g1 > 0) S.push(curva((x) => [x, sigma(x)], [-8, 8], { n: 120, color: AZUL, ancho: 2.8, alfa: g1 }), ...tramo([d, 0], [d, a], { color: GRIS2, ancho: 1, alfa: 0.7 * g1, discontinua: true }), punto([d, a], { color: ORO, radio: 7, alfa: g1 }), rotulo([-7.6, 0.9], R`a = ${coma(a)}`, { clave: 'a', ancla: 'l', tam: 21, color: ORO, alfa: g1 }));
      const F = [marco({ x: [0, 1], y: [0, 1] }, { alfa: g2, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'a', y: R`\mu` } })];
      if (g2 > 0) { F.push(curva((x) => [x, x], [0, 1], { n: 2, color: GRIS2, ancho: 1, alfa: 0.5 * g2 }), curva((x) => [x, fi(x)], [0.005, 0.995], { n: 240, color: ORO, ancho: 2.8, alfa: g2, tol: 1 }), ...tramo([a, 0], [a, m], { color: GRIS2, ancho: 1, alfa: 0.7 * g2, discontinua: true }), punto([a, m], { color: ORO, radio: 7, alfa: g2 }), rotulo([0.04, 0.9], R`\mu = ${coma(m)}`, { clave: 'mu', ancla: 'l', tam: 21, color: ORO, alfa: g2 })); }
      const K = NOMBRES_CCD.length, V = [m, ...OTROS], B = [];
      if (g3 > 0) V.forEach((v, i) => { const y = K - 1 - i; B.push(barra(0, 1, y + 0.72, { color: BLANCO, alfa: 0.07 * g3 }, y + 0.28), barra(0, v * ev(q(3), i / 12, i / 12 + 0.5), y + 0.72, { color: i ? AZUL : ORO, alfa: 0.85 * g3 }, y + 0.28), rotulo([0, y + 0.86], R`\text{${NOMBRES_CCD[i]}}`, { clave: `k${i}`, ancla: 'l', tam: 15, color: GRIS2, alfa: g3 }), rotulo([1, y + 0.5], coma(v), { clave: `v${i}`, ancla: 'l', dx: 8, tam: 16, alfa: g3 })); });
      return { principal: L, paneles: [{ ejes: { x: [-8, 8], y: [0, 1], caja: { x: 340, y: 80, w: 300, h: 170 } }, prims: S }, { ejes: { x: [0, 1], y: [0, 1], caja: { x: 340, y: 300, w: 300, h: 170 } }, prims: F }, { ejes: { x: [0, 1], y: [0, K], caja: { x: 730, y: 80, w: 270, h: 390 } }, prims: B }] };
    },
  },
  manipulacion: '<ul><li>Mueve lo que dice el modelo, y sigue el punto por las dos curvas: $a$ corre mucho más que $\\mu$.</li><li>En los extremos, la escalera se aplana: por muy seguro que esté, $\\mu$ no pasa de lo que se ha visto en los datos.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un modelo decisor responde a una pregunta sobre un texto, y dice con qué probabilidad. Esa interfaz, por sí sola, es un fuzzificador: entra lenguaje y sale un grado. Hay modelos diseñados para esto, como Jev, cuyas garantías de calibración declara su fabricante; y un modelo abierto puede hacer ese papel si lees sus logits. En los dos casos, lo que importa es el papel, y se comprueba con datos propios.' },
    { tipo: 'ejemplo', texto: 'Cuatro formas de usarlo, que no se excluyen:', tabla: [['Vía', 'Qué hace', 'Sirve para'], ['V1. Fuzzificador', 'K preguntas dan K grados, que entran en unas reglas', 'Decidir con reglas'], ['V2. Evaluador lingüístico', '«¿Dolor ninguno, leve, moderado o intenso?» da un grado por palabra', 'Modelar lo vago'], ['V3. Agregador', 'Varias redacciones o modelos, unidos en un grado', 'Ganar estabilidad'], ['V4. Fuente de reglas', 'Propone conceptos y reglas que luego se ajustan con datos', 'Construir el sistema']], cierre: 'En lo que queda de curso se usa V1, con V3 de apoyo y V4 como punto de partida.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`D(x, q) \mapsto (v, p)`, dice: 'El decisor: recibe un texto $x$ y una pregunta $q$, y devuelve una respuesta $v$ y su probabilidad $p$.' },
      { tex: R`\ell_{\text{Sí}},\ \ell_{\text{No}}`, dice: 'Los [[logits|logit]]: las puntuaciones que da el modelo a cada respuesta, antes de la softmax.' },
      { tex: R`\mu = \varphi(a)`, dice: 'El grado final: la puntuación $a$, pasada por la escalera de calibración.' },
    ], todo: R`a = \frac{e^{\ell_{\text{Sí}}}}{e^{\ell_{\text{Sí}}} + e^{\ell_{\text{No}}}}, \qquad \mu = \varphi(a)`, lee: '«De las dos puntuaciones sale $a$; y de $a$, calibrado, sale el grado». Con $K$ preguntas, sale un vector $\\mu \\in [0, 1]^K$.' },
    { tipo: 'formal', titulo: 'Modelo decisor', tex: R`Un modelo decisor es una función $D(x, q) \mapsto (v, p)$, con $v$ una respuesta de un conjunto finito de opciones $\mathcal{T}$, y $p$ una probabilidad sobre $\mathcal{T}$. Está calibrado si, entre las respuestas a las que da probabilidad $p$, ocurre una fracción $p$.`, lee: 'Es una definición de papel, no de arquitectura: la cumple cualquier modelo que dé esa salida. Lo de «calibrado» se comprueba; no se supone.' },
    { tipo: 'demo', titulo: 'Con dos respuestas, es una sigmoide', plan: 'Se divide arriba y abajo por el mismo número.', tex: R`\frac{e^{\ell_{\text{Sí}}}}{e^{\ell_{\text{Sí}}} + e^{\ell_{\text{No}}}} = \sigma(\ell_{\text{Sí}} - \ell_{\text{No}})`, pasos: [
      { texto: R`Se divide numerador y denominador entre $e^{\ell_{\text{Sí}}}$: queda $\frac{1}{1 + e^{\ell_{\text{No}} - \ell_{\text{Sí}}}}$.`, porque: 'Dividir potencias de la misma base resta los exponentes.' },
      { texto: R`Con $u = \ell_{\text{Sí}} - \ell_{\text{No}}$, es $\frac{1}{1 + e^{-u}} = \sigma(u)$.`, porque: 'Es la definición de la sigmoide. Solo cuenta la diferencia: sumar lo mismo a las dos puntuaciones no cambia nada.' },
    ] },
    { tipo: 'nota', titulo: 'El texto es inventado', texto: 'Los casos y los grados de esta parada son de juguete. Y si la pregunta se hace mal, el mejor calibrador del mundo no lo arregla: redactarla es parte del modelo.' },
  ],
  tecnicas: [{ titulo: 'Mira si solo importa una diferencia', texto: 'Si una fórmula no cambia al sumar lo mismo a todo, depende de las diferencias. Reescribirla así reduce una variable y suele revelar una función conocida.' }],
  retos: [
    { id: 'grado-alto', tipo: 'manipular', enunciado: R`Consigue un grado calibrado $\mu$ de al menos $0{,}8$.`, precision: (e) => (fi(sigma(e.d)) >= 0.8 ? 1 : 0), prueba: { d: 7 }, pendiente: (e) => `Ahora, a = ${sigma(e.d).toFixed(2).replace('.', ',')} y μ = ${fi(sigma(e.d)).toFixed(2).replace('.', ',')}.`, pistas: ['Hace falta que el modelo esté mucho más seguro de lo que parece necesario.'], explicacion: 'Un $a$ de 0,8 no basta: tras calibrar, el modelo tiene que decir mucho más para merecer un 0,8.' },
    { id: 'decisor-calc', tipo: 'calcular', enunciado: R`Si $\ell_{\text{Sí}} = 2$ y $\ell_{\text{No}} = 2$, ¿cuánto vale $a$?`, respuesta: 0.5, tol: 0.001, pistas: ['Solo importa la diferencia.'], explicacion: R`$\sigma(0) = 0{,}5$.` },
    { id: 'decisor-elegir', tipo: 'elegir', enunciado: '¿Qué hace que un modelo sea un decisor, según la definición?', opciones: ['Su arquitectura interna', 'Que da una respuesta de un conjunto cerrado, con su probabilidad', 'Que está siempre calibrado', 'Que lo diga el fabricante'], correcta: 1, explicacion: 'Es un papel. Y la calibración se comprueba aparte.' },
    { id: 'demuestra-sigmoide', tipo: 'demostrar', enunciado: R`Demuestra que sumar una misma constante $c$ a $\ell_{\text{Sí}}$ y a $\ell_{\text{No}}$ no cambia $a$.`, pistas: [R`Saca $e^c$ factor común.`], solucion: [{ texto: R`$\frac{e^{\ell_{\text{Sí}} + c}}{e^{\ell_{\text{Sí}} + c} + e^{\ell_{\text{No}} + c}} = \frac{e^c\, e^{\ell_{\text{Sí}}}}{e^c \left(e^{\ell_{\text{Sí}}} + e^{\ell_{\text{No}}}\right)}$.`, porque: 'Una potencia de una suma de exponentes es un producto.' }, { texto: R`Se cancela $e^c$, y queda $a$.`, porque: 'Por eso los logits solo valen por sus diferencias.' }] },
  ],
  referencias: ['C. Guo et al., <em>ICML</em> (2017).', 'B. Zadrozny, C. Elkan, <em>KDD</em> (2002).', 'P. W. Koh et al., «Concept Bottleneck Models», <em>ICML</em> (2020).'],
};
