import { AZUL, BLANCO, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { NOMBRES_CCD, literal, softmax, umbralCoste } from '../../nucleo/ia.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { barra, coma, tramo } from '../parte9/comun.js';
import { CAMINO, HISTORIA } from '../parte12/caminoCCD.js';

const R = String.raw;
const E0 = CAMINO[5], UMBRAL = umbralCoste(4, 1), K = NOMBRES_CCD.length;
/** El sistema entrenado, entero: de grados a reglas, a reparto. */
function evalua(mu) {
  const w = E0.m.map((f, r) => f.reduce((a, m, k) => a * literal(mu[k], E0.pol[r][k], m), 1)), t = w.reduce((a, b) => a + b, 0) + 1e-9, bar = w.map((v) => v / t), z = [0, 1].map((j) => bar.reduce((s, v, r) => s + v * E0.th[r][j], 0));
  return { w, bar, p: softmax(z) };
}
const FRASES = E0.m.map((f, r) => { const t = f.map((v, k) => (v > 0.5 ? `${E0.pol[r][k] > 0.5 ? '' : 'NO '}${NOMBRES_CCD[k]}` : null)).filter(Boolean); return `${t.length ? t.join(' Y ') : 'si no'}: ${E0.th[r][0] > E0.th[r][1] ? 'urgente' : 'no urgente'}`; });
const MU = (e) => [e.a, 0.2, e.b, e.c, 0.1, 0.1];

export default {
  id: '13-4-ccd',
  titulo: 'Células de Concepto Difusas, enteras',
  puente: 'Aquí termina el camino: de una pregunta sobre el borde de un conjunto, a un sistema completo que lee, razona con reglas y rinde cuentas. Lo demás ya no está en el curso, sino en lo que hagas tú con ello.',
  pregunta: 'Lo tienes todo: grados calibrados, reglas que se leen, costes, y un modo de evaluar. ¿Cómo se ve el conjunto cuando un caso entra por un lado y sale una decisión por el otro, con su porqué?',
  escena: {
    id: 'ccd', formato: 'plano', W: 1100, H: 560,
    ejes: { x: [0, 10], y: [0, 6], caja: { x: 40, y: 40, w: 1020, h: 440 } },
    entradas: [
      { id: 'a', tipo: 'deslizador', etiqueta: 'grado de dolor torácico', min: 0, max: 1, paso: 0.01, valor: 0.1 },
      { id: 'b', tipo: 'deslizador', etiqueta: 'grado de falta de aire', min: 0, max: 1, paso: 0.01, valor: 0.2 },
      { id: 'c', tipo: 'deslizador', etiqueta: 'grado de más de 65 años', min: 0, max: 1, paso: 0.01, valor: 0.3 },
    ],
    pasos: [
      { dur: 3000, texto: 'Primero, los <b style="color:#58c4dd;font-weight:400">conceptos</b>. Un decisor contesta $K$ preguntas sobre un texto, y cada respuesta se calibra. Es la fuzzificación, hecha de lenguaje. Son números de juguete.' },
      { dur: 3400, texto: 'Después, las <b style="color:#f4d345;font-weight:400">reglas</b> aprendidas. Mira las tres frases: las encontró el entrenamiento en los datos. Cada una se enciende según sus literales, con la fuerza $w$.' },
      { dur: 3200, texto: 'Las fuerzas reparten: cada regla vota con su consecuente, como en Takagi-Sugeno, y una softmax da el reparto. Y se decide con <b>costes</b>: basta un 20 % de «urgente» para alarmar.' },
      { dur: 3400, texto: 'Abajo, cómo se aprendió: la pérdida baja mientras el group lasso va apagando conceptos. Todo lo que ves es una función derivable, de los pesos a la decisión. <b style="color:#f4d345;font-weight:400">Y se puede leer.</b>' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, mu = MU(e), { w, bar, p } = evalua(mu), urg = p[0] > UMBRAL;
      const N = [rotulo([1.3, 6], R`\text{conceptos}`, { clave: 'tc', dy: -4, tam: 17, color: AZUL, alfa: al })];
      mu.forEach((v, k) => { const y = 5.1 - k * 0.56, act = E0.m.some((f) => f[k] > 0); N.push(barra(0, 2.6, y + 0.2, { color: BLANCO, alfa: 0.07 * al }, y), barra(0, 2.6 * v, y + 0.2, { color: act ? AZUL : GRIS2, alfa: (act ? 0.9 : 0.35) * al }, y), rotulo([0, y + 0.2], R`\text{${NOMBRES_CCD[k]}}`, { clave: `k${k}`, ancla: 'l', dy: -9, tam: 13, color: GRIS2, alfa: al }), rotulo([2.6, y + 0.1], coma(v), { clave: `v${k}`, ancla: 'l', dx: 6, tam: 13, alfa: al })); });
      FRASES.forEach((fr, r) => { const y = 4.7 - r * 1.25; N.push(barra(3.6, 7.4, y + 0.3, { color: BLANCO, alfa: 0.07 * g1 }, y), barra(3.6, 3.6 + 3.8 * bar[r], y + 0.3, { color: ORO, alfa: 0.85 * g1 }, y), rotulo([3.6, y + 0.3], R`\text{${fr}}`, { clave: `fr${r}`, ancla: 'l', dy: -13, tam: 14, alfa: g1 }), rotulo([7.4, y + 0.15], coma(w[r]), { clave: `w${r}`, ancla: 'l', dx: 6, tam: 14, color: ORO, alfa: g1 })); E0.m[r].forEach((m, k) => { if (m > 0.2) N.push(...tramo([2.95, 5.2 - k * 0.56], [3.6, y + 0.15], { color: E0.pol[r][k] > 0.5 ? AZUL : ROJO, ancho: 0.8 + 1.6 * m, alfa: 0.55 * g1, radio: 0.5 })); }); });
      N.push(rotulo([5.5, 6], R`\text{reglas}`, { clave: 'tr', dy: -4, tam: 17, color: ORO, alfa: g1 }), rotulo([9, 6], R`\text{decisión}`, { clave: 'td', dy: -4, tam: 17, alfa: g2 }));
      if (g2 > 0) { for (let r = 0; r < FRASES.length; r++) N.push(...tramo([8, 4.85 - r * 1.25], [8.15, 3.6], { color: GRIS2, ancho: 1, alfa: 0.5 * g2, radio: 0.5 })); N.push(barra(8.15, 10, 4.4, { color: urg ? ROJO : AZUL, alfa: 0.8 * g2 }, 2.7), rotulo([9.08, 3.8], R`\text{${urg ? 'urgente' : 'no urgente'}}`, { clave: 'dec', tam: 20, alfa: g2 }), rotulo([9.08, 3.2], R`p = ${coma(p[0])}`, { clave: 'p', tam: 17, alfa: g2 }), rotulo([9.08, 2.4], R`\text{alarma si } p > ${coma(UMBRAL, 1)}`, { clave: 'u', tam: 13, color: GRIS2, alfa: g2 })); }
      const H = HISTORIA, top = Math.max(...H.map((x) => x.perdida)), G = [marco({ x: [0, 400], y: [0, top] }, { alfa: g3, ticks: { x: [0, 400], y: [] }, etiquetas: { x: R`\text{vueltas de entrenamiento}` } })];
      if (g3 > 0) { const hasta = Math.max(1e-3, ev(q(3), 0, 0.85)), at = (u) => { const j = Math.min(H.length - 1, Math.round((u / 400) * (H.length - 1))); return H[j]; }; G.push(curva((u) => [u, at(u).perdida], [0, 400], { n: H.length - 1, hasta, color: ORO, ancho: 2.6, alfa: g3 }), rotulo([400, top], R`\text{conceptos activos: } ${at(400 * hasta).activos}`, { clave: 'ac', ancla: 'r', dy: -10, tam: 16, alfa: g3 }), rotulo([0, top], R`\text{pérdida}`, { clave: 'pe', ancla: 'l', dy: -10, tam: 15, color: ORO, alfa: g3 })); }
      return { principal: N, paneles: [{ ejes: { x: [0, 400], y: [0, top], caja: { x: 560, y: 410, w: 490, h: 80 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Mueve los grados, y mira qué regla se enciende.</li><li>Sube solo el dolor: es lo que basta. Sube la falta de aire con la edad baja, y luego sube la edad: ahí se ve el «Y» de la regla.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una Célula de Concepto Difusa es la unión de todo el camino. Un decisor lee y contesta preguntas; se calibra; unas reglas Takagi-Sugeno con relevancia y polaridad deciden; el coste fija la decisión; y un experimento dice si sirve. Es una propuesta de diseño: no es un producto, ni está validada en pacientes.' },
    { tipo: 'ejemplo', texto: 'Lo que aprendió este sistema, en casos inventados con una regla oculta conocida:', tabla: [['Medida', 'Con 6 conceptos', 'Con 3 conceptos'], ['Acierto', String(CAMINO[0].exactitud).replace('.', ','), String(E0.exactitud).replace('.', ',')], ['Fidelidad de las frases', String(CAMINO[0].fidelidad).replace('.', ','), String(E0.fidelidad).replace('.', ',')], ['Conceptos que leer', '6', '3']], cierre: 'Se ve el precio de lo que es juguete: la regla oculta usaba «sudoración», y la presión la ha borrado. El sistema lo cuenta, porque se puede leer. Una caja negra no lo contaría.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\mu = \varphi(a)`, dice: 'Los conceptos, calibrados.' },
      { tex: R`\bar{w}_r = \frac{w_r}{\sum_s w_s}`, dice: 'La fuerza normalizada de cada regla.' },
      { tex: R`\hat{p} = \mathrm{softmax}\left(\sum_r \bar{w}_r \theta_r\right)`, dice: 'El reparto: cada regla vota con su consecuente $\\theta_r$.' },
      { tex: R`C_{y j}`, dice: 'La matriz de costes.' },
    ], todo: R`L = \frac{1}{n} \sum_i \sum_j \hat{p}_j(x_i)\, C_{y_i j} + \lambda \sum_k \|m_{\cdot k}\| + \gamma \sum_{r, k} m_{r k}(1 - m_{r k})`, lee: '«El coste esperado de lo que se decide, más lo que cuesta usar cada concepto, más lo que cuesta no decidirse». Aquí, el entrenamiento de juguete usa la pérdida logarítmica en lugar del coste.' },
    { tipo: 'formal', titulo: 'Célula de Concepto Difusa', tex: R`Dados preguntas $q_1, \dots, q_K$, un decisor $D$ y un calibrador $\varphi$, se define $\mu_k(x) = \varphi(a(x, q_k))$. Con literales $\ell_{r k} = \pi_{r k} \mu_k + (1 - \pi_{r k})(1 - \mu_k)$, las fuerzas son $w_r = \prod_k (1 - m_{r k} + m_{r k} \ell_{r k})$, y el reparto es $\hat{p}$. La decisión es $\arg\min_j \sum_y \hat{p}_y C_{y j}$.`, lee: 'Solo se entrenan $m$, $\\pi$ y $\\theta$: el decisor queda fijo. Por eso bastan datos pequeños, y por eso hay que aceptar que un concepto mal contestado no se arregla más adelante, aunque un humano sí puede corregirlo.' },
    { tipo: 'demo', titulo: 'Si una regla domina, decide ella', plan: 'Se mira qué pasa con las fuerzas normalizadas cuando una es mucho mayor que el resto.', tex: R`Si $w_1 > 0$ y $w_r \to 0$ para $r \ne 1$, entonces $\sum_r \bar{w}_r \theta_r \to \theta_1$.`, pasos: [
      { texto: R`$\bar{w}_1 = \frac{w_1}{w_1 + \sum_{r \ne 1} w_r} \to \frac{w_1}{w_1} = 1$.`, porque: 'El resto de la suma tiende a 0, y $w_1$ no.' },
      { texto: R`Para $r \ne 1$: $\bar{w}_r = \frac{w_r}{\sum_s w_s} \to \frac{0}{w_1} = 0$.`, porque: 'El denominador tiende a $w_1 > 0$.' },
      { texto: R`Luego la suma tiende a $\theta_1$, y el reparto es la softmax de $\theta_1$.`, porque: 'La explicación «decidió esta regla» es exacta en ese límite, y solo aproximada cuando varias reglas pesan. Por eso se enseña $\\bar{w}$ junto a la frase.' },
    ] },
    { tipo: 'nota', titulo: 'Lo que falta, y que importa', texto: 'Todo aquí es de juguete. Lo que se dice de Jev viene de su fabricante, y no está comprobado por terceros. Un sistema real necesita datos con conceptos anotados por expertos, separar los datos de calibración y de prueba, mirar a los grupos de pacientes para los que falla, una decisión humana responsable y permisos éticos. Este curso enseña el mecanismo. No sirve para atender a nadie.' },
  ],
  tecnicas: [{ titulo: 'Cada pieza responde a una pregunta', texto: 'Calibrar: ¿me fío del número? Reglas: ¿lo puedo leer? Coste: ¿qué hago con él? Experimento: ¿funciona? Si no sabes qué pregunta responde una pieza, quítala.' }],
  retos: [
    { id: 'enciende-urgente', tipo: 'manipular', enunciado: R`Mueve los grados del caso hasta que el sistema diga «urgente».`, precision: (e) => (evalua(MU(e)).p[0] > UMBRAL ? 1 : 0), prueba: { a: 0.95, b: 0.9, c: 0.9 }, pendiente: (e) => `Ahora, p = ${evalua(MU(e)).p[0].toFixed(2).replace('.', ',')}.`, pistas: ['Empieza por el dolor.'], explicacion: 'Y puedes decir por qué: lee la regla que se ha encendido.' },
    { id: 'tsk-calc', tipo: 'calcular', enunciado: R`Dos reglas con fuerzas $w_1 = 0{,}6$ y $w_2 = 0{,}2$. ¿Cuánto vale $\bar{w}_1$?`, respuesta: 0.75, tol: 0.001, pistas: [R`$\frac{0{,}6}{0{,}8}$.`], explicacion: R`$0{,}75$.` },
    { id: 'ccd-elegir', tipo: 'elegir', enunciado: 'Un concepto activo se ha contestado mal. ¿Qué ventaja da este diseño?', opciones: ['Ninguna: hay que entrenar otra vez', 'Se ve qué concepto es, y una persona puede corregirlo, con efecto inmediato', 'Se corrige solo', 'Lo evita siempre'], correcta: 1, explicacion: 'Es la intervención del cuello de botella, ahora con reglas.' },
    { id: 'demuestra-ccd', tipo: 'demostrar', enunciado: R`Demuestra que las fuerzas normalizadas de un sistema suman 1, si alguna fuerza es positiva.`, pistas: ['Saca factor común el denominador.'], solucion: [{ texto: R`$\sum_r \bar{w}_r = \sum_r \frac{w_r}{\sum_s w_s} = \frac{\sum_r w_r}{\sum_s w_s}$.`, porque: 'El denominador es el mismo en todos los términos.' }, { texto: R`Numerador y denominador son iguales, y distintos de 0: el cociente es 1.`, porque: 'Por eso el resultado es una media ponderada de los consecuentes.' }] },
  ],
  referencias: ['T. Takagi, M. Sugeno, «Fuzzy identification of systems», <em>IEEE Trans. SMC</em> 15 (1985).', 'P. W. Koh et al., <em>ICML</em> (2020).', 'P. Barbiero et al., <em>ICML</em> (2023).', 'D. Debot et al., <em>NeurIPS</em> (2024).', 'C. Guo et al., <em>ICML</em> (2017).'],
};
