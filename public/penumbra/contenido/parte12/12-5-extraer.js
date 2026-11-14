import { AZUL, BLANCO, GRIS2, ORO } from '../../motor/colores.js';
import { NOMBRES_CCD, fidelidad } from '../../nucleo/ia.js';
import { curva, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { coma } from '../parte9/comun.js';
import { CAMINO } from './caminoCCD.js';

const R = String.raw;
const E0 = CAMINO[5], US = Array.from({ length: 21 }, (_, i) => 0.05 + i * 0.045), FI = US.map((u) => fidelidad(E0, u));
const fiDe = (u) => { const x = Math.min(19.999, Math.max(0, (u - 0.05) / 0.045)), i = Math.floor(x); return FI[i] + (FI[i + 1] - FI[i]) * (x - i); };
/** La regla r en palabras, para un umbral u. */
const frase = (r, u) => { const t = E0.m[r].map((v, k) => (v > u ? `${E0.pol[r][k] > 0.5 ? '' : 'NO '}${NOMBRES_CCD[k]}` : null)).filter(Boolean); return t.length ? t.join(' Y ') : 'siempre'; };
const salida = (r) => (E0.th[r][0] > E0.th[r][1] ? 'urgente' : 'no urgente');

export default {
  id: '12-5-extraer',
  titulo: 'De pesos a frases',
  puente: 'Ya tienes un modelo que se lee. Pero un modelo que decide en urgencias tiene que responder a más cosas: qué errores pesan más, qué habría cambiado su decisión, y si funciona de verdad.',
  pregunta: 'Al acabar de entrenar, las reglas son una tabla de números. ¿Se pueden escribir como frases? Sí. Pero hay una pregunta que casi nadie hace: ¿esa frase decide lo mismo que el modelo?',
  escena: {
    id: 'extraer', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [0, 6], y: [0, 3], caja: { x: 60, y: 50, w: 470, h: 180 } },
    entradas: [{ id: 'u', tipo: 'deslizador', etiqueta: 'umbral: a partir de qué relevancia cuenta', min: 0.05, max: 0.95, paso: 0.01, valor: 0.5 }],
    pasos: [
      { dur: 2800, texto: 'Lo aprendido: la relevancia de cada concepto en cada regla, con la presión que dejaba tres. Hay números claros, y otros que no lo son tanto.' },
      { dur: 3000, texto: 'Se escoge un <b>umbral</b>. Lo que lo supera, entra en la regla; lo demás, se borra. Y la polaridad decide si va tal cual o negado.' },
      { dur: 3200, texto: 'Salen <b style="color:#f4d345;font-weight:400">frases</b>. Un médico puede leerlas, discutirlas, y decir que una es absurda. Una tabla de pesos no permite nada de eso.' },
      { dur: 3400, texto: 'Pero redondear cambia el modelo. La <b>fidelidad</b> mide en qué parte de los casos las frases deciden lo mismo que el modelo con todos sus decimales. Si es baja, la explicación es falsa.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, u = e.u, Rn = E0.m.length;
      const M = [];
      E0.m.forEach((f, ri) => f.forEach((v, k) => { const Y = Rn - 1 - ri, entra = v > u, c = g1 > 0.5 && entra ? ORO : AZUL; M.push(poligono([[k + 0.05, Y + 0.05], [k + 0.95, Y + 0.05], [k + 0.95, Y + 0.95], [k + 0.05, Y + 0.95]], { color: v > 0 ? c : BLANCO, alfa: al * (v > 0 ? mix(0.2 + 0.7 * v, entra ? 0.9 : 0.12, g1) : 0.05) }), rotulo([k + 0.5, Y + 0.5], v > 0 ? coma(v) : '0', { clave: `m${ri}${k}`, tam: 13, color: g1 > 0.5 && entra ? [20, 20, 31] : BLANCO, alfa: al * (v > 0 ? 1 : 0.35) })); }));
      NOMBRES_CCD.forEach((n, k) => M.push(rotulo([k + 0.5, 0], R`\text{${n.split(' ')[0]}}`, { clave: `k${k}`, dy: 14, tam: 12, color: GRIS2, alfa: al })));
      const F = [];
      if (g2 > 0) for (let r = 0; r < Rn; r++) F.push(rotulo([0, 2.5 - r], R`\text{Si ${frase(r, u)}:}\ \ \text{${salida(r)}}`, { clave: `fr${r}`, ancla: 'l', tam: 19, color: E0.m[r].some((v) => v > u) ? ORO : GRIS2, alfa: g2 * ev(q(2), r * 0.15, r * 0.15 + 0.4) }));
      const G = [marco({ x: [0, 1], y: [0.5, 1] }, { alfa: g3, ticks: { x: [0, 1], y: [0.5, 1] }, etiquetas: { x: R`\text{umbral}`, y: R`\text{fidelidad}` } })];
      if (g3 > 0) G.push(curva((x) => [x, fiDe(x)], [0.05, 0.95], { n: 60, color: ORO, ancho: 2.8, alfa: g3 }), punto([u, fiDe(u)], { color: ORO, radio: 7, alfa: g3 }), rotulo([1, 1], R`\text{fidelidad} = ${coma(fiDe(u))}`, { clave: 'fi', ancla: 'r', dy: -2, tam: 18, alfa: g3 }));
      return { principal: M, paneles: [{ ejes: { x: [0, 10], y: [0, 3], caja: { x: 60, y: 290, w: 620, h: 180 } }, prims: F }, { ejes: { x: [0, 1], y: [0.5, 1], caja: { x: 720, y: 60, w: 320, h: 330 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Mueve el umbral, y lee cómo cambian las frases.</li><li>Busca dónde es máxima la fidelidad. Un umbral muy alto deja reglas vacías; uno muy bajo, reglas que nadie lee.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Binarizar las relevancias y las polaridades convierte el modelo en reglas en palabras. Pero un modelo redondeado es otro modelo. Si lo que explicas no es lo que decide, la explicación es decorativa. Por eso hay que medir la fidelidad, y por eso se entrena empujando a los números hacia 0 y 1: para que redondear cambie poco.' },
    { tipo: 'ejemplo', texto: 'Tres situaciones posibles al comparar sobre 1000 casos:', tabla: [['Las frases deciden igual en', 'Fidelidad', 'Qué significa'], ['990', '0,99', 'Se pueden leer como el modelo'], ['850', '0,85', 'Orientan, pero no son el modelo'], ['600', '0,60', 'No las enseñes como explicación']], cierre: 'Fidelidad no es acierto: unas frases pueden ser fieles a un modelo que se equivoca.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\tilde{m},\ \tilde{\pi}`, dice: 'Relevancia y polaridad redondeadas a 0 o 1. La tilde indica «redondeado».' },
      { tex: R`\hat{y}(x)`, dice: 'Lo que decide el modelo entero.' },
      { tex: R`\tilde{y}(x)`, dice: 'Lo que deciden las frases.' },
    ], todo: R`\mathrm{Fid} = \frac{1}{n}\sum_{i = 1}^n \big[\hat{y}(x_i) = \tilde{y}(x_i)\big]`, lee: 'Los corchetes valen 1 si es cierto lo de dentro, y 0 si no: se cuenta cuántas veces coinciden.' },
    { tipo: 'formal', titulo: 'Extracción y fidelidad', tex: R`Dado un umbral $u$, se toma $\tilde{m}_{r k} = [m_{r k} > u]$, y $\tilde{\pi}_{r k} = [\pi_{r k} > \frac{1}{2}]$. Cada regla es la conjunción de los literales con $\tilde{m}_{r k} = 1$. La fidelidad se mide con datos que no se usaron para entrenar.`, lee: 'Aquí, por simplicidad de la escena, medimos en los mismos casos de juguete. Una evaluación real tiene que separarlos.' },
    { tipo: 'demo', titulo: 'Por qué $m(1 - m)$ empuja a decidirse', plan: 'Se estudia la función: dónde vale cero y hacia dónde apunta su pendiente.', tex: R`En $[0, 1]$, $h(m) = m(1 - m)$ vale 0 solo si $m \in \{0, 1\}$, y bajar por ella aleja $m$ de $\frac{1}{2}$.`, pasos: [
      { texto: R`Un producto vale 0 solo si un factor vale 0: $m = 0$ o $m = 1$. En el resto de $[0, 1]$ es positiva.`, porque: 'Los dos factores son positivos en el interior.' },
      { texto: R`$h'(m) = 1 - 2m$: positiva si $m < \frac{1}{2}$, y negativa si $m > \frac{1}{2}$.`, porque: 'Se deriva.' },
      { texto: R`Un paso de gradiente resta $h'(m)$: baja $m$ si $m < \frac{1}{2}$, y lo sube si $m > \frac{1}{2}$.`, porque: 'Cada valor va hacia el extremo que tiene más cerca. Y si ya está ahí, el redondeo no cambia nada, y la fidelidad es 1.' },
    ] },
    { tipo: 'nota', titulo: 'Un modelo de lenguaje como fuente de reglas', texto: 'Hay un atajo para el comienzo: pedirle a un modelo de lenguaje conceptos y reglas candidatas (la vía V4). No se aceptan sin más: son el punto de partida, que luego los datos ajustan y podan, y que una persona revisa. Lo que propone puede sonar muy bien, y ser falso.' },
  ],
  tecnicas: [{ titulo: 'Comprueba la explicación contra el modelo', texto: 'Toda explicación simplificada es un modelo aparte. Mide en cuántos casos coincide con el original, y dilo junto a la explicación.' }],
  retos: [
    { id: 'regla-vacia', tipo: 'manipular', enunciado: R`Sube el umbral hasta que la tercera regla se quede sin ningún concepto.`, precision: (e) => (E0.m[2].every((v) => v <= e.u) ? 1 : 0), prueba: { u: 0.6 }, pendiente: (e) => `Ahora dice: «${frase(2, e.u)}».`, pistas: ['Su mayor relevancia está un poco por encima de 0,5.'], explicacion: 'Una regla sin condiciones se enciende siempre: era una opinión por defecto.' },
    { id: 'fidelidad-calc', tipo: 'calcular', enunciado: R`Las frases y el modelo coinciden en $176$ de $200$ casos. ¿Cuánto vale la fidelidad?`, respuesta: 0.88, tol: 0.001, pistas: ['Coincidencias entre total.'], explicacion: R`$\frac{176}{200} = 0{,}88$.` },
    { id: 'fidelidad-elegir', tipo: 'elegir', enunciado: 'Tus frases tienen fidelidad 0,99, y el modelo acierta un 60 %. ¿Qué tienes?', opciones: ['Un modelo bueno', 'Una explicación fiel de un modelo malo', 'Una explicación falsa', 'Es imposible'], correcta: 1, explicacion: 'Son dos preguntas distintas: si la frase es fiel, y si acierta.' },
    { id: 'demuestra-binario', tipo: 'demostrar', enunciado: R`Demuestra que, si todas las relevancias y polaridades ya valen 0 o 1, para cualquier umbral $u \in (0, 1)$ la fidelidad es 1.`, pistas: ['¿Qué le hace el redondeo a un número que ya es 0 o 1?'], solucion: [{ texto: R`Si $m \in \{0, 1\}$ y $u \in (0, 1)$, entonces $[m > u] = m$. Y lo mismo para $\pi$ con $\frac{1}{2}$.`, porque: 'Se comprueban los dos valores.' }, { texto: R`Luego el modelo redondeado es idéntico al original, y decide lo mismo en todo caso.`, porque: 'Por eso se entrena empujando hacia 0 y 1.' }] },
  ],
  referencias: ['D. Debot et al., <em>NeurIPS</em> (2024).', 'P. Barbiero et al., <em>ICML</em> (2023).'],
};
